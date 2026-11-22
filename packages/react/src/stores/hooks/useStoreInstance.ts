import { useId, useInsertionEffect, useRef } from 'react';
import { createStore, Store, type StoreOptions } from '../core/Store';

/**
 * Creates a component-scoped `Store<T>` without subscribing the owning component
 * to store updates. Unlike `useLocalStore()`, mutating the store causes zero
 * re-renders in the Provider/Shell that owns it; only Leaf components using
 * `useStorePath()` / `useStoreValue()` update.
 */
export function useStoreInstance<T>(
  initialValue: T | (() => T),
  name?: string,
  options?: StoreOptions,
): Store<T> {
  const storeId = useId();
  const storeRef = useRef<Store<T> | null>(null);

  if (!storeRef.current || storeRef.current.isStoreDisposed()) {
    const resolvedInitial =
      typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    const storeName = name || `scopedStore_${storeId}`;
    storeRef.current = createStore(storeName, resolvedInitial, options);
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

  return store;
}
