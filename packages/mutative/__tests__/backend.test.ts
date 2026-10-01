import { describe, expect, it, vi } from 'vitest';
import { createMutativeStateBackend, createMutativeTimelineBackend } from '../src';

describe('Mutative backend adapters', () => {
  it('provides a React-independent state backend with patches and safe snapshots', () => {
    const backend = createMutativeStateBackend('state', { count: 0 }, { readMode: 'safe' });
    const listener = vi.fn();
    const patchListener = vi.fn();
    backend.subscribe(listener);
    backend.subscribeWithPatches?.(patchListener);
    backend.update(draft => { draft.count += 1; });

    expect(backend.getSnapshot().value).toEqual({ count: 1 });
    expect(backend.getSnapshot()).toBe(backend.getSnapshot());
    expect(backend.capabilities?.immutableSnapshots).toBe(true);
    expect(backend.getLastPatches()).toHaveLength(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(patchListener).toHaveBeenCalledTimes(1);
    expect(patchListener.mock.calls[0]?.[0]).toHaveLength(1);
  });

  it('preserves explicit defaults and forwards patch path options', () => {
    const backend = createMutativeStateBackend(
      'state',
      { nested: { count: 0 } },
      { patchesOptions: { pathAsArray: false }, readMode: undefined },
    );

    backend.update(draft => { draft.nested.count = 1; });

    expect(backend.getSnapshot().value).toEqual({ nested: { count: 1 } });
    expect(backend.getLastPatches()?.[0]?.path).toBe('/nested/count');
    // Omitted options must use the safe-read default, even though the
    // caller-provided object contains no readMode field.
    expect(backend.getSafeValue()).toEqual({ nested: { count: 1 } });
    expect(backend.getSafeValue()).not.toBe(backend.getSnapshot().value);
  });

  it('does not visit listeners added during a re-entrant notification', () => {
    const backend = createMutativeStateBackend('state', { count: 0 }, { readMode: 'reference' });
    const lateListener = vi.fn();
    const firstListener = vi.fn(() => {
      backend.subscribe(lateListener);
      if (backend.getSnapshot().value.count === 1) {
        backend.update(draft => { draft.count = 2; });
      }
    });
    backend.subscribe(firstListener);

    backend.update(draft => { draft.count = 1; });

    expect(firstListener).toHaveBeenCalledTimes(2);
    expect(lateListener).toHaveBeenCalledTimes(1);
  });

  it('provides timeline identity, metadata, reset, and transaction batches', () => {
    const backend = createMutativeTimelineBackend('timeline', { count: 0 });
    const transitions: unknown[] = [];
    backend.subscribe(() => transitions.push(backend.getSnapshot()));

    const initialEntry = backend.getHistoryEntryId();
    backend.beginBatch({ label: 'edit' });
    backend.update(draft => { draft.count = 1; });
    backend.endBatch();
    const editedEntry = backend.getHistoryEntryId();

    expect(editedEntry).not.toBe(initialEntry);
    expect(backend.hasHistoryEntry(initialEntry)).toBe(true);
    expect(backend.getSnapshot().value).toEqual({ count: 1 });
    expect(transitions.length).toBeGreaterThan(0);

    backend.reset({ label: 'reset' });
    expect(backend.getSnapshot().value).toEqual({ count: 0 });
    expect(() => backend.goToHistoryEntry(editedEntry)).toThrow('no longer retained');
  });

  it('does not leave notification holds behind when beginBatch fails', () => {
    const backend = createMutativeTimelineBackend('timeline', { count: 0 });
    backend.dispose();

    expect(() => backend.beginBatch(undefined, { deferNotification: true })).toThrow('disposed');
    expect(() => backend.resumeNotifications()).not.toThrow();
    expect(() => backend.flushNotifications()).not.toThrow();
  });

  it('does not publish a failed metadata-wrapped mutation', () => {
    const backend = createMutativeTimelineBackend('timeline', { count: 0 });
    const listener = vi.fn();
    backend.subscribe(listener);
    const before = backend.getSnapshot();

    expect(() => backend.update(() => {
      throw new Error('rejected');
    }, { label: 'rejected' })).toThrow('rejected');

    expect(listener).not.toHaveBeenCalled();
    expect(backend.getSnapshot()).toBe(before);
    expect(backend.getSnapshot().value).toEqual({ count: 0 });
    expect(backend.getPosition()).toBe(0);
  });

  it('coalesces microtask notifications while retaining the final patch set', async () => {
    const backend = createMutativeTimelineBackend(
      'timeline',
      { count: 0 },
      { notificationMode: 'batched' },
    );
    const listener = vi.fn();
    const patchListener = vi.fn();
    backend.subscribe(listener);
    backend.subscribeWithPatches?.(patchListener);

    backend.update(draft => { draft.count = 1; });
    backend.update(draft => { draft.count = 2; });

    expect(listener).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(patchListener).toHaveBeenCalledTimes(1);
    expect(patchListener.mock.calls[0]?.[0]).toHaveLength(2);
    expect(backend.getSnapshot().value).toEqual({ count: 2 });
    expect(backend.getLastPatches()).toHaveLength(2);
  });
});
