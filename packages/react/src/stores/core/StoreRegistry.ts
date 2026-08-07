// biome-ignore-all lint/suspicious/noExplicitAny: heterogeneous store registry boundary.

import type { IStore, IStoreRegistry, Listener, Unsubscribe } from './types';

/**
 * Store metadata interface for enhanced registry management
 */
export interface StoreMetadata {
  /** Timestamp when the store was registered */
  registeredAt: number;
  /** Store name identifier */
  name: string;
  /** Enable debug logging for this specific store */
  debug?: boolean;
}

/**
 * Centralized non-owning registry for tracking multiple Store instances.
 *
 * The registry stores references and metadata only; callers that create stores
 * remain responsible for disposing them. This prevents a registry replacement
 * or clear operation from unexpectedly disposing stores owned by a manager.
 */
export class StoreRegistry implements IStoreRegistry {
  // Store 인스턴스들 직접 저장
  private stores = new Map<string, IStore<any>>();
  // Store별 메타데이터
  private metadata = new WeakMap<IStore<any>, StoreMetadata>();
  // Registry 변경 구독자들
  private listeners = new Set<Listener>();
  // 현재 Store 목록의 스냅샷
  private _snapshot: Array<[string, IStore<any>]> = [];
  
  public readonly name: string;

  constructor(name: string = 'default') {
    this.name = name;
  }

  /**
   * Subscribe to registry changes for reactive updates
   */
  subscribe(listener: Listener): Unsubscribe {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Register a new store in the registry
   */
  register(name: string, store: IStore<any>, metadata?: Partial<StoreMetadata>): void {
    // Re-registration replaces the reference without disposing the previous
    // store. Store ownership and cleanup remain with the creating manager.
    this.stores.set(name, store);
    
    // Store metadata
    if (metadata) {
      this.metadata.set(store, {
        registeredAt: Date.now(),
        name,
        ...metadata
      });
    }
    
    // Update snapshot and notify listeners
    this._updateSnapshot();
    this._notifyListeners();
  }

  /**
   * Unregister a store from the registry
   */
  unregister(name: string): boolean {
    const store = this.stores.get(name);
    if (!store) {
      return false;
    }

    // Remove from stores map
    this.stores.delete(name);
    
    // Metadata will be automatically cleaned up via WeakMap
    
    // Update snapshot and notify listeners
    this._updateSnapshot();
    this._notifyListeners();
    
    return true;
  }

  /**
   * Get a store by name
   */
  getStore(name: string): IStore<any> | undefined {
    return this.stores.get(name);
  }

  /**
   * Check if a store exists
   */
  hasStore(name: string): boolean {
    return this.stores.has(name);
  }

  /**
   * Get all registered store names
   */
  getStoreNames(): string[] {
    return Array.from(this.stores.keys());
  }

  /**
   * Get all stores as entries
   */
  getAllStores(): Map<string, IStore<any>> {
    return new Map(this.stores);
  }

  /**
   * Get store metadata
   */
  getStoreMetadata(nameOrStore: string | IStore<any>): StoreMetadata | undefined {
    const store = typeof nameOrStore === 'string' ? this.stores.get(nameOrStore) : nameOrStore;
    return store ? this.metadata.get(store) : undefined;
  }

  /**
   * Update store metadata
   */
  updateStoreMetadata(nameOrStore: string | IStore<any>, metadata: Partial<StoreMetadata>): boolean {
    const store = typeof nameOrStore === 'string' ? this.stores.get(nameOrStore) : nameOrStore;
    if (!store) {
      return false;
    }

    const currentMetadata = this.metadata.get(store);
    this.metadata.set(store, {
      registeredAt: Date.now(),
      name: typeof nameOrStore === 'string' ? nameOrStore : currentMetadata?.name || 'unknown',
      ...currentMetadata,
      ...metadata
    });

    return true;
  }

  /**
   * Get registry snapshot for React integration
   */
  getSnapshot(): Array<[string, IStore<any>]> {
    return this._snapshot;
  }

  /**
   * Clear all stores from registry
   */
  clear(): void {
    this.stores.clear();
    this._updateSnapshot();
    this._notifyListeners();
  }

  /**
   * Dispose registry and cleanup resources
   */
  dispose(): void {
    this.clear();
    this.listeners.clear();
  }

  /**
   * Get count of registered stores
   */
  getStoreCount(): number {
    return this.stores.size;
  }

  /**
   * Iterate over all stores
   */
  forEach(callback: (store: IStore<any>, name: string) => void): void {
    this.stores.forEach((store, name) => {
      callback(store, name);
    });
  }

  /**
   * Get registry statistics
   */
  getStats() {
    return {
      totalStores: this.stores.size,
      storeNames: this.getStoreNames(),
      registryName: this.name
    };
  }

  /**
   * Update internal snapshot
   */
  private _updateSnapshot(): void {
    this._snapshot = Array.from(this.stores.entries());
  }

  /**
   * Notify all listeners of registry changes
   */
  private _notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in registry listener:', error);
      }
    });
  }
}

/**
 * Global default registry instance
 */
export const globalStoreRegistry = new StoreRegistry('global');
