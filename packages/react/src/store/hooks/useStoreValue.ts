import { useStoreSync } from '../store-sync';
import type { IStore } from '../types';

/**
 * Subscribe to store changes and get only the value
 * @param store The store to subscribe to
 * @returns The current value of the store
 */
export function useStoreValue<T>(store: IStore<T> | undefined | null): T | undefined {
  return useStoreSync(store, {
    selector: snapshot => snapshot.value
  });
}