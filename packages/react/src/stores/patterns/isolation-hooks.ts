/**
 * Store isolation hooks for component-level store separation
 * 
 * @deprecated Prefer createContextStorePattern for domain-scoped isolation
 * @module store/isolation-hooks
 * @since 1.0.0
 * 
 * These hooks provide component-level isolation but are less recommended than
 * the Context Store Pattern approach. Use createContextStorePattern for better
 * domain separation and action-store coordination.
 */

import { useMemo, useRef, useId } from 'react';
import { createStore } from '../core/Store';
import { IsolationStoreFactory, generateStoreName } from './isolation-utils';
import { useStoreRegistry } from '../core/StoreContext';
import type { ComparisonOptions } from '../utils/comparison';

/**
 * Hook for registry-based store creation and access
 * 
 * @deprecated Use createContextStorePattern().useCreateStore instead
 * @template T Store value type
 * @param storeName Store identifier
 * @param initialValue Initial value
 * @param options Store options
 * @returns Store instance
 * 
 * @example
 * // ❌ Avoid this approach
 * const store = useRegistryStore('myStore', initialValue);
 * 
 * // ✅ Preferred approach
 * const { useCreateStore } = createContextStorePattern('myDomain');
 * const store = useCreateStore('myStore', initialValue);
 */
export function useRegistryStore<T>(
  storeName: string,
  initialValue: T | (() => T),
  options: {
    strategy?: 'reference' | 'shallow' | 'deep';
    debug?: boolean;
    comparisonOptions?: Partial<ComparisonOptions<T>>;
  } = {}
): ReturnType<typeof createStore<T>> {
  const registry = useStoreRegistry();
  const { strategy = 'reference', debug = process.env.NODE_ENV === 'development', comparisonOptions } = options;

  const store = useMemo(() => {
    const existingStore = registry.getStore(storeName);
    
    if (existingStore) {
      if (debug) {
        console.log(`🔄 Using existing registry store: ${storeName}`);
      }
      return existingStore as ReturnType<typeof createStore<T>>;
    }

    const resolvedInitialValue = typeof initialValue === 'function' 
      ? (initialValue as () => T)() 
      : initialValue;

    const newStore = createStore(storeName, resolvedInitialValue);
    
    const finalComparisonOptions = {
      strategy,
      ...comparisonOptions
    };
    newStore.setComparisonOptions(finalComparisonOptions);

    registry.register(storeName, newStore, {
      name: storeName,
      tags: ['registry', strategy],
      description: `Registry store: ${storeName} with ${strategy} comparison`
    });

    if (debug) {
      console.log(`🔧 New registry store created: ${storeName}`, {
        strategy,
        registeredStoreCount: registry.getStoreCount()
      });
    }

    return newStore;
  }, [storeName, registry]);

  return store;
}

/**
 * Hook for component-isolated store creation using useId
 * 
 * @deprecated Use createContextStorePattern().useIsolatedStore instead
 * @template T Store value type
 * @param domain Store domain name
 * @param initialValue Initial value
 * @param options Store options
 * @returns Isolated store instance
 * 
 * @example
 * // ✅ Preferred approach with Context Store Pattern
 * const { useIsolatedStore } = createContextStorePattern('myDomain');
 * const store = useIsolatedStore('component-data', initialValue);
 */
export function useIsolatedStore<T>(
  domain: string,
  initialValue: T | (() => T),
  options: {
    strategy?: 'reference' | 'shallow' | 'deep';
    debug?: boolean;
    comparisonOptions?: Partial<ComparisonOptions<T>>;
  } = {}
): ReturnType<typeof createStore<T>> {
  const componentId = useId();
  const storeName = generateStoreName(domain, componentId);
  
  return useRegistryStore(storeName, initialValue, options);
}

/**
 * Hook for lazy-initialized isolated store
 * 
 * @deprecated Use Context Store Pattern with lazy initialization instead
 * @template T Store value type
 * @param domain Store domain name
 * @param initializer Lazy initializer function
 * @param options Store options
 * @returns Store instance
 * 
 * @example
 * // ✅ Preferred approach
 * const { useCreateStore } = createContextStorePattern('myDomain');
 * const store = useCreateStore('data', () => expensiveInitializer());
 */
export function useLazyIsolatedStore<T>(
  domain: string,
  initializer: () => T,
  options: {
    strategy?: 'reference' | 'shallow' | 'deep';
    debug?: boolean;
    comparisonOptions?: Partial<ComparisonOptions<T>>;
  } = {}
): ReturnType<typeof createStore<T>> {
  const componentId = useId();
  const storeName = generateStoreName(domain, componentId);
  const registry = useStoreRegistry();
  const { strategy = 'reference', debug = process.env.NODE_ENV === 'development', comparisonOptions } = options;
  const initializerRef = useRef(initializer);
  initializerRef.current = initializer;

  const store = useMemo(() => {
    const existingStore = registry.getStore(storeName);
    
    if (existingStore) {
      if (debug) {
        console.log(`🔄 Using existing lazy store: ${storeName}`);
      }
      return existingStore as ReturnType<typeof createStore<T>>;
    }

    const initialValue = initializerRef.current();
    const newStore = createStore(storeName, initialValue);
    
    const finalComparisonOptions = {
      strategy,
      ...comparisonOptions
    };
    newStore.setComparisonOptions(finalComparisonOptions);

    registry.register(storeName, newStore, {
      name: storeName,
      tags: ['isolated', 'lazy', strategy],
      description: `Lazy isolated store: ${storeName} with ${strategy} comparison`
    });

    if (debug) {
      console.log(`⏳ Lazy store created and registered: ${storeName}`, {
        strategy,
        registeredStoreCount: registry.getStoreCount()
      });
    }

    return newStore;
  }, [storeName, registry]);

  return store;
}

/**
 * Hook for conditional store isolation
 * 
 * @deprecated Use Context Store Pattern with conditional providers instead
 * @template T Store value type
 * @param storeName Store identifier
 * @param isolationMode Isolation mode
 * @param initialValue Initial value for isolated mode
 * @param sharedStore Shared store for shared mode
 * @param options Store options
 * @returns Store instance
 */
export function useConditionalIsolatedStore<T>(
  storeName: string,
  isolationMode: 'isolated' | 'shared',
  initialValue: T,
  sharedStore?: ReturnType<typeof createStore<T>>,
  options: {
    strategy?: 'reference' | 'shallow' | 'deep';
    debug?: boolean;
    comparisonOptions?: Partial<ComparisonOptions<T>>;
  } = {}
): ReturnType<typeof createStore<T>> {
  const { strategy = 'reference', debug = process.env.NODE_ENV === 'development', comparisonOptions } = options;

  const store = useMemo(() => {
    if (isolationMode === 'shared') {
      if (!sharedStore) {
        throw new Error(`Shared store is required when isolationMode is 'shared'`);
      }

      if (debug) {
        console.log(`🤝 Conditional: SHARED mode for ${storeName}`);
      }
      return sharedStore;
    }

    if (debug) {
      console.log(`🔒 Conditional: ISOLATED mode for ${storeName}`);
    }
    
    return useRegistryStore(storeName, initialValue, {
      strategy,
      debug,
      comparisonOptions
    });
  }, [storeName, isolationMode, initialValue, sharedStore, strategy, debug, comparisonOptions]);

  return store;
}

/**
 * Hook for isolation store factory management
 * 
 * @deprecated Use Context Store Pattern for better domain management
 * @param componentId Component identifier
 * @param debug Debug mode
 * @returns Factory instance and cleanup function
 */
export function useIsolationStoreFactory(
  componentId: string,
  debug = false
): [IsolationStoreFactory, () => void] {
  const factoryRef = useRef<IsolationStoreFactory>();

  const factory = useMemo(() => {
    if (!factoryRef.current) {
      factoryRef.current = new IsolationStoreFactory(componentId, debug);
    }
    return factoryRef.current;
  }, [componentId, debug]);

  const cleanup = useMemo(() => {
    return () => {
      if (factoryRef.current) {
        factoryRef.current.cleanup();
      }
    };
  }, []);

  return [factory, cleanup];
}

/**
 * Hook for monitoring store isolation state
 * 
 * @deprecated Use Context Store Pattern useRegistryInfo for monitoring
 * @param stores Array of stores to monitor
 * @param options Monitoring options
 * @returns Monitoring results
 */
export function useStoreIsolationMonitoring(
  stores: Array<ReturnType<typeof createStore>>,
  options: {
    trackPerformance?: boolean;
    logUpdates?: boolean;
    updateInterval?: number;
  } = {}
): {
  storeCount: number;
  totalListeners: number;
  averageUpdateTime: number;
  lastUpdateTimes: number[];
} {
  const { trackPerformance = false, logUpdates = false } = options;
  const updateTimesRef = useRef<number[]>([]);

  const monitoring = useMemo(() => {
    const storeCount = stores.length;
    const totalListeners = stores.reduce((total, store) => total + store.getListenerCount(), 0);
    
    const averageUpdateTime = updateTimesRef.current.length > 0
      ? updateTimesRef.current.reduce((sum, time) => sum + time, 0) / updateTimesRef.current.length
      : 0;

    return {
      storeCount,
      totalListeners,
      averageUpdateTime,
      lastUpdateTimes: [...updateTimesRef.current]
    };
  }, [stores]);

  if (trackPerformance && stores.length > 0) {
    if (logUpdates) {
      console.log(`📊 Store monitoring: ${monitoring.storeCount} stores, ${monitoring.totalListeners} listeners`);
    }
  }

  return monitoring;
}

/**
 * Hook for tracking memory usage of isolated stores
 * 
 * @deprecated Use Context Store Pattern monitoring capabilities
 * @param stores Array of stores to track
 * @returns Memory usage information
 */
export function useStoreMemoryTracking(
  stores: Array<ReturnType<typeof createStore>>
): {
  estimatedMemoryUsage: number;
  storeSizes: number[];
  totalStores: number;
} {
  const memoryInfo = useMemo(() => {
    const storeSizes = stores.map(store => {
      try {
        const value = store.getValue();
        const jsonString = JSON.stringify(value);
        return Math.ceil(jsonString.length / 1024);
      } catch {
        return 0;
      }
    });

    const estimatedMemoryUsage = storeSizes.reduce((total, size) => total + size, 0);

    return {
      estimatedMemoryUsage,
      storeSizes,
      totalStores: stores.length
    };
  }, [stores]);

  return memoryInfo;
}