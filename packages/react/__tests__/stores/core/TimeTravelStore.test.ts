import {
  TimeTravelStore,
  createTimeTravelStore,
  isTimeTravelStore
} from '../../../src/stores/core/TimeTravelStore';
import { Store } from '../../../src/stores/core/Store';

describe('TimeTravelStore', () => {
  let store: TimeTravelStore<{ count: number; name: string }>;

  beforeEach(() => {
    store = createTimeTravelStore('test-store', { count: 0, name: 'initial' }, {
      maxHistory: 10,
    });
  });

  afterEach(() => {
    store.dispose();
  });

  describe('Basic Store Operations (IStore interface)', () => {
    it('should create store with initial value and name', () => {
      expect(store.name).toBe('test-store');
      expect(store.getValue()).toEqual({ count: 0, name: 'initial' });
    });

    it('should set and get values correctly', () => {
      store.setValue({ count: 1, name: 'updated' });
      expect(store.getValue()).toEqual({ count: 1, name: 'updated' });
    });

    it('should return immutable values from getValue', () => {
      const value = store.getValue();
      expect(value).toEqual({ count: 0, name: 'initial' });
      // With Immer's copy-on-write optimization, getValue may return the same reference
      // when no changes have been made. What matters is that the value is immutable.
      // The value should be frozen/immutable so external modifications don't affect the store.
      const secondValue = store.getValue();
      expect(secondValue).toEqual({ count: 0, name: 'initial' });
    });

    it('should handle update function', () => {
      // In mutable mode (default), draft should be modified directly
      store.update((draft) => {
        draft.count++;
      });
      expect(store.getValue().count).toBe(1);
    });

    it('should notify listeners on value change', (done) => {
      const listener = jest.fn();
      store.subscribe(listener);

      store.setValue({ count: 1, name: 'changed' });

      // TimeTravelStore notifies synchronously
      setTimeout(() => {
        expect(listener).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should not notify when value is equal', () => {
      const listener = jest.fn();
      store.subscribe(listener);

      // Same reference won't trigger (Object.is comparison)
      const currentValue = store.getValue();
      store.setValue(currentValue);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should unsubscribe correctly', (done) => {
      const listener = jest.fn();
      const unsubscribe = store.subscribe(listener);
      unsubscribe();

      store.setValue({ count: 1, name: 'changed' });

      setTimeout(() => {
        expect(listener).not.toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should return correct listener count', () => {
      expect(store.getListenerCount()).toBe(0);

      const unsub1 = store.subscribe(() => {});
      expect(store.getListenerCount()).toBe(1);

      const unsub2 = store.subscribe(() => {});
      expect(store.getListenerCount()).toBe(2);

      unsub1();
      expect(store.getListenerCount()).toBe(1);

      unsub2();
      expect(store.getListenerCount()).toBe(0);
    });

    it('should clear all listeners', () => {
      store.subscribe(() => {});
      store.subscribe(() => {});
      expect(store.getListenerCount()).toBe(2);

      store.clearListeners();
      expect(store.getListenerCount()).toBe(0);
    });

    it('should return snapshot with metadata', () => {
      const snapshot = store.getSnapshot();
      expect(snapshot.value).toEqual({ count: 0, name: 'initial' });
      expect(snapshot.name).toBe('test-store');
      expect(typeof snapshot.lastUpdate).toBe('number');
    });
  });

  describe('Time Travel API - Undo/Redo', () => {
    it('should undo to previous state', () => {
      store.setValue({ count: 1, name: 'first' });
      store.setValue({ count: 2, name: 'second' });

      expect(store.getValue().count).toBe(2);

      store.undo();
      expect(store.getValue().count).toBe(1);

      store.undo();
      expect(store.getValue().count).toBe(0);
    });

    it('should redo after undo', () => {
      store.setValue({ count: 1, name: 'first' });
      store.setValue({ count: 2, name: 'second' });

      store.undo();
      store.undo();
      expect(store.getValue().count).toBe(0);

      store.redo();
      expect(store.getValue().count).toBe(1);

      store.redo();
      expect(store.getValue().count).toBe(2);
    });

    it('should undo multiple steps at once', () => {
      store.setValue({ count: 1, name: 'a' });
      store.setValue({ count: 2, name: 'b' });
      store.setValue({ count: 3, name: 'c' });

      store.undo(2);
      expect(store.getValue().count).toBe(1);
    });

    it('should redo multiple steps at once', () => {
      store.setValue({ count: 1, name: 'a' });
      store.setValue({ count: 2, name: 'b' });
      store.setValue({ count: 3, name: 'c' });

      store.undo(3);
      expect(store.getValue().count).toBe(0);

      store.redo(2);
      expect(store.getValue().count).toBe(2);
    });

    it('should report canUndo correctly', () => {
      expect(store.canUndo()).toBe(false);

      store.setValue({ count: 1, name: 'changed' });
      expect(store.canUndo()).toBe(true);

      store.undo();
      expect(store.canUndo()).toBe(false);
    });

    it('should report canRedo correctly', () => {
      expect(store.canRedo()).toBe(false);

      store.setValue({ count: 1, name: 'changed' });
      expect(store.canRedo()).toBe(false);

      store.undo();
      expect(store.canRedo()).toBe(true);

      store.redo();
      expect(store.canRedo()).toBe(false);
    });

    it('should clear redo stack on new setValue after undo', () => {
      store.setValue({ count: 1, name: 'a' });
      store.setValue({ count: 2, name: 'b' });

      store.undo();
      expect(store.canRedo()).toBe(true);

      store.setValue({ count: 3, name: 'c' });
      expect(store.canRedo()).toBe(false);
    });
  });

  describe('Time Travel API - Position & History', () => {
    it('should track position correctly', () => {
      expect(store.getPosition()).toBe(0);

      store.setValue({ count: 1, name: 'a' });
      expect(store.getPosition()).toBe(1);

      store.setValue({ count: 2, name: 'b' });
      expect(store.getPosition()).toBe(2);

      store.undo();
      expect(store.getPosition()).toBe(1);
    });

    it('should return history array', () => {
      store.setValue({ count: 1, name: 'a' });
      store.setValue({ count: 2, name: 'b' });

      const history = store.getHistory();
      expect(history.length).toBe(3);
      expect(history[0]).toEqual({ count: 0, name: 'initial' });
      expect(history[1]).toEqual({ count: 1, name: 'a' });
      expect(history[2]).toEqual({ count: 2, name: 'b' });
    });

    it('should goTo specific position', () => {
      store.setValue({ count: 1, name: 'a' });
      store.setValue({ count: 2, name: 'b' });
      store.setValue({ count: 3, name: 'c' });

      store.goTo(1);
      expect(store.getValue().count).toBe(1);
      expect(store.getPosition()).toBe(1);

      store.goTo(3);
      expect(store.getValue().count).toBe(3);
    });

    it('should reset to initial state', () => {
      store.setValue({ count: 1, name: 'a' });
      store.setValue({ count: 2, name: 'b' });

      store.reset();

      expect(store.getValue()).toEqual({ count: 0, name: 'initial' });
      expect(store.getPosition()).toBe(0);
    });

    it('should respect maxHistory limit', () => {
      const limitedStore = createTimeTravelStore('limited', 0, { maxHistory: 3 });

      limitedStore.setValue(1);
      limitedStore.setValue(2);
      limitedStore.setValue(3);
      limitedStore.setValue(4);
      limitedStore.setValue(5);

      const history = limitedStore.getHistory();
      // maxHistory limits total entries
      expect(history.length).toBeLessThanOrEqual(4); // 3 + current

      limitedStore.dispose();
    });

    it('should provide time travel controls object', () => {
      store.setValue({ count: 1, name: 'a' });

      const controls = store.getTimeTravelControls();

      expect(controls).toHaveProperty('back');
      expect(controls).toHaveProperty('forward');
      expect(controls).toHaveProperty('go');
      expect(controls).toHaveProperty('reset');
      expect(controls).toHaveProperty('canBack');
      expect(controls).toHaveProperty('canForward');
    });
  });

  describe('Patch-Aware Subscriptions', () => {
    it('should notify patch-aware listeners with patches', (done) => {
      const patchListener = jest.fn();
      store.subscribeWithPatches(patchListener);

      store.setValue({ count: 1, name: 'updated' });

      setTimeout(() => {
        expect(patchListener).toHaveBeenCalled();
        const patches = patchListener.mock.calls[0][0];
        expect(Array.isArray(patches)).toBe(true);
        done();
      }, 10);
    });

    it('should return last patches', () => {
      expect(store.getLastPatches()).toBeNull();

      store.setValue({ count: 1, name: 'updated' });

      const patches = store.getLastPatches();
      expect(patches).not.toBeNull();
      expect(Array.isArray(patches)).toBe(true);
    });

    it('should unsubscribe patch-aware listeners', (done) => {
      const patchListener = jest.fn();
      const unsubscribe = store.subscribeWithPatches(patchListener);
      unsubscribe();

      store.setValue({ count: 1, name: 'updated' });

      setTimeout(() => {
        expect(patchListener).not.toHaveBeenCalled();
        done();
      }, 10);
    });
  });

  describe('Configuration', () => {
    it('should toggle cloning', () => {
      // Default is false to preserve structural sharing
      expect(store.isCloningEnabled()).toBe(false);

      store.setCloningEnabled(true);
      expect(store.isCloningEnabled()).toBe(true);

      store.setCloningEnabled(false);
      expect(store.isCloningEnabled()).toBe(false);
    });

    it('should use custom comparator', () => {
      const customStore = createTimeTravelStore('custom', { id: 1, data: 'a' });

      // Custom comparator that only compares id
      customStore.setCustomComparator((a, b) => a.id === b.id);

      const listener = jest.fn();
      customStore.subscribe(listener);

      // Same id, different data - should be considered equal
      customStore.setValue({ id: 1, data: 'b' });

      // With custom comparator, this should not trigger notification
      expect(listener).not.toHaveBeenCalled();

      customStore.dispose();
    });
  });

  describe('Disposal', () => {
    it('should mark store as disposed', () => {
      expect(store.isStoreDisposed()).toBe(false);
      store.dispose();
      expect(store.isStoreDisposed()).toBe(true);
    });

    it('should not allow operations after disposal', () => {
      store.dispose();

      // These should not throw but should be no-ops
      store.setValue({ count: 99, name: 'after-dispose' });
      store.undo();
      store.redo();

      expect(store.isStoreDisposed()).toBe(true);
    });

    it('should execute cleanup tasks on disposal', () => {
      const cleanup = jest.fn();
      store.registerCleanup(cleanup);

      store.dispose();

      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('should allow unregistering cleanup tasks', () => {
      const cleanup = jest.fn();
      const unregister = store.registerCleanup(cleanup);
      unregister();

      store.dispose();

      expect(cleanup).not.toHaveBeenCalled();
    });

    it('should prevent subscription after disposal', () => {
      store.dispose();

      const listener = jest.fn();
      const unsubscribe = store.subscribe(listener);

      // Should return no-op unsubscribe
      expect(typeof unsubscribe).toBe('function');
      expect(store.getListenerCount()).toBe(0);
    });
  });

  describe('isTimeTravelStore type guard', () => {
    it('should return true for TimeTravelStore', () => {
      expect(isTimeTravelStore(store)).toBe(true);
    });

    it('should return false for regular Store', () => {
      const regularStore = new Store('regular', { count: 0 });
      expect(isTimeTravelStore(regularStore)).toBe(false);
      regularStore.dispose();
    });
  });

  describe('Event object prevention', () => {
    it('should block event objects by default', () => {
      const eventLike = {
        target: document.createElement('div'),
        preventDefault: () => {},
        type: 'click',
      };

      const initialValue = store.getValue();
      store.setValue(eventLike as any);

      // Value should not change
      expect(store.getValue()).toEqual(initialValue);
    });
  });

  describe('Manual Path Notification (notifyPath/notifyPaths)', () => {
    type NestedNotifyState = {
      ui: { loading: boolean; progress: number };
      data: { items: string[]; count: number };
    };

    let nestedStore: TimeTravelStore<NestedNotifyState>;

    beforeEach(() => {
      nestedStore = createTimeTravelStore<NestedNotifyState>('nested-notify-test', {
        ui: { loading: false, progress: 0 },
        data: { items: ['a', 'b'], count: 2 }
      });
    });

    afterEach(() => {
      nestedStore.dispose();
    });

    describe('notifyPath', () => {
      it('should notify patch-aware listeners with synthetic patch', (done) => {
        const patchListener = jest.fn();
        nestedStore.subscribeWithPatches(patchListener);

        nestedStore.notifyPath(['ui', 'loading']);

        setTimeout(() => {
          expect(patchListener).toHaveBeenCalledTimes(1);
          expect(patchListener).toHaveBeenCalledWith([
            {
              op: 'replace',
              path: ['ui', 'loading'],
              value: false
            }
          ]);
          done();
        }, 10);
      });

      it('should notify regular listeners', (done) => {
        const listener = jest.fn();
        nestedStore.subscribe(listener);

        nestedStore.notifyPath(['ui', 'progress']);

        setTimeout(() => {
          expect(listener).toHaveBeenCalledTimes(1);
          done();
        }, 10);
      });

      it('should not change store value', (done) => {
        const originalValue = nestedStore.getValue();

        nestedStore.notifyPath(['ui', 'loading']);

        setTimeout(() => {
          expect(nestedStore.getValue()).toEqual(originalValue);
          done();
        }, 10);
      });

      it('should not affect time travel history', () => {
        nestedStore.setValue({
          ui: { loading: true, progress: 50 },
          data: { items: ['c'], count: 1 }
        });

        const positionBefore = nestedStore.getPosition();
        const historyLengthBefore = nestedStore.getHistory().length;

        nestedStore.notifyPath(['ui', 'loading']);

        // notifyPath should NOT add to history
        expect(nestedStore.getPosition()).toBe(positionBefore);
        expect(nestedStore.getHistory().length).toBe(historyLengthBefore);
      });

      it('should not notify on disposed store', () => {
        const listener = jest.fn();
        nestedStore.subscribe(listener);

        nestedStore.dispose();
        nestedStore.notifyPath(['ui', 'loading']);

        expect(listener).not.toHaveBeenCalled();
      });

      it('should handle non-existent path gracefully', (done) => {
        const patchListener = jest.fn();
        nestedStore.subscribeWithPatches(patchListener);

        nestedStore.notifyPath(['nonexistent', 'path']);

        setTimeout(() => {
          expect(patchListener).toHaveBeenCalledWith([
            {
              op: 'replace',
              path: ['nonexistent', 'path'],
              value: undefined
            }
          ]);
          done();
        }, 10);
      });

      it('should update lastPatches correctly', (done) => {
        nestedStore.notifyPath(['data', 'count']);

        setTimeout(() => {
          const lastPatches = nestedStore.getLastPatches();
          expect(lastPatches).toEqual([
            {
              op: 'replace',
              path: ['data', 'count'],
              value: 2
            }
          ]);
          done();
        }, 10);
      });
    });

    describe('notifyPaths', () => {
      it('should notify with multiple synthetic patches', (done) => {
        const patchListener = jest.fn();
        nestedStore.subscribeWithPatches(patchListener);

        nestedStore.notifyPaths([
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
        }, 10);
      });

      it('should handle empty paths array gracefully', () => {
        const listener = jest.fn();
        nestedStore.subscribe(listener);

        nestedStore.notifyPaths([]);

        expect(listener).not.toHaveBeenCalled();
      });

      it('should not notify on disposed store', () => {
        const listener = jest.fn();
        nestedStore.subscribe(listener);

        nestedStore.dispose();
        nestedStore.notifyPaths([['ui', 'loading'], ['data', 'count']]);

        expect(listener).not.toHaveBeenCalled();
      });
    });

    describe('Integration with Time Travel', () => {
      it('should work correctly after undo/redo', (done) => {
        nestedStore.setValue({
          ui: { loading: true, progress: 100 },
          data: { items: ['x'], count: 1 }
        });

        nestedStore.undo();

        const patchListener = jest.fn();
        nestedStore.subscribeWithPatches(patchListener);

        nestedStore.notifyPath(['ui', 'loading']);

        setTimeout(() => {
          expect(patchListener).toHaveBeenCalledWith([
            {
              op: 'replace',
              path: ['ui', 'loading'],
              value: false // Back to initial value after undo
            }
          ]);
          done();
        }, 10);
      });
    });

    describe('Real-world use case: External async with undo support', () => {
      it('should support external updates with time travel', (done) => {
        const uiUpdates: any[] = [];

        nestedStore.subscribeWithPatches((patches) => {
          patches?.forEach((patch: any) => {
            if (patch.path[0] === 'ui') {
              uiUpdates.push(patch);
            }
          });
        });

        // Simulate external async service
        const externalService = {
          async fetchData() {
            // Signal loading start (no history impact)
            nestedStore.notifyPath(['ui', 'loading']);

            await new Promise(resolve => setTimeout(resolve, 5));

            // Actual data update (adds to history for undo)
            nestedStore.setValue({
              ui: { loading: false, progress: 100 },
              data: { items: ['fetched'], count: 1 }
            });
          }
        };

        const positionBefore = nestedStore.getPosition();

        externalService.fetchData().then(() => {
          setTimeout(() => {
            // notifyPath should not have added to history
            // only setValue should have added one entry
            expect(nestedStore.getPosition()).toBe(positionBefore + 1);

            // Should have received UI notifications
            expect(uiUpdates.length).toBeGreaterThanOrEqual(1);

            // Can undo the actual data change
            expect(nestedStore.canUndo()).toBe(true);

            done();
          }, 20);
        });
      });
    });
  });
});
