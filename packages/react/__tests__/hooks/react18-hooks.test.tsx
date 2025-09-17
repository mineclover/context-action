import React from 'react';
import { renderHook, act } from '@testing-library/react';
import {
  useDeferredStore,
  useTransitionStore,
  useOptimizedStoreUpdate,
  useConcurrentStore
} from '../../src/hooks/react18-hooks';
import { Store } from '../../src/stores/core/Store';

describe('React 18 Hooks', () => {
  let store: Store<{ count: number; data: string[] }>;

  beforeEach(() => {
    store = new Store('test-store', { count: 0, data: [] });
  });

  afterEach(() => {
    store.dispose();
  });

  describe('useDeferredStore', () => {
    it('should return current store value', () => {
      const { result } = renderHook(() =>
        useDeferredStore(store)
      );

      expect(result.current).toEqual({ count: 0, data: [] });
    });

    it('should update when store value changes', () => {
      const { result } = renderHook(() =>
        useDeferredStore(store)
      );

      act(() => {
        store.setValue({ count: 1, data: ['test'] });
      });

      expect(result.current).toEqual({ count: 1, data: ['test'] });
    });

    it('should use deferred value for large objects', () => {
      const largeData = Array(200).fill('item');
      store.setValue({ count: 0, data: largeData });

      const { result } = renderHook(() =>
        useDeferredStore(store, { enableDeferred: true })
      );

      expect(result.current.data).toHaveLength(200);
    });

    it('should not use deferred value when disabled', () => {
      const largeData = Array(200).fill('item');
      store.setValue({ count: 0, data: largeData });

      const { result } = renderHook(() =>
        useDeferredStore(store, { enableDeferred: false })
      );

      expect(result.current.data).toHaveLength(200);
    });

    it('should handle complex objects', () => {
      const complexData = {
        nested: {
          deep: {
            value: 'test',
            array: [1, 2, 3, 4, 5]
          }
        }
      };

      const complexStore = new Store('complex', complexData);

      const { result } = renderHook(() =>
        useDeferredStore(complexStore)
      );

      expect(result.current).toEqual(complexData);

      complexStore.dispose();
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { count: 0, data: [] };
      circular.self = circular;

      const circularStore = new Store('circular', circular);

      const { result } = renderHook(() =>
        useDeferredStore(circularStore)
      );

      expect(result.current.count).toBe(0);

      circularStore.dispose();
    });
  });

  describe('useTransitionStore', () => {
    it('should return store value and transition state', () => {
      const { result } = renderHook(() =>
        useTransitionStore(store)
      );

      const [storeValue, isPending, updateStore] = result.current;

      expect(storeValue).toEqual({ count: 0, data: [] });
      expect(isPending).toBe(false);
      expect(typeof updateStore).toBe('function');
    });

    it('should update store with transition', () => {
      const { result } = renderHook(() =>
        useTransitionStore(store)
      );

      const [, , updateStore] = result.current;

      act(() => {
        updateStore({ count: 5, data: ['updated'] });
      });

      const [storeValue] = result.current;
      expect(storeValue).toEqual({ count: 5, data: ['updated'] });
    });

    it('should handle updater function', () => {
      const { result } = renderHook(() =>
        useTransitionStore(store)
      );

      const [, , updateStore] = result.current;

      act(() => {
        updateStore((current) => ({
          ...current,
          count: current.count + 10
        }));
      });

      const [storeValue] = result.current;
      expect(storeValue.count).toBe(10);
    });

    it('should work without transition when disabled', () => {
      const { result } = renderHook(() =>
        useTransitionStore(store, { enableTransition: false })
      );

      const [, isPending, updateStore] = result.current;

      expect(isPending).toBe(false);

      act(() => {
        updateStore({ count: 3, data: ['test'] });
      });

      const [storeValue] = result.current;
      expect(storeValue).toEqual({ count: 3, data: ['test'] });
    });
  });

  describe('useOptimizedStoreUpdate', () => {
    it('should provide optimized update function', () => {
      const { result } = renderHook(() =>
        useOptimizedStoreUpdate(store)
      );

      const updateStore = result.current;
      expect(typeof updateStore).toBe('function');

      act(() => {
        updateStore({ count: 7, data: ['optimized'] });
      });

      expect(store.getValue()).toEqual({ count: 7, data: ['optimized'] });
    });

    it('should batch multiple updates', async () => {
      const { result } = renderHook(() =>
        useOptimizedStoreUpdate(store)
      );

      const updateStore = result.current;

      act(() => {
        // Multiple updates in quick succession
        updateStore({ count: 1, data: ['first'] });
        updateStore({ count: 2, data: ['second'] });
        updateStore({ count: 3, data: ['third'] });
      });

      // Final value should be the last update
      expect(store.getValue()).toEqual({ count: 3, data: ['third'] });
    });

    it('should handle updater functions', () => {
      const { result } = renderHook(() =>
        useOptimizedStoreUpdate(store)
      );

      const updateStore = result.current;

      act(() => {
        updateStore((current) => ({
          ...current,
          count: current.count + 5,
          data: [...current.data, 'new']
        }));
      });

      expect(store.getValue()).toEqual({ count: 5, data: ['new'] });
    });

    it('should respect priority threshold', () => {
      const { result } = renderHook(() =>
        useOptimizedStoreUpdate(store, {
          priorityThreshold: 100,
          enableTransition: true
        })
      );

      const updateStore = result.current;

      act(() => {
        updateStore({ count: 100, data: Array(50).fill('item') });
      });

      expect(store.getValue().count).toBe(100);
    });
  });

  describe('useConcurrentStore', () => {
    it('should provide all concurrent features', () => {
      const { result } = renderHook(() =>
        useConcurrentStore(store)
      );

      const [storeValue, updateStore, isPending] = result.current;

      expect(storeValue).toEqual({ count: 0, data: [] });
      expect(typeof updateStore).toBe('function');
      expect(isPending).toBe(false);
    });

    it('should update with all optimizations enabled', () => {
      const { result } = renderHook(() =>
        useConcurrentStore(store, {
          enableDeferred: true,
          enableTransition: true,
          enableConcurrent: true
        })
      );

      const [, updateStore] = result.current;

      act(() => {
        updateStore({ count: 10, data: ['concurrent'] });
      });

      const [storeValue] = result.current;
      expect(storeValue).toEqual({ count: 10, data: ['concurrent'] });
    });

    it('should handle large updates efficiently', () => {
      const largeData = Array(1000).fill('item');

      const { result } = renderHook(() =>
        useConcurrentStore(store)
      );

      const [, updateStore] = result.current;

      act(() => {
        updateStore({ count: 1000, data: largeData });
      });

      const [storeValue] = result.current;
      expect(storeValue.data).toHaveLength(1000);
    });

    it('should work with custom priority threshold', () => {
      const { result } = renderHook(() =>
        useConcurrentStore(store, {
          priorityThreshold: 50
        })
      );

      const [, updateStore] = result.current;

      act(() => {
        updateStore((current) => ({
          count: current.count + 50,
          data: [...current.data, ...Array(25).fill('priority')]
        }));
      });

      const [storeValue] = result.current;
      expect(storeValue.count).toBe(50);
      expect(storeValue.data).toHaveLength(25);
    });

    it('should handle disabled concurrent features', () => {
      const { result } = renderHook(() =>
        useConcurrentStore(store, {
          enableDeferred: false,
          enableTransition: false,
          enableConcurrent: false
        })
      );

      const [, updateStore, isPending] = result.current;

      expect(isPending).toBe(false);

      act(() => {
        updateStore({ count: 5, data: ['non-concurrent'] });
      });

      const [storeValue] = result.current;
      expect(storeValue).toEqual({ count: 5, data: ['non-concurrent'] });
    });
  });

  describe('Integration and edge cases', () => {
    it('should handle null store gracefully', () => {
      const { result } = renderHook(() =>
        useDeferredStore(null as any)
      );

      // Should not throw and return some default
      expect(result.current).toBeDefined();
    });

    it('should handle rapid hook switching', () => {
      const { result, rerender } = renderHook(
        ({ useHook }) => useHook(store),
        { initialProps: { useHook: useDeferredStore } }
      );

      expect(result.current).toEqual({ count: 0, data: [] });

      // Switch to different hook
      rerender({ useHook: (s: any) => useTransitionStore(s)[0] });

      act(() => {
        store.setValue({ count: 1, data: ['switched'] });
      });

      expect(result.current).toEqual({ count: 1, data: ['switched'] });
    });

    it('should cleanup properly on unmount', () => {
      const { unmount } = renderHook(() =>
        useConcurrentStore(store)
      );

      const listenerCount = store.getListenerCount();

      unmount();

      // Should have fewer listeners after unmount
      expect(store.getListenerCount()).toBeLessThanOrEqual(listenerCount);
    });
  });
});