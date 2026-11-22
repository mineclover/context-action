import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { ActionRegister, ActionTimeoutError, ActionValidationError } from '@context-action/core';
import { createSyncActionPipeline } from '@context-action/core/element';
import {
  bindActor,
  bindActorEmissions,
  bindActorToActionRegister,
  bindActorToSyncPipeline,
  createActorActionEmitter,
  createActorStateReader,
  enqueueSyncCommand,
  waitForActorSnapshot,
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

function createMockActor(initialValue, initialContext, options = {}) {
  let snapshot = {
    value: initialValue,
    context: initialContext,
    status: 'active',
    can: (event) => (options.can ? options.can(snapshot, event) : true),
  };
  const listeners = new Set();
  let subscribeCount = 0;
  let unsubscribeCount = 0;

  const notify = () => {
    for (const observer of [...listeners]) {
      observer.next?.(snapshot);
    }
  };

  return {
    get stats() {
      return { subscribeCount, unsubscribeCount, activeListeners: listeners.size };
    },
    getSnapshot: () => snapshot,
    send(event) {
      if (options.onSend) {
        const next = options.onSend(snapshot, event, notify, (updated) => {
          snapshot = {
            ...updated,
            can: (e) => (options.can ? options.can(snapshot, e) : true),
          };
          notify();
        });
        if (next) {
          snapshot = {
            ...next,
            can: (e) => (options.can ? options.can(snapshot, e) : true),
          };
          notify();
        }
      }
    },
    subscribe(listenerOrObserver) {
      subscribeCount += 1;
      const observer =
        typeof listenerOrObserver === 'function'
          ? { next: listenerOrObserver }
          : listenerOrObserver;
      listeners.add(observer);
      let active = true;
      return {
        unsubscribe() {
          if (!active) return;
          active = false;
          unsubscribeCount += 1;
          listeners.delete(observer);
        },
      };
    },
  };
}

test('ESM and CJS entrypoints expose identical runtime functions', () => {
  const require = createRequire(import.meta.url);
  const cjsMain = require('../dist/index.cjs');
  const cjsEffect = require('../dist/effect.cjs');

  for (const symbol of [
    'bindActor',
    'bindActorEmissions',
    'createActorStateReader',
    'bindActorToSyncPipeline',
    'bindStatechartToSyncPipeline',
    'bindActorToActionRegister',
    'waitForActorSnapshot',
    'enqueueSyncCommand',
    'createActorActionEmitter',
  ]) {
    assert.equal(typeof cjsMain[symbol], 'function');
  }

  for (const symbol of [
    'fromStandardSchema',
    'registerStandardSchemaGuard',
    'registerEffectHandler',
    'registerEffectGuard',
    'bindEffectActorToActionRegister',
    'bindActionDispatchTransactions',
    'runInTransactionScope',
  ]) {
    assert.equal(typeof cjsEffect[symbol], 'function');
  }
});

test('createActorStateReader avoids pre-subscribe stale reads and filters equal slices', () => {
  let clock = 1000;
  const actor = createMockActor('idle', { count: 0, meta: 'v0' }, {
    onSend(current, event) {
      if (event.type === 'INC') {
        return {
          value: 'active',
          context: { ...current.context, count: current.context.count + 1 },
          status: 'active',
        };
      }
      if (event.type === 'META') {
        return {
          value: current.value,
          context: { ...current.context, meta: String(event.meta) },
          status: 'active',
        };
      }
      return undefined;
    },
  });

  const reader = createActorStateReader('counter', actor, {
    select: (snap) => ({ state: snap.value, count: snap.context.count }),
    equals: (a, b) => a.state === b.state && a.count === b.count,
    now: () => ++clock,
  });

  assert.deepEqual(reader.getValue(), { state: 'idle', count: 0 });
  assert.equal(reader.getSnapshot().version, 0);

  // Actor transitions BEFORE any subscribe() call must not leave reader stale
  actor.send({ type: 'INC' });
  assert.deepEqual(reader.getValue(), { state: 'active', count: 1 });
  assert.equal(reader.getSnapshot().version, 1);

  const notifications = [];
  reader.subscribe(() => {
    throw new Error('broken observer');
  });
  reader.subscribe(() => {
    notifications.push({ v: reader.getSnapshot().version, value: reader.getValue() });
  });

  // Unrelated meta update produces equal projected value -> suppressed
  actor.send({ type: 'META', meta: 'v1' });
  assert.equal(notifications.length, 0);
  assert.equal(reader.getSnapshot().version, 1);

  // Count update increments version and notifies healthy subscribers
  actor.send({ type: 'INC' });
  assert.deepEqual(notifications, [{ v: 2, value: { state: 'active', count: 2 } }]);

  reader.dispose();
  reader.dispose();
  assert.equal(reader.isDisposed(), true);
  assert.equal(actor.stats.unsubscribeCount, 1);

  actor.send({ type: 'INC' });
  assert.deepEqual(reader.getValue(), { state: 'active', count: 2 });
});

test('bindActorToSyncPipeline & createActorActionEmitter map typed events and v6 enq commands', () => {
  const pipeline = createSyncActionPipeline('flow');
  const enqQueue = [];
  const enq = (fn) => enqQueue.push(fn);

  const actor = createMockActor(
    'idle',
    { jobId: null },
    {
      can: (snap, event) =>
        (event.type === 'START' && snap.value === 'idle')
        || (event.type === 'PAUSE' && snap.value === 'running'),
      onSend(snap, event) {
        if (event.type === 'START' && snap.value === 'idle') {
          return { value: 'running', context: { jobId: event.jobId }, status: 'active' };
        }
        if (event.type === 'PAUSE' && snap.value === 'running') {
          return { value: 'paused', context: snap.context, status: 'active' };
        }
        return undefined;
      },
    },
  );

  const unbind = bindActorToSyncPipeline(pipeline, actor, {
    map: {
      start: (payload) => ({ type: 'START', jobId: payload.id }),
      pause: 'PAUSE',
    },
  });

  const denied = pipeline.dispatch('pause');
  assert.equal(denied.aborted, true);
  assert.match(denied.abortReason ?? '', /Transition "PAUSE" denied in state "idle"/);

  const started = pipeline.dispatch('start', { id: 'job-7' });
  assert.equal(started.success, true);
  assert.equal(actor.getSnapshot().value, 'running');
  assert.equal(actor.getSnapshot().context.jobId, 'job-7');

  const emitter = createActorActionEmitter(pipeline);
  emitter.enqueue(enq, 'pause');
  assert.equal(actor.getSnapshot().value, 'running');
  for (const job of enqQueue) job();
  assert.equal(actor.getSnapshot().value, 'paused');

  let directCalled = 0;
  enqueueSyncCommand(enq, (val) => {
    directCalled += val;
  }, 3);
  while (enqQueue.length) enqQueue.shift()();
  assert.equal(directCalled, 3);

  unbind();
  assert.equal(pipeline.dispatch('start', { id: 'job-8' }).result, undefined);
});

test('bindActorToActionRegister & waitForActorSnapshot handle fast-path, async settlement, and AbortSignal', async () => {
  const register = new ActionRegister({ id: 'deploy-reg' });
  let pendingTimer;

  const actor = createMockActor(
    'idle',
    { release: null },
    {
      can: (snap, event) => event.type === 'DEPLOY' && snap.value === 'idle',
      onSend(_snap, event, _notify, commit) {
        if (event.type === 'DEPLOY') {
          if (event.mode === 'hang') {
            return { value: 'deploying', context: { release: event.release }, status: 'active' };
          }
          pendingTimer = setTimeout(() => {
            commit({
              value: 'live',
              context: { release: event.release },
              status: 'done',
            });
          }, 15);
          return { value: 'deploying', context: { release: event.release }, status: 'active' };
        }
        return undefined;
      },
    },
  );

  // 0ms fast-path when initial snapshot already matches predicate
  const immediate = await waitForActorSnapshot(actor, (snap) => snap.value === 'idle');
  assert.equal(immediate.value, 'idle');

  const unbind = bindActorToActionRegister(register, actor, {
    map: {
      deploy: (payload) => ({ type: 'DEPLOY', release: payload.release, mode: payload.mode }),
    },
    waitForByAction: {
      deploy: (snap) => snap.value === 'live',
    },
  });

  const okResult = await register.dispatchWithResult('deploy', { release: 'v1.0.0', mode: 'ok' });
  assert.equal(okResult.success, true);
  assert.equal(okResult.result?.value, 'live');
  assert.equal(actor.stats.activeListeners, 0);

  // Guard denies second DEPLOY once machine reached 'live'
  const deniedOutcome = await register.dispatchWithResult('deploy', { release: 'v1.0.1', mode: 'ok' });
  assert.equal(deniedOutcome.aborted, true);
  clearTimeout(pendingTimer);
  unbind();

  // Verify AbortSignal cleanup when actor never settles
  const hangingActor = createMockActor('idle', {});
  const ac = new AbortController();
  const waitPromise = waitForActorSnapshot(
    hangingActor,
    (snap) => snap.value === 'never',
    { signal: ac.signal },
  );
  assert.equal(hangingActor.stats.activeListeners, 1);
  ac.abort('cancelled-by-caller');
  await assert.rejects(waitPromise, /cancelled-by-caller/);
  assert.equal(hangingActor.stats.activeListeners, 0);
});

test('@context-action/xstate/effect unifies Standard Schema v1 for ActionRegister schema and Guards', async () => {
  const trimTitleSchema = {
    '~standard': {
      version: 1,
      vendor: 'effect-mock',
      validate(value) {
        const input = value ?? {};
        if (typeof input.title !== 'string' || input.title.trim().length === 0) {
          return { issues: [{ message: 'Title required', path: ['title'] }] };
        }
        return { value: { title: input.title.trim() } };
      },
    },
  };

  const asyncSchema = {
    '~standard': {
      version: 1,
      vendor: 'effect-async-mock',
      async validate(value) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        const input = value ?? {};
        if (typeof input.slug !== 'string' || input.slug.length < 2) {
          return { issues: [{ message: 'Slug too short', path: ['slug'] }] };
        }
        return { value: { slug: input.slug.toLowerCase() } };
      },
    },
  };

  // ActionSchemaLike adapter on ActionRegister constructor
  const regWithSchema = new ActionRegister({
    id: 'schema-reg',
    registry: {
      schema: { createDoc: fromStandardSchema(trimTitleSchema) },
      validateOnDispatch: true,
      validationMode: 'strict',
    },
  });
  let capturedDoc;
  regWithSchema.register('createDoc', (payload) => {
    capturedDoc = payload;
  });

  await assert.rejects(
    () => regWithSchema.dispatch('createDoc', { title: '   ' }),
    ActionValidationError,
  );
  await regWithSchema.dispatch('createDoc', { title: 'Spec' });
  assert.deepEqual(capturedDoc, { title: 'Spec' });

  // Async guard validation on ActionRegister
  const asyncReg = new ActionRegister({ id: 'async-guard-reg' });
  const normalizedSlugs = [];
  registerStandardSchemaGuard(asyncReg, 'publish', asyncSchema);
  asyncReg.register('publish', (payload) => {
    normalizedSlugs.push(payload.slug);
  });

  const badOutcome = await asyncReg.dispatchWithResult('publish', { slug: 'a' });
  assert.equal(badOutcome.aborted, true);
  assert.match(badOutcome.abortReason ?? '', /slug: Slug too short/);

  const goodOutcome = await asyncReg.dispatchWithResult('publish', { slug: 'My-Guide' });
  assert.equal(goodOutcome.success, true);
  assert.deepEqual(normalizedSlugs, ['my-guide']);

  // Sync guard validation on SyncActionPipeline rejects async schemas cleanly
  const syncPipe = createSyncActionPipeline('sync-pipe');
  registerStandardSchemaGuard(syncPipe, 'save', trimTitleSchema);
  registerStandardSchemaGuard(syncPipe, 'publish', asyncSchema);

  const syncValid = syncPipe.dispatch('save', { title: '  Draft  ' });
  assert.equal(syncValid.success, true);
  assert.deepEqual(syncValid.payload, { title: 'Draft' });

  const syncAsyncReject = syncPipe.dispatch('publish', { slug: 'ok' });
  assert.equal(syncAsyncReject.aborted, true);
  assert.match(syncAsyncReject.abortReason ?? '', /Async Standard Schema/);
});

test('@context-action/xstate/effect supports Effect runners, signal interruption, and scoped actor disposal', async () => {
  const register = new ActionRegister({ id: 'effect-handlers' });
  let interrupted = 0;

  const mockRuntime = {
    runPromise(effectTask, options) {
      return effectTask(options?.signal);
    },
  };

  registerEffectGuard(
    register,
    'runJob',
    (payload) => async () => {
      if (payload.name.trim().length === 0) {
        throw new Error('Job name empty');
      }
      return { modifyPayload: { ...payload, name: payload.name.trim() } };
    },
    { runner: mockRuntime },
  );

  registerEffectHandler(
    register,
    'runJob',
    (payload) => (signal) =>
      new Promise((resolve, reject) => {
        if (payload.hang) {
          signal?.addEventListener(
            'abort',
            () => {
              interrupted += 1;
              reject(new Error('Fiber interrupted'));
            },
            { once: true },
          );
          return;
        }
        resolve(`ran:${payload.name}`);
      }),
    { runner: mockRuntime },
  );

  const denied = await register.dispatchWithResult('runJob', { name: '   ' });
  assert.equal(denied.aborted, true);
  assert.match(denied.abortReason ?? '', /Job name empty/);

  const ok = await register.dispatchWithResult('runJob', { name: '  build  ' });
  assert.equal(ok.success, true);
  assert.equal(ok.result, 'ran:build');

  // Timeout aborts controller.signal -> Effect interruption hook invoked
  await assert.rejects(
    () =>
      register.dispatchWithResult(
        'runJob',
        { name: 'slow', hang: true },
        { timeout: 20 },
      ),
    ActionTimeoutError,
  );
  assert.equal(interrupted, 1);

  // Scoped EffectActor lifecycle
  let scopeClosed = 0;
  const scopedActor = createMockActor('ready', { count: 0 }, {
    onSend(_snap, event, _notify, commit) {
      if (event.type === 'EXECUTE') {
        setTimeout(() => commit({ value: 'finished', context: { count: 1 }, status: 'done' }), 10);
        return { value: 'running', context: { count: 0 }, status: 'active' };
      }
      return undefined;
    },
  });

  const actorReg = new ActionRegister({ id: 'scoped-actor-reg' });
  const handle = bindEffectActorToActionRegister(actorReg, scopedActor, {
    map: { execute: 'EXECUTE' },
    waitFor: (snap) => snap.value === 'finished',
    scope: {
      close() {
        scopeClosed += 1;
      },
    },
  });

  assert.equal(handle.canDispatch('execute'), true);
  const actorOutcome = await actorReg.dispatchWithResult('execute');
  assert.equal(actorOutcome.result?.value, 'finished');
  assert.equal(handle.canDispatch('execute'), false);

  await handle.dispose();
  assert.equal(handle.isDisposed(), true);
  assert.equal(scopeClosed, 1);
});

test('@context-action/xstate/effect runInTransactionScope commits and rolls back atomically', async () => {
  const events = [];
  const coordinator = {
    begin(participants, options) {
      events.push(`begin:${participants.length}:${options?.label ?? ''}`);
      return {
        meta: { id: 'tx-1', ...options },
        commit() {
          events.push('commit');
        },
        rollback() {
          events.push('rollback');
        },
      };
    },
  };

  const committed = await runInTransactionScope(
    coordinator,
    [],
    async () => 'done',
    { label: 'save' },
  );
  assert.equal(committed, 'done');
  assert.deepEqual(events, ['begin:0:save', 'commit']);

  events.length = 0;
  await assert.rejects(
    () =>
      runInTransactionScope(coordinator, [], async () => {
        throw new Error('boom');
      }),
    /boom/,
  );
  assert.deepEqual(events, ['begin:0:', 'rollback']);

  events.length = 0;
  const ac = new AbortController();
  const abortedTx = runInTransactionScope(
    coordinator,
    [],
    () => new Promise(() => {}),
    { signal: ac.signal, label: 'interrupted' },
  );
  ac.abort('fiber-interrupted');
  await assert.rejects(abortedTx, /fiber-interrupted/);
  assert.deepEqual(events, ['begin:0:interrupted', 'rollback']);
});

test('functional edge cases: waitForActorSnapshot error/stopped/timeoutMs, ActionRegister emitter errors, and abortOnError', async () => {
  // 1. Actor entering error state rejects waitForActorSnapshot and detaches listener
  const errActor = createMockActor('idle', {}, {
    onSend() {
      return { value: 'failed', context: {}, status: 'error', error: new Error('machine-crashed') };
    },
  });
  const waitErr = waitForActorSnapshot(errActor, (s) => s.value === 'done');
  assert.equal(errActor.stats.activeListeners, 1);
  errActor.send({ type: 'CRASH' });
  await assert.rejects(waitErr, /machine-crashed/);
  assert.equal(errActor.stats.activeListeners, 0);

  // 2. Actor stopped before matching rejects waitForActorSnapshot
  const stopActor = createMockActor('idle', {}, {
    onSend() {
      return { value: 'cancelled', context: {}, status: 'stopped' };
    },
  });
  const waitStop = waitForActorSnapshot(stopActor, (s) => s.value === 'done');
  stopActor.send({ type: 'STOP' });
  await assert.rejects(waitStop, /Actor terminated with status "stopped"/);
  assert.equal(stopActor.stats.activeListeners, 0);

  // 3. timeoutMs expires and cleans up actor listener
  const slowActor = createMockActor('idle', {});
  await assert.rejects(
    waitForActorSnapshot(slowActor, (s) => s.value === 'done', { timeoutMs: 15 }),
    /Timed out after 15ms/,
  );
  assert.equal(slowActor.stats.activeListeners, 0);

  // 4. createActorActionEmitter with ActionRegister & onError for async enqueue failures
  const capturedErrors = [];
  const emittedPayloads = [];
  const reg = new ActionRegister({ id: 'emitter-reg' });
  reg.register('ok', (payload) => {
    emittedPayloads.push(payload);
  });
  reg.register(
    'boom',
    async () => {
      throw new Error('async-emit-failed');
    },
    { blocking: true },
  );

  const emitter = createActorActionEmitter(reg, {
    onError(error, action) {
      capturedErrors.push({ action, message: error instanceof Error ? error.message : String(error) });
    },
  });
  await emitter.emit('ok', { n: 1 });
  assert.deepEqual(emittedPayloads, [{ n: 1 }]);

  const queue = [];
  emitter.enqueue((fn) => queue.push(fn), 'boom', { fail: true });
  for (const job of queue) job();
  await new Promise((r) => setTimeout(r, 10));
  assert.deepEqual(capturedErrors, [{ action: 'boom', message: 'async-emit-failed' }]);

  // 5. registerEffectHandler with abortOnError + mapError converts failures into clean aborts
  const abortReg = new ActionRegister({ id: 'effect-abort-reg' });
  registerEffectHandler(
    abortReg,
    'charge',
    () => async () => {
      throw new Error('gateway-503');
    },
    {
      runner: (fn) => fn(),
      abortOnError: true,
      mapError: (err) => `payment:${err instanceof Error ? err.message : String(err)}`,
    },
  );
  const chargeOutcome = await abortReg.dispatchWithResult('charge', { amount: 50 });
  assert.equal(chargeOutcome.aborted, true);
  assert.equal(chargeOutcome.abortReason, 'payment:gateway-503');
});

test('standardized interfaces: bindActor universal handle, bindActorEmissions, and bindActionDispatchTransactions', async () => {
  // 1. bindActor on SyncActionPipeline exposes uniform BoundActorHandle + callable teardown
  const emittedHandlers = new Map();
  let syncActor = {
    ...createMockActor('idle', { items: [] }, {
      can: (s, e) => (e.type === 'ADD' ? s.value === 'idle' : false),
      onSend(s, e) {
        if (e.type === 'ADD') {
          const next = { value: 'idle', context: { items: [...s.context.items, e.item] }, status: 'active' };
          for (const h of emittedHandlers.get('ITEM_ADDED') ?? []) h({ type: 'ITEM_ADDED', item: e.item });
          return next;
        }
        return undefined;
      },
    }),
    on(type, handler) {
      const set = emittedHandlers.get(type) ?? new Set();
      set.add(handler);
      emittedHandlers.set(type, set);
      return {
        unsubscribe() {
          set.delete(handler);
        },
      };
    },
  };

  const syncPipe = createSyncActionPipeline('items-sync');
  const logged = [];
  syncPipe.register('onItemAdded', (payload) => {
    logged.push(payload);
  });

  const syncHandle = bindActor(syncPipe, syncActor, {
    map: { addItem: (item) => ({ type: 'ADD', item }) },
    emissions: { ITEM_ADDED: 'onItemAdded' },
  });

  assert.equal(typeof syncHandle, 'function');
  assert.equal(syncHandle.canDispatch('addItem', 'book'), true);
  assert.equal(syncHandle.isDisposed(), false);
  assert.equal(syncHandle.getSnapshot().value, 'idle');

  const syncAdd = syncPipe.dispatch('addItem', 'book');
  assert.equal(syncAdd.success, true);
  assert.deepEqual(logged, [{ item: 'book' }]);

  // Calling handle directly unbinds handlers AND detaches emission subscriptions
  syncHandle();
  assert.equal(syncHandle.isDisposed(), true);
  assert.equal(syncHandle.canDispatch('addItem', 'pen'), false);
  assert.equal(emittedHandlers.get('ITEM_ADDED')?.size ?? 0, 0);

  // 2. bindActor on ActionRegister + standalone bindActorEmissions
  const asyncReg = new ActionRegister({ id: 'async-universal' });
  const asyncEmitted = [];
  asyncReg.register('audit', (payload) => {
    asyncEmitted.push(payload);
  });
  const detachedStandalone = bindActorEmissions(syncActor, asyncReg, {
    ITEM_ADDED: (event, emitter) => emitter.emit('audit', { tag: event.item }),
  });
  const asyncHandle = bindActor(asyncReg, syncActor, {
    map: { addItem: (item) => ({ type: 'ADD', item }) },
  });
  await asyncReg.dispatch('addItem', 'notebook');
  assert.deepEqual(asyncEmitted, [{ tag: 'notebook' }]);

  asyncHandle.dispose();
  detachedStandalone();
  assert.equal(asyncHandle.isDisposed(), true);

  // 3. bindActionDispatchTransactions bridges dispatch traces to TransactionCoordinatorPort
  const txReg = new ActionRegister({ id: 'tx-trace-reg' });
  const txEvents = [];
  const coordinator = {
    begin(participants, options) {
      txEvents.push(`begin:${participants.length}:${options.label}`);
      return {
        meta: { id: 'tx-trace-1', ...options },
        commit() {
          txEvents.push('commit');
        },
        rollback() {
          txEvents.push('rollback');
        },
      };
    },
  };
  const detachTx = bindActionDispatchTransactions(txReg, coordinator, {
    getParticipants: () => [{ name: 'p1', store: {} }],
  });

  txReg.register('save', () => 'ok');
  txReg.register(
    'fail',
    () => {
      throw new Error('tx-fail');
    },
    { blocking: true },
  );

  await txReg.dispatch('save');
  await assert.rejects(() => txReg.dispatch('fail'), /tx-fail/);
  assert.deepEqual(txEvents, [
    'begin:1:save',
    'commit',
    'begin:1:fail',
    'rollback',
  ]);
  detachTx();
});

test('bindActorToActionRegister defaults blocking to true when waitFor is provided', async () => {
  let snapshot = { value: 'idle', status: 'active' };
  const listeners = new Set();
  const actor = {
    getSnapshot: () => snapshot,
    subscribe(observer) {
      listeners.add(observer);
      return { unsubscribe: () => listeners.delete(observer) };
    },
    send() {
      setTimeout(() => {
        snapshot = { value: 'done', status: 'active' };
        for (const obs of [...listeners]) {
          obs.next?.(snapshot);
        }
      }, 20);
    },
  };

  const recordedConfigs = [];
  const register = new ActionRegister();
  const originalRegister = register.register.bind(register);
  register.register = (action, handler, config) => {
    recordedConfigs.push({ action, config });
    return originalRegister(action, handler, config);
  };

  bindActorToActionRegister(register, actor, {
    map: { submit: () => ({ type: 'SUBMIT' }) },
    waitFor: (snap) => snap.value === 'done',
  });
  assert.equal(recordedConfigs[0]?.config?.blocking, true);

  await register.dispatch('submit', undefined);
  assert.equal(actor.getSnapshot().value, 'done');

  bindActorToActionRegister(register, actor, {
    map: { ping: () => ({ type: 'PING' }) },
  });
  assert.equal(recordedConfigs[1]?.config?.blocking, undefined);
  register.destroy();
});

test('binding helpers roll back partial registrations when setup throws', () => {
  const brokenEmitterActor = {
    getSnapshot: () => ({ value: 'ready', status: 'active' }),
    subscribe: () => ({ unsubscribe: () => {} }),
    send: () => {},
    on() {
      throw new Error('emission attach failed');
    },
  };

  const pipeline = createSyncActionPipeline('rollback-sync');
  assert.throws(
    () =>
      bindActorToSyncPipeline(pipeline, brokenEmitterActor, {
        map: { ping: () => ({ type: 'PING' }) },
        emissions: [{ event: 'OUT', toAction: () => ({ action: 'done' }) }],
      }),
    /emission attach failed/,
  );

  const reg = new ActionRegister();
  assert.throws(
    () =>
      bindActorToActionRegister(reg, brokenEmitterActor, {
        map: { ping: () => ({ type: 'PING' }) },
        emissions: [{ event: 'OUT', toAction: () => ({ action: 'done' }) }],
      }),
    /emission attach failed/,
  );
  assert.equal(reg.getHandlerCount('ping'), 0);

  assert.throws(
    () =>
      bindEffectActorToActionRegister(reg, brokenEmitterActor, {
        map: { ping: () => ({ type: 'PING' }) },
        emissions: [{ event: 'OUT', toAction: () => ({ action: 'done' }) }],
      }),
    /emission attach failed/,
  );
  assert.equal(reg.getHandlerCount('ping'), 0);
  reg.destroy();
});

test('waitForActorSnapshot cleans up abort listener and rejects when actor.subscribe throws synchronously', async () => {
  const controller = new AbortController();
  let removed = false;
  const originalRemove = controller.signal.removeEventListener.bind(controller.signal);
  controller.signal.removeEventListener = (...args) => {
    removed = true;
    return originalRemove(...args);
  };

  const failingActor = {
    getSnapshot: () => ({ value: 'idle', status: 'active' }),
    subscribe() {
      throw new Error('subscribe exploded');
    },
  };

  await assert.rejects(
    () =>
      waitForActorSnapshot(failingActor, () => false, {
        signal: controller.signal,
        timeoutMs: 5000,
      }),
    /subscribe exploded/,
  );
  assert.equal(removed, true);
});

test('fromStandardSchema preserves issue paths into ActionValidationError.errorPaths', async () => {
  const schema = {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate: () => ({
        issues: [{ message: 'Invalid email', path: ['user', { key: 'email' }] }],
      }),
    },
  };

  const register = new ActionRegister({
    id: 'schema-path-reg',
    registry: {
      schema: { save: fromStandardSchema(schema) },
      validateOnDispatch: true,
      validationMode: 'strict',
    },
  });
  register.register('save', () => {});

  let caught;
  try {
    await register.dispatch('save', {});
  } catch (error) {
    caught = error;
  }

  assert.equal(caught instanceof ActionValidationError, true);
  assert.deepEqual(caught.errorPaths, ['user.email']);
  register.destroy();
});

test('runInTransactionScope rejects cleanly when rollback throws or signal aborts before resolution', async () => {
  const throwingRollbackCoordinator = {
    begin() {
      return {
        meta: { id: 'tx_throw' },
        commit() {},
        rollback() {
          throw new Error('rollback boom');
        },
      };
    },
  };

  await assert.rejects(
    () =>
      runInTransactionScope(
        throwingRollbackCoordinator,
        [{ name: 'a', store: {} }],
        async () => {
          throw new Error('task failed');
        },
        { signal: new AbortController().signal },
      ),
    /task failed/,
  );

  const ac1 = new AbortController();
  await assert.rejects(
    () =>
      runInTransactionScope(
        throwingRollbackCoordinator,
        [{ name: 'a', store: {} }],
        () => new Promise(() => {}),
        { signal: (queueMicrotask(() => ac1.abort('user aborted')), ac1.signal) },
      ),
    /user aborted/,
  );

  // Signal whose aborted flag becomes true without firing listener before task resolves.
  let rollbackCalls = 0;
  let forceAborted = false;
  const silentAbortSignal = {
    get aborted() {
      return forceAborted;
    },
    reason: 'silent abort',
    addEventListener() {},
    removeEventListener() {},
  };
  await assert.rejects(
    () =>
      runInTransactionScope(
        {
          begin() {
            return {
              meta: { id: 'tx_silent' },
              commit() {
                throw new Error('commit must not run');
              },
              rollback() {
                rollbackCalls += 1;
              },
            };
          },
        },
        [{ name: 'a', store: {} }],
        async () => {
          forceAborted = true;
          return 'ok';
        },
        { signal: silentAbortSignal },
      ),
    /silent abort/,
  );
  assert.equal(rollbackCalls, 1);
});

test('bindActionDispatchTransactions supports options.actions scoping and fails closed on lane: "fast"', async () => {
  const register = new ActionRegister({
    name: 'XStateScopedBridge',
    actions: {
      save: { lane: 'orchestrated' },
      metric: { lane: 'fast' },
    },
  });
  let metricTotal = 0;
  register.register('save', () => 'saved');
  register.registerCommand('metric', (payload) => {
    metricTotal += payload.n;
  });

  const events = [];
  const coordinator = {
    begin(participants, opts) {
      events.push(`begin:${participants.length}:${opts?.actionId ?? ''}`);
      return {
        meta: { id: 'tx_scoped' },
        commit() {
          events.push('commit');
        },
        rollback() {
          events.push('rollback');
        },
      };
    },
  };

  let participantCalls = 0;
  const unbind = bindActionDispatchTransactions(register, coordinator, {
    actions: ['save'],
    getParticipants() {
      participantCalls += 1;
      return [{ name: 'store', store: {} }];
    },
  });

  await register.dispatch('metric', { n: 3 });
  assert.equal(metricTotal, 3);
  assert.equal(participantCalls, 0);
  assert.deepEqual(events, []);

  await register.dispatch('save', { id: 'ok' }, { trace: { label: 'Save' } });
  assert.equal(participantCalls, 1);
  assert.equal(events.length, 2);
  assert.equal(events[1], 'commit');

  assert.throws(
    () =>
      bindActionDispatchTransactions(register, coordinator, {
        actions: ['metric'],
        getParticipants: () => [{ name: 'store', store: {} }],
      }),
    TypeError,
  );

  unbind();
  await register.destroyAsync();
});
