import { useRef } from 'react';
import { Store, createStore } from '../core/Store';
import { useStoreSelector } from '../utils/store-selector';
import type { Snapshot } from '../core/types';

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

  const snapshot = useStoreSelector(storeRef.current);

  return {
    ...snapshot,
    store: storeRef.current
  };
}

