import { useRef, useMemo } from 'react';
import { Store } from '../Store';
import { useStoreSync } from '../store-sync';
import { StoreUtils } from '../utils';
import type { IStore } from '../types';

/**
 * Create a computed store that derives its value from other stores
 * @param name The name of the computed store
 * @param dependencies Array of stores to depend on
 * @param compute Function to compute the value
 * @returns The computed store instance
 */
export function useComputedStore<T, D extends readonly IStore[]>(
  name: string,
  dependencies: D,
  compute: (...values: { [K in keyof D]: D[K] extends IStore<infer V> ? V : never }) => T
) {
  const storeRef = useRef<Store<T>>();
  
  // Create the computed store if it doesn't exist
  if (!storeRef.current) {
    storeRef.current = StoreUtils.createComputedStore(name, [...dependencies], compute);
  }
  
  // Update the compute function if it changes
  useMemo(() => {
    if (storeRef.current) {
      // Re-create the computed store with new compute function
      const newStore = StoreUtils.createComputedStore(name, [...dependencies], compute);
      storeRef.current = newStore;
    }
  }, dependencies);
  
  const snapshot = useStoreSync(storeRef.current);
  
  return storeRef.current;
}