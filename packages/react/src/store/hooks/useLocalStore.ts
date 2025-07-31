import { useRef } from 'react';
import { Store } from '../Store';
import { useStoreSync } from '../store-sync';
import { createStore } from '../utils';
import type { Snapshot } from '../types';

/**
 * Create a component-local store that persists across renders
 * Following ARCHITECTURE.md pattern for local store creation
 * 
 * @template T - Type of the store value
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
    storeRef.current = createStore(initialValue, name);
  }
  
  const snapshot = useStoreSync(storeRef.current);
  
  return {
    ...snapshot,
    store: storeRef.current
  };
}

/**
 * Create a component-local store and return only the value and setter
 * Convenience wrapper for simple local state management
 * 
 * @template T - Type of the store value
 * @param initialValue - The initial value for the local store
 * @param name - Optional name for the store
 * @returns Tuple of [value, setValue, updateValue]
 * 
 * @example
 * ```typescript
 * const [count, setCount, updateCount] = useLocalState(0);
 * 
 * const handleIncrement = () => updateCount(prev => prev + 1);
 * const handleReset = () => setCount(0);
 * ```
 */
export function useLocalState<T>(
  initialValue: T,
  name?: string
): [T | undefined, (value: T) => void, (updater: (current: T) => T) => void] {
  const { value, store } = useLocalStore(initialValue, name);
  
  return [
    value,
    store.setValue.bind(store),
    store.update.bind(store)
  ];
}