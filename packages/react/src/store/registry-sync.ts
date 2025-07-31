import { useStoreSync } from './store-sync';
import type { IStoreRegistry, IStore, DynamicStoreOptions } from './types';

/**
 * Factory for creating standardized registry sync hooks
 * Provides consistent API for dynamic store access patterns
 */
export function createRegistrySync<T = any>() {
  return {
    /**
     * Get store value dynamically from registry by name
     */
    useDynamicStore(
      registry: IStoreRegistry | undefined | null,
      storeName: string,
      options?: DynamicStoreOptions<T>
    ): T | undefined {
      const store = registry?.getStore(storeName);
      
      // Handle store not found case
      if (!store && options?.onNotFound) {
        options.onNotFound(storeName);
      }
      
      return useStoreSync(store, {
        defaultValue: options?.defaultValue,
        selector: snapshot => snapshot.value as T
      });
    },

    /**
     * Get store value with guaranteed default from registry
     */
    useDynamicStoreWithDefault<U extends T>(
      registry: IStoreRegistry | undefined | null,
      storeName: string,
      defaultValue: U
    ): U {
      const store = registry?.getStore(storeName);
      return useStoreSync(store, {
        defaultValue,
        selector: snapshot => snapshot.value as U
      });
    },

    /**
     * Get complete store snapshot dynamically from registry
     */
    useDynamicStoreSnapshot(
      registry: IStoreRegistry | undefined | null,
      storeName: string
    ) {
      const store = registry?.getStore(storeName);
      return useStoreSync(store);
    },

    /**
     * Get multiple store values from registry
     */
    useDynamicStores<K extends string>(
      registry: IStoreRegistry | undefined | null,
      storeNames: K[]
    ): Record<K, any> {
      const results = {} as Record<K, any>;
      
      // Consistent iteration pattern
      for (const name of storeNames) {
        const store = registry?.getStore(name);
        results[name] = useStoreSync(store, {
          selector: snapshot => snapshot.value
        });
      }
      
      return results;
    }
  };
}

/**
 * Registry utilities for working with store registries
 */
export class RegistryUtils {
  /**
   * Get a typed store from registry
   */
  static getTypedStore<T>(
    registry: IStoreRegistry | undefined | null,
    name: string
  ): IStore<T> | undefined {
    return registry?.getStore(name) as IStore<T> | undefined;
  }

  /**
   * Check if store exists in registry
   */
  static hasStore(
    registry: IStoreRegistry | undefined | null,
    name: string
  ): boolean {
    return registry?.hasStore(name) ?? false;
  }

  /**
   * Get all store names from registry
   */
  static getStoreNames(
    registry: IStoreRegistry | undefined | null
  ): string[] {
    if (!registry) return [];
    return registry.getSnapshot().map(([name]) => name);
  }

  /**
   * Get stores by pattern
   */
  static getStoresByPattern(
    registry: IStoreRegistry | undefined | null,
    pattern: RegExp
  ): Array<[string, IStore]> {
    if (!registry) return [];
    return registry.getSnapshot().filter(([name]) => pattern.test(name));
  }
}

/**
 * Default registry sync instance
 */
export const registrySync = createRegistrySync();

/**
 * Convenience hooks using default registry sync
 */
export const useDynamicStore = registrySync.useDynamicStore;
export const useDynamicStoreWithDefault = registrySync.useDynamicStoreWithDefault;
export const useDynamicStoreSnapshot = registrySync.useDynamicStoreSnapshot;
export const useDynamicStores = registrySync.useDynamicStores;