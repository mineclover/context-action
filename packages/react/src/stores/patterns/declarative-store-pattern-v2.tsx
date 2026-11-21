// biome-ignore-all lint/suspicious/noExplicitAny: heterogeneous declarative store boundary.

/**
 * @fileoverview Store Context Pattern - Simplified and Unified Store Management
 * 
 * A simplified version that focuses on store management with excellent type inference.
 * Removes complexity while maintaining all essential features. Follows the Store Only Pattern
 * for pure state management without action dispatching.
 * 
 * This pattern provides type-safe store creation with automatic inference from initial values,
 * making it the recommended approach for state management in the Context-Action framework.
 */

import React, { createContext, ReactNode, useContext, useInsertionEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { StoreErrorBoundary } from '../components/StoreErrorBoundary';
import type { Store } from '../core/Store';
import { createStore } from '../core/Store';
import { StoreRegistry } from '../core/StoreRegistry';
import type { ComparisonOptions } from '../utils/comparison';
import {
  type ExplicitStoreValue,
  isExplicitStoreValue,
  isStoreConfigShape,
} from './store-definition';

const STORE_CONFIG_KEYS = new Set<PropertyKey>([
  'initialValue',
  'strategy',
  'compareStrategy',
  'description',
  'debug',
  'tags',
  'version',
  'comparisonOptions',
]);

/**
 * Store configuration interface for store context pattern
 * 
 * Defines configuration options for individual stores including initial values,
 * comparison strategies, debugging options, and metadata.
 * 
 * @template T - The type of values stored in this store
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/
 * 
 * @public
 */
export interface StoreConfig<T = any> {
  initialValue: T;
  strategy?: 'reference' | 'shallow' | 'deep';
  /** @deprecated Use strategy instead. */
  compareStrategy?: 'reference' | 'shallow' | 'deep';
  description?: string;
  debug?: boolean;
  tags?: string[];
  version?: string;
  comparisonOptions?: Partial<ComparisonOptions<T>>;
}

/**
 * Initial stores type mapping for declarative store pattern
 * 
 * Maps store names to their configuration or direct initial values.
 * Supports both full configuration objects and direct value assignment
 * for simplified store definition.
 * 
 * @template T - Record of store names to their value types
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 * 
 * @public
 */
export type InitialStores<T extends Record<string, any>> = {
  [K in keyof T]: StoreConfig<T[K]> | ExplicitStoreValue<T[K]> | T[K];
};

/**
 * Store definitions that can infer types from initialValue
 * 
 * Generic type for store definitions that supports automatic type inference.
 * Each store can be defined with either a full configuration or a direct value.
 * 
 * @public
 */
export type StoreDefinitions = Record<string, StoreConfig<any> | ExplicitStoreValue<any> | any>;

type InferStoreDefinitionValue<T> =
  T extends ExplicitStoreValue<infer V>
    ? V
    : T extends { initialValue: infer V }
      ? Exclude<keyof T, keyof StoreConfig<any>> extends never
        ? V
        : T
      : T;

/**
 * Infer store value types from store definitions
 * 
 * Utility type that extracts the value types from store definitions,
 * supporting both configuration objects and direct values. Excludes
 * functions and properly handles arrays, dates, and objects.
 * 
 * @template T - Store definitions record
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 * 
 * @public
 */
/**
 * Enhanced type inference for store definitions with better error handling
 */
export type InferStoreTypes<T extends StoreDefinitions> = {
  readonly [K in keyof T]: InferStoreDefinitionValue<T[K]> extends (...args: unknown[]) => unknown
      ? never  // Exclude functions completely
      : InferStoreDefinitionValue<T[K]> extends readonly unknown[]
        ? InferStoreDefinitionValue<T[K]>  // Handle readonly arrays
        : InferStoreDefinitionValue<T[K]> extends unknown[]
          ? InferStoreDefinitionValue<T[K]>  // Handle mutable arrays
          : InferStoreDefinitionValue<T[K]> extends Date | RegExp | Error
            ? InferStoreDefinitionValue<T[K]>  // Built-in object types
            : InferStoreDefinitionValue<T[K]> extends Record<string, unknown>
              ? InferStoreDefinitionValue<T[K]>  // Plain objects
              : InferStoreDefinitionValue<T[K]>;  // Primitives and other types
};

/**
 * @deprecated Use InitialStores instead for better type inference
 * 
 * Legacy type alias for backward compatibility. New code should use
 * InitialStores<T> which provides better type inference and cleaner API.
 * 
 * @public
 */
export type StoreSchema<T extends Record<string, any>> = InitialStores<T>;

/**
 * Map of externally created Store instances injected into createStoreContext().Provider.
 * Partial injection lets callers pre-wire headless domain stores while allowing
 * non-injected keys in `initialStores` to still be lazily instantiated by the manager.
 *
 * @public
 */
export type ExternalStoresMap<T extends Record<string, any>> = {
  [K in keyof T]?: Store<T[K]>;
};

/**
 * Options accepted by StoreManager constructor for headless DI bindings.
 *
 * @public
 */
export interface StoreManagerOptions<T extends Record<string, any>> {
  /** Pre-created Store instances to register under this manager. */
  externalStores?: ExternalStoresMap<T>;
  /**
   * Ownership policy for `externalStores`. `'shared'` keeps external stores alive
   * across clear/dispose; `'owned'` delegates disposal of external stores to StoreManager.
   */
  externalOwnership?: 'shared' | 'owned';
}

/**
 * Props accepted by the Provider returned from createStoreContext().
 *
 * @public
 */
export interface StoreProviderProps<T extends Record<string, any> = Record<string, any>> {
  children: ReactNode;
  /** Optional custom registry identifier for isolation. */
  registryId?: string;
  /**
   * Optional externally constructed StoreManager instance for headless-first
   * orchestration and dependency injection. When both `manager` and `stores`
   * are provided, `manager` takes precedence.
   */
  manager?: StoreManager<T>;
  /**
   * Optional partial or full map of externally constructed Store instances created
   * via `createStore(...)` outside React. Uninjected keys fall back to `initialStores`.
   */
  stores?: ExternalStoresMap<T>;
  /**
   * Controls whether Provider unmount disposes injected `manager` or `stores`.
   * Defaults to `'shared'` when `manager` or `stores` is supplied; set to `'owned'`
   * to transfer disposal ownership to the Provider. Ignored when neither is supplied
   * (always `'owned'`).
   */
  ownership?: 'shared' | 'owned';
}

/**
 * Internal store registry manager
 * 
 * Manages store creation, caching, and registry coordination for the
 * store context pattern. Handles store lifecycle and provides
 * type-safe access to individual stores.
 * 
 * @template T - Record of store names to their value types
 * 
 * @public
 */
export class StoreManager<T extends Record<string, any>> {
  public readonly registry: StoreRegistry;
  public readonly initialStores: InitialStores<T>;
  public readonly stores = new Map<keyof T, Store<any>>();
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
    initialStores: InitialStores<T>,
    options?: StoreManagerOptions<T>
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
        this.registry.register(String(key), externalStore, {
          name: String(key),
        });
      }
      if (this.externalStoreKeys.size > 0) {
        this.infoVersion += 1;
      }
    }
  }

  /**
   * Get or create a store with type-safe inference
   * 
   * Retrieves an existing store or creates a new one based on the initial
   * configuration. Provides excellent type inference and caches stores
   * for performance.
   * 
   * @template K - Store name key
   * @param storeName - Name of the store to retrieve or create
   * @returns Typed store instance
   * 
   * @internal
   */
  getStore<K extends keyof T>(storeName: K): Store<T[K]> {
    if (this.lifecycle === 'disposed') {
      throw new Error(`StoreManager "${this.name}" is disposed`);
    }

    // Return existing store if available
    const existing = this.stores.get(storeName);
    if (existing) {
      return existing;
    }

    // Create new store from initial configuration
    const storeConfig = this.initialStores[storeName];
    
    // Handle both direct values and config objects
    let initialValue: T[K];
    let strategy: 'reference' | 'shallow' | 'deep' = 'reference';
    let description: string | undefined;
    let debug = false;
    let tags: string[] = ['declarative'];
    let version: string | undefined;
    let comparisonOptions: StoreConfig<T[K]>['comparisonOptions'];

    if (isExplicitStoreValue(storeConfig)) {
      initialValue = storeConfig.value as T[K];
      tags = ['declarative', strategy];
    } else if (isStoreConfigShape(storeConfig, STORE_CONFIG_KEYS)) {
      // Config object with extended options
      const config = storeConfig as StoreConfig<T[K]>;
      initialValue = config.initialValue;
      strategy = config.strategy ?? config.compareStrategy ?? 'reference';
      description = config.description;
      debug = config.debug || false;
      tags = config.tags ? ['declarative', ...config.tags] : ['declarative', strategy];
      version = config.version;
      comparisonOptions = config.comparisonOptions;
    } else {
      // Direct value
      initialValue = storeConfig as T[K];
      tags = ['declarative', strategy];
    }

    // Create store
    const store = createStore(String(storeName), initialValue);
    
    // Set comparison strategy with extended options
    const finalComparisonOptions = {
      strategy,
      ...comparisonOptions
    };
    store.setComparisonOptions(finalComparisonOptions);

    // Register in StoreRegistry with extended metadata
    const metadata = {
      name: String(storeName),
      tags,
      description: description || `Store: ${String(storeName)}`,
      debug,
      ...(version !== undefined && { version })
    };
    
    this.registry.register(String(storeName), store, metadata);

    // Debug logging if enabled
    if (debug && process.env.NODE_ENV === 'development') {
      console.log(`🏪 Store context store created: ${String(storeName)}`, {
        strategy,
        tags,
        version,
        description,
        hasCustomComparison: !!comparisonOptions?.customComparator,
        ignoreKeys: comparisonOptions?.ignoreKeys
      });
    }

    // Cache the store
    this.stores.set(storeName, store);
    this.infoVersion += 1;
    this.scheduleInfoNotification();

    return store;
  }

  /**
   * Clear manager-owned stores while keeping shared external stores alive
   */
  clear(): void {
    if (this.lifecycle === 'disposed') {
      throw new Error(`StoreManager "${this.name}" is disposed`);
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

  /**
   * Get registry info
   */
  getInfo() {
    return {
      name: this.name,
      storeCount: this.stores.size,
      availableStores: Object.keys(this.initialStores)
    };
  }
}

function areExternalStoresEqual<T extends Record<string, any>>(
  prev: ExternalStoresMap<T> | undefined,
  next: ExternalStoresMap<T> | undefined
): boolean {
  if (prev === next) return true;
  if (!prev || !next) return false;
  const prevKeys = Object.keys(prev).filter(key => prev[key] !== undefined);
  const nextKeys = Object.keys(next).filter(key => next[key] !== undefined);
  if (prevKeys.length !== nextKeys.length) return false;
  return nextKeys.every(key => prev[key] === next[key]);
}

/**
 * Context type for the store pattern
 */
interface StoreContextValue<T extends Record<string, any>> {
  managerRef: React.RefObject<StoreManager<T> | null>;
}

/** Public return contract kept explicit for stable declaration consumers. */
export interface StoreContextReturn<T extends Record<string, any>> {
  readonly Provider: (props: StoreProviderProps<T>) => React.JSX.Element;
  readonly useStore: <K extends keyof T>(storeName: K) => Store<T[K]>;
  readonly useStoreManager: () => StoreManager<T>;
  readonly useStoreInfo: () => {
    name: string;
    storeCount: number;
    availableStores: string[];
  };
  readonly useStoreClear: () => () => void;
  readonly withProvider: <P extends {}>(
    Component: React.ComponentType<P>,
    config?: WithProviderConfig
  ) => React.FC<P>;
  readonly contextName: string;
  readonly initialStores: InitialStores<T>;
}

/**
 * Overload 1: Type inference - Types inferred from store definitions
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 */
export function createStoreContext<T extends StoreDefinitions>(
  contextName: string,
  storeDefinitions: T
): StoreContextReturn<InferStoreTypes<T>>;

/**
 * Overload 2: Explicit generic types - User provides explicit type interface
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 */
export function createStoreContext<T extends Record<string, any>>(
  contextName: string,
  initialStores: InitialStores<T>
): StoreContextReturn<T>;

/**
 * Reflection-friendly overload used by utilities such as
 * `ReturnType<typeof createStoreContext>`. Specific calls continue to resolve
 * through the inference overloads above.
 */
export function createStoreContext(
  contextName: string,
  initialStores: Record<string, any>
): StoreContextReturn<any>;

/**
 * Implementation function that handles both overloads
 */
export function createStoreContext<T extends Record<string, any> | StoreDefinitions>(
  contextName: string,
  initialStores: T extends StoreDefinitions ? T : InitialStores<T>
): StoreContextReturn<any> {
  return createStoreContextImpl(contextName, initialStores as any) as any;
}

/**
 * Main implementation function - Simplified and focused on store management
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 */
function createStoreContextImpl<T extends Record<string, any>>(
  contextName: string,
  initialStores: InitialStores<T>
): StoreContextReturn<T> {
  // Create context
  const StoreContext = createContext<StoreContextValue<T> | null>(null);

  /**
   * Provider component with optional registry isolation and headless Store/Manager DI
   */
  function Provider({
    children,
    registryId,
    manager: externalManager,
    stores: externalStores,
    ownership,
  }: StoreProviderProps<T>) {
    const effectiveRegistryId = registryId || contextName;
    const ownedManagerRef = useRef<StoreManager<T> | null>(null);
    const ownedStoresEntryRef = useRef<{
      stores: ExternalStoresMap<T>;
      registryId: string;
      ownership: 'shared' | 'owned';
      manager: StoreManager<T>;
    } | null>(null);

    let activeManager: StoreManager<T>;
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
          manager: new StoreManager(effectiveRegistryId, initialStores, {
            externalStores,
            externalOwnership: resolvedExternalOwnership,
          }),
        };
      }
      activeManager = ownedStoresEntryRef.current!.manager;
    } else {
      if (!ownedManagerRef.current) {
        ownedManagerRef.current = new StoreManager(effectiveRegistryId, initialStores);
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

    const activeManagerRef = useRef<StoreManager<T> | null>(activeManager);
    activeManagerRef.current = activeManager;

    // Activity disconnects passive/layout effects while retaining the component tree.
    // Keep store ownership in an insertion effect so a hidden boundary retains
    // its manager and reconnects to the same state when revealed.
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
   * Core hook - Get typed store by name
   * This is the primary API for accessing stores
   */
  function useStore<K extends keyof T>(storeName: K): Store<T[K]> {
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
   * Get the store manager (for advanced use cases)
   */
  function useStoreManager(): StoreManager<T> {
    const context = useContext(StoreContext);
    
    if (!context?.managerRef.current) {
      throw new Error(
        `useStoreManager must be used within ${contextName}.Provider`
      );
    }
    
    return context.managerRef.current;
  }

  /**
   * Utility hooks
   */
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


  /**
   * HOC for automatic provider wrapping with optional configuration
   */
  function withProvider<P extends {}>(
    Component: React.ComponentType<P>,
    config?: WithProviderConfig
  ): React.FC<P> {
    const registryId = config?.registryId || contextName;
    
    const WithStoreProvider = (props: P) => {
      const managerRef = useRef<StoreManager<T> | null>(null);
      
      if (!managerRef.current) {
        managerRef.current = new StoreManager(registryId, initialStores);
      }

      useInsertionEffect(() => {
        const manager = managerRef.current;

        return () => {
          if (config?.autoCleanup === false) return;
          manager?.dispose();
          if (managerRef.current === manager) managerRef.current = null;
        };
      }, []);
      
      const provider = (
        <StoreContext.Provider value={{ managerRef }}>
          <Component {...props} />
        </StoreContext.Provider>
      );

      return config?.errorBoundary ? (
        <StoreErrorBoundary>{provider}</StoreErrorBoundary>
      ) : provider;
    };
    
    WithStoreProvider.displayName = 
      config?.displayName || `with${contextName}Provider(${Component.displayName || Component.name})`;
    
    return WithStoreProvider;
  }


  // Return the public API - focused and clean
  return {
    // Core
    Provider,
    useStore,        // Primary API for store access
    
    // Utilities (optional use)
    useStoreManager, // Advanced use cases only
    useStoreInfo,
    useStoreClear,
    
    // HOC patterns
    withProvider,
    
    // Metadata
    contextName,
    initialStores
  } as const;
}

/**
 * Type helper for defining initial stores with better inference
 */
export type InferInitialStores<T> = T extends StoreDefinitions ? InferStoreTypes<T> : never;

/**
 * Enhanced configuration for withProvider HOC with additional safety features
 */
export interface WithProviderConfig {
  /** Custom display name for debugging */
  displayName?: string;
  /** Custom registry identifier for isolation */
  registryId?: string;
  /** Enable automatic cleanup on unmount */
  autoCleanup?: boolean;
  /** Enable error boundary integration */
  errorBoundary?: boolean;
}

/**
 * Type helper for store values
 */
export type StoreValues<T extends Record<string, any>> = {
  [K in keyof T]: InferStoreDefinitionValue<T[K]>;
};

export type { ExplicitStoreValue } from './store-definition';
export { asStoreValue } from './store-definition';
