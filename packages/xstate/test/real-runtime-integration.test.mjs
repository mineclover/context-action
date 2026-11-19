import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { ActionRegister, ActionTimeoutError, ActionValidationError } from '@context-action/core';
import { createSyncActionPipeline } from '@context-action/core/element';
import { createStateStore } from '@context-action/store-core';
import {
  bindActor,
  bindActorToActionRegister,
  bindActorToSyncPipeline,
  createActorActionEmitter,
  createActorStateReader,
} from '../dist/index.js';
import {
  bindActionDispatchTransactions,
  bindEffectActorToActionRegister,
  fromStandardSchema,
  registerEffectGuard,
  registerEffectHandler,
  registerStandardSchemaGuard,
  runInTransactionScope,
} from '../dist/effect.js';

function resolvePnpmEntry(packagePrefix, subPath) {
  const pnpmDir = path.resolve(import.meta.dirname, '../../../node_modules/.pnpm');
  if (!fs.existsSync(pnpmDir)) return null;
  const match = fs.readdirSync(pnpmDir).find((name) => name.startsWith(packagePrefix));
  if (!match) return null;
  const fullPath = path.join(pnpmDir, match, 'node_modules', subPath);
  return fs.existsSync(fullPath) ? pathToFileURL(fullPath).href : null;
}

const xstateUrl = resolvePnpmEntry('xstate@', 'xstate/dist/xstate.esm.js');
const effectUrl = resolvePnpmEntry('effect@', 'effect/dist/index.js');
const zodUrl = resolvePnpmEntry('zod@', 'zod/index.js');

function createMultiStoreCoordinator() {
  return {
    begin(participants, options) {
      const backups = participants.map((p) => ({
        store: p.store,
        snapshotValue: p.store.getValue(),
      }));
      let settled = false;
      return {
        meta: {
          id: `tx-${Date.now()}`,
          ...(options?.label !== undefined ? { label: options.label } : {}),
        },
        commit() {
          if (settled) return;
          settled = true;
        },
        rollback() {
          if (settled) return;
          settled = true;
          for (const entry of backups) {
            entry.store.setValue(entry.snapshotValue, { origin: 'reset', label: 'rollback' });
          }
        },
      };
    },
  };
}

test('Real XState v5 runtime integrates end-to-end with ActionRegister, SyncActionPipeline, and ActorStateReader', async (t) => {
  if (!xstateUrl) {
    t.skip('xstate runtime not present in local pnpm store');
    return;
  }
  const { setup, assign, createActor, fromPromise, enqueueActions } = await import(xstateUrl);

  const register = new ActionRegister({ id: 'real-xstate-v5-orders' });
  const auditTrail = [];
  register.register('recordAudit', (payload) => {
    auditTrail.push(payload);
  });
  const emitter = createActorActionEmitter(register);

  const orderMachine = setup({
    types: {
      context: {},
      events: {},
    },
    actors: {
      submitPayment: fromPromise(async ({ input }) => {
        await new Promise((r) => setTimeout(r, 15));
        if (input.amount <= 0) throw new Error('Amount must be positive');
        return { receiptId: `rcpt-${input.orderId}` };
      }),
    },
    guards: {
      canStartCheckout: ({ event }) => event.amount > 0,
    },
  }).createMachine({
    id: 'orderWorkflow',
    initial: 'idle',
    context: {
      orderId: null,
      amount: 0,
      receiptId: null,
      notes: 'initial',
    },
    states: {
      idle: {
        on: {
          ANNOTATE: {
            actions: assign({ notes: ({ event }) => event.note }),
          },
          CHECKOUT: {
            guard: 'canStartCheckout',
            target: 'charging',
            actions: assign({
              orderId: ({ event }) => event.orderId,
              amount: ({ event }) => event.amount,
            }),
          },
        },
      },
      charging: {
        invoke: {
          src: 'submitPayment',
          input: ({ context }) => ({ orderId: context.orderId, amount: context.amount }),
          onDone: {
            target: 'paid',
            actions: [
              assign({ receiptId: ({ event }) => event.output.receiptId }),
              enqueueActions(({ context }) => {
                emitter.emit('recordAudit', {
                  orderId: context.orderId,
                  status: 'paid',
                });
              }),
            ],
          },
          onError: {
            target: 'failed',
          },
        },
      },
      paid: { type: 'final' },
      failed: { type: 'final' },
    },
  });

  const actor = createActor(orderMachine);
  actor.start();

  // State projection with selector & structural equality
  const statusReader = createActorStateReader('order-projection', actor, {
    select: (snap) => ({ value: snap.value, orderId: snap.context.orderId, receiptId: snap.context.receiptId }),
    equals: (a, b) => a.value === b.value && a.orderId === b.orderId && a.receiptId === b.receiptId,
  });

  // Mount ANNOTATE onto synchronous UI SyncActionPipeline
  const uiPipeline = createSyncActionPipeline('order-ui-sync');
  const unbindSync = bindActorToSyncPipeline(uiPipeline, actor, {
    map: {
      annotate: (note) => ({ type: 'ANNOTATE', note }),
    },
  });

  const syncRes = uiPipeline.dispatch('annotate', 'updated-note');
  assert.equal(syncRes.success, true);
  assert.equal(actor.getSnapshot().context.notes, 'updated-note');
  // notes is outside select(), so version stays 0 (no needless re-render!)
  assert.equal(statusReader.getSnapshot().version, 0);

  // Mount CHECKOUT onto async ActionRegister waiting for payment settlement
  const unbindAsync = bindActorToActionRegister(register, actor, {
    map: {
      checkout: (payload) => ({ type: 'CHECKOUT', orderId: payload.orderId, amount: payload.amount }),
    },
    waitForByAction: {
      checkout: (snap) => snap.status === 'done' && snap.value === 'paid',
    },
  });

  // Guard rejects invalid amount (snapshot.can(CHECKOUT) === false in XState v5!)
  const deniedOutcome = await register.dispatchWithResult('checkout', { orderId: 'o-0', amount: -5 });
  assert.equal(deniedOutcome.aborted, true);
  assert.match(deniedOutcome.abortReason ?? '', /denied in state "idle"/);

  // Valid checkout triggers real XState v5 invoked fromPromise actor and settles to 'paid'
  const paidOutcome = await register.dispatchWithResult('checkout', { orderId: 'o-42', amount: 120 });
  assert.equal(paidOutcome.success, true);
  assert.equal(paidOutcome.result?.value, 'paid');
  assert.equal(paidOutcome.result?.context.receiptId, 'rcpt-o-42');

  // Reader projected the settled slice and emitter delivered audit trail
  assert.deepEqual(statusReader.getValue(), {
    value: 'paid',
    orderId: 'o-42',
    receiptId: 'rcpt-o-42',
  });
  assert.ok(statusReader.getSnapshot().version >= 1);
  assert.deepEqual(auditTrail, [{ orderId: 'o-42', status: 'paid' }]);

  unbindSync();
  unbindAsync();
  statusReader.dispose();
  actor.stop();
});

test('Real Effect v4 + Zod v4 validate schemas, interrupt Fibers on ActionRegister timeout, and close Scope with real XState Actor', async (t) => {
  if (!effectUrl || !zodUrl || !xstateUrl) {
    t.skip('effect, zod, or xstate runtime not present in local pnpm store');
    return;
  }

  const { Effect, Exit, Schema, Scope } = await import(effectUrl);
  const { z } = await import(zodUrl);
  const { createActor, setup } = await import(xstateUrl);

  // 1. Real Effect v4 Schema.toStandardSchemaV1 + Zod v4 Standard Schema
  const effectOrderSchema = Schema.toStandardSchemaV1(
    Schema.Struct({
      item: Schema.String,
      qty: Schema.Number,
    }),
  );
  const zodUserSchema = z.object({
    name: z.string().trim().min(2),
  });

  const reg = new ActionRegister({
    id: 'real-schema-reg',
    registry: {
      schema: { createOrder: fromStandardSchema(effectOrderSchema) },
      validateOnDispatch: true,
      validationMode: 'strict',
    },
  });
  const savedOrders = [];
  reg.register('createOrder', (p) => {
    savedOrders.push(p);
  });

  await assert.rejects(() => reg.dispatch('createOrder', { item: 'book', qty: 'bad' }), ActionValidationError);
  await reg.dispatch('createOrder', { item: 'book', qty: 3 });
  assert.deepEqual(savedOrders, [{ item: 'book', qty: 3 }]);

  const syncPipe = createSyncActionPipeline('zod-sync');
  registerStandardSchemaGuard(syncPipe, 'saveUser', zodUserSchema);
  const badUser = syncPipe.dispatch('saveUser', { name: 'a' });
  assert.equal(badUser.aborted, true);
  const trimmedUser = syncPipe.dispatch('saveUser', { name: '  Alice  ' });
  assert.equal(trimmedUser.success, true);
  assert.deepEqual(trimmedUser.payload, { name: 'Alice' });

  // 2. Real Effect v4 Fiber execution + onInterrupt triggered by ActionRegister timeout
  let fiberInterrupted = 0;
  const effReg = new ActionRegister({ id: 'real-effect-fiber-reg' });

  registerEffectGuard(
    effReg,
    'compute',
    (payload) =>
      Effect.gen(function* () {
        if (payload.n < 0) {
          return yield* Effect.fail('Negative input rejected by Effect Guard');
        }
        return { modifyPayload: { ...payload, n: payload.n * 2 } };
      }),
    { runner: Effect.runPromise },
  );

  registerEffectHandler(
    effReg,
    'compute',
    (payload) =>
      Effect.gen(function* () {
        if (payload.slow) {
          return yield* Effect.sleep('5 seconds').pipe(
            Effect.as('unreachable'),
            Effect.onInterrupt(() =>
              Effect.sync(() => {
                fiberInterrupted += 1;
              }),
            ),
          );
        }
        return payload.n + 1;
      }),
    { runner: Effect.runPromise },
  );

  const rejectedGuard = await effReg.dispatchWithResult('compute', { n: -1, slow: false });
  assert.equal(rejectedGuard.aborted, true);
  assert.match(rejectedGuard.abortReason ?? '', /Negative input rejected/);

  const okCompute = await effReg.dispatchWithResult('compute', { n: 5, slow: false });
  assert.equal(okCompute.success, true);
  assert.equal(okCompute.result, 11);

  await assert.rejects(
    () => effReg.dispatchWithResult('compute', { n: 1, slow: true }, { timeout: 25 }),
    ActionTimeoutError,
  );
  // Allow Effect runtime microtask tick to run interruption finalizer
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(fiberInterrupted, 1);

  // 3. Real Effect v4 Scope + Real XState Actor teardown via bindEffectActorToActionRegister
  const scope = Effect.runSync(Scope.make());
  let scopeFinalized = 0;
  await Effect.runPromise(
    Scope.addFinalizer(
      scope,
      Effect.sync(() => {
        scopeFinalized += 1;
      }),
    ),
  );

  const simpleMachine = setup({}).createMachine({
    id: 'scopedWorker',
    initial: 'ready',
    states: {
      ready: { on: { WORK: { target: 'working' } } },
      working: { on: { FINISH: { target: 'done' } } },
      done: { type: 'final' },
    },
  });
  const realActor = createActor(simpleMachine).start();
  const scopedReg = new ActionRegister({ id: 'real-scope-actor-reg' });

  const handle = bindEffectActorToActionRegister(scopedReg, realActor, {
    map: { work: 'WORK', finish: 'FINISH' },
    scope: () => Effect.runPromise(Scope.close(scope, Exit.void)),
  });

  assert.equal(handle.canDispatch('work'), true);
  const workRes = await scopedReg.dispatchWithResult('work');
  assert.equal(workRes.result?.value, 'working');
  assert.equal(realActor.getSnapshot().status, 'active');

  // Disposing while active tears down Effect Scope AND calls real XState actor.stop()
  await handle.dispose();
  assert.equal(handle.isDisposed(), true);
  assert.equal(scopeFinalized, 1);
  assert.equal(realActor.getSnapshot().status, 'stopped');
});

test('Real StateStore multi-participant transaction commits and rolls back under Effect v4 & AbortSignal', async (t) => {
  if (!effectUrl) {
    t.skip('effect runtime not present in local pnpm store');
    return;
  }
  const { Effect } = await import(effectUrl);

  const inventoryStore = createStateStore('inventory', { stock: 10 });
  const orderStore = createStateStore('orders', { count: 0 });
  const coordinator = createMultiStoreCoordinator();
  const participants = [
    { name: 'inventory', store: inventoryStore },
    { name: 'orders', store: orderStore },
  ];

  // 1. Success path commits mutations
  await runInTransactionScope(coordinator, participants, () =>
    Effect.runPromise(
      Effect.sync(() => {
        inventoryStore.setValue({ stock: 8 });
        orderStore.setValue({ count: 1 });
      }),
    ),
  );
  assert.deepEqual(inventoryStore.getValue(), { stock: 8 });
  assert.deepEqual(orderStore.getValue(), { count: 1 });

  // 2. Failing Effect rolls back BOTH stores to pre-transaction snapshot
  await assert.rejects(
    () =>
      runInTransactionScope(coordinator, participants, () =>
        Effect.runPromise(
          Effect.gen(function* () {
            inventoryStore.setValue({ stock: 3 });
            orderStore.setValue({ count: 2 });
            return yield* Effect.fail(new Error('ledger-write-failed'));
          }),
        ),
      ),
    /ledger-write-failed/,
  );
  assert.deepEqual(inventoryStore.getValue(), { stock: 8 });
  assert.deepEqual(orderStore.getValue(), { count: 1 });

  // 3. Aborted Effect signal rolls back partial store mutations immediately
  const ac = new AbortController();
  const pendingTx = runInTransactionScope(
    coordinator,
    participants,
    () => {
      inventoryStore.setValue({ stock: 0 });
      return Effect.runPromise(Effect.sleep('5 seconds'), { signal: ac.signal });
    },
    { signal: ac.signal },
  );
  await new Promise((r) => setTimeout(r, 10));
  ac.abort('user-cancelled');
  await assert.rejects(pendingTx, /user-cancelled/);
  assert.deepEqual(inventoryStore.getValue(), { stock: 8 });
  assert.deepEqual(orderStore.getValue(), { count: 1 });
});

test('Real XState v5 emit() + bindActor + bindActionDispatchTransactions coordinate stores atomically', async (t) => {
  if (!xstateUrl) {
    t.skip('xstate runtime not present in local pnpm store');
    return;
  }
  const { setup, emit, createActor } = await import(xstateUrl);

  const emittedEvents = [];
  const reg = new ActionRegister({ id: 'real-xstate-emit-reg' });
  reg.register('onShipped', (payload) => {
    emittedEvents.push(payload);
  });

  const shippingMachine = setup({
    types: {
      events: {},
      emitted: {},
    },
  }).createMachine({
    id: 'shipping',
    initial: 'pending',
    states: {
      pending: {
        on: {
          SHIP: {
            target: 'shipped',
            actions: emit(({ event }) => ({ type: 'SHIPPED', trackingId: event.trackingId })),
          },
        },
      },
      shipped: { type: 'final' },
    },
  });

  const actor = createActor(shippingMachine).start();
  const handle = bindActor(reg, actor, {
    map: {
      ship: (trackingId) => ({ type: 'SHIP', trackingId }),
    },
    waitFor: (snap) => snap.value === 'shipped',
    emissions: {
      SHIPPED: 'onShipped',
    },
  });

  assert.equal(handle.canDispatch('ship', 'TRK-99'), true);
  await reg.dispatch('ship', 'TRK-99');
  assert.deepEqual(emittedEvents, [{ trackingId: 'TRK-99' }]);
  assert.equal(handle.canDispatch('ship', 'TRK-100'), false);
  handle.dispose();
  actor.stop();

  // Verify bindActionDispatchTransactions with real StateStore participants
  const storeA = createStateStore('a', { total: 10 });
  const storeB = createStateStore('b', { count: 1 });
  const coordinator = createMultiStoreCoordinator();
  const traceReg = new ActionRegister({ id: 'real-trace-tx' });
  const detachTx = bindActionDispatchTransactions(traceReg, coordinator, {
    getParticipants: () => [
      { name: 'a', store: storeA },
      { name: 'b', store: storeB },
    ],
  });

  traceReg.register('commitStep', () => {
    storeA.setValue({ total: 20 });
    storeB.setValue({ count: 2 });
  });
  traceReg.register(
    'failingStep',
    () => {
      storeA.setValue({ total: 999 });
      storeB.setValue({ count: 999 });
      throw new Error('rollback-both-stores');
    },
    { blocking: true },
  );

  await traceReg.dispatch('commitStep');
  assert.deepEqual(storeA.getValue(), { total: 20 });
  assert.deepEqual(storeB.getValue(), { count: 2 });

  await assert.rejects(() => traceReg.dispatch('failingStep'), /rollback-both-stores/);
  assert.deepEqual(storeA.getValue(), { total: 20 });
  assert.deepEqual(storeB.getValue(), { count: 2 });

  detachTx();
});
