import { describe, expect, it } from 'vitest';
import { StoreController } from '../src/store-controller.js';
import { MockReactiveControllerHost, createMockStore } from './helpers.js';
import type { ReadableStore } from '../src/types.js';

describe('StoreController', () => {
  describe('Host Registration & Initial Snapshot', () => {
    it('registers itself to host on instantiation', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore({ count: 10 });
      const controller = new StoreController(host, store);

      expect(host.controllers).toContain(controller);
    });

    it('reads initial value synchronously without requesting update', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore({ count: 10 });
      const controller = new StoreController(host, store);

      expect(controller.value).toEqual({ count: 10 });
      expect(host.requestUpdateCount).toBe(0);
    });

    it('applies projection selector on initial value', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore({ user: { name: 'Alice', age: 30 } });
      const controller = new StoreController(host, store, {
        selector: (state) => state.user.name,
      });

      expect(controller.value).toBe('Alice');
      expect(host.requestUpdateCount).toBe(0);
    });

    it('validates invalid host or store inputs', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore(1);

      expect(() => new StoreController(null as any, store)).toThrow(TypeError);
      expect(() => new StoreController(host, null as any)).toThrow(TypeError);
    });
  });

  describe('Reactivity & Update Propagation', () => {
    it('subscribes on hostConnected() and calls host.requestUpdate() on store changes', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore(0);
      const controller = new StoreController(host, store);

      host.connected();
      expect(store.listenerCount).toBe(1);
      expect(host.requestUpdateCount).toBe(0);

      store.setValue(1);
      expect(controller.value).toBe(1);
      expect(host.requestUpdateCount).toBe(1);

      store.setValue(2);
      expect(controller.value).toBe(2);
      expect(host.requestUpdateCount).toBe(2);
    });

    it('suppresses host.requestUpdate() if raw value is unchanged', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore(100);
      const controller = new StoreController(host, store);

      host.connected();
      store.setValue(100);

      expect(controller.value).toBe(100);
      expect(host.requestUpdateCount).toBe(0);
    });
  });

  describe('Selector Projections & Equality Suppression', () => {
    it('suppresses update when projected slice remains identical (Object.is)', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore({ count: 1, title: 'Item' });
      const controller = new StoreController(host, store, {
        selector: (state) => state.count,
      });

      host.connected();

      // Change unrelated property
      store.setValue({ count: 1, title: 'Item Renamed' });
      expect(controller.value).toBe(1);
      expect(host.requestUpdateCount).toBe(0); // Suppressed!

      // Change projected property
      store.setValue({ count: 2, title: 'Item Renamed' });
      expect(controller.value).toBe(2);
      expect(host.requestUpdateCount).toBe(1); // Triggered!
    });

    it('supports custom equalityFn for structural comparison', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore({ tags: ['a', 'b'] });

      // Custom array equality function
      const controller = new StoreController(host, store, {
        selector: (state) => state.tags,
        equalityFn: (prev, next) =>
          prev.length === next.length && prev.every((item, i) => item === next[i]),
      });

      host.connected();

      // New array instance with identical contents
      store.setValue({ tags: ['a', 'b'] });
      expect(host.requestUpdateCount).toBe(0); // Suppressed by custom equality!

      // New array with changed contents
      store.setValue({ tags: ['a', 'b', 'c'] });
      expect(host.requestUpdateCount).toBe(1);
      expect(controller.value).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Lifecycle & Zero Memory Leak Verification', () => {
    it('unsubscribes immediately on hostDisconnected() leaving 0 listeners', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore(42);
      new StoreController(host, store);

      host.connected();
      expect(store.listenerCount).toBe(1);

      host.disconnected();
      expect(store.listenerCount).toBe(0); // Zero memory leak guarantee!

      // Updates after disconnect must not trigger requestUpdate
      store.setValue(99);
      expect(host.requestUpdateCount).toBe(0);
    });

    it('resubscribes on hostConnected() and syncs changes occurred while disconnected', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore(1);
      const controller = new StoreController(host, store);

      host.connected();
      expect(controller.value).toBe(1);

      host.disconnected();
      expect(store.listenerCount).toBe(0);

      // Store changes while disconnected
      store.setValue(100);
      expect(controller.value).toBe(1); // Cached value untouched while disconnected
      expect(host.requestUpdateCount).toBe(0);

      // Reconnect
      host.connected();
      expect(store.listenerCount).toBe(1);
      expect(controller.value).toBe(100); // Synced on reconnect!
      expect(host.requestUpdateCount).toBe(1); // Notified host!
    });

    it('does not trigger requestUpdate on reconnect if store did not change', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore('constant');
      const controller = new StoreController(host, store);

      host.connected();
      host.disconnected();
      host.resetStats();

      host.connected();
      expect(controller.value).toBe('constant');
      expect(host.requestUpdateCount).toBe(0);
    });

    it('supports explicit manual unsubscribe()', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore(10);
      const controller = new StoreController(host, store);

      host.connected();
      expect(store.listenerCount).toBe(1);

      controller.unsubscribe();
      expect(store.listenerCount).toBe(0);

      store.setValue(20);
      expect(host.requestUpdateCount).toBe(0);
    });

    it('handles multiple connect/disconnect cycles cleanly', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore(0);
      const controller = new StoreController(host, store);

      for (let i = 1; i <= 5; i++) {
        host.connected();
        expect(store.listenerCount).toBe(1);
        store.setValue(i);
        expect(controller.value).toBe(i);

        host.disconnected();
        expect(store.listenerCount).toBe(0);
      }
    });

    it('defers subscription if host is an explicitly disconnected DOM element', () => {
      const disconnectedHost = Object.assign(new MockReactiveControllerHost(), {
        isConnected: false,
      });
      const store = createMockStore(50);
      const controller = new StoreController(disconnectedHost, store);

      expect(store.listenerCount).toBe(0);
      expect(controller.isSubscribed).toBe(false);

      disconnectedHost.connected();
      expect(store.listenerCount).toBe(1);
      expect(controller.isSubscribed).toBe(true);
    });

    it('supports dispose() unregistering controller from host and unsubscribing', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore(100);
      const controller = new StoreController(host, store);

      expect(host.controllers).toContain(controller);
      expect(store.listenerCount).toBe(1);

      controller.dispose();
      expect(host.controllers).not.toContain(controller);
      expect(store.listenerCount).toBe(0);
    });

    it('supports stores with getSnapshot()', () => {
      const listeners = new Set<() => void>();
      let val = 'snapshot-val';
      const snapshotStore: ReadableStore<string> = {
        getValue: undefined as any,
        getSnapshot() {
          return { value: val };
        },
        subscribe(l) {
          listeners.add(l);
          return () => listeners.delete(l);
        },
      };

      const host = new MockReactiveControllerHost();
      const controller = new StoreController(host, snapshotStore);

      expect(controller.value).toBe('snapshot-val');
      val = 'updated-snapshot';
      for (const l of listeners) l();
      expect(controller.value).toBe('updated-snapshot');
      expect(host.requestUpdateCount).toBe(1);
    });
  });
});
