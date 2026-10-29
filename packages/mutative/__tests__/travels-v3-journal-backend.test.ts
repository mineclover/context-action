import { describe, expect, it, vi } from 'vitest';
import type { TransactionBackend } from '@context-action/store-core';
import { createTravelsV3Backend } from '../examples/travels-v3/backend';
import { createTravelsV3JournalBackend, restoreTravelsV3JournalBackend } from '../examples/travels-v3/journal-backend';

const initial = () => ({ count: 0, nested: { label: 'initial' }, untouched: { stable: true } });

describe.each([
  { name: 'state-owning', create: () => createTravelsV3Backend('ownership', initial()) },
  { name: 'journal', create: () => createTravelsV3JournalBackend('ownership', initial()) },
])('$name: owned updater deltas', ({ create }) => {
  it('detaches borrowed assignments while preserving unchanged subtrees and precise paths', () => {
    const backend = create();
    const borrowed = { label: 'borrowed' };
    const before = backend.getSnapshot();
    try {
      backend.update(draft => { draft.nested = borrowed; return undefined; });
      expect(Object.isFrozen(borrowed)).toBe(false);
      expect(backend.getSnapshot().value.nested).not.toBe(borrowed);
      expect(backend.getSnapshot().value.untouched).toBe(before.value.untouched);
      expect(backend.getLastPatches()).toMatchObject([{ path: ['nested'] }]);
      borrowed.label = 'outside';
      backend.undo(); backend.redo();
      expect(backend.getSnapshot().value.nested.label).toBe('borrowed');
    } finally { backend.dispose(); }
  });

  it('isolates returned replacement values and ignores a write disposed by its updater', () => {
    const backend = create();
    const replacement = initial();
    try {
      backend.update(() => replacement);
      replacement.nested.label = 'outside';
      expect(backend.getSnapshot().value.nested.label).toBe('initial');
      const before = backend.getSnapshot();
      backend.update(draft => { draft.count = 9; backend.dispose(); return undefined; });
      expect(backend.getSnapshot()).toBe(before);
    } finally { backend.dispose(); }
  });

  it('rejects reentrant updater writes without publishing either change', () => {
    const backend = create();
    const before = backend.getSnapshot();
    try {
      expect(() => backend.update(draft => {
        draft.count = 9;
        backend.setValue(initial());
        return undefined;
      })).toThrow(/Reentrant/);
      expect(backend.getSnapshot()).toBe(before);
    } finally { backend.dispose(); }
  });

  it('detaches metadata before a batch callback can mutate caller-owned values', () => {
    const backend = create();
    const meta = { label: 'original', detail: { source: 'caller' } };
    try {
      backend.batch(() => {
        meta.label = 'outside';
        meta.detail.source = 'outside';
        backend.update(draft => { draft.count = 1; return undefined; });
      }, meta);
      expect(Object.isFrozen(meta.detail)).toBe(false);
      expect(backend.getLastTransitionMeta()).toMatchObject({ label: 'original', detail: { source: 'caller' } });
      expect(JSON.parse(backend.serialize()).metadata[0]).toMatchObject({ label: 'original', detail: { source: 'caller' } });
    } finally { backend.dispose(); }
  });
});

describe('externally owned Travels v3 journal batch contract', () => {
  it('implements the real TransactionBackend contract and commits one staged history entry', () => {
    const backend = createTravelsV3JournalBackend('batch', initial());
    const contract: TransactionBackend<ReturnType<typeof initial>> = backend;
    const observed = vi.fn();
    backend.subscribe(observed);
    const before = backend.getSnapshot();
    try {
      contract.beginBatch({ transactionId: 'tx-1', label: 'group' }, { deferNotification: true });
      backend.update(draft => { draft.count += 1; return undefined; });
      backend.update(draft => { draft.count += 1; return undefined; });
      expect(backend.getSnapshot()).toBe(before);
      expect(observed).not.toHaveBeenCalled();
      contract.endBatch();
      expect(backend.getSnapshot().value.count).toBe(2);
      expect(backend.getHistoryLength()).toBe(2);
      expect(observed).not.toHaveBeenCalled();
      backend.flushNotifications();
      expect(observed).not.toHaveBeenCalled();
      backend.resumeNotifications();
      expect(observed).not.toHaveBeenCalled();
      backend.flushNotifications();
      expect(observed).toHaveBeenCalledTimes(1);
      expect(backend.getLastTransitionMeta()).toMatchObject({ transactionId: 'tx-1' });
      backend.undo();
      expect(backend.getSnapshot().value.count).toBe(0);
      backend.redo();
      expect(backend.getSnapshot().value.count).toBe(2);
    } finally { backend.dispose(); }
  });

  it('keeps nested savepoints and notification holds independent', () => {
    const backend = createTravelsV3JournalBackend('nested', initial());
    const observed = vi.fn();
    backend.subscribe(observed);
    try {
      backend.beginBatch({ label: 'outer' }, { deferNotification: true });
      backend.update(draft => { draft.count = 1; return undefined; });
      backend.beginBatch({ label: 'inner' }, { deferNotification: true });
      backend.update(draft => { draft.count = 9; return undefined; });
      backend.cancelBatch();
      backend.endBatch();
      backend.resumeNotifications(); backend.flushNotifications();
      expect(observed).not.toHaveBeenCalled();
      backend.resumeNotifications(); backend.flushNotifications();
      expect(observed).toHaveBeenCalledTimes(1);
      expect(backend.getSnapshot().value.count).toBe(1);
      expect(backend.getLastTransitionMeta()).toMatchObject({ label: 'outer' });
      backend.undo();
      expect(backend.getSnapshot().value.count).toBe(0);
    } finally { backend.dispose(); }
  });

  it('cancels without provisional publication or losing the redo branch and IDs', () => {
    const backend = createTravelsV3JournalBackend('rollback', initial());
    backend.update(draft => { draft.count = 1; return undefined; });
    const future = backend.getHistoryEntryId();
    backend.undo();
    const before = backend.getSnapshot();
    const observed = vi.fn();
    backend.subscribe(observed);
    try {
      backend.beginBatch(undefined, { deferNotification: true });
      backend.update(draft => { draft.count = 9; return undefined; });
      backend.cancelBatch();
      backend.resumeNotifications(); backend.flushNotifications();
      expect(backend.getSnapshot()).toBe(before);
      expect(observed).not.toHaveBeenCalled();
      expect(backend.hasHistoryEntry(future)).toBe(true);
      backend.goToHistoryEntry(future);
      expect(backend.getSnapshot().value.count).toBe(1);
    } finally { backend.dispose(); }
  });

  it('does not discard redo for net-zero sync or async batches', async () => {
    const backend = createTravelsV3JournalBackend('net-zero', initial());
    backend.update(draft => { draft.count = 1; return undefined; });
    const future = backend.getHistoryEntryId();
    backend.undo();
    const before = backend.getSnapshot();
    try {
      await backend.batch(async () => {
        backend.update(draft => { draft.count = 2; return undefined; });
        await Promise.resolve();
        backend.update(draft => { draft.count = 0; return undefined; });
      });
      expect(backend.getSnapshot()).toBe(before);
      expect(backend.hasHistoryEntry(future)).toBe(true);
      expect(backend.canRedo()).toBe(true);
    } finally { backend.dispose(); }
  });

  it('commits after an async callback settles, and rolls back rejection with the original error', async () => {
    const backend = createTravelsV3JournalBackend('async', initial());
    const observed = vi.fn();
    backend.subscribe(observed);
    try {
      const before = backend.getSnapshot();
      const result = await backend.batch(async () => {
        backend.update(draft => { draft.count = 1; return undefined; });
        await Promise.resolve();
        expect(backend.getSnapshot()).toBe(before);
        backend.update(draft => { draft.count += 1; return undefined; });
        return 42;
      });
      expect(result).toBe(42);
      expect(observed).toHaveBeenCalledTimes(1);
      expect(backend.getSnapshot().value.count).toBe(2);
      const committed = backend.getSnapshot();
      const rejected = new Error('rejected');
      await expect(backend.batch(async () => {
        backend.update(draft => { draft.count = 9; return undefined; });
        await Promise.resolve();
        throw rejected;
      })).rejects.toBe(rejected);
      expect(backend.getSnapshot()).toBe(committed);
      expect(observed).toHaveBeenCalledTimes(1);
    } finally { backend.dispose(); }
  });

  it('protects a managed async lifecycle against external end/cancel and overlapping batches', async () => {
    const backend = createTravelsV3JournalBackend('lease', initial());
    let resume!: () => void;
    const gate = new Promise<void>(resolve => { resume = resolve; });
    const running = backend.batch(async () => {
      backend.update(draft => { draft.count = 1; return undefined; });
      await gate;
      backend.update(draft => { draft.count += 1; return undefined; });
    });
    try {
      expect(() => backend.endBatch()).toThrow(/owns its lifecycle/);
      expect(() => backend.cancelBatch()).toThrow(/owns its lifecycle/);
      expect(() => backend.beginBatch()).toThrow(/owns its lifecycle/);
      expect(() => backend.batch(() => {})).toThrow(/owns its lifecycle/);
      resume(); await running;
      expect(backend.getSnapshot().value.count).toBe(2);
    } finally { resume(); await running; backend.dispose(); }
  });

  it('stages navigation for coordinated undo and can cancel it without changing the current ID', () => {
    const backend = createTravelsV3JournalBackend('navigation', initial());
    backend.update(draft => { draft.count = 1; return undefined; });
    backend.update(draft => { draft.count = 2; return undefined; });
    const before = backend.getSnapshot();
    const id = backend.getHistoryEntryId();
    try {
      backend.beginBatch(); backend.undo(); backend.cancelBatch();
      expect(backend.getSnapshot()).toBe(before);
      expect(backend.getHistoryEntryId()).toBe(id);
      backend.beginBatch({ origin: 'undo' }, { deferNotification: true });
      backend.undo(); backend.undo(); backend.endBatch();
      expect(backend.getSnapshot().value.count).toBe(0);
      backend.resumeNotifications(); backend.flushNotifications();
      backend.redo(2);
      expect(backend.getHistoryEntryId()).toBe(id);
    } finally { backend.dispose(); }
  });

  it('rejects mixed navigation/writes and invalid controls before publication', () => {
    const backend = createTravelsV3JournalBackend('invalid', initial());
    const before = backend.getSnapshot();
    try {
      expect(() => backend.batch(() => {
        backend.update(draft => { draft.count = 1; return undefined; });
        backend.undo();
      })).toThrow(/mix/);
      expect(() => backend.batch(() => { backend.goTo(0); backend.setValue(initial()); })).toThrow(/mix/);
      expect(() => backend.goTo(-1)).toThrow(RangeError);
      expect(() => backend.undo(0.5)).toThrow(RangeError);
      expect(() => backend.endBatch()).toThrow(/not active/);
      expect(() => backend.cancelBatch()).toThrow(/not active/);
      expect(backend.getSnapshot()).toBe(before);
    } finally { backend.dispose(); }
  });

  it('handles primitive/null transitions and preserves staged null rather than a fallback', () => {
    const backend = createTravelsV3JournalBackend<number | null>('primitive', 1);
    try {
      backend.batch(() => {
        backend.setValue(null);
        backend.update(value => { expect(value).toBeNull(); return 2; });
      });
      expect(backend.getSnapshot().value).toBe(2);
      backend.undo(); expect(backend.getSnapshot().value).toBe(1);
      backend.redo(); expect(backend.getSnapshot().value).toBe(2);
    } finally { backend.dispose(); }
  });

  it('round-trips semantic journal persistence and branches correctly after restore', () => {
    const backend = createTravelsV3JournalBackend('persist', initial());
    backend.update(draft => { draft.count = 1; return undefined; }, { label: 'one' });
    backend.update(draft => { draft.count = 2; return undefined; });
    const serialized = backend.serialize();
    const restored = restoreTravelsV3JournalBackend<ReturnType<typeof initial>>('restored', serialized);
    try {
      expect(JSON.parse(serialized).metadata[0]).toMatchObject({ label: 'one' });
      const retained = restored.getHistoryEntryId();
      restored.undo();
      restored.update(draft => { draft.count = 3; return undefined; });
      expect(restored.hasHistoryEntry(retained)).toBe(false);
      expect(restored.getHistoryEntryId()).not.toBe(retained);
      restored.undo(2); expect(restored.getSnapshot().value.count).toBe(0);
      restored.redo(2); expect(restored.getSnapshot().value.count).toBe(3);
      restored.beginBatch();
      expect(() => restored.serialize()).toThrow(/committed/);
      restored.cancelBatch();
      const damaged = JSON.parse(serialized);
      damaged.patches.patches[0][0].path = ['absent', 'field'];
      expect(() => restoreTravelsV3JournalBackend('damaged', JSON.stringify(damaged))).toThrow();
    } finally { backend.dispose(); restored.dispose(); }
  });

  it('replays a grouped root replacement followed by dense array edits in both directions', () => {
    const backend = createTravelsV3JournalBackend('arrays', { items: ['a', 'b', 'c'] });
    const replacement = { items: ['x', 'y', 'z'] };
    try {
      backend.batch(() => {
        backend.setValue(replacement);
        backend.update(draft => { draft.items.splice(0, 1); draft.items.push('next'); return undefined; });
      });
      replacement.items[0] = 'outside';
      expect(backend.getSnapshot().value.items).toEqual(['y', 'z', 'next']);
      backend.undo(); expect(backend.getSnapshot().value.items).toEqual(['a', 'b', 'c']);
      backend.redo(); expect(backend.getSnapshot().value.items).toEqual(['y', 'z', 'next']);
    } finally { backend.dispose(); }
  });

  it('supports zero retention, rebase invalidation and the new reset baseline', () => {
    const backend = createTravelsV3JournalBackend('zero', initial(), { maxHistory: 0 });
    const original = backend.getHistoryEntryId();
    try {
      backend.batch(() => backend.update(draft => { draft.count = 1; return undefined; }));
      expect(backend.getHistoryLength()).toBe(1);
      expect(backend.hasHistoryEntry(original)).toBe(false);
      expect(backend.canUndo()).toBe(false);
      const committed = backend.getHistoryEntryId();
      backend.rebase();
      expect(backend.hasHistoryEntry(committed)).toBe(false);
      backend.setValue(initial());
      backend.reset();
      expect(backend.getSnapshot().value.count).toBe(1);
    } finally { backend.dispose(); }
  });

  it('validates every staged state and rejects unsupported collections without freezing them', () => {
    const backend = createTravelsV3JournalBackend('validation', initial());
    const before = backend.getSnapshot();
    const borrowed = { label: new Map() };
    try {
      expect(() => backend.batch(() => {
        backend.update(draft => { draft.count = 1; return undefined; });
        backend.update(draft => { draft.nested = borrowed as never; return undefined; });
      })).toThrow(/MAP_SET/);
      expect(Object.isFrozen(borrowed)).toBe(false);
      expect(backend.getSnapshot()).toBe(before);
      expect(backend.getHistoryLength()).toBe(1);
    } finally { backend.dispose(); }
  });

  it('isolates listener failures and callback disposal without turning a committed batch into a failure', () => {
    const onError = vi.fn();
    const backend = createTravelsV3JournalBackend('listeners', initial(), { onListenerError: onError });
    const after = vi.fn();
    backend.subscribe(() => { backend.setValue(initial()); });
    backend.subscribe(after);
    backend.batch(() => backend.update(draft => { draft.count = 1; return undefined; }));
    expect(onError).toHaveBeenCalledTimes(1);
    expect(after).toHaveBeenCalledTimes(1);
    backend.subscribe(() => backend.dispose());
    expect(() => backend.batch(() => backend.setValue(initial()))).not.toThrow();
    expect(backend.isDisposed()).toBe(true);
  });

  it('disposes a suspended batch, ignores late writes and rejects its later commit', async () => {
    const backend = createTravelsV3JournalBackend('disposed', initial());
    const before = backend.getSnapshot();
    let resume!: () => void;
    const gate = new Promise<void>(resolve => { resume = resolve; });
    const pending = backend.batch(async () => {
      backend.update(draft => { draft.count = 1; return undefined; });
      await gate;
      backend.update(draft => { draft.count = 2; return undefined; });
    });
    backend.dispose(); resume();
    await expect(pending).rejects.toThrow(/disposed/);
    expect(backend.getSnapshot()).toBe(before);
    expect(backend.getHistoryLength()).toBe(0);
  });
});
