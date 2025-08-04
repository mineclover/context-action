import { useRef } from 'react';
import { Store, createStore } from '../core/Store';
import { useStoreSelector } from '../utils/store-selector';
import type { Snapshot } from '../core/types';

export function useLocalStore<T>(
  initialValue: T, 
  name?: string
): Snapshot<T> & { store: Store<T> } {
  const storeRef = useRef<Store<T>>();
  
  if (!storeRef.current) {
    const storeName = name || `localStore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    storeRef.current = createStore(storeName, initialValue);
  }
  
  const snapshot = useStoreSelector(storeRef.current);
  
  return {
    ...snapshot,
    store: storeRef.current
  };
}

