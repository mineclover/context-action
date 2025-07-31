import { useSyncExternalStore } from 'react';
import type { IStore, Snapshot } from './types';

/**
 * Default values for store sync
 */
const EMPTY_SUBSCRIBE = () => () => {};
const EMPTY_SNAPSHOT = <T>(): Snapshot<T> => ({
  value: undefined as T,
  name: '',
  lastUpdate: 0
});

/**
 * Store sync configuration
 */
export interface StoreSyncConfig<T> {
  store: IStore<T> | undefined | null;
  defaultValue?: T;
  selector?: <R>(snapshot: Snapshot<T>) => R;
}

/**
 * Create store sync hooks
 */
export function createStoreSync<T>() {
  return {
    /**
     * Sync with store and return full snapshot
     */
    useSnapshot(store: IStore<T> | undefined | null): Snapshot<T> {
      return useSyncExternalStore(
        store?.subscribe ?? EMPTY_SUBSCRIBE,
        store?.getSnapshot ?? (() => EMPTY_SNAPSHOT<T>())
      );
    },

    /**
     * Sync with store and return value only
     */
    useValue(store: IStore<T> | undefined | null): T | undefined {
      const snapshot = useSyncExternalStore(
        store?.subscribe ?? EMPTY_SUBSCRIBE,
        store?.getSnapshot ?? (() => EMPTY_SNAPSHOT<T>())
      );
      return snapshot.value;
    },

    /**
     * Sync with store using selector
     */
    useSelector<R>(
      store: IStore<T> | undefined | null,
      selector: (snapshot: Snapshot<T>) => R
    ): R {
      return useSyncExternalStore(
        store?.subscribe ?? EMPTY_SUBSCRIBE,
        store ? () => selector(store.getSnapshot()) : () => selector(EMPTY_SNAPSHOT<T>())
      );
    },

    /**
     * Sync with default value
     */
    useValueWithDefault(
      store: IStore<T> | undefined | null,
      defaultValue: T
    ): T {
      const snapshot = useSyncExternalStore(
        store?.subscribe ?? EMPTY_SUBSCRIBE,
        store?.getSnapshot ?? (() => ({ ...EMPTY_SNAPSHOT<T>(), value: defaultValue }))
      );
      return snapshot.value;
    }
  };
}

/**
 * Generic store sync hook
 */
export function useStoreSync<T, R = Snapshot<T>>(
  store: IStore<T> | undefined | null,
  options?: {
    defaultValue?: T;
    selector?: (snapshot: Snapshot<T>) => R;
  }
): R {
  const { defaultValue, selector } = options ?? {};

  const getSnapshot = store?.getSnapshot ?? (() => ({
    ...EMPTY_SNAPSHOT<T>(),
    ...(defaultValue !== undefined && { value: defaultValue })
  }));

  const selectedGetSnapshot = selector
    ? () => selector(getSnapshot())
    : getSnapshot;

  return useSyncExternalStore(
    store?.subscribe ?? EMPTY_SUBSCRIBE,
    selectedGetSnapshot as () => R
  );
}

/**
 * Batch store sync
 */
export function useBatchStoreSync<T extends Record<string, IStore | undefined | null>>(
  stores: T
): { [K in keyof T]: T[K] extends IStore<infer U> ? U : undefined } {
  const results = {} as any;

  // Note: This is not ideal as it creates multiple subscriptions
  // But it's a trade-off for simplicity
  for (const [key, store] of Object.entries(stores)) {
    results[key] = useStoreSync(store, {
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