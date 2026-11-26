import {
  createStateStore,
  type StateBackend,
  type StatePatch,
} from '@context-action/store-core';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import { createBackendStore } from '../../../src/stores/core/BackendStore';
import { createStore } from '../../../src/stores/core/Store';
import { createTimeTravelStore } from '../../../src/stores/core/TimeTravelStore';
import { useControlledStoreSync } from '../../../src/stores/hooks/useControlledStoreSync';
import { useStorePath } from '../../../src/stores/hooks/useStorePath';
import { useTimeTravelPath } from '../../../src/stores/hooks/useTimeTravelPath';
import { PathSubscriptionIndex } from '../../../src/stores/utils/path-subscription-index';

interface GridScaleState {
  selectedById: Record<string, boolean | undefined>;
  cells: Record<string, number>;
  items: string[];
}

describe('PathSubscriptionIndex, O(depth) subscribePaths, and atomic onSync contract', () => {
  it('routes add, remove, and replace across 500 path subscribers waking ONLY 1 target subscriber (not O(N))', () => {
    const store = createStore<GridScaleState>('PathTrie500', {
      selectedById: {},
      cells: { 'row-1': 10, 'row-2': 20 },
      items: ['a', 'b', 'c'],
    });

    const listenerHits = new Map<string, number>();
    const unsubs: Array<() => void> = [];

    for (let i = 1; i <= 500; i += 1) {
      const id = `row-${i}`;
      unsubs.push(
        store.subscribePaths([['selectedById', id], ['cells', id]], () => {
          listenerHits.set(id, (listenerHits.get(id) ?? 0) + 1);
        }),
      );
    }

    expect(store.getListenerCount()).toBe(500);

    // 1. Add key 'row-2' in selectedById -> ONLY 1 of 500 listeners fires
    store.update(draft => {
      draft.selectedById['row-2'] = true;
    });
    expect([...listenerHits.values()].reduce((acc, n) => acc + n, 0)).toBe(1);
    expect(listenerHits.get('row-2')).toBe(1);
    expect(listenerHits.get('row-1')).toBeUndefined();

    // 2. Replace key 'row-2' in cells -> ONLY 1 more wakeup on 'row-2'
    store.update(draft => {
      draft.cells['row-2'] = 42;
    });
    expect([...listenerHits.values()].reduce((acc, n) => acc + n, 0)).toBe(2);
    expect(listenerHits.get('row-2')).toBe(2);

    // 3. Delete key 'row-2' from selectedById -> ONLY 1 more wakeup on 'row-2'
    store.update(draft => {
      delete draft.selectedById['row-2'];
    });
    expect([...listenerHits.values()].reduce((acc, n) => acc + n, 0)).toBe(3);
    expect(listenerHits.get('row-2')).toBe(3);

    // 4. Unsubscribe cleans up all 500 listeners cleanly
    for (const unsub of unsubs) unsub();
    expect(store.getListenerCount()).toBe(0);
    store.dispose();
  });

  it('generates and routes patches via Store.setValue even when no patchAwareListeners exist, and renders only 1 of 500 React leafs', async () => {
    const store = createStore<{ rows: Record<string, number> }>('SetValue500React', {
      rows: Object.fromEntries(
        Array.from({ length: 500 }, (_, i) => [`row-${i + 1}`, i + 1]),
      ),
    });

    const renderCounts = new Map<string, number>();

    const CellLeaf = React.memo(function CellLeaf({ id }: { id: string }) {
      renderCounts.set(id, (renderCounts.get(id) ?? 0) + 1);
      const val = useStorePath(store, ['rows', id]);
      return <span data-testid={`cell-${id}`}>{String(val)}</span>;
    });

    const ids = Array.from({ length: 500 }, (_, i) => `row-${i + 1}`);
    const view = render(
      <div>
        {ids.map(id => (
          <CellLeaf key={id} id={id} />
        ))}
      </div>,
    );

    expect(renderCounts.size).toBe(500);
    expect(store.getListenerCount()).toBe(500);

    const prevRow1 = renderCounts.get('row-1') ?? 0;
    const prevRow2 = renderCounts.get('row-2') ?? 0;
    const prevRow500 = renderCounts.get('row-500') ?? 0;

    // Replace root value via setValue() directly (no subscribeWithPatches registered)
    act(() => {
      const current = store.getValue();
      store.setValue({
        rows: {
          ...current.rows,
          'row-2': 9999,
        },
      });
    });

    await waitFor(() => {
      expect(view.getByTestId('cell-row-2').textContent).toBe('9999');
    });

    expect((renderCounts.get('row-2') ?? 0) - prevRow2).toBe(1);
    expect((renderCounts.get('row-1') ?? 0) - prevRow1).toBe(0);
    expect((renderCounts.get('row-500') ?? 0) - prevRow500).toBe(0);

    view.unmount();
    expect(store.getListenerCount()).toBe(0);
    store.dispose();
  });

  it('supports TimeTravelStore.subscribePaths (including undo/redo + PathValue inference) and BackendStore.subscribePaths', async () => {
    const ttStore = createTimeTravelStore('TTPathTrie', {
      user: { name: 'Alice', score: 10 },
      other: { count: 1 },
    });

    let ttOtherHits = 0;
    const unsubOther = ttStore.subscribePaths([['other', 'count']], () => {
      ttOtherHits += 1;
    });

    function NameView() {
      const name: string = useTimeTravelPath(ttStore, ['user', 'name']);
      return <span data-testid="tt-name">{name}</span>;
    }

    const view = render(<NameView />);
    expect(view.getByTestId('tt-name').textContent).toBe('Alice');
    expect(ttStore.getListenerCount()).toBe(2);

    act(() => {
      ttStore.update(draft => {
        draft.user.name = 'Bob';
      });
    });

    await waitFor(() => {
      expect(view.getByTestId('tt-name').textContent).toBe('Bob');
    });
    expect(ttOtherHits).toBe(0);

    act(() => {
      ttStore.undo();
    });

    await waitFor(() => {
      expect(view.getByTestId('tt-name').textContent).toBe('Alice');
    });
    expect(ttOtherHits).toBe(0);

    act(() => {
      ttStore.redo();
    });

    await waitFor(() => {
      expect(view.getByTestId('tt-name').textContent).toBe('Bob');
    });
    expect(ttOtherHits).toBe(0);

    unsubOther();
    view.unmount();
    expect(ttStore.getListenerCount()).toBe(0);
    ttStore.dispose();

    // BackendStore subscribePaths (patch-emitting backend)
    interface BackendPairState {
      a: { x: number };
      b: { y: number };
    }
    let backendValue: BackendPairState = { a: { x: 1 }, b: { y: 2 } };
    let backendVersion = 0;
    let backendSnapshot = {
      name: 'BackendTrieSource',
      value: backendValue,
      version: backendVersion,
      lastUpdate: Date.now(),
    };
    const backendListeners = new Set<() => void>();
    const backendPatchListeners = new Set<
      (patches: readonly StatePatch[] | null) => void
    >();

    const patchBackend: StateBackend<BackendPairState, StatePatch> = {
      name: 'BackendTrieSource',
      getSnapshot: () => backendSnapshot,
      subscribe: listener => {
        backendListeners.add(listener);
        return () => backendListeners.delete(listener);
      },
      subscribeWithPatches: listener => {
        backendPatchListeners.add(listener);
        return () => backendPatchListeners.delete(listener);
      },
      setValue: next => {
        backendValue = next;
        backendVersion += 1;
        backendSnapshot = {
          name: 'BackendTrieSource',
          value: backendValue,
          version: backendVersion,
          lastUpdate: Date.now(),
        };
        for (const l of backendPatchListeners) l(null);
        for (const l of backendListeners) l();
      },
      update: updater => {
        const draft: BackendPairState = {
          a: { ...backendValue.a },
          b: { ...backendValue.b },
        };
        const result = updater(draft);
        const next = result !== undefined ? result : draft;
        const patches: StatePatch[] = [];
        if (next.a.x !== backendValue.a.x) {
          patches.push({ op: 'replace', path: ['a', 'x'], value: next.a.x });
        }
        if (next.b.y !== backendValue.b.y) {
          patches.push({ op: 'replace', path: ['b', 'y'], value: next.b.y });
        }
        backendValue = next;
        backendVersion += 1;
        backendSnapshot = {
          name: 'BackendTrieSource',
          value: backendValue,
          version: backendVersion,
          lastUpdate: Date.now(),
        };
        for (const l of backendPatchListeners) l(patches);
        for (const l of backendListeners) l();
      },
    };

    const bStore = createBackendStore('BackendTrie', patchBackend);
    let aHits = 0;
    let bHits = 0;
    const uA = bStore.subscribePaths([['a', 'x']], () => {
      aHits += 1;
    });
    const uB = bStore.subscribePaths([['b', 'y']], () => {
      bHits += 1;
    });
    expect(bStore.getListenerCount()).toBe(2);

    bStore.update(draft => {
      draft.a.x = 2;
    });
    expect(aHits).toBe(1);
    expect(bHits).toBe(0);

    uA();
    uB();
    expect(bStore.getListenerCount()).toBe(0);
    bStore.dispose();

    // BackendStore subscribePaths (patchless StateBackend fallback via createStateStore)
    const patchlessBackend = createStateStore('PatchlessFallback', { a: 1, b: 2 });
    const patchlessStore = createBackendStore('PatchlessFallback', patchlessBackend, {
      ownership: 'owned',
    });
    let fallbackHits = 0;
    const uFallback = patchlessStore.subscribePaths([['a']], () => {
      fallbackHits += 1;
    });
    patchlessStore.setValue({ a: 2, b: 2 });
    expect(fallbackHits).toBe(1);
    uFallback();
    expect(patchlessStore.getListenerCount()).toBe(0);
    patchlessStore.dispose();
  });

  it('conservatively notifies shifted array indexes on splice/length truncation and all subscribers on null patches', () => {
    const index = new PathSubscriptionIndex();
    const hits: string[] = [];

    index.subscribe([['items', 0]], () => hits.push('idx0'));
    index.subscribe([['items', 2]], () => hits.push('idx2'));
    index.subscribe([['other']], () => hits.push('other'));

    const removeAtZero = index.collectAffected([{ op: 'remove', path: ['items', 0] }]);
    for (const entry of removeAtZero) entry.listener();
    expect(hits.sort()).toEqual(['idx0', 'idx2']);

    hits.length = 0;
    const truncate = index.collectAffected([{ op: 'replace', path: ['items', 'length'], value: 1 }]);
    for (const entry of truncate) entry.listener();
    expect(hits.sort()).toEqual(['idx0', 'idx2']);

    hits.length = 0;
    const unknown = index.collectAffected(null);
    for (const entry of unknown) entry.listener();
    expect(hits.sort()).toEqual(['idx0', 'idx2', 'other']);
  });

  it('commits useControlledStoreSync primary path and derived fields via onSync in a single store notification', async () => {
    interface ComboSyncState {
      selectedKey: string | null;
      query: string;
    }

    const store = createStore<ComboSyncState>('ControlledAtomicSync', {
      selectedKey: 'alpha',
      query: 'Alpha',
    });

    const snapshots: Array<ComboSyncState> = [];
    const unsub = store.subscribe(() => {
      snapshots.push(store.getValue());
    });

    function SyncHost() {
      const [selectedKey, setSelectedKey] = useState<string | null>('alpha');
      useControlledStoreSync(store, ['selectedKey'], selectedKey, {
        onSync(draft, nextKey) {
          draft.query = nextKey ? nextKey.toUpperCase() : '';
        },
      });
      return (
        <button
          type="button"
          data-testid="sync-to-beta"
          onClick={() => setSelectedKey('beta')}
        >
          {selectedKey}
        </button>
      );
    }

    const view = render(<SyncHost />);
    expect(snapshots).toHaveLength(0);

    fireEvent.click(view.getByTestId('sync-to-beta'));
    await waitFor(() => {
      expect(store.getValue()).toEqual({ selectedKey: 'beta', query: 'BETA' });
    });

    // Both selectedKey and derived query committed atomically in ONE store notification
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toEqual({ selectedKey: 'beta', query: 'BETA' });

    unsub();
    view.unmount();
    store.dispose();
  });
});
