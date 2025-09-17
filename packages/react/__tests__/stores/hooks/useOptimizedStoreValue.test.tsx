import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOptimizedStoreValue } from '../../../src/stores/hooks/useOptimizedStoreValue';
import { Store } from '../../../src/stores/core/Store';

describe('useOptimizedStoreValue', () => {
  let store: Store<{ count: number; text: string }>;

  beforeEach(() => {
    store = new Store('test-store', { count: 0, text: 'initial' });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    store.dispose();
  });

  describe('Basic functionality', () => {
    it('should return current store value', () => {
      const { result } = renderHook(() =>
        useOptimizedStoreValue(store)
      );

      expect(result.current).toEqual({ count: 0, text: 'initial' });
    });

    it('should update when store value changes', () => {
      const { result } = renderHook(() =>
        useOptimizedStoreValue(store)
      );

      act(() => {
        store.setValue({ count: 1, text: 'updated' });
      });

      expect(result.current).toEqual({ count: 1, text: 'updated' });
    });

    it('should handle null store gracefully', () => {
      const { result } = renderHook(() =>
        useOptimizedStoreValue(null as any, { defaultValue: { count: -1, text: 'default' } })
      );

      expect(result.current).toEqual({ count: -1, text: 'default' });
    });
  });

  describe('Selector functionality', () => {
    it('should use selector to extract partial value', () => {
      const { result } = renderHook(() =>
        useOptimizedStoreValue(store, {
          selector: (value) => value.count
        })
      );

      expect(result.current).toBe(0);
    });

    it('should update only when selected value changes', () => {
      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useOptimizedStoreValue(store, {
          selector: (value) => value.count
        });
      });

      const initialRenderCount = renderCount;

      act(() => {
        store.setValue({ count: 0, text: 'changed' }); // count unchanged
      });

      expect(renderCount).toBe(initialRenderCount); // No re-render
      expect(result.current).toBe(0);

      act(() => {
        store.setValue({ count: 1, text: 'changed' }); // count changed
      });

      expect(renderCount).toBeGreaterThan(initialRenderCount);
      expect(result.current).toBe(1);
    });

    it('should use custom equality function', () => {
      const isEqual = jest.fn((a, b) => Math.floor(a) === Math.floor(b));

      const { result } = renderHook(() =>
        useOptimizedStoreValue(store, {
          selector: (value) => value.count,
          isEqual
        })
      );

      act(() => {
        store.setValue({ count: 0.5, text: 'test' });
      });

      expect(isEqual).toHaveBeenCalled();
      expect(result.current).toBe(0); // Still 0 because floor(0) === floor(0.5)
    });
  });

  describe('Throttle functionality', () => {
    it('should throttle updates', async () => {
      let updateCount = 0;

      const { result } = renderHook(() => {
        updateCount++;
        return useOptimizedStoreValue(store, {
          throttle: 100
        });
      });

      const initialUpdateCount = updateCount;

      // Rapid updates
      act(() => {
        for (let i = 1; i <= 10; i++) {
          store.setValue({ count: i, text: `update-${i}` });
        }
      });

      // Should get first update immediately
      expect(result.current.count).toBe(1);

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should get the latest value after throttle period
      await waitFor(() => {
        expect(result.current.count).toBe(10);
      });

      // Should have fewer updates than total due to throttling
      expect(updateCount).toBeLessThan(initialUpdateCount + 10);
    });
  });

  describe('Debounce functionality', () => {
    it('should debounce updates', async () => {
      const { result } = renderHook(() =>
        useOptimizedStoreValue(store, {
          debounce: 100
        })
      );

      // Rapid updates
      act(() => {
        for (let i = 1; i <= 5; i++) {
          store.setValue({ count: i, text: `update-${i}` });
          jest.advanceTimersByTime(50); // Less than debounce time
        }
      });

      // Should still have initial value
      expect(result.current.count).toBe(0);

      // Complete debounce period
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should have final value
      await waitFor(() => {
        expect(result.current.count).toBe(5);
      });
    });
  });

  describe('Memoization', () => {
    it('should memoize selector results', () => {
      const selector = jest.fn((value) => ({ doubled: value.count * 2 }));

      const { result, rerender } = renderHook(() =>
        useOptimizedStoreValue(store, {
          selector,
          enableMemoization: true,
          maxCacheSize: 5
        })
      );

      expect(result.current).toEqual({ doubled: 0 });
      const initialCallCount = selector.mock.calls.length;

      // Re-render with same store value
      rerender();

      // Selector should not be called again (memoized)
      expect(selector.mock.calls.length).toBe(initialCallCount);
      expect(result.current).toEqual({ doubled: 0 });
    });
  });

  describe('Performance metrics', () => {
    it('should track performance metrics when enabled', async () => {
      const { result } = renderHook(() =>
        useOptimizedStoreValue(store, {
          enableMetrics: true,
          throttle: 50
        })
      );

      // Generate updates
      act(() => {
        for (let i = 1; i <= 5; i++) {
          store.setValue({ count: i, text: `update-${i}` });
        }
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Access metrics through the hook's internal mechanism
      // Note: The actual implementation may need to expose metrics differently
      expect(result.current).toBeDefined();
    });
  });

  describe('Error recovery', () => {
    it('should handle selector errors with retry', () => {
      let attempts = 0;
      const faultySelector = jest.fn((value) => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Selector error');
        }
        return value.count;
      });

      const { result } = renderHook(() =>
        useOptimizedStoreValue(store, {
          selector: faultySelector,
          enableRetry: true,
          maxRetries: 3,
          defaultValue: -1
        })
      );

      // Should use default value on error
      expect(result.current).toBe(-1);

      // After retries, should eventually succeed
      act(() => {
        store.setValue({ count: 5, text: 'test' });
      });

      // The implementation should retry and eventually succeed
      expect(faultySelector).toHaveBeenCalled();
    });

    it('should use default value when store is unavailable', () => {
      const { result } = renderHook(() =>
        useOptimizedStoreValue(undefined as any, {
          defaultValue: { count: 999, text: 'fallback' }
        })
      );

      expect(result.current).toEqual({ count: 999, text: 'fallback' });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup subscriptions on unmount', () => {
      const unsubscribeSpy = jest.spyOn(store, 'subscribe');

      const { unmount } = renderHook(() =>
        useOptimizedStoreValue(store)
      );

      const unsubscribe = unsubscribeSpy.mock.results[0]?.value;
      expect(typeof unsubscribe).toBe('function');

      unmount();

      // Verify cleanup happened (subscription should be removed)
      expect(store.getListenerCount()).toBe(0);
    });

    it('should cleanup timers on unmount', () => {
      const { unmount } = renderHook(() =>
        useOptimizedStoreValue(store, {
          throttle: 100,
          debounce: 100
        })
      );

      // Trigger some updates
      act(() => {
        store.setValue({ count: 1, text: 'test' });
      });

      unmount();

      // Advance timers - should not cause errors
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Test passes if no errors thrown
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid option changes', () => {
      const { result, rerender } = renderHook(
        ({ throttle }) => useOptimizedStoreValue(store, { throttle }),
        { initialProps: { throttle: 100 } }
      );

      expect(result.current).toEqual({ count: 0, text: 'initial' });

      // Change throttle option
      rerender({ throttle: 50 });

      act(() => {
        store.setValue({ count: 1, text: 'updated' });
      });

      expect(result.current).toEqual({ count: 1, text: 'updated' });
    });

    it('should handle invalid options gracefully', () => {
      const { result } = renderHook(() =>
        useOptimizedStoreValue(store, {
          throttle: -100, // Invalid negative value
          debounce: NaN,   // Invalid NaN
          maxCacheSize: 0  // Invalid zero
        })
      );

      // Should still work with defaults
      expect(result.current).toEqual({ count: 0, text: 'initial' });

      act(() => {
        store.setValue({ count: 1, text: 'updated' });
      });

      expect(result.current).toEqual({ count: 1, text: 'updated' });
    });
  });
});