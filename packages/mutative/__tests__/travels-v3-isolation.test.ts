import { describe, expect, it, vi } from 'vitest';
import { createTravelsV3JournalBackend } from '../examples/travels-v3/journal-backend';
import type { ScopedJournalWriter } from '../examples/travels-v3/isolated-write-scope';

type State = { count: number; nested: { label: string } };
const initial = (): State => ({ count: 0, nested: { label: 'initial' } });
function gate() {
  let resume!: () => void;
  const promise = new Promise<void>(resolve => { resume = resolve; });
  return { promise, resume };
}

describe('journal isolated writer authority', () => {
  it('allows read-your-writes without publishing staged state and blocks direct writers across await', async () => {
    const backend = createTravelsV3JournalBackend('isolated', initial());
    const waiting = gate();
    const observed = vi.fn();
    const unwanted = vi.fn();
    backend.subscribe(observed);
    const before = backend.getSnapshot();
    const pending = backend.batchIsolated(async writer => {
      expect(Object.isFrozen(writer)).toBe(true);
      writer.update(draft => { draft.count = 1; return undefined; });
      expect(writer.getValue().count).toBe(1);
      const copy = writer.getSafeValue();
      copy.count = 99;
      expect(writer.getValue().count).toBe(1);
      expect(() => { writer.getValue().nested.label = 'outside'; }).toThrow();
      await waiting.promise;
      writer.update(draft => { draft.count += 1; return undefined; });
      return 42;
    }, { label: 'isolated increment' });
    try {
      expect(backend.getSnapshot()).toBe(before);
      expect(observed).not.toHaveBeenCalled();
      expect(() => backend.setValue(initial())).toThrow(/isolated/);
      expect(() => backend.update(unwanted)).toThrow(/isolated/);
      expect(unwanted).not.toHaveBeenCalled();
      for (const control of [backend.undo, backend.redo, () => backend.goTo(0), backend.reset, backend.rebase,
        backend.beginBatch, backend.endBatch, backend.cancelBatch, backend.resumeNotifications, backend.flushNotifications]) {
        expect(control).toThrow(/isolated/);
      }
      expect(() => backend.batch(() => {})).toThrow(/isolated/);
      await expect(backend.batchIsolated(() => {})).rejects.toThrow(/isolated/);
      waiting.resume();
      expect(await pending).toBe(42);
      expect(observed).toHaveBeenCalledTimes(1);
      expect(backend.getSnapshot().value.count).toBe(2);
      expect(backend.getLastTransitionMeta()).toMatchObject({ label: 'isolated increment' });
      backend.undo(); expect(backend.getSnapshot().value.count).toBe(0);
      backend.redo(); expect(backend.getSnapshot().value.count).toBe(2);
    } finally { waiting.resume(); await pending; backend.dispose(); }
  });

  it('revokes saved writers after success and never lets an old writer join a later scope', async () => {
    const backend = createTravelsV3JournalBackend('revocation', initial());
    let saved!: ScopedJournalWriter<State>;
    try {
      await backend.batchIsolated(writer => { saved = writer; writer.setValue({ ...initial(), count: 1 }); });
      const snapshot = backend.getSnapshot();
      const updater = vi.fn();
      for (const operation of [saved.getValue, saved.getSafeValue, () => saved.setValue(initial()), () => saved.update(updater)]) {
        expect(operation).toThrow(/expired/);
      }
      expect(updater).not.toHaveBeenCalled();
      await backend.batchIsolated(writer => {
        expect(() => saved.update(updater)).toThrow(/expired/);
        writer.update(draft => { draft.count += 1; return undefined; });
        expect(writer.getValue().count).toBe(2);
      });
      expect(snapshot.value.count).toBe(1);
      expect(backend.getSnapshot().value.count).toBe(2);
      backend.setValue(initial());
      expect(backend.getSnapshot().value.count).toBe(0);
      if (false) {
        // @ts-expect-error Writer authority does not include lifecycle controls.
        saved.endBatch();
        // @ts-expect-error Writer authority does not include timeline navigation.
        saved.undo();
        // @ts-expect-error Writer authority does not include backend disposal.
        saved.dispose();
      }
    } finally { backend.dispose(); }
  });

  it.each([false, true])('rolls back callback failure, preserves redo and releases authority: async=%s', async asynchronous => {
    const backend = createTravelsV3JournalBackend('failure', initial());
    backend.setValue({ ...initial(), count: 1 });
    const future = backend.getHistoryEntryId();
    backend.undo();
    const before = backend.getSnapshot();
    let saved!: ScopedJournalWriter<State>;
    const error = new Error('callback failure');
    const fail = (writer: ScopedJournalWriter<State>): never => {
      saved = writer;
      writer.setValue({ ...initial(), count: 9 });
      throw error;
    };
    try {
      const pending = backend.batchIsolated(asynchronous ? async writer => { await Promise.resolve(); return fail(writer); } : fail);
      await expect(pending).rejects.toBe(error);
      expect(backend.getSnapshot()).toBe(before);
      expect(backend.hasHistoryEntry(future)).toBe(true);
      expect(() => saved.setValue(initial())).toThrow(/expired/);
      backend.redo(); expect(backend.getSnapshot().value.count).toBe(1);
      await backend.batchIsolated(writer => writer.setValue(initial()));
      expect(backend.getSnapshot().value.count).toBe(0);
    } finally { backend.dispose(); }
  });

  it('seals writers before observers execute and keeps direct writes blocked through publication', async () => {
    const errors = vi.fn();
    const backend = createTravelsV3JournalBackend('publication', initial(), { onListenerError: errors });
    let saved!: ScopedJournalWriter<State>;
    backend.subscribe(() => { backend.setValue(initial()); });
    backend.subscribe(() => { saved.setValue(initial()); });
    try {
      await backend.batchIsolated(writer => { saved = writer; writer.update(draft => { draft.count = 1; return undefined; }); });
      expect(errors).toHaveBeenCalledTimes(2);
      expect(String(errors.mock.calls[0]?.[0])).toMatch(/isolated/);
      expect(String(errors.mock.calls[1]?.[0])).toMatch(/expired/);
      expect(backend.getSnapshot().value.count).toBe(1);
    } finally { backend.dispose(); }
  });

  it('revokes authority on disposal, rejects late writes before invoking an updater, and cannot commit', async () => {
    const backend = createTravelsV3JournalBackend('disposed', initial());
    const waiting = gate();
    const before = backend.getSnapshot();
    const updater = vi.fn();
    let saved!: ScopedJournalWriter<State>;
    const pending = backend.batchIsolated(async writer => {
      saved = writer;
      writer.setValue({ ...initial(), count: 1 });
      await waiting.promise;
      writer.update(updater);
    });
    backend.dispose(); waiting.resume();
    await expect(pending).rejects.toThrow(/expired/);
    expect(() => saved.getValue()).toThrow(/expired/);
    expect(updater).not.toHaveBeenCalled();
    expect(backend.getSnapshot()).toBe(before);
    expect(() => backend.setValue(initial())).not.toThrow();
  });

  it('rejects invalid metadata before calling the callback and leaves existing external batches alone', async () => {
    const backend = createTravelsV3JournalBackend('admission', initial());
    const callback = vi.fn();
    try {
      await expect(backend.batchIsolated(callback, { label: undefined })).rejects.toThrow(/UNDEFINED/);
      expect(callback).not.toHaveBeenCalled();
      backend.beginBatch();
      backend.update(draft => { draft.count = 3; return undefined; });
      await expect(backend.batchIsolated(callback)).rejects.toThrow(/nest/);
      expect(callback).not.toHaveBeenCalled();
      backend.endBatch();
      expect(backend.getSnapshot().value.count).toBe(3);
    } finally { backend.dispose(); }
  });

  it('preserves legacy ambient batch behavior for callers that deliberately use it', async () => {
    const backend = createTravelsV3JournalBackend('legacy', initial());
    const waiting = gate();
    const pending = backend.batch(async () => {
      backend.setValue({ ...initial(), count: 1 });
      await waiting.promise;
    });
    try {
      backend.setValue({ ...initial(), count: 7 });
      waiting.resume(); await pending;
      expect(backend.getSnapshot().value.count).toBe(7);
      expect(backend.getHistoryLength()).toBe(2);
    } finally { waiting.resume(); await pending; backend.dispose(); }
  });

  it('does not steal an existing notification hold or publish unrelated pending transitions', async () => {
    const backend = createTravelsV3JournalBackend('held', initial());
    const observed = vi.fn();
    backend.subscribe(observed);
    const callback = vi.fn();
    try {
      backend.beginBatch(undefined, { deferNotification: true });
      backend.setValue({ ...initial(), count: 1 });
      backend.endBatch();
      await expect(backend.batchIsolated(callback)).rejects.toThrow(/fresh quiescent/);
      expect(callback).not.toHaveBeenCalled();
      expect(observed).not.toHaveBeenCalled();
      backend.resumeNotifications(); backend.flushNotifications();
      expect(observed).toHaveBeenCalledTimes(1);
      await backend.batchIsolated(writer => writer.setValue({ ...initial(), count: 2 }));
      expect(observed).toHaveBeenCalledTimes(2);
    } finally { backend.dispose(); }
  });

  it('expires lifecycle controls as well as writers, without granting access to a later reservation', () => {
    const backend = createTravelsV3JournalBackend('controls', initial());
    const scope = backend.reserveIsolatedWriter();
    try {
      scope.batchControl.beginBatch();
      scope.writer.setValue({ ...initial(), count: 1 });
      scope.seal();
      expect(() => scope.writer.getValue()).toThrow(/expired/);
      scope.batchControl.endBatch();
      expect(() => backend.setValue(initial())).toThrow(/isolated/);
      scope.release();
      const next = backend.reserveIsolatedWriter();
      try {
        expect(() => scope.batchControl.beginBatch()).toThrow(/expired/);
        expect(() => scope.batchControl.resumeNotifications()).toThrow(/expired/);
        expect(() => scope.writer.setValue(initial())).toThrow(/expired/);
        next.batchControl.beginBatch();
        next.writer.setValue({ ...initial(), count: 2 });
        next.seal(); next.batchControl.endBatch();
      } finally { next.release(); }
      expect(backend.getSnapshot().value.count).toBe(2);
    } finally { scope.release(); backend.dispose(); }
  });
});
