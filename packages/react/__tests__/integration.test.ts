/**
 * Integration tests for Testing Utilities
 * - Testing Utilities (MockStore, async helpers)
 */

import { createMockStore, waitForStoreChange, sleep } from './utils/test-utils';
import { Store } from '../src/stores/core/Store';
import { StoreRegistry } from '../src/stores/core/StoreRegistry';

// Mock React for testing
jest.mock('react', () => ({
  useEffect: jest.fn((effect, _deps) => {
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
    test('MockStore works with waitForStoreChange', async () => {
      // Create MockStore
      const mockStore = createMockStore(
        'test-store', 
        { count: 0, status: 'idle' },
        { enableSpying: true }
      );

      // Test async update with waitForStoreChange
      setTimeout(() => {
        mockStore.setValue({ count: 1, status: 'active' });
      }, 100);

      const newValue = await waitForStoreChange(mockStore, (value) => value.count === 1, 200);
      expect(newValue).toEqual({ count: 1, status: 'active' });

      // Check MockStore call history
      const history = mockStore.__testUtils.getCallHistory();
      expect(history.some(call => call.method === 'setValue')).toBe(true);
    });

    test('Async operations with MockStore', async () => {
      const mockStore = createMockStore(
        'async-store',
        0,
        { enableSpying: true }
      );

      // Simulate async operations
      const asyncOp1 = async () => {
        await sleep(100);
        mockStore.setValue(10);
        return 10;
      };

      const asyncOp2 = async () => {
        await sleep(50);
        mockStore.update(v => v + 5);
        return 5;
      };

      // Run operations in parallel
      const results = await Promise.all([asyncOp1(), asyncOp2()]);
      expect(results).toEqual([10, 5]);

      // Final value depends on which operation completes last (10 or 5)
      const finalValue = mockStore.getValue();
      expect([5, 10, 15]).toContain(finalValue);

      // Check MockStore call history
      const history = mockStore.__testUtils.getCallHistory();
      expect(history.some(call => call.method === 'setValue')).toBe(true);
      expect(history.some(call => call.method === 'update')).toBe(true);
    });
  });

  describe('Store Registry Integration', () => {
    test('StoreRegistry with MockStore', () => {
      const registry = new StoreRegistry('test-registry');
      
      // Create stores
      const store1 = new Store('store1', { value: 0 });
      const store2 = createMockStore(
        'store2',
        { data: 'initial' },
        { enableSpying: true }
      );

      registry.register('store1', store1);
      registry.register('store2', store2);

      // Test registry operations
      expect(registry.getStore('store1')).toBe(store1);
      expect(registry.getStore('store2')).toBe(store2);

      // Update stores
      store1.setValue({ value: 10 });
      store2.setValue({ data: 'updated' });

      // Verify values
      expect(store1.getValue()).toEqual({ value: 10 });
      expect(store2.getValue()).toEqual({ data: 'updated' });

      // Check MockStore call history
      const history = store2.__testUtils.getCallHistory();
      expect(history.some(call => call.method === 'setValue')).toBe(true);
    });
  });

  describe('Complex Async Scenarios', () => {
    test('Multiple stores with async updates', async () => {
      const userStore = createMockStore(
        'user-store',
        { id: null as number | null, name: '', status: 'idle' },
        { enableSpying: true }
      );

      const dataStore = createMockStore(
        'data-store',
        { items: [] as any[] },
        { enableSpying: true }
      );

      // Simulate async operations
      const userUpdatePromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          userStore.setValue({ id: 1 as number | null, name: 'John', status: 'loaded' });
          resolve();
        }, 50);
      });

      const dataUpdatePromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          dataStore.setValue({ items: [{ id: 1, name: 'Item 1' }] });
          resolve();
        }, 100);
      });

      // Wait for both operations to complete
      await Promise.all([userUpdatePromise, dataUpdatePromise]);

      // Verify final states
      expect(userStore.getValue().status).toBe('loaded');
      expect(dataStore.getValue().items).toHaveLength(1);

      // Check call history
      const userHistory = userStore.__testUtils.getCallHistory();
      const dataHistory = dataStore.__testUtils.getCallHistory();
      expect(userHistory.some(call => call.method === 'setValue')).toBe(true);
      expect(dataHistory.some(call => call.method === 'setValue')).toBe(true);
    });
  });
});