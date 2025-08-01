import { useRegistry } from './useRegistry';
import type { IStore, IStoreRegistry } from '../types';

/**
 * Get a specific store from the registry by name
 * Replaces deprecated withRegistryStores HOC pattern with modern hook approach
 * 
 * @implements store-hooks
 * @memberof api-terms
 * @param registry The store registry instance
 * @param name The name of the store to retrieve
 * @returns The store if found, undefined otherwise
 * 
 * @example
 * ```typescript
 * // Basic registry store usage
 * const userStore = useRegistryStore(registry, 'user');
 * const user = useStoreValue(userStore);
 * 
 * // Multiple stores from registry
 * const userStore = useRegistryStore(registry, 'user');
 * const settingsStore = useRegistryStore(registry, 'settings');
 * const user = useStoreValue(userStore);
 * const settings = useStoreValue(settingsStore);
 * ```
 */
export function useRegistryStore(registry: IStoreRegistry, name: string): IStore | undefined {
  const stores = useRegistry(registry);
  const store = stores.find(([storeName]) => storeName === name)?.[1];
  return store;
}