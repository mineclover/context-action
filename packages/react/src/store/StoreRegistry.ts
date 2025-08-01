import type { IStore, IStoreRegistry, Listener, Unsubscribe } from './types';

/**
 * Store metadata interface
 */
interface StoreMetadata {
  registeredAt: number;
  name: string;
  tags?: string[];
  description?: string;
}

/**
 * Registry for managing multiple stores with metadata separation
 * @implements store-registry
 * @memberof core-concepts
 * 
 * Centralized registry that manages store instances and provides access to stores
 * within the application context
 */
export class StoreRegistry implements IStoreRegistry {
  private stores = new Map<string, IStore>();
  private metadata = new WeakMap<IStore, StoreMetadata>();
  private listeners = new Set<Listener>();
  private _snapshot: Array<[string, IStore]> = [];
  public readonly name: string;

  constructor(name: string = 'default') {
    this.name = name;
  }

  /**
   * Subscribe to registry changes (store additions/removals)
   * @implements store-hooks
   * @memberof api-terms
   */
  subscribe = (listener: Listener): Unsubscribe => {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Get current snapshot of all stores
   */
  getSnapshot = (): Array<[string, IStore]> => {
    return this._snapshot;
  };

  /**
   * Register a store with optional metadata
   * @implements store-integration-pattern
   * @memberof core-concepts
   */
  register(name: string, store: IStore, metadata?: Partial<StoreMetadata>): void {
    if (this.stores.has(name)) {
      console.warn(`Store "${name}" already exists in registry "${this.name}". Overwriting.`);
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
   * Unregister a store
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
   * Get a specific store
   * @implements lazy-evaluation
   * @memberof architecture-terms
   * 
   * Enables lazy evaluation of store values in action handlers
   */
  getStore(name: string): IStore | undefined {
    return this.stores.get(name);
  }

  /**
   * Get all stores as a new Map
   */
  getAllStores(): Map<string, IStore> {
    return new Map(this.stores);
  }

  /**
   * Check if a store exists
   */
  hasStore(name: string): boolean {
    return this.stores.has(name);
  }

  /**
   * Get number of registered stores
   */
  getStoreCount(): number {
    return this.stores.size;
  }

  /**
   * Get all store names
   */
  getStoreNames(): string[] {
    return Array.from(this.stores.keys());
  }

  /**
   * Get metadata for a store
   */
  getStoreMetadata(name: string): StoreMetadata | undefined {
    const store = this.stores.get(name);
    return store ? this.metadata.get(store) : undefined;
  }

  /**
   * Update metadata for a store
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
   * Clear all stores
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
   * Execute a function for each store
   */
  forEach(callback: (store: IStore, name: string) => void): void {
    this.stores.forEach((store, name) => {
      callback(store, name);
    });
  }

  /**
   * Create a new registry with filtered stores
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
