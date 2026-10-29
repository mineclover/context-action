import { act, renderHook } from '@testing-library/react';
import {
  useStorePath,
  useStoreSelectorWithPaths,
  type PatchAwareStore,
  type StorePathPatch,
} from '@context-action/react';
import { createBackendStore, type StateBackend } from '@context-action/react/backend';

/** Immutable fixture: no draft engine or engine-specific patch conversion. */
function createPortableBackend<T>(initialValue: T) {
  const name = 'portable';
  let snapshot = { name, value: initialValue, version: 0, lastUpdate: 0 };
  const listeners = new Set<() => void>();
  const patchListeners = new Set<(patches: readonly StorePathPatch[] | null) => void>();
  const publish = (value: T, patches: readonly StorePathPatch[] | null) => {
    snapshot = { name, value, version: snapshot.version + 1, lastUpdate: snapshot.lastUpdate + 1 };
    for (const listener of listeners) listener();
    for (const listener of patchListeners) listener(patches);
  };
  const backend: StateBackend<T, StorePathPatch> = {
    name,
    getSnapshot: () => snapshot,
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    subscribeWithPatches: listener => { patchListeners.add(listener); return () => { patchListeners.delete(listener); }; },
    setValue: value => publish(value, null),
    update: updater => {
      const value = updater(snapshot.value);
      if (value !== undefined) publish(value, null);
    },
  };
  return { backend, publish, listenerCount: () => listeners.size + patchListeners.size };
}

describe('public path hooks with portable backends', () => {
  it('accepts readonly patch arrays and const dependency paths without a conversion wrapper', async () => {
    const fixture = createPortableBackend({ count: 0, label: 'initial' });
    const store = createBackendStore('portable', fixture.backend);
    const countPath = ['count'] as const;
    const dependencies = [countPath] as const;
    type State = ReturnType<typeof store.getValue>;
    let renders = 0;
    const { result, unmount } = renderHook(() => {
      renders += 1;
      return {
        count: useStorePath<State, number>(store, countPath),
        selected: useStoreSelectorWithPaths(store, state => state.count, { dependsOn: dependencies }),
      };
    });
    try {
      const before = renders;
      await act(async () => {
        fixture.publish({ count: 0, label: 'other' }, Object.freeze([
          Object.freeze({ op: 'replace', path: Object.freeze(['label']) }),
        ]));
      });
      expect(renders).toBe(before);
      await act(async () => {
        fixture.publish({ count: 1, label: 'other' }, [{ op: 'replace', path: '/count' }]);
      });
      expect(result.current).toEqual({ count: 1, selected: 1 });
    } finally { unmount(); store.dispose(); }
    expect(fixture.listenerCount()).toBe(0);
  });

  it('observes both sides of a cross-array move and copy destination shifts', async () => {
    const fixture = createPortableBackend({ source: ['a', 'b', 'c'], dest: ['x', 'y'] });
    const store = createBackendStore('moves', fixture.backend);
    type State = ReturnType<typeof store.getValue>;
    const { result, unmount } = renderHook(() => ({
      source: useStorePath<State, string | undefined>(store, ['source', 1]),
      dest: useStoreSelectorWithPaths(store, state => state.dest[1], { dependsOn: [['dest', 1]] }),
    }));
    try {
      await act(async () => {
        fixture.publish({ source: ['b', 'c'], dest: ['a', 'x', 'y'] }, [
          { op: 'move', from: '/source/0', path: '/dest/0' },
        ]);
      });
      expect(result.current).toEqual({ source: 'c', dest: 'x' });
      await act(async () => {
        fixture.publish({ source: ['b', 'c'], dest: ['b', 'a', 'x', 'y'] }, [
          { op: 'copy', from: '/source/0', path: '/dest/0' },
        ]);
      });
      expect(result.current).toEqual({ source: 'c', dest: 'a' });
    } finally { unmount(); store.dispose(); }
  });

  it('decodes pointer escapes and treats unrecognized paths as full invalidation', async () => {
    const fixture = createPortableBackend({ 'a/b': { '~key': 0 } });
    const store = createBackendStore('escaped', fixture.backend);
    type State = ReturnType<typeof store.getValue>;
    const { result, unmount } = renderHook(() => useStorePath<State, number>(store, ['a/b', '~key']));
    try {
      await act(async () => {
        fixture.publish({ 'a/b': { '~key': 1 } }, [{ op: 'replace', path: '/a~1b/~0key' }]);
      });
      expect(result.current).toBe(1);
      await act(async () => {
        fixture.publish({ 'a/b': { '~key': 2 } }, [{ op: 'replace', path: 'engine-specific:opaque' }]);
      });
      expect(result.current).toBe(2);
    } finally { unmount(); store.dispose(); }
  });

  it.each([null, undefined])('preserves an intentional %s snapshot value instead of reading a fallback', value => {
    const getValue = jest.fn(() => 'stale fallback');
    const store: PatchAwareStore<string | null | undefined> = {
      getSnapshot: () => ({ name: 'nullable', value, version: 0, lastUpdate: 0 }),
      getValue,
      subscribe: () => () => {},
      subscribeWithPatches: () => () => {},
    };
    const { result, unmount } = renderHook(() => ({
      path: useStorePath(store, []),
      selected: useStoreSelectorWithPaths(store, current => current),
    }));
    try {
      expect(result.current.path).toBe(value);
      expect(result.current.selected).toBe(value);
      expect(getValue).not.toHaveBeenCalled();
    } finally { unmount(); }
  });
});
