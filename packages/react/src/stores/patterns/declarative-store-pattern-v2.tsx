/**
 * Declarative Store Pattern V2 - Simplified and Unified
 * 
 * A simplified version that focuses on store management with excellent type inference.
 * Removes complexity while maintaining all essential features.
 * 
 * @module store/declarative-store-pattern-v2
 * @since 2.1.0
 */

import React, { createContext, useContext, ReactNode, useRef } from 'react';
import { StoreRegistry } from '../core/StoreRegistry';
import { createStore } from '../core/Store';
import type { Store } from '../core/Store';
import type { ComparisonOptions } from '../utils/comparison';

/**
 * Store Configuration - Extended to match Pattern Guide
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
 * Initial Stores - Direct type mapping
 */
export type InitialStores<T extends Record<string, any>> = {
  [K in keyof T]: StoreConfig<T[K]> | T[K];  // Allow direct value or config
};

/**
 * @deprecated Use InitialStores instead
 */
export type StoreSchema<T extends Record<string, any>> = InitialStores<T>;

/**
 * Internal Registry Manager
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
   * Get or create a store with excellent type inference
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
 * Main factory function - Simplified and focused on store management
 * 
 * @example
 * ```typescript
 * // Define your stores with excellent type inference
 * const AppStores = createDeclarativeStorePattern('App', {
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
export function createDeclarativeStorePattern<T extends Record<string, any>>(
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
    
    return context.managerRef.current.getStore(storeName);
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