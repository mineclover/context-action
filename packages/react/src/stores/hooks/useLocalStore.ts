import { useId, useInsertionEffect, useRef } from 'react';
import { createStore, Store, type StoreOptions } from '../core/Store';
import type { Snapshot } from '../core/types';
import { useStoreValue } from './useStoreValue';

/**
 * Creates a component-lifetime `Store<T>` and **subscribes the calling component**
 * to its updates, returning `{ value, name, lastUpdate, store }` (disposed on unmount).
 *
 * Unlike `useStoreInstance()`, every store update re-renders the owning component.
 * Use `useStoreInstance()` when passing a store into `createScopedContext()` or child
 * components that subscribe selectively via `useStorePath()` / `useStoreValue()`.
 */
export function useLocalStore<T>(
  initialValue: T,
  name?: string,
  options?: StoreOptions
): Snapshot<T> & { store: Store<T> } {
  const storeId = useId();
  const storeRef = useRef<Store<T> | null>(null);

  if (!storeRef.current) {
    const storeName = name || `localStore_${storeId}`;
    storeRef.current = createStore(storeName, initialValue, options);
  }

  const store = storeRef.current;

  useInsertionEffect(() => {
    return () => {
      store.dispose();
      if (storeRef.current === store) {
        storeRef.current = null;
      }
    };
  }, [store]);

  const value = useStoreValue(store);

  return {
    value,
    name: store.name,
    lastUpdate: store.getSnapshot().lastUpdate,
    store
  };
}

