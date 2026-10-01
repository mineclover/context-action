import { createStateStore, type StateBackend, type StateMutationMeta, type StatePatch } from '@context-action/store-core';
import { createBackendStore } from '../../../src/stores/core/BackendStore';

function createReferenceBackend<T>(name: string, initialValue: T) {
  let value = initialValue;
  let version = 0;
  let snapshot = { value, name, version, lastUpdate: Date.now() };
  let lastMeta: StateMutationMeta | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: T, meta?: StateMutationMeta) => {
    value = next;
    lastMeta = meta;
    version += 1;
    snapshot = { value, name, version, lastUpdate: Date.now() };
    [...listeners].forEach(listener => listener());
  };
  return {
    name,
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setValue: (next: T, meta?: StateMutationMeta) => publish(next, meta),
    update: (updater: (current: T) => T | undefined, meta?: StateMutationMeta) => {
      const next = updater(value);
      if (next !== undefined) publish(next, meta);
    },
    getLastMeta: () => lastMeta,
  };
}

describe('BackendStore', () => {
  it('preserves a custom backend patch type', () => {
    type CustomPatch = { readonly kind: 'custom'; readonly path: readonly string[] };
    const backend: StateBackend<number, CustomPatch> = {
      name: 'custom',
      getSnapshot: () => ({ name: 'custom', value: 0, version: 0, lastUpdate: 0 }),
      subscribe: () => () => {},
      setValue: () => {},
      update: () => {},
      getLastPatches: () => [{ kind: 'custom', path: ['value'] }],
    };
    const store = createBackendStore('custom', backend);
    store.subscribeWithPatches(patches => {
      const patch: CustomPatch | undefined = patches?.[0];
      void patch;
    });
    store.dispose();
  });

  it('binds a user-owned non-immutable backend without Mutative', () => {
    const backend = createReferenceBackend('reference', { count: 0 });
    const store = createBackendStore('reference', backend);
    const listener = jest.fn();
    store.subscribe(listener);

    store.setValue({ count: 1 });
    store.update(current => ({ count: current.count + 1 }));

    expect(store.getValue()).toEqual({ count: 2 });
    expect(store.getSnapshot().version).toBe(2);
    expect(listener).toHaveBeenCalledTimes(2);
    store.dispose();
  });

  it('maps only explicit metadata and preserves the backend snapshot identity', () => {
    const backend = createReferenceBackend('reference', { count: 0 });
    const store = createBackendStore('reference', backend);
    const initial = store.getSnapshot();

    store.setValue({ count: 1 }, { skipClone: true, meta: { label: 'explicit', requestId: 'r1' } });

    expect(backend.getLastMeta()).toEqual({ label: 'explicit', requestId: 'r1' });
    expect(store.getSnapshot()).not.toBe(initial);
    const current = store.getSnapshot();
    expect(store.getSnapshot()).toBe(current);
    store.dispose();
  });

  it('isolates listener failures and falls back to full invalidation without patches', () => {
    const backend = createReferenceBackend('reference', 0);
    const store = createBackendStore('reference', backend);
    const observed: unknown[] = [];
    store.subscribe(() => { throw new Error('listener failure'); });
    store.subscribe(() => observed.push(store.getValue()));
    const patches: Array<readonly StatePatch[] | null> = [];
    store.subscribeWithPatches(value => patches.push(value));

    store.setValue(1);

    expect(observed).toEqual([1]);
    expect(patches).toEqual([null]);
    store.dispose();
  });

  it('invalidates when a compatible backend reuses its snapshot object', () => {
    let value = 0;
    const snapshot = { name: 'reused', value, version: 0, lastUpdate: 0 };
    const listeners = new Set<() => void>();
    const backend: StateBackend<number> = {
      name: 'reused',
      getSnapshot: () => snapshot,
      subscribe: listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      setValue: next => {
        value = next;
        snapshot.value = value;
        snapshot.version += 1;
        snapshot.lastUpdate += 1;
        [...listeners].forEach(listener => listener());
      },
      update: updater => {
        const next = updater(value);
        if (next !== undefined) backend.setValue(next);
      },
    };

    const store = createBackendStore('reused', backend);
    const initial = store.getSnapshot();
    backend.setValue(1);

    expect(store.getSnapshot()).not.toBe(initial);
    expect(store.getSnapshot().value).toBe(1);
    expect(store.getSnapshot().version).toBe(1);
    store.dispose();
  });

  it('keeps cleanup and owned disposal resilient when backend teardown throws', () => {
    const listeners = new Set<() => void>();
    let disposed = false;
    const backend: StateBackend<number> = {
      name: 'teardown',
      getSnapshot: () => ({ name: 'teardown', value: 0, version: 0, lastUpdate: 0 }),
      subscribe: listener => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
          throw new Error('unsubscribe failed');
        };
      },
      subscribeWithPatches: () => () => {
        throw new Error('patch unsubscribe failed');
      },
      setValue: () => {},
      update: () => {},
      dispose: () => {
        disposed = true;
      },
    };

    const store = createBackendStore('teardown', backend, { ownership: 'owned' });

    expect(() => store.dispose()).not.toThrow();
    expect(disposed).toBe(true);
    expect(store.isStoreDisposed()).toBe(true);
    expect(listeners.size).toBe(0);
  });

  it('retains the last valid snapshot when a backend read fails during notification', () => {
    let failRead = false;
    const listeners = new Set<() => void>();
    const snapshot = { name: 'read-failure', value: 0, version: 0, lastUpdate: 0 };
    const backend: StateBackend<number> = {
      name: 'read-failure',
      getSnapshot: () => {
        if (failRead) throw new Error('snapshot unavailable');
        return snapshot;
      },
      subscribe: listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      setValue: () => {
        failRead = true;
        [...listeners].forEach(listener => listener());
      },
      update: () => {},
    };

    const store = createBackendStore('read-failure', backend);
    expect(() => backend.setValue(1)).not.toThrow();
    expect(store.getSnapshot().value).toBe(0);
    store.dispose();
  });

  it('respects shared and owned backend lifecycle', () => {
    const shared = createStateStore('shared', 0);
    const sharedStore = createBackendStore('shared', shared);
    sharedStore.dispose();
    expect(shared.isDisposed?.()).toBe(false);
    shared.dispose?.();

    const owned = createStateStore('owned', 0);
    const ownedStore = createBackendStore('owned', owned, { ownership: 'owned' });
    ownedStore.dispose();
    expect(owned.isDisposed?.()).toBe(true);
  });
});
