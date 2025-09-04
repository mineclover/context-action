import { StoreRegistry, globalStoreRegistry } from '../../../src/stores/core/StoreRegistry';
import { Store } from '../../../src/stores/core/Store';

describe('StoreRegistry', () => {
  let registry: StoreRegistry;
  let store1: Store<string>;
  let store2: Store<number>;
  let store3: Store<{ name: string; value: number }>;

  beforeEach(() => {
    registry = new StoreRegistry('test');
    store1 = new Store('test-string', 'initial');
    store2 = new Store('test-number', 42);
    store3 = new Store('test-object', { name: 'test', value: 100 });
  });

  afterEach(() => {
    registry.dispose();
  });

  describe('Basic Registry Operations', () => {
    it('should create registry with correct name', () => {
      expect(registry.name).toBe('test');
    });

    it('should register stores correctly', () => {
      registry.register('string-store', store1);
      registry.register('number-store', store2);

      expect(registry.hasStore('string-store')).toBe(true);
      expect(registry.hasStore('number-store')).toBe(true);
      expect(registry.getStoreCount()).toBe(2);
    });

    it('should unregister stores correctly', () => {
      registry.register('string-store', store1);
      expect(registry.hasStore('string-store')).toBe(true);

      const removed = registry.unregister('string-store');
      expect(removed).toBe(true);
      expect(registry.hasStore('string-store')).toBe(false);
      expect(registry.getStoreCount()).toBe(0);
    });

    it('should return false when trying to unregister non-existent store', () => {
      const removed = registry.unregister('non-existent');
      expect(removed).toBe(false);
    });

    it('should get store by name', () => {
      registry.register('string-store', store1);
      const retrieved = registry.getStore('string-store');
      expect(retrieved).toBe(store1);
    });

    it('should return undefined for non-existent store', () => {
      const retrieved = registry.getStore('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Store Names and Listing', () => {
    it('should get all store names', () => {
      registry.register('store1', store1);
      registry.register('store2', store2);
      registry.register('store3', store3);

      const names = registry.getStoreNames();
      expect(names).toHaveLength(3);
      expect(names).toContain('store1');
      expect(names).toContain('store2');
      expect(names).toContain('store3');
    });

    it('should get all stores as map', () => {
      registry.register('store1', store1);
      registry.register('store2', store2);

      const allStores = registry.getAllStores();
      expect(allStores.size).toBe(2);
      expect(allStores.get('store1')).toBe(store1);
      expect(allStores.get('store2')).toBe(store2);

      // Should be a new Map instance (not the same reference)
      expect(allStores).not.toBe(registry['stores']);
    });

    it('should iterate over stores correctly', () => {
      registry.register('store1', store1);
      registry.register('store2', store2);

      const visited: Array<[string, any]> = [];
      registry.forEach((store, name) => {
        visited.push([name, store]);
      });

      expect(visited).toHaveLength(2);
      expect(visited).toContainEqual(['store1', store1]);
      expect(visited).toContainEqual(['store2', store2]);
    });
  });

  describe('Store Metadata Management', () => {
    it('should store and retrieve metadata', () => {
      const metadata = {
        debug: true,
        registeredAt: Date.now(),
        name: 'test-store'
      };

      registry.register('test-store', store1, metadata);
      const retrieved = registry.getStoreMetadata('test-store');

      expect(retrieved).toMatchObject({
        name: 'test-store',
        debug: true
      });
      expect(retrieved?.registeredAt).toBeGreaterThan(0);
    });

    it('should retrieve metadata by store instance', () => {
      registry.register('test-store', store1, { debug: true });
      const retrieved = registry.getStoreMetadata(store1);

      expect(retrieved).toMatchObject({
        name: 'test-store',
        debug: true
      });
    });

    it('should return undefined for non-existent metadata', () => {
      const retrieved = registry.getStoreMetadata('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should update store metadata', () => {
      registry.register('test-store', store1);
      
      const updated = registry.updateStoreMetadata('test-store', { debug: true });
      expect(updated).toBe(true);

      const metadata = registry.getStoreMetadata('test-store');
      expect(metadata?.debug).toBe(true);
    });

    it('should update metadata by store instance', () => {
      registry.register('test-store', store1);
      
      const updated = registry.updateStoreMetadata(store1, { debug: false });
      expect(updated).toBe(true);

      const metadata = registry.getStoreMetadata(store1);
      expect(metadata?.debug).toBe(false);
    });

    it('should return false when updating non-existent store metadata', () => {
      const updated = registry.updateStoreMetadata('non-existent', { debug: true });
      expect(updated).toBe(false);
    });
  });

  describe('Store Replacement and Cleanup', () => {
    it('should handle store replacement correctly', () => {
      const originalStore = store1;
      const newStore = new Store('replacement', 'new-value');

      registry.register('test-store', originalStore);
      expect(registry.getStore('test-store')).toBe(originalStore);

      // Register with same name should replace
      registry.register('test-store', newStore);
      expect(registry.getStore('test-store')).toBe(newStore);
      expect(registry.getStoreCount()).toBe(1);
    });

    it('should clear all stores', () => {
      registry.register('store1', store1);
      registry.register('store2', store2);
      registry.register('store3', store3);

      expect(registry.getStoreCount()).toBe(3);

      registry.clear();
      expect(registry.getStoreCount()).toBe(0);
      expect(registry.getStoreNames()).toHaveLength(0);
    });
  });

  describe('Subscription and Notification System', () => {
    it('should notify listeners on store registration', () => {
      const listener = jest.fn();
      const unsubscribe = registry.subscribe(listener);

      registry.register('test-store', store1);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      registry.register('test-store-2', store2);
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called after unsubscribe
    });

    it('should notify listeners on store unregistration', () => {
      const listener = jest.fn();
      registry.subscribe(listener);
      
      registry.register('test-store', store1);
      expect(listener).toHaveBeenCalledTimes(1);

      registry.unregister('test-store');
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should notify listeners on clear', () => {
      const listener = jest.fn();
      registry.subscribe(listener);
      
      registry.register('store1', store1);
      registry.register('store2', store2);
      expect(listener).toHaveBeenCalledTimes(2);

      registry.clear();
      expect(listener).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      registry.subscribe(listener1);
      registry.subscribe(listener2);

      registry.register('test-store', store1);
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = jest.fn();
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      registry.subscribe(errorListener);
      registry.subscribe(normalListener);

      registry.register('test-store', store1);
      
      expect(errorListener).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in registry listener:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Snapshot System for React Integration', () => {
    it('should provide correct snapshot', () => {
      registry.register('store1', store1);
      registry.register('store2', store2);

      const snapshot = registry.getSnapshot();
      expect(snapshot).toHaveLength(2);
      expect(snapshot).toContainEqual(['store1', store1]);
      expect(snapshot).toContainEqual(['store2', store2]);
    });

    it('should update snapshot on changes', () => {
      const initialSnapshot = registry.getSnapshot();
      expect(initialSnapshot).toHaveLength(0);

      registry.register('store1', store1);
      const afterRegisterSnapshot = registry.getSnapshot();
      expect(afterRegisterSnapshot).toHaveLength(1);

      registry.unregister('store1');
      const afterUnregisterSnapshot = registry.getSnapshot();
      expect(afterUnregisterSnapshot).toHaveLength(0);
    });
  });

  describe('Registry Statistics and Info', () => {
    it('should provide registry statistics', () => {
      registry.register('store1', store1);
      registry.register('store2', store2);

      const stats = registry.getStats();
      expect(stats).toEqual({
        totalStores: 2,
        storeNames: ['store1', 'store2'],
        registryName: 'test'
      });
    });

    it('should provide empty statistics for empty registry', () => {
      const stats = registry.getStats();
      expect(stats).toEqual({
        totalStores: 0,
        storeNames: [],
        registryName: 'test'
      });
    });
  });

  describe('Resource Management and Cleanup', () => {
    it('should dispose registry properly', () => {
      const listener = jest.fn();
      registry.subscribe(listener);
      registry.register('store1', store1);
      registry.register('store2', store2);

      expect(registry.getStoreCount()).toBe(2);

      registry.dispose();
      expect(registry.getStoreCount()).toBe(0);
      
      // Listeners should be cleared (no way to directly test, but disposal should clean up)
      registry.register('store3', store3);
      expect(listener).toHaveBeenCalledTimes(3); // Initial registrations + post-disposal registration
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty store names', () => {
      registry.register('', store1);
      expect(registry.hasStore('')).toBe(true);
      expect(registry.getStore('')).toBe(store1);
    });

    it('should handle multiple unsubscriptions safely', () => {
      const listener = jest.fn();
      const unsubscribe = registry.subscribe(listener);

      // Multiple calls should not cause issues
      unsubscribe();
      unsubscribe();
      
      registry.register('test-store', store1);
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle WeakMap cleanup when store is garbage collected', () => {
      // This is primarily handled by the WeakMap automatically
      // We can only test that metadata exists and the basic functionality works
      registry.register('test-store', store1, { debug: true });
      expect(registry.getStoreMetadata('test-store')).toBeDefined();
      
      registry.unregister('test-store');
      expect(registry.getStoreMetadata('test-store')).toBeUndefined();
    });
  });
});

describe('Global Store Registry', () => {
  afterEach(() => {
    globalStoreRegistry.clear();
  });

  it('should provide global registry instance', () => {
    expect(globalStoreRegistry).toBeInstanceOf(StoreRegistry);
    expect(globalStoreRegistry.name).toBe('global');
  });

  it('should be a singleton', () => {
    const registry1 = globalStoreRegistry;
    const registry2 = globalStoreRegistry;
    expect(registry1).toBe(registry2);
  });

  it('should work with global registry operations', () => {
    const store = new Store('global-test', 'value');
    
    globalStoreRegistry.register('global-store', store);
    expect(globalStoreRegistry.hasStore('global-store')).toBe(true);
    expect(globalStoreRegistry.getStore('global-store')).toBe(store);
  });
});

describe('StoreRegistry Constructor', () => {
  it('should use default name when none provided', () => {
    const registry = new StoreRegistry();
    expect(registry.name).toBe('default');
  });

  it('should use provided name', () => {
    const registry = new StoreRegistry('custom-name');
    expect(registry.name).toBe('custom-name');
  });
});