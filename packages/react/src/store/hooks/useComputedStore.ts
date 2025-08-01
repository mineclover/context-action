import { useRef, useMemo } from 'react';
import { Store } from '../Store';
import { useStoreSync } from '../store-sync';
import { createComputedStore } from '../utils';
import type { IStore, Snapshot } from '../types';

/**
 * Hook for creating computed stores with dependencies
 * @implements computed-store
 * @memberof api-terms
 * @example
 * ```typescript
 * // Basic computed store
 * const totalPriceStore = useComputedStore(
 *   [cartStore, taxStore],
 *   (cart, tax) => cart.items.reduce((sum, item) => sum + item.price, 0) * (1 + tax.rate)
 * );
 * 
 * // Named computed store
 * const userDisplayStore = useComputedStore(
 *   [userStore, settingsStore],
 *   (user, settings) => ({
 *     displayName: settings.showFullName ? user.name : user.name.split(' ')[0],
 *     avatar: generateAvatar(user.id, settings.theme)
 *   }),
 *   'userDisplay'
 * );
 * ```
 */
export function useComputedStore<T, D extends readonly IStore[]>(
  dependencies: D,
  compute: (...values: { [K in keyof D]: D[K] extends IStore<infer V> ? V : never }) => T,
  name?: string
): Store<T> {
  const storeRef = useRef<Store<T>>();
  
  // Create the computed store if it doesn't exist
  if (!storeRef.current) {
    storeRef.current = createComputedStore(dependencies, compute, name);
  }
  
  // Update the compute function if it changes
  useMemo(() => {
    if (storeRef.current) {
      // Re-create the computed store with new compute function
      const newStore = createComputedStore(dependencies, compute, name);
      // Clean up old store if it has cleanup method
      if ((storeRef.current as any)._cleanup) {
        (storeRef.current as any)._cleanup();
      }
      storeRef.current = newStore;
    }
  }, [compute, name, ...dependencies]);
  
  // Subscribe to changes to keep the store reactive
  useStoreSync(storeRef.current);
  
  return storeRef.current;
}

/**
 * Hook to get the computed value directly (convenience wrapper)
 * 
 * @template T - Type of the computed store value  
 * @template D - Array type of dependency stores
 * @param dependencies - Array of stores to depend on
 * @param compute - Function to compute the derived value
 * @param name - Optional name for the computed store
 * @returns The current computed value
 * 
 * @example
 * ```typescript
 * const totalPrice = useComputedValue(
 *   [cartStore, taxStore],
 *   (cart, tax) => cart.items.reduce((sum, item) => sum + item.price, 0) * (1 + tax.rate)
 * );
 * ```
 */
export function useComputedValue<T, D extends readonly IStore[]>(
  dependencies: D,
  compute: (...values: { [K in keyof D]: D[K] extends IStore<infer V> ? V : never }) => T,
  name?: string
): T | undefined {
  const store = useComputedStore(dependencies, compute, name);
  const snapshot = useStoreSync(store);
  return snapshot.value;
}