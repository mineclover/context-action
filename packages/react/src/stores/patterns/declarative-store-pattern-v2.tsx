/**
 * @fileoverview Declarative Store Pattern V2 - Simplified and Unified
 * 
 * A simplified version that focuses on store management with excellent type inference.
 * Removes complexity while maintaining all essential features. Follows the Store Only Pattern
 * for pure state management without action dispatching.
 * 
 * This pattern provides type-safe store creation with automatic inference from initial values,
 * making it the recommended approach for state management in the Context-Action framework.
 */

import React, { createContext, useContext, ReactNode, useRef, useMemo } from 'react';
import { StoreRegistry } from '../core/StoreRegistry';
import { createStore } from '../core/Store';
import type { Store } from '../core/Store';
import type { ComparisonOptions } from '../utils/comparison';

/**
 * Store configuration interface for declarative store pattern
 * 
 * Defines configuration options for individual stores including initial values,
 * comparison strategies, debugging options, and metadata.
 * 
 * @template T - The type of values stored in this store
 * 
 * @example
 * ```typescript
 * const userConfig: StoreConfig<User> = {
 *   initialValue: { id: '', name: '', email: '' },
 *   strategy: 'shallow',
 *   description: 'User profile data',
 *   debug: true,
 *   tags: ['user', 'profile'],
 *   version: '1.0.0'
 * }
 * ```
 * 
 * @public
 */
export interface StoreConfig<T = any> {
  initialValue: T;
  strategy?: 'reference' | 'shallow' | 'deep';
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
 * @example
 * ```typescript
 * type AppStores = {
 *   user: User
 *   settings: AppSettings
 *   theme: 'light' | 'dark'
 * }
 * 
 * const stores: InitialStores<AppStores> = {
 *   user: { initialValue: defaultUser, strategy: 'shallow' },
 *   settings: defaultSettings,  // Direct value
 *   theme: 'light'              // Direct value
 * }
 * ```
 * 
 * @public
 */
export type InitialStores<T extends Record<string, any>> = {
  [K in keyof T]: StoreConfig<T[K]> | T[K];  // Allow direct value or config
};

/**
 * Store definitions that can infer types from initialValue
 * 
 * Generic type for store definitions that supports automatic type inference.
 * Each store can be defined with either a full configuration or a direct value.
 * 
 * @public
 */
export type StoreDefinitions = Record<string, StoreConfig<any> | any>;

/**
 * Infer store value types from store definitions
 * 
 * Utility type that extracts the value types from store definitions,
 * supporting both configuration objects and direct values. Excludes
 * functions and properly handles arrays, dates, and objects.
 * 
 * @template T - Store definitions record
 * 
 * @example
 * ```typescript
 * const definitions = {
 *   user: { initialValue: { id: '', name: '' } },
 *   count: 0,
 *   items: [] as string[],
 *   settings: { theme: 'light' }
 * }
 * 
 * type InferredTypes = InferStoreTypes<typeof definitions>
 * // Result: {
 * //   user: { id: string; name: string }
 * //   count: number
 * //   items: string[]
 * //   settings: { theme: string }
 * // }
 * ```
 * 
 * @public
 */
export type InferStoreTypes<T extends StoreDefinitions> = {
  [K in keyof T]: T[K] extends StoreConfig<infer V> 
    ? V 
    : T[K] extends (...args: any[]) => any
      ? never  // Exclude functions
      : T[K] extends object
        ? T[K] extends { length: number }
          ? T[K]  // Arrays
          : T[K] extends Date
            ? T[K]  // Dates
            : T[K]  // Objects
        : T[K];  // Primitives
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
 * Internal store registry manager
 * 
 * Manages store creation, caching, and registry coordination for the
 * declarative store pattern. Handles store lifecycle and provides
 * type-safe access to individual stores.
 * 
 * @template T - Record of store names to their value types
 * 
 * @internal
 */
class StoreManager<T extends Record<string, any>> {
  public readonly registry: StoreRegistry;
  public readonly initialStores: InitialStores<T>;
  public readonly stores = new Map<keyof T, Store<any>>();

  constructor(
    public readonly name: string,
    initialStores: InitialStores<T>
  ) {
    this.registry = new StoreRegistry(name);
    this.initialStores = initialStores;
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

    if (storeConfig && typeof storeConfig === 'object' && 'initialValue' in storeConfig) {
      // Config object with extended options
      const config = storeConfig as StoreConfig<T[K]>;
      initialValue = config.initialValue;
      strategy = config.strategy || 'reference';
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
    this.registry.register(String(storeName), store, {
      name: String(storeName),
      tags,
      description: description || `Store: ${String(storeName)}`,
      version,
      debug
    });

    // Debug logging if enabled
    if (debug && process.env.NODE_ENV === 'development') {
      console.log(`🏪 Declarative store created: ${String(storeName)}`, {
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

    return store;
  }

  /**
   * Clear all stores
   */
  clear(): void {
    this.registry.clear();
    this.stores.clear();
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

/**
 * Context type for the store pattern
 */
interface StoreContextValue<T extends Record<string, any>> {
  managerRef: React.RefObject<StoreManager<T>>;
}

/**
 * Overload 1: Explicit generic types - User provides explicit type interface
 * 
 * @example
 * ```typescript
 * // Define types explicitly
 * interface AppStores {
 *   counter: number;
 *   user: { id: string; name: string; email: string };
 *   settings: { theme: 'light' | 'dark'; language: string };
 * }
 * 
 * // Create with explicit type and type-checked initialValue
 * const AppStores = createDeclarativeStorePattern<AppStores>('App', {
 *   counter: 0,  // Must match AppStores['counter'] = number
 *   user: { id: '', name: '', email: '' },  // Must match AppStores['user']
 *   settings: { 
 *     initialValue: { theme: 'light', language: 'en' },  // Must match AppStores['settings']
 *     strategy: 'shallow'
 *   }
 * });
 * ```
 */
export function createDeclarativeStorePattern<T extends Record<string, any>>(
  contextName: string,
  initialStores: InitialStores<T>
): ReturnType<typeof createDeclarativeStorePatternImpl<T>>;

/**
 * Overload 2: Type inference - Types inferred from store definitions
 * 
 * @example
 * ```typescript
 * // Type inference from initialValue (automatic)
 * const AppStores = createDeclarativeStorePattern('App', {
 *   counter: 0,  // Inferred as Store<number>
 *   user: { id: '', name: '', email: '' },  // Inferred as Store<{id: string, name: string, email: string}>
 *   settings: {
 *     initialValue: { theme: 'light' as const, language: 'en' },
 *     strategy: 'shallow'
 *   }
 * });
 * ```
 */
export function createDeclarativeStorePattern<T extends StoreDefinitions>(
  contextName: string,
  storeDefinitions: T
): ReturnType<typeof createDeclarativeStorePatternImpl<InferStoreTypes<T>>>;

/**
 * Implementation function that handles both overloads
 */
export function createDeclarativeStorePattern(
  contextName: string,
  initialStores: any
): any {
  return createDeclarativeStorePatternImpl(contextName, initialStores);
}

/**
 * Main implementation function - Simplified and focused on store management
 * 
 * @example
 * ```typescript
 * // Define your stores with excellent type inference
 * const AppStores = createDeclarativeStorePatternImpl('App', {
 *   // Direct value - simplest form
 *   counter: 0,
 *   
 *   // With configuration
 *   user: {
 *     initialValue: { id: '', name: '', email: '' },
 *     strategy: 'shallow'
 *   },
 *   
 *   // Complex nested structures work too
 *   settings: {
 *     initialValue: {
 *       theme: 'light' as 'light' | 'dark',
 *       language: 'en'
 *     }
 *   }
 * });
 * 
 * // Use in component
 * function MyComponent() {
 *   const counter = AppStores.useStore('counter');      // Store<number>
 *   const user = AppStores.useStore('user');           // Store<{id: string, name: string, email: string}>
 *   const settings = AppStores.useStore('settings');   // Store<{theme: 'light' | 'dark', language: string}>
 *   
 *   // Use with useStoreValue hook
 *   const count = useStoreValue(counter);
 *   const userData = useStoreValue(user);
 * }
 * ```
 */
function createDeclarativeStorePatternImpl<T extends Record<string, any>>(
  contextName: string,
  initialStores: InitialStores<T>
) {
  // Create context
  const StoreContext = createContext<StoreContextValue<T> | null>(null);

  /**
   * Provider component with optional registry isolation
   */
  function Provider({ 
    children, 
    registryId 
  }: { 
    children: ReactNode;
    registryId?: string;
  }) {
    const effectiveRegistryId = registryId || contextName;
    const managerRef = useRef<StoreManager<T> | null>(null);
    
    if (!managerRef.current) {
      managerRef.current = new StoreManager(effectiveRegistryId, initialStores);
    }
    
    return (
      <StoreContext.Provider value={{ managerRef }}>
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
    
    if (!context || !context.managerRef.current) {
      throw new Error(
        `useStore must be used within ${contextName}.Provider. ` +
        `Wrap your component with <${contextName}.Provider>`
      );
    }
    
    // Memoize store to prevent infinite re-renders in useEffect dependencies
    return useMemo(() => {
      return context.managerRef.current!.getStore(storeName);
    }, [context.managerRef, storeName]);
  }

  /**
   * Get the store manager (for advanced use cases)
   */
  function useStoreManager(): StoreManager<T> {
    const context = useContext(StoreContext);
    
    if (!context || !context.managerRef.current) {
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
      
      return (
        <StoreContext.Provider value={{ managerRef }}>
          <Component {...props} />
        </StoreContext.Provider>
      );
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
export type InferInitialStores<T> = T extends InitialStores<infer U> ? U : never;

/**
 * Configuration for withProvider HOC
 */
export interface WithProviderConfig {
  displayName?: string;
  registryId?: string;
}

/**
 * Type helper for store values
 */
export type StoreValues<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends StoreConfig<infer V> ? V : T[K];
};