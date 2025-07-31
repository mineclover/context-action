import { useStoreSync } from './store-sync';
import type { IStoreRegistry, IStore } from './types';

/**
 * Create registry sync hooks
 */
export function createRegistrySync<T = any>() {
  return {
    /**
     * Get a store value dynamically from registry
     */
    useDynamicStore(
      registry: IStoreRegistry | undefined | null,
      storeName: string
    ): T | undefined {
      const store = registry?.getStore(storeName);
      return useStoreSync(store, {
        selector: s => s.value as T
      });
    },

    /**
     * Get a store value with default from registry
     */
    useDynamicStoreWithDefault<U extends T>(
      registry: IStoreRegistry | undefined | null,
      storeName: string,
      defaultValue: U
    ): U {
      const store = registry?.getStore(storeName);
      return useStoreSync(store, {
        defaultValue,
        selector: s => s.value as U
      });
    },

    /**
     * Get store snapshot dynamically from registry
     */
    useDynamicStoreSnapshot<U = T>(
      registry: IStoreRegistry | undefined | null,
      storeName: string
    ) {
      const store = registry?.getStore(storeName);
      return useStoreSync(store);
    },

    /**
     * Get multiple stores from registry
     */
    useDynamicStores<K extends string>(
      registry: IStoreRegistry | undefined | null,
      storeNames: K[]
    ): Record<K, any> {
      const results = {} as Record<K, any>;
      
      for (const name of storeNames) {
        const store = registry?.getStore(name);
        results[name] = useStoreSync(store, {
          selector: s => s.value
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