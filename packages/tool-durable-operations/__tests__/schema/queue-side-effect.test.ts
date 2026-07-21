import { runQueueSideEffect } from '../../src/queue-side-effect';
import {
  createMockDurableOperationBackend,
  createMockDurableOperationStore,
} from '../support/mock-durable-operation-store';
import { createDurableSideEffectRunner } from '../../src/side-effect';
import type { SideEffectRecordPayload } from '../../src/side-effect';

function createRunner<TResult, TDiagnostic = unknown>(ownerId: string) {
  const backend = createMockDurableOperationBackend<
    SideEffectRecordPayload<TResult, TDiagnostic>
  >();
  const store = createMockDurableOperationStore(backend, ownerId);
  return {
    backend,
    runner: createDurableSideEffectRunner<TResult, TDiagnostic>({ store, ownerId }),
  };
}

describe('queue durable side-effect adapter', () => {
  it('replays an authoritative acknowledgement without enqueueing twice', async () => {
    const first = createRunner<{ messageId: string }, { requestId: string }>('queue-a');
    const secondRunner = createDurableSideEffectRunner<
      { messageId: string },
      { requestId: string }
    >({
      store: createMockDurableOperationStore(first.backend, 'queue-b'),
      ownerId: 'queue-b',
    });
    let enqueueCount = 0;

    await expect(runQueueSideEffect({
      runner: first.runner,
      key: 'queue:orders:42',
      fingerprint: 'orders:42:v1',
      message: { orderId: '42' },
      enqueue: async message => {
        enqueueCount += 1;
        return { messageId: `message-${message.orderId}` };
      },
      onAcknowledgement: acknowledgement => ({
        state: 'completed',
        result: acknowledgement,
      }),
    })).resolves.toMatchObject({
      state: 'completed',
      result: { messageId: 'message-42' },
    });

    await expect(runQueueSideEffect({
      runner: secondRunner,
      key: 'queue:orders:42',
      fingerprint: 'orders:42:v1',
      message: { orderId: '42' },
      enqueue: async () => {
        enqueueCount += 1;
        return { messageId: 'duplicate' };
      },
      onAcknowledgement: acknowledgement => ({
        state: 'completed',
        result: acknowledgement,
      }),
    })).resolves.toMatchObject({ state: 'replayed', result: { messageId: 'message-42' } });
    expect(enqueueCount).toBe(1);
  });

  it('requires explicit recovery for an ambiguous acknowledgement', async () => {
    const first = createRunner<{ status: string }, { requestId: string }>('publisher-a');
    const recoveryRunner = createDurableSideEffectRunner<
      { status: string },
      { requestId: string }
    >({
      store: createMockDurableOperationStore(first.backend, 'recovery-a'),
      ownerId: 'recovery-a',
    });
    let enqueueCount = 0;

    await expect(runQueueSideEffect({
      runner: first.runner,
      key: 'queue:payments:42',
      fingerprint: 'payments:42:v1',
      message: { paymentId: '42' },
      enqueue: async () => {
        enqueueCount += 1;
        return { accepted: true };
      },
      onAcknowledgement: () => ({
        state: 'unknown',
        reason: 'broker acknowledgement was lost after publish',
        diagnostic: { requestId: 'publish-42' },
      }),
    })).resolves.toMatchObject({
      state: 'unknown',
      diagnostic: { requestId: 'publish-42' },
    });

    await expect(runQueueSideEffect({
      runner: recoveryRunner,
      key: 'queue:payments:42',
      fingerprint: 'payments:42:v1',
      message: { paymentId: '42' },
      enqueue: async () => {
        enqueueCount += 1;
        return { accepted: true };
      },
      onAcknowledgement: () => ({ state: 'completed', result: { status: 'duplicate' } }),
    })).resolves.toMatchObject({ state: 'unknown' });

    await expect(recoveryRunner.recover('queue:payments:42', async ({ diagnostic }) => ({
      state: 'completed',
      result: {
        status: diagnostic?.requestId === 'publish-42' ? 'confirmed' : 'unverified',
      },
    }))).resolves.toMatchObject({
      state: 'resolved',
      result: { status: 'confirmed' },
    });
    expect(enqueueCount).toBe(1);
  });

  it('allows a provider to classify a pre-enqueue rejection as failed', async () => {
    const { runner } = createRunner<{ accepted: boolean }>('publisher-a');

    await expect(runQueueSideEffect({
      runner,
      key: 'queue:reject:42',
      fingerprint: 'reject:42:v1',
      message: { orderId: '42' },
      enqueue: async () => {
        throw new Error('broker rejected before publish');
      },
      onAcknowledgement: () => ({ state: 'completed', result: { accepted: true } }),
      onError: () => ({
        state: 'failed',
        reason: 'broker rejected before publish',
        result: { accepted: false },
      }),
    })).resolves.toMatchObject({
      state: 'failed',
      result: { accepted: false },
      operation: { state: 'failed' },
    });
  });
});
