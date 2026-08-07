// biome-ignore-all lint/suspicious/noExplicitAny: heterogeneous time-travel store boundary.

/**
 * @fileoverview Time Travel Store Context Pattern
 *
 * A store context pattern with built-in undo/redo capabilities.
 * Provides the same API as createStoreContext but with time travel functionality.
 */

import type { Patches } from '@context-action/mutative';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { createStore, Store } from '../core/Store';
import { StoreRegistry } from '../core/StoreRegistry';
import { createTimeTravelStore, isTimeTravelStore, TimeTravelStore } from '../core/TimeTravelStore';
import type { StorePath } from '../hooks/useTimeTravelPath';
import type { ComparisonOptions } from '../utils/comparison';
import { createPathSignature, createPathsSignature } from '../utils/path-signature';
import {
  type ExplicitStoreValue,
  isExplicitStoreValue,
  isStoreConfigShape,
} from './store-definition';

const TIME_TRAVEL_STORE_CONFIG_KEYS = new Set<PropertyKey>([
  'initialValue',
  'timeTravel',
  'maxHistory',
  'mutable',
  'strategy',
  'description',
  'debug',
  'tags',
  'version',
  'comparisonOptions',
]);

/**
 * Check if patches affect the target path
 */
function patchesAffectPath(patches: Patches | null, targetPath: StorePath): boolean {
  if (!patches || patches.length === 0) return true;

  return patches.some(patch => {
    const patchPath = patch.path as StorePath;
    if (patchPath.length === 0) return true;

    const minLen = Math.min(patchPath.length, targetPath.length);
    for (let i = 0; i < minLen; i++) {
      if (patchPath[i] !== targetPath[i]) return false;
    }
    return true;
  });
}

/**
 * Get value at a specific path
 */
function getValueAtPath<T, R>(obj: T, path: StorePath): R {
  let current: unknown = obj;
  for (const key of path) {
    if (current === null || current === undefined) return undefined as R;
    current = (current as Record<string | number, unknown>)[key];
  }
  return current as R;
}

/**
 * Time travel store configuration
 */
export interface TimeTravelStoreConfig<T = any> {
  initialValue: T;
  /** Enable time travel (undo/redo). Default: true */
  timeTravel?: boolean;
  /** Maximum undo history length */
  maxHistory?: number;
  /** Enable mutable mode for observable state */
  mutable?: boolean;
  /** Comparison strategy */
  strategy?: 'reference' | 'shallow' | 'deep';
  description?: string;
  debug?: boolean;
  tags?: string[];
  version?: string;
  comparisonOptions?: Partial<ComparisonOptions<T>>;
}

/**
 * Initial stores type for time travel pattern
 */
export type TimeTravelInitialStores<T extends Record<string, any>> = {
  [K in keyof T]: TimeTravelStoreConfig<T[K]> | ExplicitStoreValue<T[K]> | T[K];
};

/**
 * Time travel controls state
 */
export interface TimeTravelControlsState {
  canUndo: boolean;
  canRedo: boolean;
  position: number;
  historyLength: number;
  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  goTo: (position: number) => void;
  reset: () => void;
}

/**
 * Infer store types from definitions
 */
export type InferTimeTravelStoreTypes<T extends Record<string, any>> = {
  readonly [K in keyof T]: T[K] extends ExplicitStoreValue<infer V>
    ? V
    : T[K] extends { initialValue: infer V }
      ? Exclude<keyof T[K], keyof TimeTravelStoreConfig<any>> extends never
        ? V
        : T[K]
      : T[K] extends (...args: unknown[]) => unknown
        ? never
        : T[K];
};

/**
 * Time Travel Store Manager
 */
export class TimeTravelStoreManager<T extends Record<string, any>> {
  public readonly registry: StoreRegistry;
  public readonly initialStores: TimeTravelInitialStores<T>;
  public readonly stores = new Map<keyof T, Store<any> | TimeTravelStore<any>>();

  constructor(
    public readonly name: string,
    initialStores: TimeTravelInitialStores<T>,
    private readonly defaultMaxHistory: number = 50
  ) {
    this.registry = new StoreRegistry(name);
    this.initialStores = initialStores;
  }

  getStore<K extends keyof T>(storeName: K): Store<T[K]> | TimeTravelStore<T[K]> {
    const existing = this.stores.get(storeName);
    if (existing) {
      return existing;
    }

    const storeConfig = this.initialStores[storeName];

    let initialValue: T[K];
    let enableTimeTravel = true; // default: time travel enabled
    let maxHistory = this.defaultMaxHistory;
    let mutable = false;
    let strategy: 'reference' | 'shallow' | 'deep' = 'reference';
    let description: string | undefined;
    let debug = false;
    let tags: string[] = ['time-travel'];
    let version: string | undefined;
    let comparisonOptions: TimeTravelStoreConfig<T[K]>['comparisonOptions'];

    if (isExplicitStoreValue(storeConfig)) {
      initialValue = storeConfig.value as T[K];
      tags = ['time-travel', strategy];
    } else if (isStoreConfigShape(storeConfig, TIME_TRAVEL_STORE_CONFIG_KEYS)) {
      const config = storeConfig as TimeTravelStoreConfig<T[K]>;
      initialValue = config.initialValue;
      enableTimeTravel = config.timeTravel !== false; // default true
      maxHistory = config.maxHistory ?? this.defaultMaxHistory;
      mutable = config.mutable ?? false;
      strategy = config.strategy || 'reference';
      description = config.description;
      debug = config.debug || false;
      tags = enableTimeTravel
        ? (config.tags ? ['time-travel', ...config.tags] : ['time-travel', strategy])
        : (config.tags ? ['store', ...config.tags] : ['store', strategy]);
      version = config.version;
      comparisonOptions = config.comparisonOptions;
    } else {
      initialValue = storeConfig as T[K];
      tags = ['time-travel', strategy];
    }

    let store: Store<T[K]> | TimeTravelStore<T[K]>;

    if (enableTimeTravel) {
      store = createTimeTravelStore(String(storeName), initialValue, {
        maxHistory,
        mutable,
        isEqual: comparisonOptions?.customComparator,
      });
    } else {
      store = createStore(String(storeName), initialValue);
    }

    const metadata = {
      name: String(storeName),
      tags,
      description: description || `${enableTimeTravel ? 'TimeTravelStore' : 'Store'}: ${String(storeName)}`,
      debug,
      ...(version !== undefined && { version }),
    };

    this.registry.register(String(storeName), store as any, metadata);

    if (debug && process.env.NODE_ENV === 'development') {
      console.log(`${enableTimeTravel ? '🕰️ Time travel' : '📦 Regular'} store created: ${String(storeName)}`, {
        timeTravel: enableTimeTravel,
        ...(enableTimeTravel && { maxHistory }),
        mutable,
        strategy,
        tags,
      });
    }

    this.stores.set(storeName, store);
    return store;
  }

  /**
   * Check if a store has time travel enabled
   */
  hasTimeTravel<K extends keyof T>(storeName: K): boolean {
    const store = this.getStore(storeName);
    return isTimeTravelStore(store);
  }

  clear(): void {
    this.stores.forEach(store => store.dispose());
    this.registry.clear();
    this.stores.clear();
  }

  /** Dispose all stores and registry resources owned by this manager. */
  dispose(): void {
    this.clear();
    this.registry.dispose();
  }

  getInfo() {
    return {
      name: this.name,
      storeCount: this.stores.size,
      availableStores: Object.keys(this.initialStores),
    };
  }
}

/**
 * Context type
 */
interface TimeTravelStoreContextValue<T extends Record<string, any>> {
  managerRef: React.RefObject<TimeTravelStoreManager<T> | null>;
}

/**
 * Create a time travel store context with undo/redo capabilities
 *
 * @example
 * ```tsx
 * const { Provider, useStore, useTimeTravelControls } = createTimeTravelStoreContext('App', {
 *   counter: { initialValue: { count: 0 }, maxHistory: 100 },
 *   todos: { initialValue: [], maxHistory: 50 },
 * });
 *
 * function Counter() {
 *   const store = useStore('counter');
 *   const { count } = useStoreValue(store);
 *   const { canUndo, canRedo, undo, redo } = useTimeTravelControls('counter');
 *
 *   return (
 *     <div>
 *       <p>{count}</p>
 *       <button onClick={() => undo()} disabled={!canUndo}>Undo</button>
 *       <button onClick={() => redo()} disabled={!canRedo}>Redo</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function createTimeTravelStoreContext<T extends Record<string, any>>(
  contextName: string,
  initialStores: TimeTravelInitialStores<T>,
  options?: { defaultMaxHistory?: number }
) {
  const defaultMaxHistory = options?.defaultMaxHistory ?? 50;
  const StoreContext = createContext<TimeTravelStoreContextValue<T> | null>(null);

  function Provider({
    children,
    registryId,
  }: {
    children: ReactNode;
    registryId?: string;
  }) {
    const effectiveRegistryId = registryId || contextName;
    const managerRef = useRef<TimeTravelStoreManager<T> | null>(null);

    if (!managerRef.current) {
      managerRef.current = new TimeTravelStoreManager(
        effectiveRegistryId,
        initialStores,
        defaultMaxHistory
      );
    }

    useEffect(() => {
      const manager = managerRef.current;
      return () => manager?.dispose();
    }, []);

    return (
      <StoreContext.Provider value={{ managerRef }}>
        {children}
      </StoreContext.Provider>
    );
  }

  /**
   * Get a store (regular or time-travel based on config)
   */
  function useStore<K extends keyof T>(storeName: K): Store<T[K]> | TimeTravelStore<T[K]> {
    const context = useContext(StoreContext);

    if (!context?.managerRef.current) {
      throw new Error(
        `useStore must be used within ${contextName}.Provider. ` +
        `Wrap your component with <${contextName}.Provider>`
      );
    }

    return useMemo(() => {
      return context.managerRef.current!.getStore(storeName);
    }, [context.managerRef, storeName]);
  }

  /**
   * Get a time-travel enabled store. Throws if store has timeTravel: false
   */
  function useTimeTravelStore<K extends keyof T>(storeName: K): TimeTravelStore<T[K]> {
    const store = useStore(storeName);

    if (!isTimeTravelStore(store)) {
      throw new Error(
        `useTimeTravelStore: Store "${String(storeName)}" does not have time travel enabled. ` +
        `Use useStore() instead, or set timeTravel: true in the store config.`
      );
    }

    return store;
  }

  /**
   * Hook for time travel controls with proper React subscription.
   * Throws if used on a store without time travel enabled.
   */
  function useTimeTravelControls<K extends keyof T>(storeName: K): TimeTravelControlsState {
    const store = useStore(storeName);

    if (!isTimeTravelStore(store)) {
      throw new Error(
        `useTimeTravelControls: Store "${String(storeName)}" does not have time travel enabled. ` +
        `Set timeTravel: true in the store config to use undo/redo.`
      );
    }

    const cacheRef = useRef<{
      canUndo: boolean;
      canRedo: boolean;
      position: number;
      historyLength: number;
    } | null>(null);

    const subscribe = useCallback(
      (callback: () => void) => store.subscribe(callback),
      [store]
    );

    const getSnapshot = useCallback(() => {
      const canUndo = store.canUndo();
      const canRedo = store.canRedo();
      const position = store.getPosition();
      const historyLength = store.getHistory().length;

      const cached = cacheRef.current;
      if (
        cached &&
        cached.canUndo === canUndo &&
        cached.canRedo === canRedo &&
        cached.position === position &&
        cached.historyLength === historyLength
      ) {
        return cached;
      }

      const newState = { canUndo, canRedo, position, historyLength };
      cacheRef.current = newState;
      return newState;
    }, [store]);

    const getServerSnapshot = useCallback(
      () => ({ canUndo: false, canRedo: false, position: 0, historyLength: 1 }),
      []
    );

    const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const controls = useMemo(
      () => ({
        undo: (steps?: number) => store.undo(steps),
        redo: (steps?: number) => store.redo(steps),
        goTo: (position: number) => store.goTo(position),
        reset: () => store.reset(),
      }),
      [store]
    );

    return { ...state, ...controls };
  }

  /**
   * Hook for subscribing to a specific path with patch-based optimization
   *
   * @example
   * ```tsx
   * const userName = useStorePath('user', ['name']);
   * // Only re-renders when user.name changes
   * ```
   */
  function useStorePath<K extends keyof T, R = unknown>(
    storeName: K,
    path: StorePath
  ): R {
    const store = useStore(storeName);
    const pathSignature = createPathSignature(path);
    const stablePathRef = useRef<{ signature: string; path: StorePath }>({
      signature: pathSignature,
      path: [...path],
    });

    if (stablePathRef.current.signature !== pathSignature) {
      stablePathRef.current = { signature: pathSignature, path: [...path] };
    }

    const stablePath = stablePathRef.current.path;

    const cacheRef = useRef<{ value: R; initialized: boolean; pathSignature: string }>({
      value: undefined as R,
      initialized: false,
      pathSignature,
    });

    if (cacheRef.current.pathSignature !== pathSignature) {
      cacheRef.current = { value: undefined as R, initialized: false, pathSignature };
    }

    const subscribe = useCallback(
      (callback: () => void) => {
        // TimeTravelStore has subscribeWithPatches for optimized path-based subscriptions
        if (isTimeTravelStore(store)) {
          return store.subscribeWithPatches((patches: Patches | null) => {
            if (patchesAffectPath(patches, stablePath)) {
              callback();
            }
          });
        }
        // Regular Store: subscribe to all changes
        return store.subscribe(callback);
      },
      [store, stablePath]
    );

    const getSnapshot = useCallback((): R => {
      const storeValue = store.getValue();
      const currentValue = getValueAtPath<T[K], R>(storeValue, stablePath);

      if (!cacheRef.current.initialized) {
        cacheRef.current = { value: currentValue, initialized: true, pathSignature };
        return currentValue;
      }

      if (Object.is(cacheRef.current.value, currentValue)) {
        return cacheRef.current.value;
      }

      cacheRef.current.value = currentValue;
      return currentValue;
    }, [store, stablePath, pathSignature]);

    const getServerSnapshot = useCallback((): R => {
      return getValueAtPath<T[K], R>(store.getValue(), stablePath);
    }, [store, stablePath]);

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  }

  /**
   * Hook for subscribing with selector and path hints
   *
   * @example
   * ```tsx
   * const fullName = useStoreSelector('user',
   *   (user) => `${user.firstName} ${user.lastName}`,
   *   { dependsOn: [['firstName'], ['lastName']] }
   * );
   * ```
   */
  function useStoreSelector<K extends keyof T, R>(
    storeName: K,
    selector: (value: T[K]) => R,
    options: { dependsOn?: StorePath[]; equalityFn?: (a: R, b: R) => boolean } = {}
  ): R {
    const store = useStore(storeName);
    const { dependsOn, equalityFn } = options;
    const cacheRef = useRef<R | undefined>(undefined);

    const depsKey = createPathsSignature(dependsOn);
    const stablePathsRef = useRef<{
      signature: string | null;
      paths: StorePath[] | undefined;
    }>({
      signature: depsKey,
      paths: dependsOn?.map((path) => [...path]),
    });

    if (stablePathsRef.current.signature !== depsKey) {
      stablePathsRef.current = {
        signature: depsKey,
        paths: dependsOn?.map((path) => [...path]),
      };
    }

    const stablePaths = stablePathsRef.current.paths;

    const subscribe = useCallback(
      (callback: () => void) => {
        if (!stablePaths) {
          return store.subscribe(callback);
        }
        // TimeTravelStore has subscribeWithPatches for optimized path-based subscriptions
        if (isTimeTravelStore(store)) {
          return store.subscribeWithPatches((patches: Patches | null) => {
            const affected = stablePaths.some(path => patchesAffectPath(patches, path));
            if (affected) callback();
          });
        }
        // Regular Store: subscribe to all changes when dependsOn is specified
        return store.subscribe(callback);
      },
      [store, stablePaths]
    );

    const getSnapshot = useCallback((): R => {
      const currentValue = selector(store.getValue());

      if (cacheRef.current !== undefined) {
        if (equalityFn ? equalityFn(cacheRef.current, currentValue) : Object.is(cacheRef.current, currentValue)) {
          return cacheRef.current;
        }
      }

      cacheRef.current = currentValue;
      return currentValue;
    }, [store, selector, equalityFn]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }

  function useStoreManager(): TimeTravelStoreManager<T> {
    const context = useContext(StoreContext);

    if (!context?.managerRef.current) {
      throw new Error(
        `useStoreManager must be used within ${contextName}.Provider`
      );
    }

    return context.managerRef.current;
  }

  function useStoreInfo() {
    const manager = useStoreManager();
    return manager.getInfo();
  }

  function useStoreClear() {
    const manager = useStoreManager();
    return () => manager.clear();
  }

  function withProvider<P extends {}>(
    Component: React.ComponentType<P>,
    config?: { displayName?: string; registryId?: string; autoCleanup?: boolean }
  ): React.FC<P> {
    const registryId = config?.registryId || contextName;

    const WithTimeTravelStoreProvider = (props: P) => {
      const managerRef = useRef<TimeTravelStoreManager<T> | null>(null);

      if (!managerRef.current) {
        managerRef.current = new TimeTravelStoreManager(
          registryId,
          initialStores,
          defaultMaxHistory
        );
      }

      useEffect(() => {
        const manager = managerRef.current;
        return () => {
          if (config?.autoCleanup !== false) {
            manager?.dispose();
          }
        };
      }, []);

      return (
        <StoreContext.Provider value={{ managerRef }}>
          <Component {...props} />
        </StoreContext.Provider>
      );
    };

    WithTimeTravelStoreProvider.displayName =
      config?.displayName ||
      `with${contextName}TimeTravelProvider(${Component.displayName || Component.name})`;

    return WithTimeTravelStoreProvider;
  }

  return {
    Provider,
    useStore,
    useTimeTravelStore,
    useStorePath,
    useStoreSelector,
    useTimeTravelControls,
    useStoreManager,
    useStoreInfo,
    useStoreClear,
    withProvider,
    contextName,
    initialStores,
  } as const;
}
