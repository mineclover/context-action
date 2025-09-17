import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { createStore } from '../../../src/stores/core/Store';
import { useComputedStore, useMultiComputedStore as useComputedStores, useAsyncComputedStore } from '../../../src/stores/hooks/useComputedStore';

describe('useComputedStore', () => {
  it('should compute derived value from store', () => {
    const sourceStore = createStore('test', { count: 0 });

    const { result } = renderHook(() =>
      useComputedStore(sourceStore, (value) => value.count * 2)
    );

    expect(result.current).toBe(0);

    act(() => {
      sourceStore.setValue({ count: 5 });
    });

    expect(result.current).toBe(10);
  });

  it('should handle compute function changes', () => {
    const sourceStore = createStore('test', { count: 10 });

    const { result, rerender } = renderHook(
      ({ multiplier }) => useComputedStore(
        sourceStore,
        (value) => value.count * multiplier
      ),
      { initialProps: { multiplier: 2 } }
    );

    expect(result.current).toBe(20);

    rerender({ multiplier: 3 });
    expect(result.current).toBe(30);
  });

  it('should use custom equality function', () => {
    const sourceStore = createStore('test', { data: [1, 2, 3] });
    let computeCount = 0;

    const { result } = renderHook(() =>
      useComputedStore(
        sourceStore,
        (value) => {
          computeCount++;
          return value.data.reduce((a, b) => a + b, 0);
        },
        {
          equalityFn: (a, b) => a === b
        }
      )
    );

    expect(result.current).toBe(6);
    expect(computeCount).toBe(1);

    // Update with same sum - should not recompute
    act(() => {
      sourceStore.setValue({ data: [2, 2, 2] });
    });

    // Computation still happens, but result is memoized by equality
    expect(result.current).toBe(6);
  });

  it('should handle errors with onError callback', () => {
    const sourceStore = createStore('test', { value: 10 });
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useComputedStore(
        sourceStore,
        (value) => {
          if (value.value < 0) {
            throw new Error('Negative value');
          }
          return value.value * 2;
        },
        { onError }
      )
    );

    expect(result.current).toBe(20);

    act(() => {
      sourceStore.setValue({ value: -5 });
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError.mock.calls[0][0].message).toBe('Negative value');
  });

  it('should cache results when enabled', () => {
    const sourceStore = createStore('test', { value: 1 });
    let computeCount = 0;

    const { result } = renderHook(() =>
      useComputedStore(
        sourceStore,
        (value) => {
          computeCount++;
          return value.value * 2;
        },
        { enableCache: true, cacheSize: 3 }
      )
    );

    expect(result.current).toBe(2);
    expect(computeCount).toBe(1);

    // Change value
    act(() => {
      sourceStore.setValue({ value: 2 });
    });
    expect(computeCount).toBe(2);

    // Return to cached value
    act(() => {
      sourceStore.setValue({ value: 1 });
    });

    // Should use cached result
    expect(result.current).toBe(2);
    expect(computeCount).toBe(2); // No additional computation
  });

  it('should debounce computations when configured', async () => {
    jest.useFakeTimers();
    const sourceStore = createStore('test', { value: 0 });
    let computeCount = 0;

    const { result } = renderHook(() =>
      useComputedStore(
        sourceStore,
        (value) => {
          computeCount++;
          return value.value;
        },
        { debounceMs: 100 }
      )
    );

    expect(computeCount).toBe(1);

    // Rapid updates
    act(() => {
      sourceStore.setValue({ value: 1 });
      sourceStore.setValue({ value: 2 });
      sourceStore.setValue({ value: 3 });
    });

    // Still only initial computation
    expect(computeCount).toBe(1);

    // Advance timers
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Now should compute with latest value
    expect(result.current).toBe(3);
    expect(computeCount).toBe(2);

    jest.useRealTimers();
  });

  it('should handle initial value config', () => {
    const sourceStore = createStore('test', { value: 10 });

    const { result } = renderHook(() =>
      useComputedStore(
        sourceStore,
        (value) => value.value * 2,
        { initialValue: -1 }
      )
    );

    // Should compute immediately, not use initial value
    expect(result.current).toBe(20);
  });

  it('should log debug information when enabled', () => {
    const consoleLog = jest.spyOn(console, 'log').mockImplementation();
    const sourceStore = createStore('test', { value: 5 });

    renderHook(() =>
      useComputedStore(
        sourceStore,
        (value) => value.value * 3,
        { debug: true, name: 'TestComputed' }
      )
    );

    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining('[TestComputed]'),
      expect.anything()
    );

    consoleLog.mockRestore();
  });
});

describe('useComputedStores', () => {
  it('should compute from multiple stores', () => {
    const store1 = createStore('s1', { a: 1 });
    const store2 = createStore('s2', { b: 2 });
    const store3 = createStore('s3', { c: 3 });

    const { result } = renderHook(() =>
      useComputedStores(
        [store1, store2, store3],
        ([v1, v2, v3]) => v1.a + v2.b + v3.c
      )
    );

    expect(result.current).toBe(6);

    act(() => {
      store1.setValue({ a: 10 });
    });

    expect(result.current).toBe(15);

    act(() => {
      store2.setValue({ b: 20 });
    });

    expect(result.current).toBe(33);
  });

  it('should handle empty store array', () => {
    const { result } = renderHook(() =>
      useComputedStores([], () => 'empty')
    );

    expect(result.current).toBe('empty');
  });

  it('should memoize computation for same values', () => {
    const store1 = createStore('s1', { value: 1 });
    const store2 = createStore('s2', { value: 2 });
    let computeCount = 0;

    const { result } = renderHook(() =>
      useComputedStores(
        [store1, store2],
        ([v1, v2]) => {
          computeCount++;
          return v1.value + v2.value;
        }
      )
    );

    expect(result.current).toBe(3);
    expect(computeCount).toBe(1);

    // Update stores to different values that produce same result
    act(() => {
      store1.setValue({ value: 2 });
      store2.setValue({ value: 1 });
    });

    // Computation happens but result is same
    expect(result.current).toBe(3);
    expect(computeCount).toBe(2);
  });

  it('should handle errors in multi-store computation', () => {
    const store1 = createStore('s1', { value: 10 });
    const store2 = createStore('s2', { value: 5 });
    const onError = jest.fn();

    renderHook(() =>
      useComputedStores(
        [store1, store2],
        ([v1, v2]) => {
          if (v1.value < v2.value) {
            throw new Error('Invalid state');
          }
          return v1.value - v2.value;
        },
        { onError }
      )
    );

    act(() => {
      store1.setValue({ value: 3 });
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should cache multi-store results when enabled', () => {
    const store1 = createStore('s1', { x: 1 });
    const store2 = createStore('s2', { y: 2 });
    let computeCount = 0;

    const { result } = renderHook(() =>
      useComputedStores(
        [store1, store2],
        ([v1, v2]) => {
          computeCount++;
          return v1.x * v2.y;
        },
        { enableCache: true }
      )
    );

    expect(result.current).toBe(2);
    expect(computeCount).toBe(1);

    // Change and revert
    act(() => {
      store1.setValue({ x: 2 });
    });
    expect(computeCount).toBe(2);

    act(() => {
      store1.setValue({ x: 1 });
    });

    // Should use cached result
    expect(result.current).toBe(2);
    expect(computeCount).toBe(2); // No additional computation
  });

  it('should debounce multi-store computations', async () => {
    jest.useFakeTimers();
    const store1 = createStore('s1', { val: 1 });
    const store2 = createStore('s2', { val: 2 });
    let computeCount = 0;

    const { result } = renderHook(() =>
      useComputedStores(
        [store1, store2],
        ([v1, v2]) => {
          computeCount++;
          return v1.val + v2.val;
        },
        { debounceMs: 50 }
      )
    );

    expect(computeCount).toBe(1);

    // Rapid updates
    act(() => {
      store1.setValue({ val: 10 });
      store2.setValue({ val: 20 });
      store1.setValue({ val: 30 });
    });

    expect(computeCount).toBe(1);

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(result.current).toBe(50); // 30 + 20
    expect(computeCount).toBe(2);

    jest.useRealTimers();
  });
});

describe('useAsyncComputedStore', () => {
  it('should handle async computation', async () => {
    const sourceStore = createStore('test', { id: 1 });

    const { result } = renderHook(() =>
      useAsyncComputedStore(
        [sourceStore],
        async ([value]) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return `Item ${value.id}`;
        },
        { initialValue: 'Loading...' }
      )
    );

    expect(result.current.value).toBe('Loading...');
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeUndefined();

    // Wait for async computation
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    expect(result.current.value).toBe('Item 1');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle async computation errors', async () => {
    const sourceStore = createStore('test', { fail: true });
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useAsyncComputedStore(
        [sourceStore],
        async ([value]) => {
          if (value.fail) {
            throw new Error('Computation failed');
          }
          return 'Success';
        },
        { onError, initialValue: 'Initial' }
      )
    );

    // Wait for async error
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.value).toBe('Initial');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Computation failed');
    expect(onError).toHaveBeenCalled();
  });

  it('should retry async computation on failure', async () => {
    const sourceStore = createStore('test', { attempt: 0 });
    let computeCount = 0;

    const { result } = renderHook(() =>
      useAsyncComputedStore(
        [sourceStore],
        async ([value]) => {
          computeCount++;
          if (value.attempt < 2) {
            throw new Error('Retry needed');
          }
          return 'Success';
        },
        { retryOnError: true, retryCount: 3, retryDelayMs: 10 }
      )
    );

    // Initial failure
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    expect(result.current.error).toBeDefined();

    // Trigger retry by updating store
    act(() => {
      sourceStore.setValue({ attempt: 1 });
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    expect(result.current.error).toBeDefined();

    // Success on third attempt
    act(() => {
      sourceStore.setValue({ attempt: 2 });
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    expect(result.current.value).toBe('Success');
    expect(result.current.error).toBeUndefined();
    expect(computeCount).toBeGreaterThan(2);
  });

  it('should cancel previous async computation on new update', async () => {
    const sourceStore = createStore('test', { id: 1 });
    const abortedIds: number[] = [];

    renderHook(() =>
      useAsyncComputedStore(
        [sourceStore],
        async ([value]: any[], controller?: AbortController) => {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, 50);
            controller?.signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              abortedIds.push(value.id);
              reject(new Error('Aborted'));
            });
          });
          return `Item ${value.id}`;
        }
      )
    );

    // Rapid updates
    act(() => {
      sourceStore.setValue({ id: 2 });
    });

    act(() => {
      sourceStore.setValue({ id: 3 });
    });

    // Wait for potential computations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Previous computations should be aborted
    expect(abortedIds).toContain(1);
    expect(abortedIds).toContain(2);
  });

  it('should handle async computation with caching', async () => {
    const sourceStore = createStore('test', { query: 'test' });
    let computeCount = 0;

    const { result } = renderHook(() =>
      useAsyncComputedStore(
        [sourceStore],
        async ([value]) => {
          computeCount++;
          await new Promise(resolve => setTimeout(resolve, 10));
          return `Result for ${value.query}`;
        },
        { enableCache: true }
      )
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    expect(result.current.value).toBe('Result for test');
    expect(computeCount).toBe(1);

    // Change and revert
    act(() => {
      sourceStore.setValue({ query: 'other' });
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    expect(computeCount).toBe(2);

    act(() => {
      sourceStore.setValue({ query: 'test' });
    });

    // Should use cached result immediately
    expect(result.current.value).toBe('Result for test');
    expect(result.current.loading).toBe(false);
    expect(computeCount).toBe(2); // No additional computation
  });

  it('should handle multiple async computations with debounce', async () => {
    jest.useFakeTimers();
    const sourceStore = createStore('test', { id: 1 });
    let computeCount = 0;

    renderHook(() =>
      useAsyncComputedStore(
        [sourceStore],
        async ([value]) => {
          computeCount++;
          return value.id * 10;
        },
        { debounceMs: 100 }
      )
    );

    // Rapid updates
    act(() => {
      sourceStore.setValue({ id: 2 });
      sourceStore.setValue({ id: 3 });
      sourceStore.setValue({ id: 4 });
    });

    expect(computeCount).toBe(1); // Only initial

    act(() => {
      jest.advanceTimersByTime(100);
    });

    await act(async () => {
      jest.advanceTimersByTime(10);
    });

    // Should only compute once with final value
    expect(computeCount).toBe(2);

    jest.useRealTimers();
  });
});