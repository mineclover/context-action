import { act, renderHook } from '@testing-library/react';
import { createStore } from '../../../src/stores/core/Store';
import { useStoreValue } from '../../../src/stores/hooks/useStoreValue';

describe('useStoreValue condition contract', () => {
  it('gates the visible value without pausing the external-store subscription', () => {
    const store = createStore('condition-render-gate', { value: 0 });
    let enabled = false;
    const { result, rerender, unmount } = renderHook(() => {
      return useStoreValue(store, state => state.value, {
        condition: () => enabled,
      });
    });

    try {
      expect(result.current).toBe(0);
      expect(store.getListenerCount()).toBe(1);

      act(() => {
        store.setValue({ value: 1 });
      });

      expect(store.getListenerCount()).toBe(1);
      expect(result.current).toBe(0);

      enabled = true;
      rerender();
      expect(result.current).toBe(1);
      expect(store.getListenerCount()).toBe(1);
    } finally {
      unmount();
      expect(store.getListenerCount()).toBe(0);
      store.dispose();
    }
  });
});
