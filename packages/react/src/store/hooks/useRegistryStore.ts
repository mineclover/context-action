import { useRegistry } from './useRegistry';
import type { IStore, IStoreRegistry } from '../types';

/**
 * Get a specific store from the registry
 * @param registry The store registry
 * @param name The name of the store to retrieve
 * @returns The store if found, undefined otherwise
 */
export function useRegistryStore(registry: IStoreRegistry, name: string): IStore | undefined {
  const stores = useRegistry(registry);
  const store = stores.find(([storeName]) => storeName === name)?.[1];
  return store;
}