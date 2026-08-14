import { createDurableOperationStore } from '../../src/durable-operation';
import { createDurableSideEffectRunner } from '../../src/side-effect';
import type { SideEffectOutcome, SideEffectRecordPayload } from '../../src/side-effect';
import {
  createMockDurableOperationBackend,
  createMockDurableOperationStore,
} from '../support/mock-durable-operation-store';

describe('durable side-effect runner', () => {
  it('rejects a legacy custom store without fencing capability', () => {
    const backend = createMockDurableOperationBackend<SideEffectRecordPayload<{ id: string }>>();
    const fencedStore = createMockDurableOperationStore(backend, 'legacy-worker');
    const { fencingCapability: _fencingCapability, ...legacyStore } = fencedStore;

    expect(() => createDurableSideEffectRunner({
      store: legacyStore as unknown as typeof fencedStore,
      ownerId: 'legacy-worker',
    })).toThrow('incarnation-revision fencing');
  });

  it('executes a queue write once and replays the durable result', async () => {
    const backend = createMockDurableOperationBackend<SideEffectRecordPayload<{ id: string }>>();
    const worker = createMockDurableOperationStore(backend, 'worker-a');
    const restartedWorker = createMockDurableOperationStore(backend, 'worker-b');
    const runner = createDurableSideEffectRunner({ store: worker, ownerId: 'worker-a' });
    const restartedRunner = createDurableSideEffectRunner({
      store: restartedWorker,
      ownerId: 'worker-b',
    });
    let enqueueCount = 0;

    await expect(runner.run({
      key: 'queue:orders:42',
      fingerprint: 'order-42-v1',
      execute: async () => {
        enqueueCount += 1;
        return { state: 'completed', result: { id: 'message-42' } };
      },
    })).resolves.toMatchObject({
      state: 'completed',
      operation: { state: 'completed' },
      result: { id: 'message-42' },
    });

    await expect(restartedRunner.run({
      key: 'queue:orders:42',
      fingerprint: 'order-42-v1',
      execute: async () => {
        enqueueCount += 1;
        return { state: 'completed', result: { id: 'duplicate' } };
      },
    })).resolves.toMatchObject({
      state: 'replayed',
      result: { id: 'message-42' },
    });
    expect(enqueueCount).toBe(1);
  });

  it('protects a filesystem write from duplicate delivery', async () => {
    const backend = createMockDurableOperationBackend<
      SideEffectRecordPayload<{ path: string }>
    >();
    const firstWorker = createMockDurableOperationStore(backend, 'tab-a');
    const secondWorker = createMockDurableOperationStore(backend, 'tab-b');
    const firstRunner = createDurableSideEffectRunner({
      store: firstWorker,
      ownerId: 'tab-a',
    });
    const secondRunner = createDurableSideEffectRunner({
      store: secondWorker,
      ownerId: 'tab-b',
    });
    const writes: string[] = [];
    const writeFile = async (path: string): Promise<void> => {
      writes.push(path);
    };

    await expect(
      firstRunner.run({
        key: 'workspace.saveAll:folder-a:7:write:index.html',
        fingerprint: 'workspace.saveAll:folder-a:write:index.html:sha256:v1',
        execute: async () => {
          await writeFile('index.html');
          return { state: 'completed', result: { path: 'index.html' } };
        },
      })
    ).resolves.toMatchObject({ state: 'completed' });

    await expect(
      secondRunner.run({
        key: 'workspace.saveAll:folder-a:7:write:index.html',
        fingerprint: 'workspace.saveAll:folder-a:write:index.html:sha256:v1',
        execute: async () => {
          await writeFile('index.html');
          return { state: 'completed', result: { path: 'index.html' } };
        },
      })
    ).resolves.toMatchObject({ state: 'replayed', result: { path: 'index.html' } });
    expect(writes).toEqual(['index.html']);
  });

  it('does not let a stale execution complete after a same-owner lease reclaim', async () => {
    type Result = { attempt: number };
    type Outcome = SideEffectOutcome<Result>;
    let now = 1_000;
    const backend = createMockDurableOperationBackend<SideEffectRecordPayload<Result>>();
    const firstStore = createMockDurableOperationStore(backend, 'shared-owner', () => now);
    const reclaimingStore = createMockDurableOperationStore(backend, 'shared-owner', () => now);
    const firstRunner = createDurableSideEffectRunner({
      store: firstStore,
      ownerId: 'shared-owner',
    });
    const reclaimingRunner = createDurableSideEffectRunner({
      store: reclaimingStore,
      ownerId: 'shared-owner',
    });
    let resolveFirst: ((outcome: Outcome) => void) | undefined;
    let resolveReclaimed: ((outcome: Outcome) => void) | undefined;

    const firstRun = firstRunner.run({
      key: 'queue:same-owner-reclaim',
      fingerprint: 'same-owner-v1',
      leaseMs: 100,
      execute: () => new Promise(resolve => {
        resolveFirst = resolve;
      }),
    });
    while (!resolveFirst) await Promise.resolve();

    now = 1_101;
    const reclaimedRun = reclaimingRunner.run({
      key: 'queue:same-owner-reclaim',
      fingerprint: 'same-owner-v1',
      leaseMs: 100,
      execute: () => new Promise(resolve => {
        resolveReclaimed = resolve;
      }),
    });
    while (!resolveReclaimed) await Promise.resolve();

    resolveFirst({ state: 'completed', result: { attempt: 1 } });
    const staleResult = await firstRun.then(
      value => ({ status: 'fulfilled' as const, value }),
      error => ({ status: 'rejected' as const, error })
    );
    resolveReclaimed({ state: 'completed', result: { attempt: 2 } });
    const currentResult = await reclaimedRun.then(
      value => ({ status: 'fulfilled' as const, value }),
      error => ({ status: 'rejected' as const, error })
    );

    expect(staleResult.status).toBe('rejected');
    if (staleResult.status === 'rejected') {
      expect(staleResult.error).toEqual(expect.objectContaining({
        message: expect.stringContaining('fence is stale'),
      }));
    }
    expect(currentResult).toMatchObject({
      status: 'fulfilled',
      value: { state: 'completed', result: { attempt: 2 } },
    });
  });

  it('does not schedule execution when cancellation happens while claim is pending', async () => {
    const backend = createMockDurableOperationBackend<SideEffectRecordPayload<{ ok: boolean }>>();
    const baseStore = createDurableOperationStore(backend);
    let releaseClaim: (() => void) | undefined;
    const store = {
      ...baseStore,
      claim: async (...args: Parameters<typeof baseStore.claim>) => {
        const claim = await baseStore.claim(...args);
        await new Promise<void>(resolve => {
          releaseClaim = resolve;
        });
        return claim;
      },
    };
    const runner = createDurableSideEffectRunner({ store, ownerId: 'worker-a' });
    const controller = new AbortController();
    let executions = 0;

    const run = runner.run({
      key: 'queue:abort-during-claim',
      fingerprint: 'abort-during-claim-v1',
      signal: controller.signal,
      execute: async () => {
        executions += 1;
        return { state: 'completed', result: { ok: true } };
      },
    });
    while (!releaseClaim) await Promise.resolve();

    controller.abort();
    releaseClaim();

    await expect(run).resolves.toMatchObject({
      state: 'cancelled',
      operation: { state: 'pending', revision: 1 },
      reason: 'side-effect was cancelled before execution',
    });
    expect(executions).toBe(0);
  });

  it('keeps an HTTP/provider error unknown by default and reconciles it explicitly', async () => {
    const backend = createMockDurableOperationBackend<SideEffectRecordPayload<{ status: number }, { requestId: string }>>();
    const worker = createMockDurableOperationStore(backend, 'provider-a');
    const recoveryWorker = createMockDurableOperationStore(backend, 'recovery');
    const runner = createDurableSideEffectRunner({ store: worker, ownerId: 'provider-a' });
    const recoveryRunner = createDurableSideEffectRunner({
      store: recoveryWorker,
      ownerId: 'recovery',
    });

    await expect(runner.run({
      key: 'provider:charge:42',
      fingerprint: 'charge-42-v1',
      execute: async () => {
        throw new Error('connection closed after request body was sent');
      },
    })).resolves.toMatchObject({
      state: 'unknown',
      operation: { state: 'unknown', reason: 'connection closed after request body was sent' },
    });

    let resolverCalls = 0;
    await expect(recoveryRunner.recover(
      'provider:charge:42',
      async ({ operation }) => {
        resolverCalls += 1;
        expect(operation.result).toBeUndefined();
        return {
          state: 'completed',
          result: { status: 201 },
          diagnostic: { requestId: 'req-42' },
          reason: 'provider query confirmed the charge',
        };
      },
      { reconcilerId: 'operator-42' }
    )).resolves.toMatchObject({
      state: 'resolved',
      operation: {
        state: 'completed',
        reconciledBy: 'operator-42',
        result: {
          result: { status: 201 },
          diagnostic: { requestId: 'req-42' },
        },
      },
      result: { status: 201 },
    });
    expect(resolverCalls).toBe(1);

    await expect(runner.run({
      key: 'provider:charge:42',
      fingerprint: 'charge-42-v1',
      execute: async () => ({ state: 'completed', result: { status: 500 } }),
    })).resolves.toMatchObject({ state: 'replayed', result: { status: 201 } });
  });

  it('rejects a stale recovery fence before invoking the domain resolver', async () => {
    type Payload = SideEffectRecordPayload<{ ok: boolean }>;
    let now = 1_000;
    let incarnation = 0;
    const backend = createMockDurableOperationBackend<Payload>();
    const storeOptions = {
      retentionMs: 0,
      createIncarnation: () => `side-effect-recovery-${++incarnation}`,
    };
    const ownerStore = createMockDurableOperationStore(
      backend,
      'owner',
      () => now,
      storeOptions
    );
    const recoveryStore = createMockDurableOperationStore(
      backend,
      'recovery',
      () => now,
      storeOptions
    );
    const firstClaim = await ownerStore.claim('provider:aba:42', 'provider-aba-v1', 'owner');
    const firstUnknown = await ownerStore.markUnknown(
      'provider:aba:42',
      'owner',
      'first incarnation outcome is unknown',
      undefined,
      firstClaim.fence
    );
    await ownerStore.resolveUnknown(
      'provider:aba:42',
      'operator',
      { state: 'failed', reason: 'first incarnation was rejected' },
      { incarnation: firstUnknown.incarnation, revision: firstUnknown.revision }
    );
    now += 1;
    await expect(ownerStore.prune(now)).resolves.toBe(1);
    const secondClaim = await ownerStore.claim('provider:aba:42', 'provider-aba-v1', 'owner');
    const secondUnknown = await ownerStore.markUnknown(
      'provider:aba:42',
      'owner',
      'second incarnation outcome is unknown',
      undefined,
      secondClaim.fence
    );
    expect(secondUnknown.revision).toBe(firstUnknown.revision);
    expect(secondUnknown.incarnation).not.toBe(firstUnknown.incarnation);

    const resolver = jest.fn(async () => ({
      state: 'completed' as const,
      result: { ok: true },
    }));
    const recoveryRunner = createDurableSideEffectRunner({
      store: recoveryStore,
      ownerId: 'recovery',
    });
    await expect(recoveryRunner.recover(
      'provider:aba:42',
      resolver,
      {
        expectedFence: {
          incarnation: firstUnknown.incarnation,
          revision: firstUnknown.revision,
        },
      }
    )).rejects.toThrow('fence is stale');
    expect(resolver).not.toHaveBeenCalled();
    await expect(recoveryStore.get('provider:aba:42')).resolves.toMatchObject({
      state: 'unknown',
      incarnation: secondUnknown.incarnation,
    });
  });

  it('marks a draining handler unknown when a timeout signal wins the race', async () => {
    const backend = createMockDurableOperationBackend<SideEffectRecordPayload<{ ok: boolean }, { requestId: string }>>();
    const worker = createMockDurableOperationStore(backend, 'worker-a');
    const secondWorker = createMockDurableOperationStore(backend, 'worker-b');
    const runner = createDurableSideEffectRunner({ store: worker, ownerId: 'worker-a' });
    const secondRunner = createDurableSideEffectRunner({ store: secondWorker, ownerId: 'worker-b' });
    const controller = new AbortController();
    let resolveHandler: ((value: { state: 'completed'; result: { ok: boolean } }) => void) | undefined;
    let handlerStarted = false;
    let calls = 0;

    const run = runner.run({
      key: 'http:upload:42',
      fingerprint: 'upload-42-v1',
      signal: controller.signal,
      abortDiagnostic: { requestId: 'req-upload-42' },
      execute: async () => {
        calls += 1;
        handlerStarted = true;
        return new Promise((resolve) => {
          resolveHandler = resolve;
        });
      },
    });

    while (!handlerStarted) await Promise.resolve();
    setTimeout(() => controller.abort(), 0);

    await expect(run).resolves.toMatchObject({
      state: 'unknown',
      operation: {
        state: 'unknown',
        result: { diagnostic: { requestId: 'req-upload-42' } },
      },
    });
    await expect(secondRunner.run({
      key: 'http:upload:42',
      fingerprint: 'upload-42-v1',
      execute: async () => {
        calls += 1;
        return { state: 'completed', result: { ok: true } };
      },
    })).resolves.toMatchObject({ state: 'unknown' });
    expect(calls).toBe(1);

    // The detached handler can finish, but the runner never upgrades unknown
    // without an explicit domain reconciliation call.
    resolveHandler?.({ state: 'completed', result: { ok: true } });
    await Promise.resolve();
    await expect(secondRunner.recover('http:upload:42', async ({ diagnostic }) => {
      expect(diagnostic).toEqual({ requestId: 'req-upload-42' });
      return { state: 'completed', result: { ok: true } };
    })).resolves.toMatchObject({ state: 'resolved', result: { ok: true } });
  });

  it('allows a queue adapter to classify a known rejection as failed', async () => {
    const backend = createMockDurableOperationBackend<SideEffectRecordPayload<{ accepted: boolean }>>();
    const worker = createMockDurableOperationStore(backend, 'worker-a');
    const runner = createDurableSideEffectRunner({ store: worker, ownerId: 'worker-a' });

    await expect(runner.run({
      key: 'queue:reject:42',
      fingerprint: 'reject-42-v1',
      execute: async () => {
        throw new Error('queue rejected before enqueue');
      },
      onError: () => ({
        state: 'failed',
        reason: 'queue rejected before enqueue',
        result: { accepted: false },
      }),
    })).resolves.toMatchObject({
      state: 'failed',
      operation: { state: 'failed', reason: 'queue rejected before enqueue' },
      result: { accepted: false },
    });
  });
});
