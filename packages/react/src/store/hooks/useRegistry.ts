import { useStoreSync } from '../store-sync';
import type { IStore, IStoreRegistry } from '../types';

/**
 * Hook to subscribe to registry changes and get all registered stores
 * Standardized implementation using useStoreSync with registry snapshot selector
 * 
 * @param registry - The store registry to subscribe to
 * @returns Array of [name, store] tuples representing all registered stores
 *
 * @example
 * ```typescript
 * const registry = new StoreRegistry('app');
 * const stores = useRegistry(registry); // Array<[string, IStore]>
 * ```
 */
export function useRegistry(registry: IStoreRegistry | undefined | null): Array<[string, IStore]> {
  return useStoreSync(registry as any, {
    selector: () => registry?.getSnapshot() ?? [],
    defaultValue: [] as any
  });
}