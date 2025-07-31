import { useMemo } from 'react';
import type { Store } from '../Store';

/**
 * Get memoized action handlers for a store
 * @param store The store instance
 * @returns Object with setValue and update methods
 */
export function useStoreActions<T>(store: Store<T>) {
  return useMemo(
    () => ({
      setValue: store.setValue.bind(store),
      update: store.update.bind(store),
      getValue: store.getValue.bind(store),
    }),
    [store]
  );
}