import { useStoreSync } from '../store-sync';
import type { IStore, Snapshot } from '../types';

/**
 * Hook to subscribe to store changes and get the current snapshot
 * Standardized implementation using useStoreSync without selector
 * 
 * @template T - Type of the store value
 * @param store - The store to subscribe to  
 * @returns The current snapshot of the store containing value, name, and lastUpdate
 * 
 * @example
 * ```typescript
 * const counterStore = new Store('counter', 0);
 * const snapshot = useStore(counterStore); // { value: 0, name: 'counter', lastUpdate: timestamp }
 * ```
 */
export function useStore<T>(store: IStore<T> | undefined | null): Snapshot<T> {
  return useStoreSync(store);
}