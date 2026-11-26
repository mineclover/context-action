// biome-ignore-all lint/suspicious/noExplicitAny: heterogeneous time-travel store boundary.

/**
 * @fileoverview Time Travel Store Context Pattern
 *
 * A store context pattern with built-in undo/redo capabilities.
 * Provides the same API as createStoreContext but with time travel functionality.
 */

import type { StateBackend, TimelineBackend } from '@context-action/store-core';
import React, { createContext, ReactNode, useCallback, useContext, useInsertionEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { StoreErrorBoundary } from '../components/StoreErrorBoundary';
import { BackendStore, createBackendStore, isBackendStoreInstance } from '../core/BackendStore';
import { createStore, isStoreInstance, Store, type StoreNotificationMode } from '../core/Store';
import { createTimeTravelStore, isTimeTravelStore, TimeTravelStore } from '../core/TimeTravelStore';
import { BaseStoreManager, useManagedStoreProvider } from './base-store-manager';
import {
  useStorePath as useStorePathHook,
  useStoreSelectorWithPaths,
  type StorePath,
} from '../hooks/useStorePath';
import {
  useTimeTravelControls as useTimeTravelControlsHook,
  type TimeTravelControlsState,
  type TimeTravelControlsStore,
} from '../hooks/useTimeTravelControls';
import { compareValues, type ComparisonOptions } from '../utils/comparison';
import {
  areExternalStoresEqual,
  type ExplicitStoreValue,
  isExplicitStoreValue,
  isStoreConfigShape,
} from './store-definition';

export type { TimeTravelControlsState };

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
  'notificationMode',
]);

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
  /** Listener notification scheduling mode */
  notificationMode?: StoreNotificationMode;
}

/**
 * Initial stores type for time travel pattern
 */
export type TimeTravelInitialStores<T extends Record<string, any>> = {
  [K in keyof T]: TimeTravelStoreConfig<T[K]> | ExplicitStoreValue<T[K]> | T[K];
};

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
 * Supported external store or framework-neutral backend input accepted by
 * `ExternalTimeTravelStoresMap<T>` in `createTimeTravelStoreContext().Provider`.
 *
 * Timeline backends (`TimelineBackend` / `MutativeTimelineBackend`) remain
 * unwrapped so `undo`, `redo`, `goTo`, `reset`, and `subscribeWithPatches` work
 * natively. Non-timeline `StateBackend` instances are wrapped with `BackendStore`.
 *
 * @public
 */
export type ExternalTimeTravelStoreInput<T> =
  | Store<T>
  | TimeTravelStore<T>
  | BackendStore<T, any>
  | StateBackend<T, any>
  | TimelineBackend<T, any>;

/**
 * Map of externally created Store, TimeTravelStore, or backend instances injected into
 * createTimeTravelStoreContext().Provider.
 *
 * @public
 */
export type ExternalTimeTravelStoresMap<T extends Record<string, any>> = {
  [K in keyof T]?: ExternalTimeTravelStoreInput<T[K]>;
};

function isTimelineCapable(store: unknown): store is TimeTravelStore<any> | TimelineBackend<any, any> {
  if (typeof store !== 'object' || store === null) {
    return false;
  }
  if (isTimeTravelStore(store as any)) {
    return true;
  }
  const candidate = store as Record<string, unknown>;
  return (
    typeof candidate.subscribe === 'function' &&
    typeof candidate.getSnapshot === 'function' &&
    typeof candidate.canUndo === 'function' &&
    typeof candidate.canRedo === 'function' &&
    typeof candidate.undo === 'function' &&
    typeof candidate.redo === 'function' &&
    typeof candidate.goTo === 'function' &&
    typeof candidate.reset === 'function' &&
    typeof candidate.getPosition === 'function' &&
    typeof candidate.getHistoryLength === 'function'
  );
}

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
export class TimeTravelStoreManager<T extends Record<string, any>> extends BaseStoreManager<
  T,
  TimeTravelInitialStores<T>,
  Store<any> | TimeTravelStore<any>
> {
  constructor(
    name: string,
    initialStores: TimeTravelInitialStores<T>,
    private readonly defaultMaxHistory: number = 50,
    options?: TimeTravelStoreManagerOptions<T>
  ) {
    super(
      name,
      initialStores,
      options?.externalOwnership ?? 'shared',
      'TimeTravelStoreManager'
    );

    this.registerExternalStores(
      options?.externalStores as Partial<Record<keyof T, unknown>> | undefined,
      (key, externalStore, externalOwnership) => {
        if (
          isStoreInstance(externalStore) ||
          isTimelineCapable(externalStore) ||
          isBackendStoreInstance(externalStore)
        ) {
          return {
            store: externalStore as unknown as Store<any> | TimeTravelStore<any>,
            adapted: false,
          };
        }

        // Adapt plain StateBackend inputs while keeping TimelineBackend instances
        // unwrapped so their native timeline controls remain accessible.
        const adapted = createBackendStore(
          String(key),
          externalStore as StateBackend<any, any>,
          { ownership: externalOwnership }
        );
        return {
          store: adapted as unknown as Store<any>,
          adapted: true,
        };
      }
    );
  }

  getStore<K extends keyof T>(storeName: K): Store<T[K]> | TimeTravelStore<T[K]> {
    this.assertActive();

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
    let notificationMode: StoreNotificationMode | undefined;

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
      notificationMode = config.notificationMode;
    } else {
      initialValue = storeConfig as T[K];
      tags = ['time-travel', strategy];
    }

    let store: Store<T[K]> | TimeTravelStore<T[K]>;

    if (enableTimeTravel) {
      store = createTimeTravelStore(String(storeName), initialValue, {
        maxHistory,
        mutable,
        ...(notificationMode !== undefined && { notificationMode }),
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
      store = createStore(
        String(storeName),
        initialValue,
        notificationMode !== undefined ? { notificationMode } : undefined
      );
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

    if (debug && process.env.NODE_ENV === 'development') {
      console.log(`${enableTimeTravel ? '🕰️ Time travel' : '📦 Regular'} store created: ${String(storeName)}`, {
        timeTravel: enableTimeTravel,
        ...(enableTimeTravel && { maxHistory }),
        mutable,
        strategy,
        tags,
      });
    }

    return this.registerCreatedStore(storeName, store, metadata);
  }

  /**
   * Check if a store has time travel enabled
   */
  hasTimeTravel<K extends keyof T>(storeName: K): boolean {
    const store = this.getStore(storeName);
    return isTimelineCapable(store);
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
    const contextValue = useManagedStoreProvider<
      TimeTravelStoreManager<T>,
      ExternalTimeTravelStoresMap<T>
    >({
      registryId,
      contextName,
      externalManager,
      externalStores,
      ownership,
      areExternalStoresEqual,
      createOwnedManager: (effectiveRegistryId) =>
        new TimeTravelStoreManager(effectiveRegistryId, initialStores, defaultMaxHistory),
      createExternalStoresManager: (
        effectiveRegistryId,
        stores,
        resolvedOwnership
      ) =>
        new TimeTravelStoreManager(effectiveRegistryId, initialStores, defaultMaxHistory, {
          externalStores: stores,
          externalOwnership: resolvedOwnership,
        }),
    });

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

    if (!isTimelineCapable(store)) {
      throw new Error(
        `useTimeTravelStore: Store "${String(storeName)}" does not have time travel enabled. ` +
        `Use useStore() instead, or set timeTravel: true in the store config.`
      );
    }

    return store as TimeTravelStore<T[K]>;
  }

  /**
   * Hook for time travel controls with proper React subscription.
   * Throws if used on a store without time travel enabled.
   */
  function useTimeTravelControls<K extends keyof T>(storeName: K): TimeTravelControlsState {
    const store = useStore(storeName);

    if (!isTimelineCapable(store)) {
      throw new Error(
        `useTimeTravelControls: Store "${String(storeName)}" does not have time travel enabled. ` +
        `Set timeTravel: true in the store config to use undo/redo.`
      );
    }

    return useTimeTravelControlsHook(store as TimeTravelControlsStore<T[K]>);
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
    path: Readonly<StorePath>
  ): R {
    const store = useStore(storeName);
    return useStorePathHook(store, path as (string | number)[]) as R;
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
    options: { dependsOn?: readonly Readonly<StorePath>[]; equalityFn?: (a: R, b: R) => boolean } = {}
  ): R {
    const store = useStore(storeName);
    return useStoreSelectorWithPaths(store, selector, {
      dependsOn: options.dependsOn,
      // Preserve TimeTravelStoreContext.useStoreSelector's 4.x Object.is default.
      equalityFn: options.equalityFn ?? Object.is,
    });
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
    const subscribeInfo = useMemo(
      () => (listener: () => void) => manager.subscribeInfo(listener),
      [manager]
    );
    const getInfoVersion = useMemo(
      () => () => manager.getInfoVersion(),
      [manager]
    );
    useSyncExternalStore(subscribeInfo, getInfoVersion, getInfoVersion);
    return manager.getInfo();
  }

  function useStoreClear() {
    const manager = useStoreManager();
    return useCallback(() => manager.clear(), [manager]);
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
