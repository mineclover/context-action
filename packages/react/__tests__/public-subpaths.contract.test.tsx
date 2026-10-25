import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { createStore, useStoreValue } from '@context-action/react';
import { StoreRegistry, useComputedStore, useLocalStore } from '@context-action/react/advanced';
import { createBackendStore, type StateBackend } from '@context-action/react/backend';
import { compareValues, composeProviders, deepClone, produce, safeGet, safeSet } from '@context-action/react/utils';

describe('Public basic subpath functional contracts', () => {
  it('connects a user-owned backend to a reactive Store without disposing that backend', async () => {
    let snapshot = { name: 'backend', value: 0, version: 0, lastUpdate: 0 };
    const listeners = new Set<() => void>();
    const dispose = jest.fn();
    const backend: StateBackend<number> = {
      name: 'backend',
      getSnapshot: () => snapshot,
      subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
      setValue: value => {
        snapshot = { ...snapshot, value, version: snapshot.version + 1 };
        for (const notify of [...listeners]) notify();
      },
      update: updater => {
        const next = updater(snapshot.value);
        if (next !== undefined) backend.setValue(next);
      },
      dispose,
    };
    const store = createBackendStore('public-backend', backend);
    const { result, unmount } = renderHook(() => useStoreValue(store));
    try {
      expect(result.current).toBe(0);
      await act(async () => { store.setValue(1); });
      expect(result.current).toBe(1);
      await act(async () => { store.update(value => value + 1); });
      expect(result.current).toBe(2);
    } finally {
      unmount();
      store.dispose();
      expect(listeners.size).toBe(0);
      expect(dispose).not.toHaveBeenCalled();
    }
  });

  it('computes derived values and exposes local Store updates through the advanced entry', async () => {
    const source = createStore('derived', 2);
    const registry = new StoreRegistry('public-registry');
    registry.register('source', source);
    const { result, unmount } = renderHook(() => ({
      computed: useComputedStore(source, value => value * 2),
      local: useLocalStore(1, 'local'),
    }));
    try {
      expect(registry.getStore('source')).toBe(source);
      expect(result.current.computed).toBe(4);
      expect(result.current.local.value).toBe(1);
      await act(async () => {
        source.setValue(3);
        result.current.local.store.setValue(5);
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      });
      expect(result.current.computed).toBe(6);
      expect(result.current.local.value).toBe(5);
    } finally {
      unmount();
      source.dispose();
    }
  });

  it('clones, reads, writes and compares immutable values through the utils entry', () => {
    const original = { nested: { count: 1 } };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned.nested).not.toBe(original.nested);
    const changed = produce(original, draft => { draft.nested.count = 2; });
    expect(original.nested.count).toBe(1);
    expect(changed.nested.count).toBe(2);
    const read = safeGet(changed, true);
    expect(read).toEqual(changed);
    expect(read).not.toBe(changed);
    expect(safeSet(changed)).toEqual(changed);
    expect(compareValues(original, cloned, { strategy: 'deep' })).toBe(true);
    expect(compareValues(original, changed, { strategy: 'deep' })).toBe(false);
  });

  it('composes Provider contexts in declared order through the utils entry', () => {
    const Outer = React.createContext('missing');
    const Inner = React.createContext('missing');
    const wrapper = composeProviders(
      ({ children }) => <Outer.Provider value="outer">{children}</Outer.Provider>,
      ({ children }) => <Inner.Provider value={`${React.useContext(Outer)}:inner`}>{children}</Inner.Provider>,
    );
    const { result, unmount } = renderHook(() => React.useContext(Inner), { wrapper });
    try { expect(result.current).toBe('outer:inner'); }
    finally { unmount(); }
  });
});
