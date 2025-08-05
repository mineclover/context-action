import { useRef } from 'react';
import { Store, createStore } from '../core/Store';
import { useStoreSelector } from '../utils/store-selector';
import type { Snapshot } from '../core/types';
import { createLogger } from '@context-action/logger';

// Create logger once at module level
const logger = createLogger();

/**
 * Create a component-local store that persists across renders
 * Replaces deprecated withStore HOC pattern with modern hook approach
 * Following ARCHITECTURE.md pattern for local store creation
 * 
 * @implements store-hooks
 * @memberof api-terms
 * @template T Type of the store value
 * @param initialValue - The initial value for the local store
 * @param name - Optional name for the store (auto-generated if not provided)
 * @returns The store snapshot with store instance
 * 
 * @example
 * ```typescript
 * // Basic local store
 * const { value: count, store: counterStore } = useLocalStore(0);
 * 
 * // Named local store
 * const { value: user, store: userStore } = useLocalStore(
 *   { id: '', name: '' }, 
 *   'localUser'
 * );
 * 
 * // Use store actions
 * const handleIncrement = () => counterStore.setValue(count + 1);
 * const handleUpdateUser = (name: string) => userStore.update(u => ({ ...u, name }));
 * ```
 */
export function useLocalStore<T>(
  initialValue: T, 
  name?: string
): Snapshot<T> & { store: Store<T> } {
  const storeRef = useRef<Store<T>>();
  
  if (!storeRef.current) {
    const storeName = name || `localStore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    storeRef.current = createStore(storeName, initialValue);
    logger.debug(`Local store created via useLocalStore`, { 
      name: storeRef.current.name,
      initialValue 
    });
  }
  
  const snapshot = useStoreSelector(storeRef.current);
  
  return {
    ...snapshot,
    store: storeRef.current
  };
}

