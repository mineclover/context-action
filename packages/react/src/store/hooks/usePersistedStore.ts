import { useRef, useEffect } from 'react';
import { Store } from '../Store';
import { useStoreSync } from '../store-sync';

interface PersistOptions {
  storage?: Storage;
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
}

/**
 * Create a store that persists to localStorage/sessionStorage
 * @param key The storage key
 * @param initialValue The initial value
 * @param options Persistence options
 * @returns The persisted store instance
 */
export function usePersistedStore<T>(
  key: string,
  initialValue: T,
  options: PersistOptions = {}
) {
  const {
    storage = localStorage,
    serialize = JSON.stringify,
    deserialize = JSON.parse
  } = options;
  
  const storeRef = useRef<Store<T>>();
  
  // Initialize store with persisted value or initial value
  if (!storeRef.current) {
    let value = initialValue;
    
    try {
      const stored = storage.getItem(key);
      if (stored !== null) {
        value = deserialize(stored);
      }
    } catch (error) {
      console.warn(`Failed to load persisted value for "${key}":`, error);
    }
    
    storeRef.current = new Store(key, value);
  }
  
  const store = storeRef.current;
  // Subscribe to changes to keep the hook reactive
  useStoreSync(store);
  
  // Persist changes
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      try {
        const value = store.getValue();
        storage.setItem(key, serialize(value));
      } catch (error) {
        console.warn(`Failed to persist value for "${key}":`, error);
      }
    });
    
    return unsubscribe;
  }, [store, key, storage, serialize]);
  
  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const value = deserialize(e.newValue);
          store.setValue(value);
        } catch (error) {
          console.warn(`Failed to sync value for "${key}":`, error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [store, key, deserialize]);
  
  return store;
}