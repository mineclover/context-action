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

  it('rejects invalid runtime subscribers at the adapter boundary', () => {
    const backend = createReferenceBackend('subscriber-validation', 0);
    const store = createBackendStore('subscriber-validation', backend);

    expect(() => store.subscribe(null as never)).toThrow(TypeError);
    expect(() => store.subscribeWithPatches(null as never)).toThrow(TypeError);

    store.dispose();
  });

  it('treats a malformed optional patch hook as an absent capability', () => {
    const backend = {
      ...createReferenceBackend('malformed-patch-hook', 0),
      subscribeWithPatches: 'not-a-function',
    } as unknown as StateBackend<number>;

    expect(() => {
      const store = createBackendStore('malformed-patch-hook', backend);
      store.dispose();
    }).not.toThrow();
  });

  it('preserves the backend receiver when registering a patch channel', async () => {
    type Patch = { readonly path: readonly string[] };
    const patchListeners = new Set<(patches: readonly Patch[] | null) => void>();
    const base = createReferenceBackend('bound-patch-hook', 0);
    const backend = {
      ...base,
      patchListeners,
      subscribeWithPatches(this: { patchListeners: typeof patchListeners }, listener: (patches: readonly Patch[] | null) => void) {
        this.patchListeners.add(listener);
        return () => this.patchListeners.delete(listener);
      },
      emitPatch(patches: readonly Patch[] | null) {
        for (const listener of [...this.patchListeners]) listener(patches);
      },
    };
    const store = createBackendStore('bound-patch-hook', backend);
    const observed: Array<readonly Patch[] | null> = [];
    store.subscribeWithPatches(patches => observed.push(patches));
    const patch = [{ path: ['value'] }] as const;

    backend.emitPatch(patch);
    await Promise.resolve();

    expect(observed).toEqual([patch]);
    store.dispose();
  });

  it('rolls back a patch subscription when regular subscription setup fails', () => {
    const patchListeners = new Set<(patches: readonly StatePatch[] | null) => void>();
    const patchUnsubscribe = jest.fn(() => patchListeners.clear());
    const backend: StateBackend<number> = {
      name: 'registration-rollback',
      getSnapshot: () => ({ name: 'registration-rollback', value: 0, version: 0, lastUpdate: 0 }),
      subscribe: () => {
        throw new Error('regular subscription failed');
      },
      subscribeWithPatches: listener => {
        patchListeners.add(listener);
        return patchUnsubscribe;
      },
      setValue: () => {},
      update: () => {},
    };

    expect(() => createBackendStore('registration-rollback', backend)).toThrow(
      'regular subscription failed',
    );
    expect(patchUnsubscribe).toHaveBeenCalledTimes(1);
    expect(patchListeners.size).toBe(0);
  });

  it('pairs regular-first and patch-first backend notifications', async () => {
    type Patch = { readonly path: readonly string[] };
    const snapshot = { name: 'ordered', value: 0, version: 0, lastUpdate: 0 };
    const listeners = new Set<() => void>();
    const patchListeners = new Set<(patches: readonly Patch[] | null) => void>();
    const backend: StateBackend<number, Patch> & {
      publish: (value: number, patches: readonly Patch[] | null, order: 'regular-first' | 'patch-first') => void;
    } = {
      name: 'ordered',
      getSnapshot: () => snapshot,
      subscribe: listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      subscribeWithPatches: listener => {
        patchListeners.add(listener);
        return () => patchListeners.delete(listener);
      },
      setValue: value => backend.publish(value, [{ path: ['value'] }], 'regular-first'),
      update: updater => backend.setValue(updater(snapshot.value) ?? snapshot.value),
      publish: (value, patches, order) => {
        snapshot.value = value;
        snapshot.version += 1;
        snapshot.lastUpdate += 1;
        const notifyPatches = () => [...patchListeners].forEach(listener => listener(patches));
        const notifyRegular = () => [...listeners].forEach(listener => listener());
        if (order === 'regular-first') {
          notifyRegular();
          notifyPatches();
        } else {
          notifyPatches();
          notifyRegular();
        }
      },
    };

    const store = createBackendStore('ordered', backend);
    const observed: Array<readonly Patch[] | null> = [];
    store.subscribeWithPatches(patches => observed.push(patches));
    const patch = [{ path: ['value'] }] as const;

    backend.publish(1, patch, 'regular-first');
    await Promise.resolve();
    backend.publish(2, patch, 'patch-first');

    expect(observed).toEqual([patch, patch]);
    store.dispose();
  });

  it('delivers patch-only notifications without attaching them to a future transition', async () => {
    type Patch = { readonly path: readonly string[] };
    const snapshot = { name: 'patch-only', value: 0, version: 0, lastUpdate: 0 };
    const patchListeners = new Set<(patches: readonly Patch[] | null) => void>();
    const backend: StateBackend<number, Patch> = {
      name: 'patch-only',
      getSnapshot: () => snapshot,
      subscribe: () => () => {},
      subscribeWithPatches: listener => {
        patchListeners.add(listener);
        return () => patchListeners.delete(listener);
      },
      setValue: () => {},
      update: () => {},
    };
    const store = createBackendStore('patch-only', backend);
    const observed: Array<readonly Patch[] | null> = [];
    store.subscribeWithPatches(patches => observed.push(patches));
    const patch = [{ path: ['value'] }] as const;

    [...patchListeners].forEach(listener => listener(patch));
    expect(observed).toEqual([]);
    await Promise.resolve();
    expect(observed).toEqual([patch]);

    store.dispose();
  });

  it('keeps nested regular-first patch events attached to the innermost transition', async () => {
    type Patch = { readonly id: 'outer' | 'nested' };
    const snapshot = { name: 'reentrant', value: 0, version: 0, lastUpdate: 0 };
    const listeners = new Set<() => void>();
    const patchListeners = new Set<(patches: readonly Patch[] | null) => void>();
    const backend: StateBackend<number, Patch> & {
      publish: (value: number, patches: readonly Patch[]) => void;
    } = {
      name: 'reentrant',
      getSnapshot: () => snapshot,
      subscribe: listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      subscribeWithPatches: listener => {
        patchListeners.add(listener);
        return () => patchListeners.delete(listener);
      },
      setValue: value => backend.publish(value, [{ id: 'outer' }]),
      update: updater => backend.setValue(updater(snapshot.value) ?? snapshot.value),
      publish: (value, patches) => {
        snapshot.value = value;
        snapshot.version += 1;
        snapshot.lastUpdate += 1;
        [...listeners].forEach(listener => listener());
        [...patchListeners].forEach(listener => listener(patches));
      },
    };

    const store = createBackendStore('reentrant', backend);
    const observed: Array<readonly Patch[] | null> = [];
    let nested = false;
    store.subscribeWithPatches(patches => observed.push(patches));
    store.subscribe(() => {
      if (!nested && store.getValue() === 1) {
        nested = true;
        backend.publish(2, [{ id: 'nested' }]);
      }
    });

    backend.publish(1, [{ id: 'outer' }]);
    await Promise.resolve();

    // Delivery remains transition ordered even though the nested patch
    // callback arrives before the outer regular-first callback's patch.
    expect(observed).toEqual([[{ id: 'outer' }], [{ id: 'nested' }]]);
    store.dispose();
  });

  it('delivers explicit null and patchless updates without reusing stale patches', async () => {
    const snapshot = { name: 'null-patches', value: 0, version: 0, lastUpdate: 0 };
    const listeners = new Set<() => void>();
    const patchListeners = new Set<(patches: readonly StatePatch[] | null) => void>();
    const backend: StateBackend<number> & {
      publish: (value: number, patches?: readonly StatePatch[] | null) => void;
    } = {
      name: 'null-patches',
      getSnapshot: () => snapshot,
      subscribe: listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      subscribeWithPatches: listener => {
        patchListeners.add(listener);
        return () => patchListeners.delete(listener);
      },
      setValue: value => backend.publish(value),
      update: updater => backend.setValue(updater(snapshot.value) ?? snapshot.value),
      publish: (value, patches = undefined) => {
        snapshot.value = value;
        snapshot.version += 1;
        snapshot.lastUpdate += 1;
        if (patches !== undefined) {
          [...patchListeners].forEach(listener => listener(patches));
        }
        [...listeners].forEach(listener => listener());
      },
    };

    const store = createBackendStore('null-patches', backend);
    const observed: Array<readonly StatePatch[] | null> = [];
    store.subscribeWithPatches(patches => observed.push(patches));
    const patch = [{ op: 'replace', path: ['value'], value: 1 }] as const;

    backend.publish(1, patch);
    backend.publish(2, null);
    backend.publish(3);
    await Promise.resolve();

    expect(observed).toEqual([patch, null, null]);
    expect(store.getLastPatches()).toBeNull();
    store.dispose();
  });

  it('preserves null returned by a backend safe-read hook', () => {
    const backend = createReferenceBackend('safe-null', { value: 1 }) as StateBackend<{ value: number }>;
    backend.getSafeValue = () => null as unknown as { value: number };
    const store = createBackendStore('safe-null', backend);

    expect(store.getSafeValue()).toBeNull();
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

  it('uses a getLastPatches-only backend once without replaying stale patches', () => {
    const patch = [{ op: 'replace', path: ['value'], value: 1 }] as const;
    let value = 0;
    let version = 0;
    const listeners = new Set<() => void>();
    const backend: StateBackend<number> = {
      name: 'fallback-patches',
      getSnapshot: () => ({ name: 'fallback-patches', value, version, lastUpdate: version }),
      subscribe: listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getLastPatches: () => patch,
      setValue: next => {
        value = next;
        version += 1;
        [...listeners].forEach(listener => listener());
      },
      update: updater => backend.setValue(updater(value) ?? value),
    };

    const store = createBackendStore('fallback-patches', backend);
    const observed: Array<readonly StatePatch[] | null> = [];
    store.subscribeWithPatches(patches => observed.push(patches));
    store.setValue(1);
    store.setValue(2);

    expect(observed).toEqual([patch, null]);
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
