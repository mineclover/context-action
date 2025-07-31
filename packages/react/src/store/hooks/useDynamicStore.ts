import { useDynamicStore as useRegistryDynamicStore } from '../registry-sync';
import type { IStoreRegistry, Snapshot } from '../types';

/**
 * Dynamically subscribe to a store in the registry by name
 * @param registry The store registry
 * @param name The name of the store
 * @returns The value of the store if found, undefined otherwise
 */
export function useDynamicStore<T = any>(
  registry: IStoreRegistry | undefined | null,
  name: string
): T | undefined {
  return useRegistryDynamicStore(registry, name) as T;
}