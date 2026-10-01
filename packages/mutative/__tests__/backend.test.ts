import { describe, expect, it, vi } from 'vitest';
import { createMutativeStateBackend, createMutativeTimelineBackend } from '../src';

describe('Mutative backend adapters', () => {
  it('provides a React-independent state backend with patches and safe snapshots', () => {
    const backend = createMutativeStateBackend(
      'state',
      { count: 0, nested: { value: 1 } },
      { readMode: 'safe' },
    );
    const listener = vi.fn();
    const patchListener = vi.fn();
    backend.subscribe(listener);
    backend.subscribeWithPatches?.(patchListener);
    backend.update(draft => { draft.count += 1; });

    expect(backend.getSnapshot().value).toEqual({ count: 1, nested: { value: 1 } });
    expect(Object.isFrozen(backend.getSnapshot().value)).toBe(true);
    expect(Object.isFrozen(backend.getSnapshot().value.nested)).toBe(true);
    expect(Reflect.set(backend.getSnapshot().value, 'count', 99)).toBe(false);
    expect(backend.getSnapshot().value.count).toBe(1);
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

  it('freezes safe timeline snapshots without freezing reference-mode state', () => {
    const safe = createMutativeTimelineBackend(
      'safe-timeline',
      {
        nested: { count: 0 },
        map: new Map([['count', 0]]),
        set: new Set([1]),
        date: new Date(0),
      },
      { readMode: 'safe' },
    );
    const safeValue = safe.getSnapshot().value;
    expect(Object.isFrozen(safeValue)).toBe(true);
    expect(Object.isFrozen(safeValue.nested)).toBe(true);
    expect(Reflect.set(safeValue.nested, 'count', 10)).toBe(false);
    expect(safe.getSnapshot().value.nested.count).toBe(0);
    expect(Object.isFrozen(safeValue.map)).toBe(true);
    expect(() => safeValue.map.set('count', 10)).toThrow('immutable snapshot Map');
    expect(() => safeValue.map.delete('count')).toThrow('immutable snapshot Map');
    expect(() => safeValue.map.clear()).toThrow('immutable snapshot Map');
    expect(safe.getSnapshot().value.map.get('count')).toBe(0);
    expect(Object.isFrozen(safeValue.set)).toBe(true);
    expect(() => safeValue.set.add(2)).toThrow('immutable snapshot Set');
    expect(() => safeValue.set.delete(1)).toThrow('immutable snapshot Set');
    expect(() => safeValue.set.clear()).toThrow('immutable snapshot Set');
    expect(safe.getSnapshot().value.set.has(1)).toBe(true);
    expect(Object.isFrozen(safeValue.date)).toBe(true);
    expect(() => safeValue.date.setTime(10)).toThrow('immutable snapshot Date');
    expect(safe.getSnapshot().value.date.getTime()).toBe(0);

    const reference = createMutativeTimelineBackend(
      'reference-timeline',
      { nested: { count: 0 }, map: new Map([['count', 0]]) },
      { readMode: 'reference' },
    );
    expect(Object.isFrozen(reference.getSnapshot().value)).toBe(false);
    reference.getSnapshot().value.map.set('count', 2);
    expect(reference.getSnapshot().value.map.get('count')).toBe(2);
  });

  it('does not expose mutable Map or Set targets through forEach callbacks', () => {
    const backend = createMutativeStateBackend(
      'safe-iteration',
      {
        map: new Map([['count', 0]]),
        set: new Set([1]),
      },
      { readMode: 'safe' },
    );
    const snapshot = backend.getSnapshot().value;
    let callbackMap: Map<string, number> | undefined;
    let callbackSet: Set<number> | undefined;

    snapshot.map.forEach((_value, _key, map) => {
      callbackMap = map;
    });
    snapshot.set.forEach((_value, _sameValue, set) => {
      callbackSet = set;
    });

    expect(callbackMap).toBe(snapshot.map);
    expect(callbackSet).toBe(snapshot.set);
    expect(() => snapshot.map.forEach((_value, _key, map) => map.set('leak', 1))).toThrow(
      'immutable snapshot Map',
    );
    expect(() => snapshot.set.forEach((_value, _sameValue, set) => set.add(2))).toThrow(
      'immutable snapshot Set',
    );
    expect(snapshot.map.has('leak')).toBe(false);
    expect(snapshot.set.has(2)).toBe(false);
  });

  it('guards WeakMap and WeakSet mutators in safe snapshots', () => {
    const key = {};
    const weakMapValue = { count: 1 };
    const weakMap = new WeakMap<object, { count: number }>([[key, weakMapValue]]);
    const weakSet = new WeakSet<object>([key]);
    const backend = createMutativeStateBackend(
      'safe-weak-collections',
      { weakMap, weakSet },
      { readMode: 'safe' },
    );

    const snapshot = backend.getSnapshot().value;
    expect(Object.isExtensible(weakMap)).toBe(true);
    expect(Object.isExtensible(weakSet)).toBe(true);
    expect(Object.isFrozen(snapshot.weakMap)).toBe(true);
    expect(Object.isFrozen(snapshot.weakSet)).toBe(true);
    expect(snapshot.weakMap).toBeInstanceOf(WeakMap);
    expect(snapshot.weakSet).toBeInstanceOf(WeakSet);
    const snapshotWeakMapValue = snapshot.weakMap.get(key)!;
    expect(snapshotWeakMapValue).not.toBe(weakMapValue);
    expect(snapshotWeakMapValue).toEqual({ count: 1 });
    expect(Object.isFrozen(snapshotWeakMapValue)).toBe(true);
    expect(Reflect.set(snapshotWeakMapValue, 'count', 2)).toBe(false);
    expect(weakMapValue.count).toBe(1);
    expect(snapshot.weakSet.has(key)).toBe(true);
    expect(() => snapshot.weakMap.set(key, 2)).toThrow('immutable snapshot WeakMap');
    expect(() => snapshot.weakMap.delete(key)).toThrow('immutable snapshot WeakMap');
    expect(() => snapshot.weakSet.add({})).toThrow('immutable snapshot WeakSet');
    expect(() => snapshot.weakSet.delete(key)).toThrow('immutable snapshot WeakSet');
    expect(backend.getSafeValue().weakMap.get(key)).toEqual({ count: 1 });
    expect(backend.getSafeValue().weakSet.has(key)).toBe(true);
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
