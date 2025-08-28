/**
 * Integration tests for Testing Utilities
 * - Testing Utilities (MockStore, async helpers)
 */

import { createMockStore } from '../testing/mock-store';
import { waitForStoreUpdate, BatchAsyncManager, createBatchAsyncManager } from '../testing/async-helpers';
import { Store } from '../stores/core/Store';
import { StoreRegistry } from '../stores/core/StoreRegistry';
import React from 'react';

// Mock React for testing
jest.mock('react', () => ({
  useEffect: jest.fn((effect, deps) => {
    const cleanup = effect();
    return cleanup;
  }),
  createElement: jest.fn((type, props) => ({ type, props })),
  Component: class MockComponent {
    constructor(props: any) {
      Object.assign(this, props);
    }
  }
}));

// Global setup
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Integration: Testing Utilities', () => {
  describe('MockStore with Async Helpers', () => {
    test('MockStore works with waitForStoreUpdate', async () => {
      // Create MockStore
      const mockStore = createMockStore({
        initialValue: { count: 0, status: 'idle' },
        enableLogging: true
      });

      // Test async update with waitForStoreUpdate
      setTimeout(() => {
        mockStore.setValue({ count: 1, status: 'active' });
      }, 100);

      const newValue = await waitForStoreUpdate(mockStore, 200);
      expect(newValue).toEqual({ count: 1, status: 'active' });

      // Check MockStore stats
      const stats = mockStore.getStats();
      expect(stats.setValueCalls).toBe(1);

      mockStore.dispose?.();
    });

    test('BatchAsyncManager with MockStore', async () => {
      const mockStore = createMockStore({
        initialValue: 0,
        enableLogging: true
      });

      const batchManager = createBatchAsyncManager();

      // Batch multiple async operations
      const promise1 = batchManager.add(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        mockStore.setValue(10);
        return 10;
      });

      const promise2 = batchManager.add(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        mockStore.update(v => v + 5);
        return 5;
      });

      const results = await batchManager.waitAll();
      expect(results).toEqual([10, 5]);

      // Final value should be 15 (10 + 5)
      expect(mockStore.getValue()).toBe(15);

      // Check MockStore stats
      const stats = mockStore.getStats();
      expect(stats.setValueCalls).toBe(1);
      expect(stats.updateCalls).toBe(1);

      mockStore.dispose?.();
    });
  });

  describe('Store Registry Integration', () => {
    test('StoreRegistry with MockStore', () => {
      const registry = new StoreRegistry('test-registry');
      
      // Create stores
      const store1 = new Store('store1', { value: 0 });
      const store2 = createMockStore({
        initialValue: { data: 'initial' },
        enableLogging: true
      });

      registry.register('store1', store1);
      registry.register('store2', store2);

      // Test registry operations
      expect(registry.get('store1')).toBe(store1);
      expect(registry.get('store2')).toBe(store2);

      // Update stores
      store1.setValue({ value: 10 });
      store2.setValue({ data: 'updated' });

      // Verify values
      expect(store1.getValue()).toEqual({ value: 10 });
      expect(store2.getValue()).toEqual({ data: 'updated' });

      // Check MockStore stats
      const stats = store2.getStats();
      expect(stats.setValueCalls).toBe(1);

      // Cleanup
      store1.dispose?.();
      store2.dispose?.();
    });
  });

  describe('Complex Async Scenarios', () => {
    test('Multiple stores with async updates', async () => {
      const userStore = createMockStore({
        initialValue: { id: null, name: '', status: 'idle' },
        enableLogging: true
      });

      const dataStore = createMockStore({
        initialValue: { items: [] as any[] },
        enableLogging: true
      });

      const manager = createBatchAsyncManager();

      // Add store update watchers
      manager.addStoreUpdate(
        userStore,
        (value) => value.status === 'loaded',
        'user-load'
      );

      manager.addStoreUpdate(
        dataStore,
        (value) => value.items.length > 0,
        'data-load'
      );

      // Simulate async operations
      setTimeout(() => {
        userStore.setValue({ id: 1, name: 'John', status: 'loaded' });
      }, 50);

      setTimeout(() => {
        dataStore.setValue({ items: [{ id: 1, name: 'Item 1' }] });
      }, 100);

      // Wait for any to complete
      const firstResult = await manager.waitAny();
      expect(firstResult).toBeDefined();

      // Wait for all to complete
      const allResults = await manager.waitAll(200);
      expect(allResults).toHaveLength(2);

      // Verify final states
      expect(userStore.getValue().status).toBe('loaded');
      expect(dataStore.getValue().items).toHaveLength(1);

      // Check stats
      const userStats = userStore.getStats();
      const dataStats = dataStore.getStats();
      expect(userStats.setValueCalls).toBe(1);
      expect(dataStats.setValueCalls).toBe(1);

      userStore.dispose?.();
      dataStore.dispose?.();
    });
  });
});