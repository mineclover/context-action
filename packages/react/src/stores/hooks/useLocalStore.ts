import { useInsertionEffect, useRef } from 'react';
import { createStore, Store } from '../core/Store';
import type { Snapshot } from '../core/types';
import { useStoreValue } from './useStoreValue';

// Counter for generating unique store names (more efficient than Date.now + Math.random)
let localStoreCounter = 0;

export function useLocalStore<T>(
  initialValue: T,
  name?: string
): Snapshot<T> & { store: Store<T> } {
  const storeRef = useRef<Store<T> | null>(null);

  if (!storeRef.current) {
    // Use a simple counter for store naming instead of expensive Date.now() + Math.random()
    const storeName = name || `localStore_${++localStoreCounter}`;
    storeRef.current = createStore(storeName, initialValue);
  }

  const store = storeRef.current;

  useInsertionEffect(() => {
    return () => {
      store.dispose();
      if (storeRef.current === store) {
        storeRef.current = null;
      }
    };
  }, [store]);

  const value = useStoreValue(store);

  return {
    value,
    name: store.name,
    lastUpdate: store.getSnapshot().lastUpdate,
    store
  };
}

