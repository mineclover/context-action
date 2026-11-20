import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitAbortable } from '@/pages/integrations/advanced/handlers/ConcurrentActionHandlerRegistry';
import { useApiManager, useSmartSearch } from './hooks';

describe('action-guard hooks and abortable waits', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('tracks cache hits within 100%, preserves concurrent writes, clears timeouts on failure, and resets stats', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/fail')) {
        throw new Error('network error');
      }
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ url }),
      } as Response;
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { result } = renderHook(() => useApiManager());

    await act(async () => {
      await Promise.all([
        result.current.execute({
          url: '/api/one',
          method: 'GET',
          cacheKey: 'key-1',
        }),
        result.current.execute({
          url: '/api/two',
          method: 'GET',
          cacheKey: 'key-2',
        }),
      ]);
    });

    expect(result.current.cache.size).toBe(2);
    expect(result.current.cache.has('key-1')).toBe(true);
    expect(result.current.cache.has('key-2')).toBe(true);

    await act(async () => {
      const cached = await result.current.execute({
        url: '/api/one',
        method: 'GET',
        cacheKey: 'key-1',
      });
      expect(cached.cached).toBe(true);
    });

    expect(result.current.stats.cacheHits).toBe(1);
    expect(result.current.stats.totalRequests).toBe(3);
    expect(
      result.current.stats.cacheHits / result.current.stats.totalRequests
    ).toBeLessThanOrEqual(1);

    const callsBeforeFail = clearTimeoutSpy.mock.calls.length;
    await act(async () => {
      await expect(
        result.current.execute({ url: '/api/fail', method: 'GET' })
      ).rejects.toThrow('network error');
    });
    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(callsBeforeFail);

    act(() => {
      result.current.clearCache();
    });
    expect(result.current.cache.size).toBe(0);
    expect(result.current.stats).toEqual({
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
    });
  });

  it('settles superseded debounced searches, forwards AbortSignal, and ignores stale responses', async () => {
    vi.useFakeTimers();

    const resolvers = new Map<string, (items: string[]) => void>();
    const signals: Array<AbortSignal | undefined> = [];

    const searchFn = vi.fn(
      (query: string, _config: unknown, signal?: AbortSignal) => {
        signals.push(signal);
        return new Promise<string[]>((resolve) => {
          resolvers.set(query, resolve);
        });
      }
    );

    const { result } = renderHook(() =>
      useSmartSearch(searchFn, { debounceMs: 100, minLength: 1 })
    );

    let firstPromise!: ReturnType<typeof result.current.search>;
    let secondPromise!: ReturnType<typeof result.current.search>;

    await act(async () => {
      firstPromise = result.current.search('alpha');
      await vi.advanceTimersByTimeAsync(50);
      secondPromise = result.current.search('beta');
    });

    const supersededResult = await firstPromise;
    expect(supersededResult.items).toEqual([]);
    expect(searchFn).not.toHaveBeenCalledWith(
      'alpha',
      expect.anything(),
      expect.anything()
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(searchFn).toHaveBeenCalledTimes(1);
    expect(signals[0]).toBeInstanceOf(AbortSignal);
    expect(signals[0]?.aborted).toBe(false);

    let thirdPromise!: ReturnType<typeof result.current.search>;
    await act(async () => {
      thirdPromise = result.current.search('gamma');
    });
    expect(signals[0]?.aborted).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(searchFn).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolvers.get('gamma')?.(['gamma-match']);
      resolvers.get('beta')?.(['stale-beta']);
    });

    const thirdResult = await thirdPromise;
    const secondResult = await secondPromise;
    expect(thirdResult.items).toEqual(['gamma-match']);
    expect(secondResult.items).toEqual([]);
    expect(result.current.results?.query).toBe('gamma');
    expect(result.current.results?.items).toEqual(['gamma-match']);
  });

  it('removes abort listeners on normal completion and rejects immediately when aborted', async () => {
    vi.useFakeTimers();

    const controller = new AbortController();
    const removeSpy = vi.spyOn(controller.signal, 'removeEventListener');

    const okPromise = waitAbortable(50, controller.signal, 'Task was aborted');
    await vi.advanceTimersByTimeAsync(50);
    await expect(okPromise).resolves.toBeUndefined();
    expect(removeSpy).toHaveBeenCalledTimes(1);

    const abortController = new AbortController();
    const abortedPromise = waitAbortable(
      1000,
      abortController.signal,
      'Task was aborted'
    );
    abortController.abort();
    await expect(abortedPromise).rejects.toThrow('Task was aborted');
  });
});
