import { createDurableSideEffectRunner } from '../../src/side-effect';
import type { SideEffectRecordPayload } from '../../src/side-effect';
import {
  createMockDurableOperationBackend,
  createMockDurableOperationStore,
} from '../support/mock-durable-operation-store';

describe('durable side-effect runner', () => {
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
