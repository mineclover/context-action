import { describe, expect, it, vi } from 'vitest';
import {
  createTimeTravel,
  deepClone,
  deepCloneValue,
  isNonCloneableType,
} from '../src';

describe('@context-action/mutative time-travel core contract propagation', () => {
  it('replays Set history with insertion order intact', () => {
    const timeTravel = createTimeTravel({ values: new Set([1, 2]) });

    timeTravel.setState((draft) => {
      draft.values.delete(1);
      draft.values.add(3);
    });
    timeTravel.back();

    expect([...timeTravel.getState().values]).toEqual([1, 2]);
  });

  it('propagates enableAutoFreeze to state updates', () => {
    const timeTravel = createTimeTravel(
      { nested: { count: 0 } },
      { enableAutoFreeze: true }
    );

    timeTravel.setState((draft) => {
      draft.nested.count = 1;
    });

    expect(Object.isFrozen(timeTravel.getState())).toBe(true);
    expect(Object.isFrozen(timeTravel.getState().nested)).toBe(true);
  });

  it('recognizes functions as non-cloneable and safely clones cyclic structures', () => {
    const fn = () => 'ok';
    expect(isNonCloneableType(fn)).toBe(true);

    const cyclicObj: Record<string, unknown> = { fn, nested: [1] };
    cyclicObj.self = cyclicObj;
    (cyclicObj.nested as unknown[]).push(cyclicObj.nested);

    const cloned = deepClone(cyclicObj);
    expect(cloned).not.toBe(cyclicObj);
    expect(cloned.self).toBe(cloned);
    expect(cloned.fn).toBe(fn);
    expect(cloned.nested).not.toBe(cyclicObj.nested);
    expect((cloned.nested as unknown[])[1]).toBe(cloned.nested);

    const clonedFromUtil = deepCloneValue(cyclicObj) as Record<string, unknown>;
    expect(clonedFromUtil.self).toBe(clonedFromUtil);
    expect(clonedFromUtil.fn).toBe(fn);
  });

  it('replaces state with undefined cleanly outside and inside batches', () => {
    const timeTravel = createTimeTravel<{ count: number } | undefined>({ count: 1 });
    timeTravel.setState(undefined);
    expect(timeTravel.getState()).toBeUndefined();

    timeTravel.setState({ count: 2 });
    timeTravel.beginBatch();
    timeTravel.setState(undefined);
    timeTravel.endBatch();
    expect(timeTravel.getState()).toBeUndefined();
  });

  it('returns defensive copies even on TimeTravel.getHistory() cache hits', () => {
    const timeTravel = createTimeTravel({ nested: { count: 0 } });
    timeTravel.setState(draft => {
      draft.nested.count = 1;
    });

    const firstRead = timeTravel.getHistory();
    const secondRead = timeTravel.getHistory();

    expect(secondRead[0]).not.toBe(firstRead[0]);
    expect(secondRead[1]).not.toBe(timeTravel.getState());
    (secondRead[0] as { nested: { count: number } }).nested.count = 999;

    const thirdRead = timeTravel.getHistory();
    expect(thirdRead[0]).toEqual({ nested: { count: 0 } });
    expect(timeTravel.getState()).toEqual({ nested: { count: 1 } });
  });

  it('keeps manual historyEntryIds bounded and supports goToHistoryEntry with pending temp patches', () => {
    const timeTravel = createTimeTravel(
      { count: 0 },
      { autoArchive: false, maxHistory: 2 },
    );

    const id0 = timeTravel.getHistoryEntryId();
    timeTravel.setState(draft => { draft.count = 1; });
    timeTravel.archive();
    const id1 = timeTravel.getHistoryEntryId();

    timeTravel.setState(draft => { draft.count = 2; });
    timeTravel.archive();
    const id2 = timeTravel.getHistoryEntryId();

    timeTravel.setState(draft => { draft.count = 3; });
    const id3 = timeTravel.getHistoryEntryId();

    expect(id3).toBeDefined();
    expect(timeTravel.hasHistoryEntry(id0)).toBe(false);
    expect(timeTravel.hasHistoryEntry(id1)).toBe(true);
    expect(timeTravel.hasHistoryEntry(id2)).toBe(true);

    timeTravel.goToHistoryEntry(id1);
    expect(timeTravel.getState()).toEqual({ count: 1 });
    timeTravel.goToHistoryEntry(id3);
    expect(timeTravel.getState()).toEqual({ count: 3 });
  });

  it('notifies restoration on cancelBatch after go/reset without creating a forward entry on endBatch', () => {
    const timeTravel = createTimeTravel({ count: 0 });
    timeTravel.setState(draft => { draft.count = 1; });
    timeTravel.setState(draft => { draft.count = 2; });

    const listener = vi.fn();
    timeTravel.subscribe(listener);

    timeTravel.beginBatch();
    timeTravel.back();
    expect(timeTravel.getState()).toEqual({ count: 1 });
    listener.mockClear();

    timeTravel.cancelBatch();
    expect(timeTravel.getState()).toEqual({ count: 2 });
    expect(timeTravel.getPosition()).toBe(2);
    expect(listener).toHaveBeenCalledTimes(1);

    timeTravel.beginBatch();
    timeTravel.reset();
    listener.mockClear();
    timeTravel.cancelBatch();
    expect(timeTravel.getState()).toEqual({ count: 2 });
    expect(timeTravel.getPosition()).toBe(2);
    expect(listener).toHaveBeenCalledTimes(1);

    timeTravel.beginBatch();
    timeTravel.back();
    timeTravel.endBatch();
    expect(timeTravel.getPosition()).toBe(1);
    expect(timeTravel.getHistoryLength()).toBe(3);
  });
});
