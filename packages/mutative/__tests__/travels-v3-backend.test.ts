import { describe, expect, it, vi } from 'vitest';
import type { TimelineBackend, TransactionBackend } from '@context-action/store-core';
import { createMutativeTimelineBackend } from '../src';
import { createTravelsV3JournalBackend } from '../examples/travels-v3/journal-backend';
import {
  createTravelsV3Backend,
  restoreTravelsV3Backend,
} from '../examples/travels-v3/backend';

type State = { count: number; nested: { label: string } };
const initial = (): State => ({ count: 0, nested: { label: 'initial' } });
const factories: Array<{
  name: string;
  create: (maxHistory?: number) => TimelineBackend<State, unknown>;
}> = [
  {
    name: 'Context-Action maintained engine',
    create: (maxHistory = 50) => createMutativeTimelineBackend('comparison', initial(), { maxHistory, readMode: 'safe' }),
  },
  {
    name: 'Travels 3.0.1 + Mutative 2.0.0 experiment',
    create: (maxHistory = 50) => createTravelsV3Backend('comparison', initial(), { maxHistory }),
  },
  {
    name: 'Travels v3 externally owned journal experiment',
    create: (maxHistory = 50) => createTravelsV3JournalBackend('comparison', initial(), { maxHistory }),
  },
];

describe.each(factories)('$name: common TimelineBackend contracts', ({ create }) => {
  it('publishes stable immutable snapshots, patches, unsubscribe and undo/redo', () => {
    const backend = create();
    const observed = vi.fn();
    const patches = vi.fn();
    const off = backend.subscribe(observed);
    const offPatches = backend.subscribeWithPatches!(patches);
    try {
      const start = backend.getSnapshot();
      expect(backend.getSnapshot()).toBe(start);
      expect(Object.isFrozen(start.value.nested)).toBe(true);
      backend.update(draft => { draft.count += 1; return undefined; });
      expect(observed).toHaveBeenCalledTimes(1);
      expect(patches).toHaveBeenCalledTimes(1);
      expect(backend.getSnapshot().value.count).toBe(1);
      expect(backend.getSnapshot().version).toBeGreaterThan(start.version);
      backend.undo();
      expect(backend.getSnapshot().value.count).toBe(0);
      backend.redo();
      expect(backend.getSnapshot().value.count).toBe(1);
      const before = observed.mock.calls.length;
      off(); offPatches();
      backend.setValue({ count: 2, nested: { label: 'next' } });
      expect(observed).toHaveBeenCalledTimes(before);
    } finally { backend.dispose?.(); }
  });

  it('does not publish a no-op update', () => {
    const backend = create();
    const listener = vi.fn();
    backend.subscribe(listener);
    try {
      const snapshot = backend.getSnapshot();
      backend.update(() => undefined);
      expect(listener).not.toHaveBeenCalled();
      expect(backend.getSnapshot()).toBe(snapshot);
      expect(backend.getHistoryLength()).toBe(1);
    } finally { backend.dispose?.(); }
  });

  it('keeps retained IDs stable through trimming and rejects a discarded redo entry', () => {
    const backend = create(2);
    try {
      const originalId = backend.getHistoryEntryId();
      backend.update(draft => { draft.count = 1; return undefined; });
      const oneId = backend.getHistoryEntryId();
      backend.update(draft => { draft.count = 2; return undefined; });
      const twoId = backend.getHistoryEntryId();
      backend.update(draft => { draft.count = 3; return undefined; });
      const threeId = backend.getHistoryEntryId();
      expect(backend.getHistoryLength()).toBe(3);
      expect(backend.hasHistoryEntry(originalId)).toBe(false);
      expect(backend.hasHistoryEntry(oneId)).toBe(true);
      backend.goToHistoryEntry(twoId);
      expect(backend.getSnapshot().value.count).toBe(2);
      expect(backend.getHistoryEntryId()).toBe(twoId);
      backend.update(draft => { draft.count = 4; return undefined; });
      expect(backend.hasHistoryEntry(threeId)).toBe(false);
      expect(() => backend.goToHistoryEntry(threeId)).toThrow(/no longer retained/);
      expect(backend.canRedo()).toBe(false);
      backend.goToHistoryEntry(oneId);
      expect(backend.getSnapshot().value.count).toBe(1);
    } finally { backend.dispose?.(); }
  });

  it('keeps the final snapshot and skips late writes/updaters after disposal', () => {
    const backend = create();
    backend.setValue({ count: 1, nested: { label: 'final' } });
    const final = backend.getSnapshot();
    const updater = vi.fn();
    backend.dispose?.();
    backend.dispose?.();
    backend.setValue(initial());
    backend.update(updater);
    expect(backend.getSnapshot()).toBe(final);
    expect(updater).not.toHaveBeenCalled();
    expect(backend.canUndo()).toBe(false);
  });

  it('resets the true initial state after bounded history has been trimmed', () => {
    const backend = create(1);
    try {
      backend.setValue({ count: 1, nested: { label: 'one' } });
      backend.setValue({ count: 2, nested: { label: 'two' } });
      backend.reset();
      expect(backend.getSnapshot().value).toEqual(initial());
      expect(backend.getPosition()).toBe(0);
      expect(backend.getHistoryLength()).toBe(1);
    } finally { backend.dispose?.(); }
  });
});

describe('Travels v3 experimental adapter specialization', () => {
  it('does not freeze caller input or expose mutable snapshot/patch aliases', () => {
    const input = initial();
    const backend = createTravelsV3Backend('ownership', input);
    try {
      input.nested.label = 'outside';
      expect(backend.getSnapshot().value.nested.label).toBe('initial');
      const next = { count: 1, nested: { label: 'committed' } };
      backend.setValue(next);
      next.nested.label = 'outside-again';
      expect(backend.getSnapshot().value.nested.label).toBe('committed');
      expect(() => { backend.getSnapshot().value.nested.label = 'forbidden'; }).toThrow();
      const patches = backend.getLastPatches()!;
      expect(Object.isFrozen(patches)).toBe(true);
      const history = backend.getHistory();
      history[1]!.nested.label = 'owned-copy';
      backend.undo(); backend.redo();
      expect(backend.getSnapshot().value.nested.label).toBe('committed');
    } finally { backend.dispose(); }
  });

  it('detaches borrowed draft assignments without freezing caller objects', () => {
    const backend = createTravelsV3Backend('draft-input', initial());
    try {
      const borrowed = { label: 'borrowed' };
      backend.update(draft => { draft.nested = borrowed; return undefined; });
      expect(Object.isFrozen(borrowed)).toBe(false);
      expect(backend.getSnapshot().value.nested).not.toBe(borrowed);
      borrowed.label = 'outside';
      expect(backend.getSnapshot().value.nested.label).toBe('borrowed');
      backend.undo(); backend.redo();
      expect(backend.getSnapshot().value.nested.label).toBe('borrowed');
      const owned = { label: 'owned' };
      backend.update(draft => { draft.nested = structuredClone(owned); return undefined; });
      expect(Object.isFrozen(owned)).toBe(false);
      owned.label = 'outside';
      expect(backend.getSnapshot().value.nested.label).toBe('owned');
    } finally { backend.dispose(); }
  });

  it('publishes one atomic synchronous batch and supports rollback without provisional events', () => {
    const backend = createTravelsV3Backend('batch', initial());
    const listener = vi.fn();
    backend.subscribe(listener);
    try {
      const start = backend.getSnapshot();
      const result = backend.batch(() => {
        backend.update(draft => { draft.count += 1; return undefined; });
        backend.update(draft => { draft.count += 1; return undefined; });
        expect(backend.getSnapshot()).toBe(start);
        return 42;
      }, { transactionId: 'tx-1', label: 'two increments' });
      expect(result).toBe(42);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(backend.getSnapshot().value.count).toBe(2);
      expect(backend.getHistoryLength()).toBe(2);
      expect(backend.getLastTransitionMeta()).toMatchObject({ transactionId: 'tx-1' });
      const committed = backend.getSnapshot();
      const rejected = new Error('rejected');
      expect(() => backend.batch(() => {
        backend.update(draft => { draft.count = 9; return undefined; });
        throw rejected;
      })).toThrowError(expect.objectContaining({ code: 'TRANSACTION_FAILED', cause: rejected }));
      expect(listener).toHaveBeenCalledTimes(1);
      expect(backend.getSnapshot()).toBe(committed);
      backend.undo();
      expect(backend.getSnapshot().value.count).toBe(0);
    } finally { backend.dispose(); }
  });

  it('preserves redo entries and IDs for a net-zero transaction', () => {
    const backend = createTravelsV3Backend('net-zero', initial());
    try {
      backend.update(draft => { draft.count = 1; return undefined; });
      const futureId = backend.getHistoryEntryId();
      backend.undo();
      const before = backend.getSnapshot();
      backend.batch(() => {
        backend.update(draft => { draft.count = 2; return undefined; });
        backend.update(draft => { draft.count = 0; return undefined; });
      });
      expect(backend.getSnapshot()).toBe(before);
      expect(backend.hasHistoryEntry(futureId)).toBe(true);
      backend.goToHistoryEntry(futureId);
      expect(backend.getSnapshot().value.count).toBe(1);
    } finally { backend.dispose(); }
  });

  it('rolls back a regular callback that returns a Promise instead of committing it', () => {
    const backend = createTravelsV3Backend('promise-return', initial());
    const listener = vi.fn();
    backend.subscribe(listener);
    try {
      const before = backend.getSnapshot();
      expect(() => backend.batch((() => {
        backend.update(draft => { draft.count = 9; return undefined; });
        return Promise.resolve('unsupported');
      }) as never)).toThrowError(expect.objectContaining({ code: 'TRANSACTION_FAILED' }));
      expect(backend.getSnapshot()).toBe(before);
      expect(backend.getHistoryLength()).toBe(1);
      expect(listener).not.toHaveBeenCalled();
    } finally { backend.dispose(); }
  });

  it('round-trips strict persistence with semantic validation and history navigation', () => {
    const backend = createTravelsV3Backend('serialize', initial());
    backend.update(draft => { draft.count = 1; return undefined; }, { label: 'one' });
    backend.update(draft => { draft.count = 2; return undefined; });
    const serialized = backend.serialize();
    expect(JSON.parse(serialized).metadata[0]).toMatchObject({ label: 'one' });
    const restored = restoreTravelsV3Backend<State>('restored', serialized);
    try {
      expect(restored.getSnapshot().value.count).toBe(2);
      expect(restored.getHistoryLength()).toBe(3);
      restored.undo(2);
      expect(restored.getSnapshot().value.count).toBe(0);
      restored.redo(2);
      expect(restored.getSnapshot().value.count).toBe(2);
      const damaged = JSON.parse(serialized);
      damaged.patches.patches[0][0].path = ['absent', 'field'];
      expect(() => restoreTravelsV3Backend('damaged', JSON.stringify(damaged))).toThrow();
    } finally { backend.dispose(); restored.dispose(); }
  });

  it.each([new Map(), new Set(), new Date(), [1, , 3], { value: undefined }])(
    'rejects non-durable initial values instead of claiming legacy collection compatibility: %j', value => {
      expect(() => createTravelsV3Backend('not-json', value as never)).toThrow();
    },
  );

  it('rejects unsupported updates before state/history commits', () => {
    const backend = createTravelsV3Backend('validation', initial());
    try {
      const snapshot = backend.getSnapshot();
      expect(() => backend.update(draft => {
        (draft.nested as unknown as { label: unknown }).label = new Date();
        return undefined;
      })).toThrow(/DATE/);
      expect(backend.getSnapshot()).toBe(snapshot);
      expect(backend.getHistoryLength()).toBe(1);
    } finally { backend.dispose(); }
  });

  it('handles maxHistory zero and never reuses an expired entry ID', () => {
    const backend = createTravelsV3Backend('no-history', initial(), { maxHistory: 0 });
    try {
      const before = backend.getHistoryEntryId();
      backend.update(draft => { draft.count = 1; return undefined; });
      expect(backend.getHistoryEntryId()).not.toBe(before);
      expect(backend.hasHistoryEntry(before)).toBe(false);
      expect(backend.getHistoryLength()).toBe(1);
      expect(backend.canUndo()).toBe(false);
    } finally { backend.dispose(); }
  });

  it('isolates listener errors, forbids reentrant writes and releases all listeners on disposal', () => {
    const report = vi.fn();
    const backend = createTravelsV3Backend('observers', initial(), { onListenerError: report });
    const after = vi.fn();
    backend.subscribe(() => { backend.setValue({ count: 99, nested: { label: 'reentrant' } }); });
    backend.subscribe(after);
    backend.update(draft => { draft.count = 1; return undefined; });
    expect(report).toHaveBeenCalledTimes(1);
    expect(after).toHaveBeenCalledTimes(1);
    expect(backend.getSnapshot().value.count).toBe(1);
    backend.dispose();
    backend.update(draft => { draft.count = 2; return undefined; });
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('rejects async callbacks and does not pretend to support the multi-store transaction contract', () => {
    const backend = createTravelsV3Backend('capabilities', initial());
    const callback = vi.fn();
    try {
      // Bypass the static boundary to exercise JavaScript runtime validation.
      expect(() => backend.batch((async () => { callback(); }) as never)).toThrow(/synchronous/);
      expect(callback).not.toHaveBeenCalled();
      expect(() => backend.update((async () => undefined) as never)).toThrow(/synchronous/);
      expect(() => backend.batch(() => { backend.undo(); })).toThrowError(expect.objectContaining({
        code: 'TRANSACTION_FAILED', cause: expect.objectContaining({ message: expect.stringMatching(/Navigation/) }),
      }));
      if (false) {
        // @ts-expect-error Separate begin/end/hold capabilities are intentionally absent.
        const unsupported: TransactionBackend<State> = backend;
        void unsupported;
        // @ts-expect-error Promise-returning batches are not part of this prototype.
        backend.batch(async () => {});
      }
    } finally { backend.dispose(); }
  });
});
