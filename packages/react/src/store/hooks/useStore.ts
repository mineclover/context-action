import { useStoreSync } from '../store-sync';
import type { IStore, Snapshot } from '../types';

/**
 * Subscribe to store changes and get the current snapshot
 * @param store The store to subscribe to
 * @returns The current snapshot of the store
 */
export function useStore<T>(store: IStore<T> | undefined | null): Snapshot<T> {
  return useStoreSync(store);
}