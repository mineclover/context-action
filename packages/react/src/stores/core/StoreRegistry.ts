import type { IStore, IStoreRegistry, Listener, Unsubscribe } from './types';

/**
 * Store metadata interface for enhanced registry management
 * 
 * Contains comprehensive metadata about registered stores including
 * registration timestamps, categorization tags, versioning, and debugging flags.
 * Used by StoreRegistry for advanced store management and introspection.
 * 
 * @example
 * ```typescript
 * const metadata: StoreMetadata = {
 *   registeredAt: Date.now(),
 *   name: 'userStore',
 *   tags: ['user', 'authentication'],
 *   description: 'Manages user profile and session data',
 *   version: '2.1.0',
 *   debug: process.env.NODE_ENV === 'development'
 * }
 * ```
 * 
 * @public
 */
export interface StoreMetadata {
  /** Timestamp when the store was registered */
  registeredAt: number;
  
  /** Store name identifier */
  name: string;
  
  /** Categorization tags for filtering and organization */
  tags?: string[];
  
  /** Human-readable description of the store's purpose */
  description?: string;
  
  /** Version identifier for the store */
  version?: string;
  
  /** Enable debug logging for this specific store */
  debug?: boolean;
}

/**
 * Centralized store registry for managing multiple Store instances
 * 
 * Provides comprehensive store management capabilities including registration,
 * unregistration, retrieval, metadata management, and subscription to registry changes.
 * Essential for complex applications requiring multiple stores with organized lifecycle management.
 * 
 * Core Features:
 * - Store registration/unregistration with unique names
 * - Store retrieval by name with type safety
 * - Registry change subscriptions for reactive updates
 * - Metadata management for enhanced store information
 * - Filtering and organization capabilities
 * - Memory-safe cleanup with automatic garbage collection
 * 
 * @example Basic Store Registry Usage
 * ```typescript
 * // Create registry
 * const registry = new StoreRegistry('AppRegistry')
 * 
 * // Register stores
 * const userStore = createStore('user', { name: 'Guest' })
 * const settingsStore = createStore('settings', { theme: 'light' })
 * 
 * registry.register('user', userStore, {
 *   tags: ['auth', 'profile'],
 *   description: 'User profile and authentication data'
 * })
 * 
 * registry.register('settings', settingsStore, {
 *   tags: ['ui', 'preferences'],
 *   description: 'Application settings and user preferences'
 * })
 * 
 * // Retrieve stores
 * const user = registry.getStore('user')
 * const settings = registry.getStore('settings')
 * ```
 * 
 * @example Registry Subscriptions
 * ```typescript
 * const registry = new StoreRegistry('ReactiveRegistry')
 * 
 * // Subscribe to registry changes
 * const unsubscribe = registry.subscribe(() => {
 *   console.log(`Registry now has ${registry.getStoreCount()} stores`)
 *   console.log('Stores:', registry.getStoreNames())
 * })
 * 
 * // Registry changes will trigger the subscription
 * registry.register('newStore', createStore('data', []))
 * registry.unregister('oldStore')
 * 
 * // Cleanup subscription
 * unsubscribe()
 * ```
 * 
 * @example Metadata and Organization
 * ```typescript
 * const registry = new StoreRegistry('OrganizedRegistry')
 * 
 * // Register with comprehensive metadata
 * registry.register('userProfile', userStore, {
 *   tags: ['user', 'profile', 'auth'],
 *   description: 'Complete user profile management',
 *   version: '2.1.0',
 *   debug: true
 * })
 * 
 * // Query metadata
 * const metadata = registry.getStoreMetadata('userProfile')
 * console.log('Store registered at:', new Date(metadata.registeredAt))
 * 
 * // Update metadata
 * registry.updateStoreMetadata('userProfile', {
 *   version: '2.1.1',
 *   debug: false
 * })
 * ```
 * 
 * @example Advanced Operations
 * ```typescript
 * const registry = new StoreRegistry('AdvancedRegistry')
 * 
 * // Bulk operations
 * registry.forEach((store, name) => {
 *   console.log(`Store ${name} has ${store.getListenerCount()} subscribers`)
 * })
 * 
 * // Create filtered registry
 * const userStores = registry.filter((store, name) => {
 *   const metadata = registry.getStoreMetadata(name)
 *   return metadata?.tags?.includes('user') ?? false
 * })
 * ```
 * 
 * @public
 */
export class StoreRegistry implements IStoreRegistry {
  // Store 인스턴스들을 이름으로 매핑 - 핵심 저장소
  private stores = new Map<string, IStore>();
  // Store별 메타데이터 - WeakMap으로 메모리 누수 방지
  private metadata = new WeakMap<IStore, StoreMetadata>();
  // Registry 변경 구독자들
  private listeners = new Set<Listener>();
  // 현재 Store 목록의 스냅샷 - React와의 동기화용
  private _snapshot: Array<[string, IStore]> = [];
  public readonly name: string;
  constructor(name: string = 'default') {
    this.name = name;
  }

  /**
   * Subscribe to registry changes for reactive updates
   * 
   * Registers a listener function that will be called whenever stores are
   * added to or removed from the registry. Essential for building reactive
   * UI components that need to respond to registry changes.
   * 
   * @param listener - Function to call when registry changes occur
   * 
   * @returns Unsubscribe function to remove the listener
   * 
   * @example
   * ```typescript
   * const registry = new StoreRegistry('MyRegistry')
   * 
   * const unsubscribe = registry.subscribe(() => {
   *   console.log('Registry changed! Current stores:', registry.getStoreNames())
   * })
   * 
   * // This will trigger the listener
   * registry.register('newStore', createStore('data', {}))
   * 
   * // Cleanup when done
   * unsubscribe()
   * ```
   * 
   * @public
   */
  subscribe = (listener: Listener): Unsubscribe => {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Get current snapshot of all registered stores
   * 
   * Returns an immutable snapshot of all currently registered stores as
   * an array of name-store pairs. Compatible with React's useSyncExternalStore
   * for reactive UI updates.
   * 
   * @returns Array of [name, store] tuples representing current registry state
   * 
   * @example
   * ```typescript
   * const snapshot = registry.getSnapshot()
   * snapshot.forEach(([name, store]) => {
   *   console.log(`Store ${name}:`, store.getValue())
   * })
   * ```
   * 
   * @public
   */
  getSnapshot = (): Array<[string, IStore]> => {
    return this._snapshot;
  };

  /**
   * Register a store with optional metadata
   * 
   * Adds a store to the registry with the given name and optional metadata.
   * If a store with the same name already exists, it will be replaced.
   * Triggers registry change notifications for subscribers.
   * 
   * @param name - Unique identifier for the store
   * @param store - Store instance to register
   * @param metadata - Optional metadata for enhanced store management
   * 
   * @example Basic Registration
   * ```typescript
   * const userStore = createStore('user', { id: '', name: '' })
   * registry.register('user', userStore)
   * ```
   * 
   * @example Registration with Metadata
   * ```typescript
   * registry.register('userProfile', userStore, {
   *   tags: ['user', 'profile'],
   *   description: 'User profile data management',
   *   version: '1.0.0',
   *   debug: true
   * })
   * ```
   * 
   * @public
   */
  register(name: string, store: IStore, metadata?: Partial<StoreMetadata>): void {
    // Store already exists check (silent overwrite)
    if (this.stores.has(name)) {
      // Overwrite existing store
    }
    
    this.stores.set(name, store);
    
    // Store metadata in WeakMap for automatic GC
    this.metadata.set(store, {
      registeredAt: Date.now(),
      name,
      ...metadata
    });
    
    
    this._updateSnapshot();
  }

  /**
   * Unregister a store from the registry
   * 
   * Removes a store from the registry and calls its destroy method if available.
   * Triggers registry change notifications for subscribers. Metadata is automatically
   * garbage collected when the store is no longer referenced.
   * 
   * @param name - Name of the store to unregister
   * 
   * @returns True if store was found and removed, false if store didn't exist
   * 
   * @example
   * ```typescript
   * const wasRemoved = registry.unregister('oldStore')
   * if (wasRemoved) {
   *   console.log('Store successfully removed')
   * } else {
   *   console.log('Store not found')
   * }
   * ```
   * 
   * @public
   */
  unregister(name: string): boolean {
    const store = this.stores.get(name);
    
    if (store) {
      // Call destroy if available
      if ('destroy' in store && typeof store.destroy === 'function') {
        store.destroy();
      }
      
      this.stores.delete(name);
      // Metadata will be automatically GC'd when store is no longer referenced
      
      this._updateSnapshot();
      return true;
    }
    return false;
  }

  /**
   * Get a specific store by name
   * 
   * Retrieves a store from the registry by its registered name.
   * Returns undefined if no store with the given name exists.
   * Commonly used in action handlers for lazy evaluation of store values.
   * 
   * @param name - Name of the store to retrieve
   * 
   * @returns Store instance if found, undefined otherwise
   * 
   * @example
   * ```typescript
   * const userStore = registry.getStore('user')
   * if (userStore) {
   *   const userData = userStore.getValue()
   *   console.log('Current user:', userData)
   * } else {
   *   console.log('User store not found')
   * }
   * ```
   * 
   * @example In Action Handler
   * ```typescript
   * const updateUserHandler = async (payload, controller) => {
   *   // Lazy evaluation - only get store when needed
   *   const userStore = registry.getStore('user')
   *   const currentUser = userStore?.getValue()
   *   
   *   if (currentUser) {
   *     userStore.setValue({ ...currentUser, ...payload })
   *   }
   * }
   * ```
   * 
   * @public
   */
  getStore(name: string): IStore | undefined {
    const store = this.stores.get(name);
    return store;
  }

  /**
   * Get all registered stores as a new Map
   * 
   * Returns a new Map containing all currently registered stores.
   * The returned Map is independent of the internal registry state
   * and can be safely modified without affecting the registry.
   * 
   * @returns New Map with store names as keys and store instances as values
   * 
   * @example
   * ```typescript
   * const allStores = registry.getAllStores()
   * allStores.forEach((store, name) => {
   *   console.log(`Store ${name}:`, store.getValue())
   * })
   * ```
   * 
   * @public
   */
  getAllStores(): Map<string, IStore> {
    return new Map(this.stores);
  }

  /**
   * Check if a store exists in the registry
   * 
   * Returns true if a store with the given name is registered,
   * false otherwise. Useful for conditional operations.
   * 
   * @param name - Name of the store to check
   * 
   * @returns True if store exists, false otherwise
   * 
   * @example
   * ```typescript
   * if (registry.hasStore('user')) {
   *   const user = registry.getStore('user').getValue()
   *   console.log('User data:', user)
   * } else {
   *   console.log('User store not initialized yet')
   * }
   * ```
   * 
   * @public
   */
  hasStore(name: string): boolean {
    return this.stores.has(name);
  }

  /**
   * Get the total number of registered stores
   * 
   * Returns the count of currently registered stores in the registry.
   * Useful for debugging and monitoring registry size.
   * 
   * @returns Number of registered stores
   * 
   * @example
   * ```typescript
   * console.log(`Registry has ${registry.getStoreCount()} stores`)
   * 
   * // Monitor registry growth
   * const unsubscribe = registry.subscribe(() => {
   *   console.log(`Store count changed to: ${registry.getStoreCount()}`)
   * })
   * ```
   * 
   * @public
   */
  getStoreCount(): number {
    return this.stores.size;
  }

  /**
   * Get all registered store names
   * 
   * Returns an array containing the names of all currently registered stores.
   * Useful for iteration, debugging, and building dynamic UI components.
   * 
   * @returns Array of store names
   * 
   * @example
   * ```typescript
   * const storeNames = registry.getStoreNames()
   * console.log('Available stores:', storeNames)
   * 
   * // Use in UI to show available stores
   * storeNames.forEach(name => {
   *   console.log(`${name}: ${registry.getStore(name).getValue()}`)
   * })
   * ```
   * 
   * @public
   */
  getStoreNames(): string[] {
    return Array.from(this.stores.keys());
  }

  /**
   * Get metadata for a specific store
   * 
   * Retrieves the metadata associated with a registered store.
   * Returns undefined if the store doesn't exist or has no metadata.
   * 
   * @param name - Name of the store
   * 
   * @returns Store metadata if found, undefined otherwise
   * 
   * @example
   * ```typescript
   * const metadata = registry.getStoreMetadata('userProfile')
   * if (metadata) {
   *   console.log('Store registered at:', new Date(metadata.registeredAt))
   *   console.log('Tags:', metadata.tags)
   *   console.log('Description:', metadata.description)
   * }
   * ```
   * 
   * @public
   */
  getStoreMetadata(name: string): StoreMetadata | undefined {
    const store = this.stores.get(name);
    return store ? this.metadata.get(store) : undefined;
  }

  /**
   * Update metadata for a registered store
   * 
   * Partially updates the metadata for an existing store.
   * Only provided fields will be updated, existing fields remain unchanged.
   * 
   * @param name - Name of the store to update
   * @param updates - Partial metadata updates to apply
   * 
   * @returns True if metadata was updated, false if store doesn't exist
   * 
   * @example
   * ```typescript
   * // Update version and remove debug flag
   * const success = registry.updateStoreMetadata('userStore', {
   *   version: '2.0.1',
   *   debug: false
   * })
   * 
   * if (success) {
   *   console.log('Metadata updated successfully')
   * }
   * ```
   * 
   * @public
   */
  updateStoreMetadata(name: string, updates: Partial<StoreMetadata>): boolean {
    const store = this.stores.get(name);
    if (!store) return false;
    
    const currentMetadata = this.metadata.get(store);
    if (!currentMetadata) return false;
    
    this.metadata.set(store, {
      ...currentMetadata,
      ...updates
    });
    
    return true;
  }

  /**
   * Clear all registered stores
   * 
   * Removes all stores from the registry and calls their destroy methods
   * if available. Triggers registry change notifications. Use with caution
   * as this will affect all parts of the application using these stores.
   * 
   * @example
   * ```typescript
   * // Clear all stores (useful for testing or app reset)
   * registry.clear()
   * 
   * console.log(`Stores remaining: ${registry.getStoreCount()}`) // 0
   * ```
   * 
   * @public
   */
  clear(): void {
    // Call destroy on all stores if available
    this.stores.forEach((store) => {
      if ('destroy' in store && typeof store.destroy === 'function') {
        store.destroy();
      }
    });
    
    this.stores.clear();
    // WeakMap will automatically clean up metadata
    this._updateSnapshot();
  }

  /**
   * Execute a function for each registered store
   * 
   * Iterates over all registered stores, calling the provided callback
   * function for each store with the store instance and its name.
   * 
   * @param callback - Function to execute for each store
   * 
   * @example
   * ```typescript
   * // Log all store values
   * registry.forEach((store, name) => {
   *   console.log(`${name}:`, store.getValue())
   * })
   * 
   * // Check store health
   * registry.forEach((store, name) => {
   *   const listenerCount = store.getListenerCount()
   *   if (listenerCount === 0) {
   *     console.warn(`Store ${name} has no listeners`)
   *   }
   * })
   * ```
   * 
   * @public
   */
  forEach(callback: (store: IStore, name: string) => void): void {
    this.stores.forEach((store, name) => {
      callback(store, name);
    });
  }

  /**
   * Create a new registry containing filtered stores
   * 
   * Creates a new StoreRegistry instance containing only the stores
   * that match the provided predicate function. The original registry
   * remains unchanged. Useful for creating specialized registries.
   * 
   * @param predicate - Function to test each store for inclusion
   * 
   * @returns New StoreRegistry containing only matching stores
   * 
   * @example Filter by Store Type
   * ```typescript
   * // Create registry with only user-related stores
   * const userRegistry = registry.filter((store, name) => {
   *   const metadata = registry.getStoreMetadata(name)
   *   return metadata?.tags?.includes('user') ?? false
   * })
   * 
   * console.log('User stores:', userRegistry.getStoreNames())
   * ```
   * 
   * @example Filter by Store State
   * ```typescript
   * // Create registry with only active stores (having listeners)
   * const activeRegistry = registry.filter((store) => {
   *   return store.getListenerCount() > 0
   * })
   * ```
   * 
   * @public
   */
  filter(predicate: (store: IStore, name: string) => boolean): StoreRegistry {
    const filtered = new StoreRegistry(`${this.name}-filtered`);
    
    this.stores.forEach((store, name) => {
      if (predicate(store, name)) {
        filtered.register(name, store);
      }
    });
    
    return filtered;
  }

  private _updateSnapshot(): void {
    this._snapshot = Array.from(this.stores.entries());
    this._notifyListeners();
  }

  private _notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error(`Error in registry listener for "${this.name}":`, error);
      }
    });
  }
}
