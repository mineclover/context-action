import { runHttpSideEffect } from '../../src/http-side-effect';
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
    runner: createDurableSideEffectRunner<TResult, TDiagnostic>({
      store,
      ownerId,
    }),
  };
}

describe('HTTP durable side-effect adapter', () => {
  it('replays an authoritative response without issuing a second request', async () => {
    const first = createRunner<{ status: number }, { requestId: string }>('http-a');
    const secondStore = createMockDurableOperationStore(first.backend, 'http-b');
    const second = createDurableSideEffectRunner<
      { status: number },
      { requestId: string }
    >({
      store: secondStore,
      ownerId: 'http-b',
    });
    let requestCount = 0;

    await expect(
      runHttpSideEffect({
        runner: first.runner,
        key: 'http:orders:42',
        fingerprint: 'orders:42:v1',
        request: async () => {
          requestCount += 1;
          return new Response(JSON.stringify({ accepted: true }), {
            status: 202,
            headers: { 'content-type': 'application/json' },
          });
        },
        onResponse: async response => {
          if (response.ok) {
            return { state: 'completed', result: { status: response.status } };
          }
          return {
            state: 'unknown',
            reason: 'provider acknowledgement was not authoritative',
          };
        },
      })
    ).resolves.toMatchObject({ state: 'completed', result: { status: 202 } });

    await expect(
      runHttpSideEffect({
        runner: second,
        key: 'http:orders:42',
        fingerprint: 'orders:42:v1',
        request: async () => {
          requestCount += 1;
          return new Response('{}', { status: 202 });
        },
        onResponse: async response => ({
          state: 'completed',
          result: { status: response.status },
        }),
      })
    ).resolves.toMatchObject({ state: 'replayed', result: { status: 202 } });
    expect(requestCount).toBe(1);
  });

  it('allows an adapter to mark a confirmed pre-send rejection as failed', async () => {
    const { runner } = createRunner<
      { accepted: boolean },
      { phase: string }
    >('http-a');
    let responseHandlerCalled = false;

    await expect(
      runHttpSideEffect({
        runner,
        key: 'http:orders:reject',
        fingerprint: 'orders:reject:v1',
        request: async () => {
          throw new Error('request rejected before transmission');
        },
        onResponse: async () => {
          responseHandlerCalled = true;
          return { state: 'completed', result: { accepted: true } };
        },
        onError: () => ({
          state: 'failed',
          reason: 'request rejected before transmission',
          result: { accepted: false },
          diagnostic: { phase: 'pre-send' },
        }),
      })
    ).resolves.toMatchObject({
      state: 'failed',
      result: { accepted: false },
      diagnostic: { phase: 'pre-send' },
    });
    expect(responseHandlerCalled).toBe(false);
  });

  it('keeps a non-authoritative provider error unknown and recovers without retrying', async () => {
    const first = createRunner<
      { status: number },
      { requestId: string }
    >('provider-a');
    const recoveryStore = createMockDurableOperationStore(
      first.backend,
      'recovery-a'
    );
    const recoveryRunner = createDurableSideEffectRunner<
      { status: number },
      { requestId: string }
    >({
      store: recoveryStore,
      ownerId: 'recovery-a',
    });
    let requestCount = 0;

    await expect(
      runHttpSideEffect({
        runner: first.runner,
        key: 'http:payments:42',
        fingerprint: 'payments:42:v1',
        request: async () => {
          requestCount += 1;
          return new Response('{"error":"upstream unavailable"}', {
            status: 500,
          });
        },
        onResponse: async response => ({
          state: 'unknown',
          reason: `provider response is ambiguous (HTTP ${response.status})`,
          diagnostic: { requestId: 'req-42' },
        }),
      })
    ).resolves.toMatchObject({
      state: 'unknown',
      diagnostic: { requestId: 'req-42' },
    });

    await expect(
      recoveryRunner.recover('http:payments:42', async ({ diagnostic }) => ({
        state: 'completed',
        result: { status: diagnostic?.requestId === 'req-42' ? 201 : 500 },
        reason: 'provider status query confirmed the payment',
      }))
    ).resolves.toMatchObject({
      state: 'resolved',
      result: { status: 201 },
    });
    expect(requestCount).toBe(1);
  });

  it('returns unknown immediately when cancellation beats an in-flight request', async () => {
    const { runner } = createRunner<{ status: number }, { requestId: string }>(
      'http-a'
    );
    const controller = new AbortController();
    let requestStarted = false;
    let resolveRequest: ((response: Response) => void) | undefined;
    const request = new Promise<Response>(resolve => {
      resolveRequest = resolve;
    });

    const run = runHttpSideEffect({
      runner,
      key: 'http:uploads:42',
      fingerprint: 'uploads:42:v1',
      signal: controller.signal,
      abortDiagnostic: { requestId: 'req-upload-42' },
      request: async context => {
        requestStarted = true;
        expect(context.signal).toBe(controller.signal);
        return request;
      },
      onResponse: async response => ({
        state: 'completed',
        result: { status: response.status },
      }),
    });

    while (!requestStarted) await Promise.resolve();
    controller.abort();

    await expect(run).resolves.toMatchObject({
      state: 'unknown',
      diagnostic: { requestId: 'req-upload-42' },
    });
    resolveRequest?.(new Response('{}', { status: 200 }));
    await Promise.resolve();
  });
});
