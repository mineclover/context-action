import { useSyncExternalStore } from 'react';
import type { IStore, Snapshot, StoreSyncConfig } from './types';

/**
 * Constants for store sync operations
 */
const CONSTANTS = {
  EMPTY_SUBSCRIBE: () => () => {},
  EMPTY_SNAPSHOT: <T>(): Snapshot<T> => ({
    value: undefined as T,
    name: 'empty',
    lastUpdate: 0
  }),
  ERROR_MESSAGES: {
    INVALID_STORE: 'Invalid store provided to useStoreSync',
    SUBSCRIPTION_FAILED: 'Store subscription failed'
  }
} as const;

/**
 * Factory for creating typed store sync hooks
 * Provides a consistent API for different sync patterns
 */
export function createStoreSync<T>() {
  return {
    /**
     * Get full snapshot from store
     */
    useSnapshot(store: IStore<T> | undefined | null): Snapshot<T> {
      return useStoreSync(store);
    },

    /**
     * Get only the value from store
     */
    useValue(store: IStore<T> | undefined | null): T | undefined {
      return useStoreSync(store, {
        selector: snapshot => snapshot.value
      });
    },

    /**
     * Get transformed value using selector
     */
    useSelector<R>(
      store: IStore<T> | undefined | null,
      selector: (snapshot: Snapshot<T>) => R
    ): R {
      return useStoreSync(store, { selector });
    },

    /**
     * Get value with fallback default
     */
    useValueWithDefault(
      store: IStore<T> | undefined | null,
      defaultValue: T
    ): T {
      return useStoreSync(store, {
        defaultValue,
        selector: snapshot => snapshot.value
      });
    }
  };
}

/**
 * Primary store sync hook - standardized interface for all store interactions
 */
export function useStoreSync<T, R = Snapshot<T>>(
  store: IStore<T> | undefined | null,
  config?: StoreSyncConfig<T, R>
): R {
  const { defaultValue, selector } = config ?? {};

  // Standardized snapshot getter with proper fallback handling
  const getSnapshot = store?.getSnapshot ?? (() => ({
    ...CONSTANTS.EMPTY_SNAPSHOT<T>(),
    ...(defaultValue !== undefined && { value: defaultValue })
  }));

  // Apply selector if provided, otherwise return snapshot as-is
  const selectedGetSnapshot = selector
    ? () => selector(getSnapshot())
    : getSnapshot;

  // Use React's useSyncExternalStore with proper error handling
  return useSyncExternalStore(
    store?.subscribe ?? CONSTANTS.EMPTY_SUBSCRIBE,
    selectedGetSnapshot as () => R
  );
}

/**
 * Batch store sync
 */
export function useBatchStoreSync<T extends Record<string, IStore | undefined | null>>(
  stores: T
): { [K in keyof T]: T[K] extends IStore<infer U> ? U : undefined } {
  const results = {} as { [K in keyof T]: T[K] extends IStore<infer U> ? U : undefined };

  // Note: This is not ideal as it creates multiple subscriptions
  // But it's a trade-off for simplicity
  for (const [key, store] of Object.entries(stores)) {
    results[key as keyof T] = useStoreSync(store, {
      selector: snapshot => snapshot?.value
    });
  }

  return results;
}

/**
 * Create a typed store hook factory
 */
export function createTypedStoreHooks<T>() {
  const sync = createStoreSync<T>();

  return {
    useStore: sync.useSnapshot,
    useStoreValue: sync.useValue,
    useStoreSelector: sync.useSelector,
    useStoreWithDefault: sync.useValueWithDefault,
    
    /**
     * Additional typed utilities
     */
    useStoreState(store: IStore<T> | undefined | null) {
      const value = sync.useValue(store);
      const setValue = (newValue: T) => store?.setValue(newValue);
      const update = (updater: (current: T) => T) => {
        if (store && value !== undefined) {
          store.setValue(updater(value));
        }
      };
      
      return [value, { setValue, update }] as const;
    }
  };
}

// Export alias for the snapshot-based useStoreSync to avoid naming conflicts
export { useStoreSync as useStoreSyncWithSelector };