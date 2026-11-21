// biome-ignore-all lint/suspicious/noExplicitAny: heterogeneous time-travel store boundary.

/**
 * @fileoverview Time Travel Store Context Pattern
 *
 * A store context pattern with built-in undo/redo capabilities.
 * Provides the same API as createStoreContext but with time travel functionality.
 */

import type { Patches } from '@context-action/mutative';
import React, { createContext, ReactNode, useCallback, useContext, useInsertionEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { StoreErrorBoundary } from '../components/StoreErrorBoundary';
import { createStore, Store } from '../core/Store';
import { StoreRegistry } from '../core/StoreRegistry';
import { createTimeTravelStore, isTimeTravelStore, TimeTravelStore } from '../core/TimeTravelStore';
import type { StorePath } from '../hooks/useTimeTravelPath';
import { compareValues, type ComparisonOptions } from '../utils/comparison';
import { createPathSignature, createPathsSignature } from '../utils/path-signature';
import { patchesAffectPath } from '../utils/patch-affects-path';
import {
  areExternalStoresEqual,
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
  'readMode',
]);

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
  /** Public read policy. Manager defaults to safe defensive reads. */
  readMode?: 'reference' | 'safe';
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
 * Map of externally created Store or TimeTravelStore instances injected into
 * createTimeTravelStoreContext().Provider.
 *
 * @public
 */
export type ExternalTimeTravelStoresMap<T extends Record<string, any>> = {
  [K in keyof T]?: Store<T[K]> | TimeTravelStore<T[K]>;
};

/**
 * Options accepted by TimeTravelStoreManager constructor for headless DI bindings.
 *
 * @public
 */
export interface TimeTravelStoreManagerOptions<T extends Record<string, any>> {
  /** Pre-created Store or TimeTravelStore instances to register under this manager. */
  externalStores?: ExternalTimeTravelStoresMap<T>;
  /**
   * Ownership policy for `externalStores`. `'shared'` keeps external stores alive
   * across clear/dispose; `'owned'` delegates disposal of external stores to TimeTravelStoreManager.
   */
  externalOwnership?: 'shared' | 'owned';
}

/**
 * Props accepted by the Provider returned from createTimeTravelStoreContext().
 *
 * @public
 */
export interface TimeTravelStoreProviderProps<T extends Record<string, any> = Record<string, any>> {
  children: ReactNode;
  /** Optional custom registry identifier for isolation. */
  registryId?: string;
  /**
   * Optional externally constructed TimeTravelStoreManager instance for headless-first
   * orchestration and dependency injection. When both `manager` and `stores` are
   * provided, `manager` takes precedence.
   */
  manager?: TimeTravelStoreManager<T>;
  /**
   * Optional partial or full map of externally constructed Store or TimeTravelStore
   * instances created outside React. Uninjected keys fall back to `initialStores`.
   */
  stores?: ExternalTimeTravelStoresMap<T>;
  /**
   * Controls whether Provider unmount disposes injected `manager` or `stores`.
   * Defaults to `'shared'` when `manager` or `stores` is supplied; set to `'owned'`
   * to transfer disposal ownership to the Provider. Ignored when neither is supplied
   * (always `'owned'`).
   */
  ownership?: 'shared' | 'owned';
}

/**
 * Time Travel Store Manager
 */
export class TimeTravelStoreManager<T extends Record<string, any>> {
  public readonly registry: StoreRegistry;
  public readonly initialStores: TimeTravelInitialStores<T>;
  public readonly stores = new Map<keyof T, Store<any> | TimeTravelStore<any>>();
  private readonly externalStoreKeys = new Set<keyof T>();
  private readonly externalOwnership: 'shared' | 'owned';
  private lifecycle: 'active' | 'disposed' = 'active';
  private version = 0;
  private infoVersion = 0;
  private readonly listeners = new Set<() => void>();
  private readonly infoListeners = new Set<() => void>();
  private infoNotificationScheduled = false;

  constructor(
    public readonly name: string,
    initialStores: TimeTravelInitialStores<T>,
    private readonly defaultMaxHistory: number = 50,
    options?: TimeTravelStoreManagerOptions<T>
  ) {
    this.registry = new StoreRegistry(name);
    this.initialStores = initialStores;
    this.externalOwnership = options?.externalOwnership ?? 'shared';

    if (options?.externalStores) {
      for (const [rawKey, externalStore] of Object.entries(options.externalStores)) {
        if (!externalStore) continue;
        const key = rawKey as keyof T;
        this.externalStoreKeys.add(key);
        this.stores.set(key, externalStore);
        this.registry.register(String(key), externalStore as any, {
          name: String(key),
        });
      }
      if (this.externalStoreKeys.size > 0) {
        this.infoVersion += 1;
      }
    }
  }

  getStore<K extends keyof T>(storeName: K): Store<T[K]> | TimeTravelStore<T[K]> {
    if (this.lifecycle === 'disposed') {
      throw new Error(`TimeTravelStoreManager "${this.name}" is disposed`);
    }

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
        readMode: (storeConfig && isStoreConfigShape(storeConfig, TIME_TRAVEL_STORE_CONFIG_KEYS))
          ? (storeConfig as TimeTravelStoreConfig<T[K]>).readMode ?? 'safe'
          : 'safe',
        isEqual: comparisonOptions?.customComparator ?? (
          (comparisonOptions?.strategy ?? strategy) === 'reference'
            ? undefined
            : (previous, next) => compareValues(previous, next, {
                ...comparisonOptions,
                strategy: comparisonOptions?.strategy ?? strategy,
              })
        ),
      });
    } else {
      store = createStore(String(storeName), initialValue);
      store.setComparisonOptions({
        strategy,
        ...comparisonOptions,
      });
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
    this.infoVersion += 1;
    this.scheduleInfoNotification();
    return store;
  }

  /**
   * Check if a store has time travel enabled
   */
  hasTimeTravel<K extends keyof T>(storeName: K): boolean {
    const store = this.getStore(storeName);
    return isTimeTravelStore(store);
  }

  /** Clear manager-owned stores while keeping shared external stores alive. */
  clear(): void {
    if (this.lifecycle === 'disposed') {
      throw new Error(`TimeTravelStoreManager "${this.name}" is disposed`);
    }

    const keysToDispose: Array<keyof T> = [];
    this.stores.forEach((_store, key) => {
      const isSharedExternal =
        this.externalOwnership === 'shared' && this.externalStoreKeys.has(key);
      if (!isSharedExternal) {
        keysToDispose.push(key);
      }
    });

    for (const key of keysToDispose) {
      const store = this.stores.get(key);
      store?.dispose();
      this.registry.unregister(String(key));
      this.stores.delete(key);
    }

    this.version += 1;
    this.infoVersion += 1;
    this.listeners.forEach(listener => listener());
    this.scheduleInfoNotification();
  }

  /** Dispose manager-owned stores and registry resources; preserve shared external stores. */
  dispose(): void {
    if (this.lifecycle === 'disposed') return;
    this.lifecycle = 'disposed';
    this.stores.forEach((store, key) => {
      if (this.externalOwnership === 'owned' || !this.externalStoreKeys.has(key)) {
        store.dispose();
      }
    });
    this.stores.clear();
    this.listeners.clear();
    this.infoListeners.clear();
    this.registry.dispose();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getVersion(): number {
    return this.version;
  }

  subscribeInfo(listener: () => void): () => void {
    this.infoListeners.add(listener);
    return () => this.infoListeners.delete(listener);
  }

  getInfoVersion(): number {
    return this.infoVersion;
  }

  /**
   * Store creation can happen during render through useStore(). Defer the
   * metadata notification so one component never synchronously updates a
   * sibling that is still rendering.
   */
  private scheduleInfoNotification(): void {
    if (this.infoNotificationScheduled) return;
    this.infoNotificationScheduled = true;
    queueMicrotask(() => {
      this.infoNotificationScheduled = false;
      if (this.lifecycle === 'disposed') return;
      this.infoListeners.forEach(listener => listener());
    });
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
    manager: externalManager,
    stores: externalStores,
    ownership,
  }: TimeTravelStoreProviderProps<T>) {
    const effectiveRegistryId = registryId || contextName;
    const ownedManagerRef = useRef<TimeTravelStoreManager<T> | null>(null);
    const ownedStoresEntryRef = useRef<{
      stores: ExternalTimeTravelStoresMap<T>;
      registryId: string;
      ownership: 'shared' | 'owned';
      manager: TimeTravelStoreManager<T>;
    } | null>(null);

    let activeManager: TimeTravelStoreManager<T>;
    if (externalManager) {
      activeManager = externalManager;
    } else if (externalStores) {
      const resolvedExternalOwnership: 'shared' | 'owned' = ownership ?? 'shared';
      const currentEntry = ownedStoresEntryRef.current;
      if (
        !currentEntry ||
        currentEntry.registryId !== effectiveRegistryId ||
        currentEntry.ownership !== resolvedExternalOwnership ||
        !areExternalStoresEqual(currentEntry.stores, externalStores)
      ) {
        ownedStoresEntryRef.current = {
          stores: externalStores,
          registryId: effectiveRegistryId,
          ownership: resolvedExternalOwnership,
          manager: new TimeTravelStoreManager(effectiveRegistryId, initialStores, defaultMaxHistory, {
            externalStores,
            externalOwnership: resolvedExternalOwnership,
          }),
        };
      }
      activeManager = ownedStoresEntryRef.current!.manager;
    } else {
      if (!ownedManagerRef.current) {
        ownedManagerRef.current = new TimeTravelStoreManager(
          effectiveRegistryId,
          initialStores,
          defaultMaxHistory
        );
      }
      activeManager = ownedManagerRef.current;
    }

    // Track current disposal policy in an insertion effect so swapping from
    // a shared external manager to an owned one disposes the outgoing manager
    // under its own policy before the new effect commits.
    const shouldDisposeManager = externalManager ? ownership === 'owned' : true;
    const disposeOnUnmountRef = useRef(shouldDisposeManager);
    useInsertionEffect(() => {
      disposeOnUnmountRef.current = shouldDisposeManager;
    }, [activeManager, shouldDisposeManager]);

    const activeManagerRef = useRef<TimeTravelStoreManager<T> | null>(activeManager);
    activeManagerRef.current = activeManager;

    // Hidden Activities clean up passive effects. Use insertion-effect
    // ownership so the store history survives a hide/reveal cycle.
    useInsertionEffect(() => {
      return () => {
        const shouldDispose = disposeOnUnmountRef.current;
        if (shouldDispose) {
          activeManager.dispose();
        }
        if (ownedManagerRef.current === activeManager && shouldDispose) {
          ownedManagerRef.current = null;
        }
        if (ownedStoresEntryRef.current?.manager === activeManager) {
          ownedStoresEntryRef.current = null;
        }
        if (activeManagerRef.current === activeManager && shouldDispose) {
          activeManagerRef.current = null;
        }
      };
    }, [activeManager]);

    const contextValue = useMemo(
      () => ({ managerRef: activeManagerRef }),
      [activeManager]
    );

    return (
      <StoreContext.Provider value={contextValue}>
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

    const manager = context.managerRef.current;
    const subscribe = useMemo(() => manager.subscribe.bind(manager), [manager]);
    const getVersion = useMemo(() => manager.getVersion.bind(manager), [manager]);
    useSyncExternalStore(subscribe, getVersion, getVersion);

    // getStore returns the cached instance until clear() invalidates it.
    return manager.getStore(storeName);
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
      const storeValue = store.getSnapshot().value;
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
      return getValueAtPath<T[K], R>(store.getSnapshot().value, stablePath);
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
      const currentValue = selector(store.getSnapshot().value);

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
    useSyncExternalStore(
      listener => manager.subscribeInfo(listener),
      () => manager.getInfoVersion(),
      () => manager.getInfoVersion(),
    );
    return manager.getInfo();
  }

  function useStoreClear() {
    const manager = useStoreManager();
    return () => manager.clear();
  }

  function withProvider<P extends {}>(
    Component: React.ComponentType<P>,
    config?: {
      displayName?: string;
      registryId?: string;
      autoCleanup?: boolean;
      errorBoundary?: boolean;
    }
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

      useInsertionEffect(() => {
        const manager = managerRef.current;

        return () => {
          if (config?.autoCleanup === false) return;
          manager?.dispose();
          if (managerRef.current === manager) managerRef.current = null;
        };
      }, []);

      const contextValue = useMemo(() => ({ managerRef }), []);

      const provider = (
        <StoreContext.Provider value={contextValue}>
          <Component {...props} />
        </StoreContext.Provider>
      );

      return config?.errorBoundary ? (
        <StoreErrorBoundary>{provider}</StoreErrorBoundary>
      ) : provider;
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
