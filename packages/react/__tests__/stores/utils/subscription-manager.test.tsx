import React from 'react';
import { render } from '@testing-library/react';
import { act } from '@testing-library/react';
import { SubscriptionManager, useSubscriptionManager } from '../../../src/stores/utils/subscription-manager';
import { Store } from '../../../src/stores/core/Store';

describe('SubscriptionManager', () => {
  let manager: SubscriptionManager;
  let store: Store<string>;

  beforeEach(() => {
    manager = new SubscriptionManager();
    store = new Store('test-store', 'initial');
  });

  afterEach(() => {
    manager.dispose();
    store.dispose();
  });

  describe('Basic Subscription Management', () => {
    it('should add subscriptions with unique IDs', () => {
      const unsubscribe1 = jest.fn();
      const unsubscribe2 = jest.fn();

      const id1 = manager.add(unsubscribe1, 'store1');
      const id2 = manager.add(unsubscribe2, 'store2');

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).toMatch(/^sub_\d+_\d+$/);
      expect(id2).toMatch(/^sub_\d+_\d+$/);
    });

    it('should remove subscriptions correctly', () => {
      const unsubscribe = jest.fn();
      const subscriptionId = manager.add(unsubscribe, 'test-store');

      expect(manager.remove(subscriptionId)).toBe(true);
      expect(unsubscribe).toHaveBeenCalledTimes(1);
      
      // Second removal should return false
      expect(manager.remove(subscriptionId)).toBe(false);
    });

    it('should handle removing non-existent subscriptions', () => {
      expect(manager.remove('non-existent-id')).toBe(false);
    });

    it('should prevent operations after disposal', () => {
      manager.dispose();
      
      expect(() => {
        manager.add(() => {}, 'test');
      }).toThrow('SubscriptionManager has been disposed');
    });

    it('should handle double disposal safely', () => {
      const unsubscribe = jest.fn();
      manager.add(unsubscribe, 'test');

      manager.dispose();
      manager.dispose(); // Should not cause errors

      expect(manager.isManagerDisposed()).toBe(true);
    });
  });

  describe('Store Subscription Integration', () => {
    it('should add store subscriptions correctly', () => {
      const listener = jest.fn();
      const subscriptionId = manager.addStoreSubscription(store, listener);

      expect(typeof subscriptionId).toBe('string');
      
      // Trigger store change to verify subscription works
      store.setValue('changed');
      
      return new Promise(resolve => {
        setTimeout(() => {
          expect(listener).toHaveBeenCalled();
          resolve(void 0);
        }, 20);
      });
    });

    it('should handle store subscription errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Create a mock store that throws on subscribe
      const problematicStore = {
        name: 'problematic',
        subscribe: () => {
          throw new Error('Subscription failed');
        }
      } as any;

      expect(() => {
        manager.addStoreSubscription(problematicStore, () => {});
      }).toThrow('Subscription failed');

      consoleErrorSpy.mockRestore();
    });

    it('should cleanup store subscriptions properly', (done) => {
      const listener = jest.fn();
      const subscriptionId = manager.addStoreSubscription(store, listener);

      store.setValue('first-change');
      
      setTimeout(() => {
        expect(listener).toHaveBeenCalledTimes(1);
        
        // Remove subscription
        manager.remove(subscriptionId);
        
        // Should not be called after removal
        store.setValue('second-change');
        
        setTimeout(() => {
          expect(listener).toHaveBeenCalledTimes(1); // Still 1, not 2
          done();
        }, 20);
      }, 20);
    });
  });

  describe('Bulk Operations', () => {
    it('should cleanup all subscriptions at once', () => {
      const unsubscribes = [jest.fn(), jest.fn(), jest.fn()];
      
      unsubscribes.forEach((unsubscribe, index) => {
        manager.add(unsubscribe, `store-${index}`);
      });

      manager.cleanupAll();

      unsubscribes.forEach(unsubscribe => {
        expect(unsubscribe).toHaveBeenCalledTimes(1);
      });

      const stats = manager.getStats();
      expect(stats.totalSubscriptions).toBe(0);
      expect(stats.activeSubscriptions).toBe(0);
    });

    it('should handle cleanup errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const errorUnsubscribe = jest.fn(() => {
        throw new Error('Cleanup error');
      });
      const normalUnsubscribe = jest.fn();

      manager.add(errorUnsubscribe, 'error-store');
      manager.add(normalUnsubscribe, 'normal-store');

      manager.cleanupAll();

      expect(errorUnsubscribe).toHaveBeenCalled();
      expect(normalUnsubscribe).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide accurate subscription statistics', () => {
      const startTime = Date.now();
      
      manager.add(() => {}, 'store-a');
      manager.add(() => {}, 'store-b');
      manager.add(() => {}, 'store-a'); // Another subscription to store-a

      const stats = manager.getStats();

      expect(stats.totalSubscriptions).toBe(3);
      expect(stats.activeSubscriptions).toBe(3);
      expect(stats.subscriptionsByStore).toEqual({
        'store-a': 2,
        'store-b': 1
      });
      expect(stats.averageAge).toBeGreaterThanOrEqual(0);
      expect(stats.oldestSubscription).toBeGreaterThanOrEqual(0);
    });

    it('should calculate age statistics correctly', () => {
      const originalDateNow = Date.now;
      let mockTime = 1000;
      
      Date.now = jest.fn(() => mockTime);

      // Add subscription at time 1000
      manager.add(() => {}, 'store1');
      
      // Move time forward
      mockTime = 2000;
      manager.add(() => {}, 'store2');
      
      // Move time forward more
      mockTime = 3000;
      
      const stats = manager.getStats();
      
      expect(stats.activeSubscriptions).toBe(2);
      expect(stats.averageAge).toBe(1500); // (2000 + 1000) / 2
      expect(stats.oldestSubscription).toBe(2000); // 3000 - 1000

      Date.now = originalDateNow;
    });

    it('should handle empty subscription statistics', () => {
      const stats = manager.getStats();

      expect(stats.totalSubscriptions).toBe(0);
      expect(stats.activeSubscriptions).toBe(0);
      expect(stats.averageAge).toBe(0);
      expect(stats.oldestSubscription).toBe(0);
      expect(stats.subscriptionsByStore).toEqual({});
    });

    it('should exclude inactive subscriptions from active counts', () => {
      const unsubscribe1 = jest.fn();
      const unsubscribe2 = jest.fn();
      
      const id1 = manager.add(unsubscribe1, 'store1');
      const id2 = manager.add(unsubscribe2, 'store2');

      // Remove one subscription
      manager.remove(id1);

      const stats = manager.getStats();
      
      expect(stats.totalSubscriptions).toBe(1);  // Only remaining subscription
      expect(stats.activeSubscriptions).toBe(1);
      expect(stats.subscriptionsByStore).toEqual({ 'store2': 1 });
    });
  });

  describe('Error Handling', () => {
    it('should handle subscription cleanup errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const errorUnsubscribe = jest.fn(() => {
        throw new Error('Unsubscribe error');
      });

      const subscriptionId = manager.add(errorUnsubscribe, 'error-store');
      
      expect(manager.remove(subscriptionId)).toBe(true);
      expect(errorUnsubscribe).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should mark subscriptions as inactive after failed cleanup', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const errorUnsubscribe = jest.fn(() => {
        throw new Error('Cleanup failed');
      });

      const subscriptionId = manager.add(errorUnsubscribe, 'failing-store');
      manager.remove(subscriptionId);

      const stats = manager.getStats();
      expect(stats.activeSubscriptions).toBe(0); // Should be marked inactive despite error

      consoleErrorSpy.mockRestore();
    });
  });
});

describe('useSubscriptionManager Hook', () => {
  it('should provide a subscription manager instance', () => {
    let capturedManager: SubscriptionManager | null = null;

    function TestComponent() {
      capturedManager = useSubscriptionManager();
      return <div>Test</div>;
    }

    act(() => {
      render(<TestComponent />);
    });

    expect(capturedManager).toBeInstanceOf(SubscriptionManager);
    expect(capturedManager!.isManagerDisposed()).toBe(false);
  });

  it('should reuse the same manager instance across renders', () => {
    let manager1: SubscriptionManager | null = null;
    let manager2: SubscriptionManager | null = null;
    let renderCount = 0;

    function TestComponent({ trigger }: { trigger: number }) {
      renderCount++;
      const manager = useSubscriptionManager();
      
      if (renderCount === 1) {
        manager1 = manager;
      } else if (renderCount === 2) {
        manager2 = manager;
      }
      
      return <div>Render: {trigger}</div>;
    }

    const { rerender } = render(<TestComponent trigger={1} />);
    rerender(<TestComponent trigger={2} />);

    expect(manager1).toBe(manager2);
    expect(renderCount).toBe(2);
  });

  it('should dispose manager on component unmount', () => {
    let capturedManager: SubscriptionManager | null = null;

    function TestComponent() {
      capturedManager = useSubscriptionManager();
      return <div>Test</div>;
    }

    const { unmount } = render(<TestComponent />);

    expect(capturedManager!.isManagerDisposed()).toBe(false);

    act(() => {
      unmount();
    });

    expect(capturedManager!.isManagerDisposed()).toBe(true);
  });

  it('should cleanup all subscriptions on unmount', () => {
    let capturedManager: SubscriptionManager | null = null;
    const unsubscribeFunction = jest.fn();

    function TestComponent() {
      capturedManager = useSubscriptionManager();
      
      // Add a subscription during component lifecycle
      React.useEffect(() => {
        if (capturedManager) {
          capturedManager.add(unsubscribeFunction, 'test-store');
        }
      }, []);
      
      return <div>Test</div>;
    }

    const { unmount } = render(<TestComponent />);

    expect(unsubscribeFunction).not.toHaveBeenCalled();

    act(() => {
      unmount();
    });

    expect(unsubscribeFunction).toHaveBeenCalledTimes(1);
  });
});

describe('Integration with Real Store Scenarios', () => {
  let manager: SubscriptionManager;
  let userStore: Store<{ name: string; age: number }>;
  let settingsStore: Store<{ theme: string; notifications: boolean }>;

  beforeEach(() => {
    manager = new SubscriptionManager();
    userStore = new Store('user', { name: 'John', age: 30 });
    settingsStore = new Store<{ theme: string; notifications: boolean }>('settings', { theme: 'dark', notifications: true });
  });

  afterEach(() => {
    manager.dispose();
    userStore.dispose();
    settingsStore.dispose();
  });

  it('should handle multiple store subscriptions correctly', (done) => {
    const userListener = jest.fn();
    const settingsListener = jest.fn();

    manager.addStoreSubscription(userStore, userListener);
    manager.addStoreSubscription(settingsStore, settingsListener);

    userStore.setValue({ name: 'Jane', age: 25 });
    settingsStore.setValue({ theme: 'light', notifications: false });

    setTimeout(() => {
      expect(userListener).toHaveBeenCalledTimes(1);
      expect(settingsListener).toHaveBeenCalledTimes(1);

      const stats = manager.getStats();
      expect(stats.activeSubscriptions).toBe(2);
      expect(stats.subscriptionsByStore).toEqual({
        'user': 1,
        'settings': 1
      });

      done();
    }, 50);
  });

  it('should handle rapid subscription changes', () => {
    const listeners = Array.from({ length: 10 }, () => jest.fn());
    const subscriptionIds: string[] = [];

    // Add multiple subscriptions rapidly
    listeners.forEach((listener, index) => {
      const id = manager.addStoreSubscription(userStore, listener);
      subscriptionIds.push(id);
    });

    expect(manager.getStats().activeSubscriptions).toBe(10);

    // Remove half of them
    subscriptionIds.slice(0, 5).forEach(id => {
      manager.remove(id);
    });

    expect(manager.getStats().activeSubscriptions).toBe(5);
    expect(manager.getStats().subscriptionsByStore.user).toBe(5);
  });
});

describe('Development Debug Support', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalWindow = global.window;

  beforeAll(() => {
    // Mock window for testing
    (global as any).window = {
      __contextActionDebug: undefined
    };
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
    global.window = originalWindow;
  });

  it('should add debug support in development environment', () => {
    process.env.NODE_ENV = 'development';
    
    // Re-require the module to trigger the debug setup
    jest.resetModules();
    require('../../../src/stores/utils/subscription-manager');

    expect((global.window as any).__contextActionDebug).toBeDefined();
    expect((global.window as any).__contextActionDebug.SubscriptionManager).toBeDefined();
  });
});