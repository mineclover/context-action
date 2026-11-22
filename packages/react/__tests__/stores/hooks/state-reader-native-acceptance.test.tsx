import { act, renderHook } from '@testing-library/react';
import {
  createStateStore,
  type StateReader,
  type TimelineBackend,
} from '@context-action/store-core';
import {
  useStorePath,
  useStoreSelector,
  useStoreSelectorWithPaths,
  useStoreValue,
  type StorePathPatch,
} from '@context-action/react';
import {
  useTimeTravelControls,
  useTimeTravelPath,
  useTimeTravelSelector,
} from '@context-action/react/time-travel';
import { useStoreValues } from '../../../src/stores/hooks/useStoreValue';

function createMinimalReader<T>(name: string, initialValue: T) {
  let version = 0;
  let snapshot = { name, value: initialValue, lastUpdate: Date.now() };
  const listeners = new Set<() => void>();

  const reader: StateReader<T, { name: string; value: T; lastUpdate: number }> = {
    name,
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  return {
    reader,
    emit(next: T) {
      version += 1;
      snapshot = { name, value: next, lastUpdate: Date.now() + version };
      for (const listener of [...listeners]) {
        listener();
      }
    },
    listenerCount: () => listeners.size,
  };
}

function createStructuralTimeline<T extends Record<string, unknown>>(
  name: string,
  initialValue: T
) {
  const history: T[] = [initialValue];
  let position = 0;
  let version = 0;
  let snapshot = { name, value: initialValue, version, lastUpdate: Date.now() };
  const listeners = new Set<() => void>();
  const patchListeners = new Set<(patches: readonly StorePathPatch[] | null) => void>();

  const publish = (nextPos: number, patches: readonly StorePathPatch[] | null) => {
    position = nextPos;
    version += 1;
    const current = history[position]!;
    snapshot = { name, value: current, version, lastUpdate: Date.now() + version };
    for (const listener of [...listeners]) {
      listener();
    }
    for (const patchListener of [...patchListeners]) {
      patchListener(patches);
    }
  };

  const timeline: TimelineBackend<T, StorePathPatch> = {
    name,
    getSnapshot: () => snapshot,
    getValue: () => snapshot.value,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    subscribeWithPatches: (listener) => {
      patchListeners.add(listener);
      return () => {
        patchListeners.delete(listener);
      };
    },
    setValue: (value) => {
      history.splice(position + 1);
      history.push(value);
      publish(history.length - 1, null);
    },
    update: (updater) => {
      const next = updater(history[position]!);
      if (next !== undefined) {
        history.splice(position + 1);
        history.push(next);
        publish(history.length - 1, [{ op: 'replace', path: [] }]);
      }
    },
    getHistoryEntryId: () => position,
    hasHistoryEntry: (id) => typeof id === 'number' && id >= 0 && id < history.length,
    canUndo: () => position > 0,
    canRedo: () => position < history.length - 1,
    getPosition: () => position,
    getHistory: () => [...history],
    getHistoryLength: () => history.length,
    undo: (steps = 1) => {
      const target = Math.max(0, position - steps);
      if (target !== position) publish(target, null);
    },
    redo: (steps = 1) => {
      const target = Math.min(history.length - 1, position + steps);
      if (target !== position) publish(target, null);
    },
    goTo: (target) => {
      if (target >= 0 && target < history.length && target !== position) {
        publish(target, null);
      }
    },
    goToHistoryEntry: (id) => {
      if (typeof id === 'number' && id >= 0 && id < history.length && id !== position) {
        publish(id, null);
      }
    },
    reset: () => {
      history.splice(1);
      publish(0, null);
    },
  };

  return { timeline, listenerCount: () => listeners.size + patchListeners.size };
}

describe('M1a · Native StateReader / StateStore / TimelineBackend hook acceptance', () => {
  it('accepts createStateStore() directly in useStoreValue, useStoreValues, useStoreSelector, useStorePath, and useStoreSelectorWithPaths', () => {
    const first = createStateStore('state-core-1', { count: 1, label: 'alpha' });
    const second = createStateStore('state-core-2', { count: 10, label: 'beta' });

    const { result, rerender, unmount } = renderHook(
      ({ store }: { store: typeof first }) => ({
        full: useStoreValue(store),
        countViaSelector: useStoreSelector(store, (state) => state.count),
        labelViaPath: useStorePath<{ count: number; label: string }, string>(
          store,
          ['label']
        ),
        combinedViaPaths: useStoreSelectorWithPaths(
          store,
          (state) => `${state.label}:${state.count}`,
          { dependsOn: [['label'], ['count']] }
        ),
        multi: useStoreValues(store, {
          count: (state) => state.count,
          label: (state) => state.label,
        }),
      }),
      { initialProps: { store: first } }
    );

    expect(result.current.full).toEqual({ count: 1, label: 'alpha' });
    expect(result.current.countViaSelector).toBe(1);
    expect(result.current.labelViaPath).toBe('alpha');
    expect(result.current.combinedViaPaths).toBe('alpha:1');
    expect(result.current.multi).toEqual({ count: 1, label: 'alpha' });

    act(() => {
      first.setValue({ count: 2, label: 'alpha-2' });
    });

    expect(result.current.full).toEqual({ count: 2, label: 'alpha-2' });
    expect(result.current.countViaSelector).toBe(2);
    expect(result.current.labelViaPath).toBe('alpha-2');
    expect(result.current.combinedViaPaths).toBe('alpha-2:2');
    expect(result.current.multi).toEqual({ count: 2, label: 'alpha-2' });

    // Store instance swap resets selection cleanly
    rerender({ store: second });
    expect(result.current.full).toEqual({ count: 10, label: 'beta' });
    expect(result.current.countViaSelector).toBe(10);
    expect(result.current.labelViaPath).toBe('beta');

    unmount();

    const nullable = renderHook(
      ({ store }: { store: typeof first | undefined }) => ({
        full: useStoreValue(store),
        multi: useStoreValues(store, { count: (state) => state.count }),
      }),
      { initialProps: { store: undefined as typeof first | undefined } }
    );
    expect(nullable.result.current.full).toBeUndefined();
    expect(nullable.result.current.multi).toBeUndefined();
    nullable.unmount();
    first.dispose?.();
    second.dispose?.();
  });

  it('accepts a minimal read-only StateReader (no getValue or setValue) directly', () => {
    const fixture = createMinimalReader('minimal-reader', { nested: { status: 'idle' } });

    const { result, unmount } = renderHook(() => ({
      whole: useStoreValue(fixture.reader),
      statusSelector: useStoreSelector(fixture.reader, (s) => s.nested.status),
      statusPath: useStorePath<{ nested: { status: string } }, string>(
        fixture.reader,
        ['nested', 'status']
      ),
    }));

    expect(result.current).toEqual({
      whole: { nested: { status: 'idle' } },
      statusSelector: 'idle',
      statusPath: 'idle',
    });

    act(() => {
      fixture.emit({ nested: { status: 'ready' } });
    });

    expect(result.current).toEqual({
      whole: { nested: { status: 'ready' } },
      statusSelector: 'ready',
      statusPath: 'ready',
    });

    unmount();
    expect(fixture.listenerCount()).toBe(0);
  });

  it('accepts a structural TimelineBackend directly in useTimeTravelControls, useTimeTravelPath, and useTimeTravelSelector', () => {
    const fixture = createStructuralTimeline('structural-tt', { step: 0, note: 'start' });

    const { result, unmount } = renderHook(() => ({
      controls: useTimeTravelControls(fixture.timeline),
      step: useTimeTravelPath<{ step: number; note: string }, number>(
        fixture.timeline,
        ['step']
      ),
      summary: useTimeTravelSelector(
        fixture.timeline,
        (state) => `${state.step}:${state.note}`,
        { dependsOn: [['step'], ['note']] }
      ),
    }));

    expect(result.current.controls).toMatchObject({
      canUndo: false,
      canRedo: false,
      position: 0,
      historyLength: 1,
    });
    expect(result.current.step).toBe(0);
    expect(result.current.summary).toBe('0:start');

    act(() => {
      fixture.timeline.setValue({ step: 1, note: 'edited' });
    });

    expect(result.current.controls).toMatchObject({
      canUndo: true,
      canRedo: false,
      position: 1,
      historyLength: 2,
    });
    expect(result.current.step).toBe(1);
    expect(result.current.summary).toBe('1:edited');

    act(() => {
      result.current.controls.undo();
    });

    expect(result.current.controls).toMatchObject({
      canUndo: false,
      canRedo: true,
      position: 0,
      historyLength: 2,
    });
    expect(result.current.step).toBe(0);

    unmount();
    expect(fixture.listenerCount()).toBe(0);
  });
});
