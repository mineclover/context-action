import { useRef } from 'react';
import { Store } from '../Store';
import { useStoreSync } from '../store-sync';
import type { Snapshot } from '../types';

/**
 * Create a component-local store that persists across renders
 * @param name The name of the store
 * @param initialValue The initial value
 * @returns The store snapshot with store instance
 */
export function useLocalStore<T>(name: string, initialValue: T): Snapshot<T> & { store: Store<T> } {
  const storeRef = useRef<Store<T>>();
  
  if (!storeRef.current) {
    storeRef.current = new Store(name, initialValue);
  }
  
  const snapshot = useStoreSync(storeRef.current);
  
  return {
    ...snapshot,
    store: storeRef.current
  };
}