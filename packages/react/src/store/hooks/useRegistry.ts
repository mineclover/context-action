import { useStoreSync } from '../store-sync';
import type { IStore, IStoreRegistry } from '../types';

/**
 * Subscribe to registry changes and get all stores
 * @param registry The store registry to subscribe to
 * @returns Array of [name, store] tuples
 */
export function useRegistry(registry: IStoreRegistry | undefined | null): Array<[string, IStore]> {
  if (!registry) {
    return [];
  }
  
  return useStoreSync(registry as any, {
    selector: () => registry.getSnapshot()
  });
}