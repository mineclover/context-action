/**
 * @fileoverview MVVM Store Hooks
 * Specialized hooks for MVVM architecture patterns
 */

import { useCallback } from 'react';
import { useStoreValue } from './useStoreValue';
import { useStoreActions } from './useStoreActions';
import { useStoreRegistry } from '../../StoreProvider';
import { createStore } from '../utils';
import type { IStore } from '../types';

/**
 * Hook to create and access a store with MVVM patterns
 * Combines store creation, value subscription, and actions
 * 
 * @template T - Type of the store value
 * @param name - Name of the store in registry
 * @param initialValue - Initial value if store doesn't exist
 * @param selector - Optional selector for partial subscriptions
 * @returns Object with value, actions, and store instance
 * 
 * @example
 * ```typescript
 * // Basic MVVM store usage
 * const { value: user, setValue, update } = useMVVMStore(
 *   'user',
 *   { id: '', name: '', email: '' }
 * );
 * 
 * // With selector for performance optimization
 * const { value: userName, setValue, update } = useMVVMStore(
 *   'user',
 *   { id: '', name: '', email: '' },
 *   user => user.name // Only re-renders when name changes
 * );
 * 
 * // Usage in components
 * const handleUpdateName = (name: string) => {
 *   update(user => ({ ...user, name }));
 * };
 * ```
 */
export function useMVVMStore<T>(
  name: string,
  initialValue: T
): {
  value: T | undefined;
  setValue: (value: T) => void;
  update: (updater: (current: T) => T) => void;
  store: IStore<T>;
};
export function useMVVMStore<T, R>(
  name: string,
  initialValue: T,
  selector: (value: T) => R
): {
  value: R | undefined;
  setValue: (value: T) => void;
  update: (updater: (current: T) => T) => void;
  store: IStore<T>;
};
export function useMVVMStore<T, R>(
  name: string,
  initialValue: T,
  selector?: (value: T) => R
) {
  const registry = useStoreRegistry();
  
  // Get or create store
  let store = registry.getStore(name) as IStore<T>;
  if (!store) {
    store = createStore(initialValue, name);
    registry.register(name, store);
  }
  
  // Subscribe to store with optional selector
  const value = selector 
    ? useStoreValue(store, selector)
    : useStoreValue(store);
  
  // Get store actions
  const { setValue, update } = useStoreActions(store as any);
  
  return {
    value,
    setValue,
    update,
    store
  };
}

/**
 * Hook for coordinated multi-store access in MVVM pattern
 * Provides type-safe access to multiple stores with automatic creation
 * 
 * @template S - Store map type
 * @param storeSpecs - Specifications for stores to access
 * @returns Object with store values and actions
 * 
 * @example
 * ```typescript
 * const stores = useMultiMVVMStore({
 *   user: { 
 *     initialValue: { id: '', name: '', email: '' },
 *     selector: user => user.name 
 *   },
 *   settings: { 
 *     initialValue: { theme: 'light', notifications: true } 
 *   },
 *   cart: { 
 *     initialValue: { items: [] } 
 *   }
 * });
 * 
 * // Access values and actions
 * const userName = stores.user.value; // string | undefined
 * const settings = stores.settings.value; // Settings | undefined
 * 
 * // Update stores
 * stores.user.update(user => ({ ...user, name: 'New Name' }));
 * stores.settings.setValue({ theme: 'dark', notifications: false });
 * ```
 */
export function useMultiMVVMStore<
  S extends Record<string, {
    initialValue: unknown;
    selector?: (value: unknown) => unknown;
  }>
>(storeSpecs: S): {
  [K in keyof S]: {
    value: S[K]['selector'] extends (value: unknown) => infer R ? R | undefined : S[K]['initialValue'] | undefined;
    setValue: (value: S[K]['initialValue']) => void;
    update: (updater: (current: S[K]['initialValue']) => S[K]['initialValue']) => void;
    store: IStore<S[K]['initialValue']>;
  }
} {
  const registry = useStoreRegistry();
  type ResultType = {
    [K in keyof S]: {
      value: S[K]['selector'] extends (value: unknown) => infer R ? R | undefined : S[K]['initialValue'] | undefined;
      setValue: (value: S[K]['initialValue']) => void;
      update: (updater: (current: S[K]['initialValue']) => S[K]['initialValue']) => void;
      store: IStore<S[K]['initialValue']>;
    }
  };
  const result = {} as ResultType;
  
  for (const [storeName, spec] of Object.entries(storeSpecs)) {
    // Get or create store
    let store = registry.getStore(storeName);
    if (!store) {
      store = createStore(spec.initialValue, storeName);
      registry.register(storeName, store);
    }
    
    // Subscribe with optional selector
    const value = spec.selector 
      ? useStoreValue(store, spec.selector)
      : useStoreValue(store);
    
    // Get actions
    const { setValue, update } = useStoreActions(store as any);
    
    result[storeName] = {
      value,
      setValue,
      update,
      store
    };
  }
  
  return result;
}

/**
 * Hook for reactive store queries with caching
 * Useful for computed values that depend on multiple stores
 * 
 * @template T - Type of the query result
 * @param queryKey - Unique key for the query
 * @param queryFn - Function to compute the query result
 * @param dependencies - Stores that trigger recomputation
 * @returns Query result with loading and error states
 * 
 * @example
 * ```typescript
 * const userStats = useStoreQuery(
 *   'userStats',
 *   (user, orders, settings) => ({
 *     totalOrders: orders.length,
 *     totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
 *     displayName: settings.showFullName ? user.name : user.name.split(' ')[0]
 *   }),
 *   ['user', 'orders', 'settings']
 * );
 * 
 * if (userStats.loading) return <div>Loading...</div>;
 * if (userStats.error) return <div>Error: {userStats.error}</div>;
 * 
 * return <div>Total Orders: {userStats.data?.totalOrders}</div>;
 * ```
 */
export function useStoreQuery<T>(
  queryKey: string,
  queryFn: (...storeValues: unknown[]) => T,
  dependencies: string[]
): {
  data: T | undefined;
  loading: boolean;
  error: string | null;
} {
  const registry = useStoreRegistry();
  
  // Get all dependency stores
  const stores = dependencies.map(name => registry.getStore(name)).filter(Boolean);
  
  // Create query function with error handling
  const safeQueryFn = useCallback((...values: unknown[]) => {
    try {
      return queryFn(...values);
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }, [queryFn]);
  
  // Use computed store for reactive queries
  try {
    const queryStore = useMVVMStore(
      `query_${queryKey}`,
      { data: undefined as T | undefined, loading: true, error: null },
      query => query
    );
    
    // Update query when dependencies change
    const dependencyValues = stores.map(store => useStoreValue(store));
    
    // Compute new result when dependencies change
    const computeResult = useCallback(() => {
      if (stores.length !== dependencies.length) {
        return { data: undefined, loading: true, error: 'Some stores not found' };
      }
      
      try {
        const result = safeQueryFn(...dependencyValues);
        return { data: result, loading: false, error: null };
      } catch (error) {
        return { 
          data: undefined, 
          loading: false, 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    }, [dependencyValues, safeQueryFn, stores.length, dependencies.length]);
    
    // Update query store with computed result
    const newResult = computeResult();
    if (JSON.stringify(queryStore.value) !== JSON.stringify(newResult)) {
      queryStore.setValue(newResult as { data: T | undefined; loading: boolean; error: null });
    }
    
    return queryStore.value || { data: undefined, loading: true, error: null };
    
  } catch (error) {
    return {
      data: undefined,
      loading: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}