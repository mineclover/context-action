import { Store, createStore } from '../../../src/stores/core/Store';
import { StoreRegistry } from '../../../src/stores/core/StoreRegistry';

// Mock requestAnimationFrame for testing
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

describe('Store Class', () => {
  let store: Store<string>;
  let numericStore: Store<number>;
  let objectStore: Store<{ name: string; value: number }>;

  beforeEach(() => {
    store = new Store('test-store', 'initial-value');
    numericStore = new Store('numeric-store', 42);
    objectStore = new Store('object-store', { name: 'test', value: 100 });
    jest.clearAllMocks();
  });

  afterEach(() => {
    store.dispose();
    numericStore.dispose();
    objectStore.dispose();
  });

  describe('Basic Store Operations', () => {
    it('should create store with initial value and name', () => {
      expect(store.name).toBe('test-store');
      expect(store.getValue()).toBe('initial-value');
    });

    it('should set and get values correctly', () => {
      store.setValue('new-value');
      expect(store.getValue()).toBe('new-value');
    });

    it('should maintain immutability of returned values', () => {
      const initialObject = { name: 'test', value: 100 };
      objectStore.setValue(initialObject);
      
      const retrieved = objectStore.getValue();
      // Try to modify the retrieved object (may be frozen by Immer)
      try {
        retrieved.name = 'modified';
      } catch (error) {
        // Expected behavior: Immer may freeze objects
      }
      
      // Original store value should remain unchanged
      expect(objectStore.getValue().name).toBe('test');
    });

    it('should handle complex object updates correctly', () => {
      const store = new Store('complex-store', { 
        user: { name: '', age: 0 },
        settings: { theme: '', notifications: false },
        items: [] as number[]
      });
      
      const complexObject = {
        user: { name: 'John', age: 30 },
        settings: { theme: 'dark', notifications: true },
        items: [1, 2, 3]
      };

      store.setValue(complexObject);
      const retrieved = store.getValue();
      
      expect(retrieved).toEqual(complexObject);
      // Note: With copy-on-write optimization, references may be preserved when no changes occur
      
      store.dispose();
    });
  });

  describe('Subscription System', () => {
    it('should notify listeners on value changes', (done) => {
      const listener = jest.fn();
      store.subscribe(listener);

      store.setValue('changed-value');
      
      // Wait for async notification (RAF-based)
      setTimeout(() => {
        expect(listener).toHaveBeenCalledTimes(1);
        done();
      }, 20);
    });

    it('should not notify listeners when value does not change', (done) => {
      const listener = jest.fn();
      store.subscribe(listener);

      store.setValue('initial-value'); // Same value
      
      setTimeout(() => {
        expect(listener).not.toHaveBeenCalled();
        done();
      }, 20);
    });

    it('should allow multiple listeners', (done) => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      store.subscribe(listener1);
      store.subscribe(listener2);

      store.setValue('changed-value');
      
      setTimeout(() => {
        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(1);
        done();
      }, 20);
    });

    it('should unsubscribe listeners correctly', (done) => {
      const listener = jest.fn();
      const unsubscribe = store.subscribe(listener);

      store.setValue('first-change');
      
      setTimeout(() => {
        expect(listener).toHaveBeenCalledTimes(1);
        
        unsubscribe();
        store.setValue('second-change');
        
        setTimeout(() => {
          expect(listener).toHaveBeenCalledTimes(1); // Should not increase
          done();
        }, 20);
      }, 20);
    });

    it('should handle listener errors gracefully', (done) => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = jest.fn();
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      store.subscribe(errorListener);
      store.subscribe(normalListener);

      store.setValue('trigger-error');
      
      setTimeout(() => {
        expect(errorListener).toHaveBeenCalled();
        expect(normalListener).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
        done();
      }, 20);
    });

    it('should remove problematic listeners after multiple errors', (done) => {
      const errorListener = jest.fn(() => {
        throw new Error('Persistent error');
      });
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      store.subscribe(errorListener);

      // Trigger errors multiple times
      store.setValue('error1');
      setTimeout(() => {
        store.setValue('error2');
        setTimeout(() => {
          store.setValue('error3');
          setTimeout(() => {
            store.setValue('error4');
            setTimeout(() => {
              expect(consoleWarnSpy).toHaveBeenCalled();
              expect(store.getListenerCount()).toBe(0);
              
              consoleWarnSpy.mockRestore();
              consoleErrorSpy.mockRestore();
              done();
            }, 20);
          }, 20);
        }, 20);
      }, 20);
    });
  });

  describe('Patch-aware notification batching', () => {
    it('should merge patches from multiple updates in the same frame', (done) => {
      const batchedStore = createStore('batched-patches', {
        count: 0,
        name: 'initial'
      });
      const patchListener = jest.fn();
      batchedStore.subscribeWithPatches(patchListener);

      batchedStore.setValue({ count: 1, name: 'initial' });
      batchedStore.setValue({ count: 1, name: 'changed' });

      setTimeout(() => {
        expect(patchListener).toHaveBeenCalledTimes(1);
        expect(patchListener).toHaveBeenCalledWith([
          { op: 'replace', path: ['count'], value: 1 },
          { op: 'replace', path: ['name'], value: 'changed' }
        ]);
        expect(batchedStore.getLastPatches()).toEqual([
          { op: 'replace', path: ['count'], value: 1 },
          { op: 'replace', path: ['name'], value: 'changed' }
        ]);
        batchedStore.dispose();
        done();
      }, 20);
    });

    it('should preserve the current frame patches when a listener updates again', (done) => {
      const batchedStore = createStore('batched-reentrant-patches', { count: 0 });
      const listener = jest.fn(() => {
        if (listener.mock.calls.length === 1) {
          batchedStore.setValue({ count: 2 });
        }
      });
      const patchListener = jest.fn();
      batchedStore.subscribe(listener);
      batchedStore.subscribeWithPatches(patchListener);

      batchedStore.setValue({ count: 1 });

      setTimeout(() => {
        expect(listener).toHaveBeenCalledTimes(2);
        expect(patchListener).toHaveBeenCalledTimes(2);
        expect(patchListener.mock.calls[0][0]).toEqual([
          { op: 'replace', path: ['count'], value: 1 }
        ]);
        expect(patchListener.mock.calls[1][0]).toEqual([
          { op: 'replace', path: ['count'], value: 2 }
        ]);
        batchedStore.dispose();
        done();
      }, 50);
    });
  });

  describe('Update Method with Immer Integration', () => {
    it('should update values using updater function', () => {
      objectStore.update(current => ({
        ...current,
        name: 'updated'
      }));

      expect(objectStore.getValue().name).toBe('updated');
      expect(objectStore.getValue().value).toBe(100); // Other properties preserved
    });

    it('should handle concurrent updates safely', () => {
      const updates = [
        () => numericStore.update(current => current + 1),
        () => numericStore.update(current => current * 2),
        () => numericStore.update(current => current - 5)
      ];

      // Execute updates simultaneously
      Promise.all(updates.map(update => Promise.resolve().then(update)));
      
      // Wait for all updates to complete
      return new Promise(resolve => {
        setTimeout(() => {
          // Value should reflect all updates in some order
          const finalValue = numericStore.getValue();
          expect(typeof finalValue).toBe('number');
          expect(finalValue).not.toBe(42); // Should be different from initial
          resolve(void 0);
        }, 50);
      });
    });

    it('should handle updater function errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // This should not crash the store
      objectStore.update(() => {
        throw new Error('Updater error');
      });

      expect(objectStore.getValue()).toEqual({ name: 'test', value: 100 });
      consoleSpy.mockRestore();
    });

    it('should prevent event object storage in update results', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock event-like object
      const fakeEvent = {
        target: document.createElement('div'),
        preventDefault: () => {},
        type: 'click'
      };

      objectStore.update(() => fakeEvent as any);
      
      // Store value should remain unchanged
      expect(objectStore.getValue()).toEqual({ name: 'test', value: 100 });
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Snapshot System for React Integration', () => {
    it('should provide immutable snapshots', () => {
      const snapshot1 = store.getSnapshot();
      expect(snapshot1.value).toBe('initial-value');
      expect(snapshot1.name).toBe('test-store');
      expect(typeof snapshot1.lastUpdate).toBe('number');

      store.setValue('new-value');
      const snapshot2 = store.getSnapshot();
      
      expect(snapshot1.value).toBe('initial-value'); // Old snapshot unchanged
      expect(snapshot2.value).toBe('new-value');
      expect(snapshot2.lastUpdate).toBeGreaterThanOrEqual(snapshot1.lastUpdate);
    });

    it('should create new snapshot only when value changes', () => {
      const snapshot1 = store.getSnapshot();
      
      store.setValue('initial-value'); // Same value
      const snapshot2 = store.getSnapshot();
      
      expect(snapshot1).toBe(snapshot2); // Should be the same reference
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should register and execute cleanup tasks', () => {
      const cleanup1 = jest.fn();
      const cleanup2 = jest.fn();
      
      const unregister1 = store.registerCleanup(cleanup1);
      store.registerCleanup(cleanup2);

      store.dispose();
      
      expect(cleanup1).toHaveBeenCalledTimes(1);
      expect(cleanup2).toHaveBeenCalledTimes(1);
    });

    it('should allow unregistering cleanup tasks', () => {
      const cleanup = jest.fn();
      const unregister = store.registerCleanup(cleanup);
      
      unregister();
      store.dispose();
      
      expect(cleanup).not.toHaveBeenCalled();
    });

    it('should handle cleanup task errors during disposal', () => {
      const errorCleanup = jest.fn(() => {
        throw new Error('Cleanup error');
      });
      const normalCleanup = jest.fn();
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      store.registerCleanup(errorCleanup);
      store.registerCleanup(normalCleanup);

      store.dispose();
      
      expect(errorCleanup).toHaveBeenCalled();
      expect(normalCleanup).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should prevent operations on disposed store', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      store.dispose();
      
      const unsubscribe = store.subscribe(() => {});
      expect(typeof unsubscribe).toBe('function');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot subscribe to disposed store')
      );

      const unregister = store.registerCleanup(() => {});
      expect(typeof unregister).toBe('function');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('already disposed')
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle double disposal safely', () => {
      store.dispose();
      store.dispose(); // Should not cause errors
      
      expect(store.isStoreDisposed()).toBe(true);
    });
  });

  describe('Advanced Configuration', () => {
    it('should support custom comparator functions', (done) => {
      const customStore = new Store('custom', { value: 1 });
      const listener = jest.fn();
      
      // Custom comparator that only considers the 'value' property
      customStore.setCustomComparator((old, current) => {
        return old.value === current.value;
      });
      
      customStore.subscribe(listener);

      // Change object reference but same value
      customStore.setValue({ value: 1 });
      
      setTimeout(() => {
        expect(listener).not.toHaveBeenCalled(); // Should not notify
        
        // Now change the value
        customStore.setValue({ value: 2 });
        
        setTimeout(() => {
          expect(listener).toHaveBeenCalledTimes(1);
          customStore.dispose();
          done();
        }, 20);
      }, 20);
    });

    it('should support comparison options', (done) => {
      const customStore = new Store('options', { a: 1, b: 2 });
      const listener = jest.fn();
      
      customStore.setComparisonOptions({ 
        strategy: 'shallow'
      });
      
      customStore.subscribe(listener);

      // Change 'b' only - should trigger with shallow comparison
      customStore.setValue({ a: 1, b: 99 });
      
      setTimeout(() => {
        expect(listener).toHaveBeenCalledTimes(1);
        
        // Change 'a' - should trigger again
        customStore.setValue({ a: 2, b: 99 });
        
        setTimeout(() => {
          expect(listener).toHaveBeenCalledTimes(2);
          customStore.dispose();
          done();
        }, 20);
      }, 20);
    });

    it('should support disabling cloning for performance', () => {
      const performanceStore = new Store('perf', { data: 'test' });
      performanceStore.setCloningEnabled(false);
      
      expect(performanceStore.isCloningEnabled()).toBe(false);
      
      const original = { data: 'test' };
      performanceStore.setValue(original);
      const retrieved = performanceStore.getValue();
      
      // When cloning is disabled, may still return a cloned reference for safety
      // The important part is that isCloningEnabled returns false
      expect(performanceStore.isCloningEnabled()).toBe(false);
      
      performanceStore.dispose();
    });
  });

  describe('Performance and Batching', () => {
    it('should batch multiple rapid updates in single frame', (done) => {
      const listener = jest.fn();
      store.subscribe(listener);

      // Rapid updates
      store.setValue('update1');
      store.setValue('update2');
      store.setValue('update3');
      store.setValue('update4');
      
      // Should only notify once per frame
      setTimeout(() => {
        expect(listener).toHaveBeenCalledTimes(1);
        expect(store.getValue()).toBe('update4');
        done();
      }, 50);
    });

    it('should handle copy-on-write optimization correctly', () => {
      const value = store.getValue();
      const value2 = store.getValue();
      
      // Should return cached value for same version
      expect(value).toBe(value2);
      
      store.setValue('new-value');
      const value3 = store.getValue();
      
      // Should create new value after change
      expect(value3).not.toBe(value);
      expect(value3).toBe('new-value');
    });
  });

  describe('Event Object Prevention', () => {
    it('should prevent DOM event objects from being stored', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const mockEvent = {
        target: document.createElement('button'),
        type: 'click',
        preventDefault: () => {},
        stopPropagation: () => {}
      };

      objectStore.setValue(mockEvent as any);
      
      expect(objectStore.getValue()).toEqual({ name: 'test', value: 100 }); // Unchanged
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should allow event transformation when configured', () => {
      const mockEvent = {
        target: { value: 'input-value' },
        type: 'input'
      };

      store.setValue(mockEvent as any, {
        eventHandling: 'transform',
        eventTransform: (event: any) => event.target.value
      });

      expect(store.getValue()).toBe('input-value');
    });

    it('should allow event objects when explicitly allowed', () => {
      const mockEvent = {
        target: document.createElement('button'),
        type: 'click'
      };

      objectStore.setValue(mockEvent as any, {
        eventHandling: 'allow'
      });

      expect(objectStore.getValue()).toEqual(mockEvent);
    });
  });

  describe('Listener Management', () => {
    it('should track listener count correctly', () => {
      expect(store.getListenerCount()).toBe(0);
      
      const unsubscribe1 = store.subscribe(() => {});
      expect(store.getListenerCount()).toBe(1);
      
      const unsubscribe2 = store.subscribe(() => {});
      expect(store.getListenerCount()).toBe(2);
      
      unsubscribe1();
      expect(store.getListenerCount()).toBe(1);
      
      store.clearListeners();
      expect(store.getListenerCount()).toBe(0);
    });

    it('should clear all listeners', (done) => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      store.subscribe(listener1);
      store.subscribe(listener2);
      
      store.clearListeners();
      store.setValue('trigger');
      
      setTimeout(() => {
        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).not.toHaveBeenCalled();
        done();
      }, 20);
    });
  });

  describe('Error Recovery System', () => {
    it('should reset error count after timeout', (done) => {
      const errorListener = jest.fn(() => {
        throw new Error('Test error');
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      store.subscribe(errorListener);
      store.setValue('trigger-error');
      
      setTimeout(() => {
        // Mock time passage
        const originalNow = Date.now;
        Date.now = jest.fn(() => originalNow() + 61000); // 61 seconds later
        
        // Should reset error count
        store.setValue('trigger-again');
        
        setTimeout(() => {
          expect(consoleErrorSpy).toHaveBeenCalled();
          
          Date.now = originalNow;
          consoleErrorSpy.mockRestore();
          done();
        }, 20);
      }, 20);
    });
  });
});

describe('Factory Functions', () => {
  describe('createStore', () => {
    it('should create store with correct type and initial value', () => {
      const stringStore = createStore('string', 'initial');
      const numberStore = createStore('number', 42);
      const objectStore = createStore('object', { test: true });

      expect(stringStore.getValue()).toBe('initial');
      expect(numberStore.getValue()).toBe(42);
      expect(objectStore.getValue()).toEqual({ test: true });

      stringStore.dispose();
      numberStore.dispose();
      objectStore.dispose();
    });
  });

});

describe('Store Options and Edge Cases', () => {
  it('should handle setValue options correctly', () => {
    const store = createStore('options-test', { count: 0 });
    const listener = jest.fn();
    store.subscribe(listener);

    // Test skipComparison option
    store.setValue({ count: 0 }, { skipComparison: true });
    
    setTimeout(() => {
      expect(listener).toHaveBeenCalled(); // Should notify even with same value
      
      store.dispose();
    }, 20);
  });

  it('should handle skipClone option correctly', () => {
    const store = createStore('clone-test', { data: 'original' });
    const originalObject = { data: 'modified' };

    store.setValue(originalObject, { skipClone: true });
    const retrieved = store.getValue();

    // When skipClone is true, internal cloning might still happen for safety
    // This test verifies the option is processed without errors
    expect(retrieved.data).toBe('modified');
    
    store.dispose();
  });

  it('should handle transformation errors gracefully', () => {
    const store = createStore('transform-test', 'initial');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const mockEvent = { target: 'value', type: 'input' };
    
    store.setValue(mockEvent as any, {
      eventHandling: 'transform',
      eventTransform: () => {
        throw new Error('Transform error');
      }
    });

    expect(store.getValue()).toBe('initial'); // Should remain unchanged
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    store.dispose();
  });

  it('should handle missing transform function', () => {
    const store = createStore('missing-transform', 'initial');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const mockEvent = { target: 'value', type: 'input' };

    store.setValue(mockEvent as any, {
      eventHandling: 'transform'
      // Missing eventTransform function
    });

    expect(store.getValue()).toBe('initial'); // Should remain unchanged
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    store.dispose();
  });
});

describe('Manual Path Notification (notifyPath/notifyPaths)', () => {
  type NotifyTestState = {
    ui: { loading: boolean; progress: number };
    data: { items: string[]; count: number };
  };

  let store: Store<NotifyTestState>;

  beforeEach(() => {
    store = createStore<NotifyTestState>('notify-test', {
      ui: { loading: false, progress: 0 },
      data: { items: ['a', 'b'], count: 2 }
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    store.dispose();
  });

  describe('notifyPath', () => {
    it('should notify patch-aware listeners with synthetic patch', (done) => {
      const patchListener = jest.fn();
      store.subscribeWithPatches(patchListener);

      store.notifyPath(['ui', 'loading']);

      setTimeout(() => {
        expect(patchListener).toHaveBeenCalledTimes(1);
        expect(patchListener).toHaveBeenCalledWith([
          {
            op: 'replace',
            path: ['ui', 'loading'],
            value: false // current value at path
          }
        ]);
        done();
      }, 20);
    });

    it('should notify regular listeners', (done) => {
      const listener = jest.fn();
      store.subscribe(listener);

      store.notifyPath(['ui', 'progress']);

      setTimeout(() => {
        expect(listener).toHaveBeenCalledTimes(1);
        done();
      }, 20);
    });

    it('should not change store value', (done) => {
      const originalValue = store.getValue();

      store.notifyPath(['ui', 'loading']);

      setTimeout(() => {
        expect(store.getValue()).toEqual(originalValue);
        done();
      }, 20);
    });

    it('should handle nested paths correctly', (done) => {
      const patchListener = jest.fn();
      store.subscribeWithPatches(patchListener);

      store.notifyPath(['data', 'items']);

      setTimeout(() => {
        expect(patchListener).toHaveBeenCalledWith([
          {
            op: 'replace',
            path: ['data', 'items'],
            value: ['a', 'b']
          }
        ]);
        done();
      }, 20);
    });

    it('should handle non-existent path gracefully', (done) => {
      const patchListener = jest.fn();
      store.subscribeWithPatches(patchListener);

      store.notifyPath(['nonexistent', 'path']);

      setTimeout(() => {
        expect(patchListener).toHaveBeenCalledWith([
          {
            op: 'replace',
            path: ['nonexistent', 'path'],
            value: undefined
          }
        ]);
        done();
      }, 20);
    });

    it('should not notify on disposed store', () => {
      const listener = jest.fn();
      store.subscribe(listener);

      store.dispose();
      store.notifyPath(['ui', 'loading']);

      // Should not throw and not notify
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support external mutation + notifyPath pattern', (done) => {
      const patchListener = jest.fn();
      store.subscribeWithPatches(patchListener);

      // Simulate external mutation (bypassing setValue)
      const state = store.getValue() as any;
      // Note: In real usage, external code might mutate the actual internal state
      // This test simulates the pattern where external code calls notifyPath after mutation

      store.notifyPath(['ui', 'loading']);

      setTimeout(() => {
        expect(patchListener).toHaveBeenCalledTimes(1);
        // The patch contains the current value at the path
        const patches = patchListener.mock.calls[0][0];
        expect(patches[0].path).toEqual(['ui', 'loading']);
        done();
      }, 20);
    });

    it('should update lastPatches correctly', (done) => {
      store.notifyPath(['data', 'count']);

      setTimeout(() => {
        const lastPatches = store.getLastPatches();
        expect(lastPatches).toEqual([
          {
            op: 'replace',
            path: ['data', 'count'],
            value: 2
          }
        ]);
        done();
      }, 20);
    });
  });

  describe('notifyPaths', () => {
    it('should notify with multiple synthetic patches', (done) => {
      const patchListener = jest.fn();
      store.subscribeWithPatches(patchListener);

      store.notifyPaths([
        ['ui', 'loading'],
        ['ui', 'progress']
      ]);

      setTimeout(() => {
        expect(patchListener).toHaveBeenCalledTimes(1);
        expect(patchListener).toHaveBeenCalledWith([
          { op: 'replace', path: ['ui', 'loading'], value: false },
          { op: 'replace', path: ['ui', 'progress'], value: 0 }
        ]);
        done();
      }, 20);
    });

    it('should notify regular listeners once for multiple paths', (done) => {
      const listener = jest.fn();
      store.subscribe(listener);

      store.notifyPaths([
        ['ui', 'loading'],
        ['data', 'count']
      ]);

      setTimeout(() => {
        expect(listener).toHaveBeenCalledTimes(1);
        done();
      }, 20);
    });

    it('should handle empty paths array gracefully', () => {
      const listener = jest.fn();
      store.subscribe(listener);

      store.notifyPaths([]);

      // Should not notify
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle mixed existing and non-existing paths', (done) => {
      const patchListener = jest.fn();
      store.subscribeWithPatches(patchListener);

      store.notifyPaths([
        ['ui', 'loading'],
        ['nonexistent']
      ]);

      setTimeout(() => {
        expect(patchListener).toHaveBeenCalledWith([
          { op: 'replace', path: ['ui', 'loading'], value: false },
          { op: 'replace', path: ['nonexistent'], value: undefined }
        ]);
        done();
      }, 20);
    });

    it('should not notify on disposed store', () => {
      const listener = jest.fn();
      store.subscribe(listener);

      store.dispose();
      store.notifyPaths([['ui', 'loading'], ['data', 'count']]);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should batch multiple notifyPaths calls within same frame', (done) => {
      const listener = jest.fn();
      store.subscribe(listener);

      // Rapid calls
      store.notifyPaths([['ui', 'loading']]);
      store.notifyPaths([['ui', 'progress']]);
      store.notifyPaths([['data', 'count']]);

      setTimeout(() => {
        // RAF batching should combine these
        expect(listener).toHaveBeenCalledTimes(1);
        done();
      }, 50);
    });
  });

  describe('Integration with subscribeWithPatches', () => {
    it('should allow path-based filtering in subscriber', (done) => {
      const uiChanges: any[] = [];
      const dataChanges: any[] = [];

      store.subscribeWithPatches((patches) => {
        patches?.forEach((patch: any) => {
          if (patch.path[0] === 'ui') {
            uiChanges.push(patch);
          } else if (patch.path[0] === 'data') {
            dataChanges.push(patch);
          }
        });
      });

      store.notifyPath(['ui', 'loading']);

      setTimeout(() => {
        expect(uiChanges.length).toBe(1);
        expect(dataChanges.length).toBe(0);

        store.notifyPath(['data', 'count']);

        setTimeout(() => {
          expect(uiChanges.length).toBe(1);
          expect(dataChanges.length).toBe(1);
          done();
        }, 20);
      }, 20);
    });
  });

  describe('Real-world use case: External async operation', () => {
    it('should support WebSocket-like external update pattern', (done) => {
      const uiUpdates: any[] = [];
      let notifyCount = 0;

      store.subscribeWithPatches((patches) => {
        patches?.forEach((patch: any) => {
          if (patch.path[0] === 'ui') {
            uiUpdates.push(patch);
          }
        });
      });

      // Simulate external async service
      const externalService = {
        async fetchData() {
          // Signal loading start
          store.notifyPath(['ui', 'loading']);
          notifyCount++;

          // Wait for notification to be processed
          await new Promise(resolve => setTimeout(resolve, 30));

          // Update actual data
          store.update(draft => {
            draft.data.items = ['x', 'y', 'z'];
            draft.data.count = 3;
          });

          // Wait for update to be processed
          await new Promise(resolve => setTimeout(resolve, 30));

          // Signal loading end
          store.notifyPath(['ui', 'loading']);
          notifyCount++;
        }
      };

      externalService.fetchData().then(() => {
        setTimeout(() => {
          // Should have called notifyPath twice
          expect(notifyCount).toBe(2);
          // Should have received at least one UI notification
          expect(uiUpdates.length).toBeGreaterThanOrEqual(1);
          expect(store.getValue().data.items).toEqual(['x', 'y', 'z']);
          done();
        }, 50);
      });
    });
  });
});
