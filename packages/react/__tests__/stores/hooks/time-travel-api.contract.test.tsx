import { act, renderHook } from '@testing-library/react';
import {
  createTimeTravelStore,
  type TimeTravelStore,
  useTimeTravelControls,
  useTimeTravelPath,
  useTimeTravelSelector,
} from '@context-action/react';

type State = { value: number | undefined; other: number };
type Equality = (previous: number | undefined, next: number | undefined) => boolean;
const selectionHooks = {
  useTimeTravelPath: (store: TimeTravelStore<State>, equalityFn: Equality) =>
    useTimeTravelPath<State, number | undefined>(store, ['value'], { equalityFn }),
  useTimeTravelSelector: (store: TimeTravelStore<State>, equalityFn: Equality) =>
    useTimeTravelSelector(store, state => state.value, { equalityFn, dependsOn: [['value']] }),
};

describe('Public Time Travel API contracts', () => {
  it.each(Object.keys(selectionHooks) as Array<keyof typeof selectionHooks>)(
    '%s resets selection history when replacing the Store', name => {
      const first = createTimeTravelStore<State>('first', { value: 1, other: 0 });
      const second = createTimeTravelStore<State>('second', { value: 2, other: 0 });
      const useSelected = selectionHooks[name];
      const { result, rerender, unmount } = renderHook(
        ({ store }) => useSelected(store, () => true),
        { initialProps: { store: first } },
      );
      try {
        expect(result.current).toBe(1);
        rerender({ store: second });
        expect(result.current).toBe(2);
        expect(first.getListenerCount()).toBe(0);
        expect(second.getListenerCount()).toBe(1);
        act(() => {
          first.setValue({ value: 3, other: 0 });
          second.setValue({ value: 4, other: 0 });
        });
        expect(result.current).toBe(2);
      } finally {
        unmount();
        expect(second.getListenerCount()).toBe(0);
        first.dispose();
        second.dispose();
      }
    },
  );

  it.each(Object.keys(selectionHooks) as Array<keyof typeof selectionHooks>)(
    '%s applies custom equality to an undefined selection and preserves it through undo/redo', name => {
      const store = createTimeTravelStore<State>('undefined', { value: undefined, other: 0 });
      const equality = jest.fn<ReturnType<Equality>, Parameters<Equality>>(
        (previous, next) => Object.is(previous, next) || next === 1,
      );
      const useSelected = selectionHooks[name];
      const { result, unmount } = renderHook(() => useSelected(store, equality));
      try {
        expect(result.current).toBeUndefined();
        act(() => { store.setValue({ value: 1, other: 0 }); });
        expect(equality).toHaveBeenCalledWith(undefined, 1);
        expect(result.current).toBeUndefined();
        act(() => { store.setValue({ value: 2, other: 0 }); });
        expect(result.current).toBe(2);
        act(() => { store.undo(); });
        expect(result.current).toBe(2); // Custom equality intentionally retains 2 for a new value of 1.
        act(() => { store.undo(); });
        expect(result.current).toBeUndefined();
        act(() => { store.redo(2); });
        expect(result.current).toBe(2);
      } finally {
        unmount();
        expect(store.getListenerCount()).toBe(0);
        store.dispose();
      }
    },
  );

  it('exposes reactive undo, redo, goTo, reset controls and cleans up on Store replacement', () => {
    const first = createTimeTravelStore('controls-first', { value: 0 });
    const second = createTimeTravelStore('controls-second', { value: 10 });
    const { result, rerender, unmount } = renderHook(
      ({ store }) => useTimeTravelControls(store),
      { initialProps: { store: first } },
    );
    try {
      expect(result.current).toMatchObject({ canUndo: false, canRedo: false, position: 0, historyLength: first.getHistoryLength() });
      const initialUndo = result.current.undo;
      act(() => {
        first.setValue({ value: 1 });
        first.setValue({ value: 2 });
      });
      expect(result.current).toMatchObject({ canUndo: true, canRedo: false, position: 2, historyLength: first.getHistoryLength() });
      expect(result.current.undo).toBe(initialUndo);
      act(() => { result.current.undo(); });
      expect(first.getValue()).toEqual({ value: 1 });
      expect(result.current).toMatchObject({ canUndo: true, canRedo: true, position: 1 });
      act(() => { result.current.redo(); });
      expect(first.getValue()).toEqual({ value: 2 });
      act(() => { result.current.goTo(0); });
      expect(first.getValue()).toEqual({ value: 0 });
      act(() => { result.current.reset(); });
      expect(result.current).toMatchObject({ canUndo: false, canRedo: false, position: 0, historyLength: first.getHistoryLength() });
      rerender({ store: second });
      expect(result.current.undo).not.toBe(initialUndo);
      expect(first.getListenerCount()).toBe(0);
      expect(second.getListenerCount()).toBe(1);
      act(() => { second.setValue({ value: 11 }); });
      act(() => { result.current.undo(); });
      expect(second.getValue()).toEqual({ value: 10 });
      expect(first.getValue()).toEqual({ value: 0 });
    } finally {
      unmount();
      expect(second.getListenerCount()).toBe(0);
      first.dispose();
      second.dispose();
    }
  });

  it('reads history length without materializing the history entries', () => {
    const store = createTimeTravelStore('metadata-only-controls', { value: 0 });
    store.setValue({ value: 1 });
    const getHistory = jest.spyOn(store, 'getHistory');
    const { result, unmount } = renderHook(() => useTimeTravelControls(store));
    try {
      expect(result.current.historyLength).toBe(store.getHistoryLength());
      expect(getHistory).not.toHaveBeenCalled();
    } finally {
      unmount();
      getHistory.mockRestore();
      store.dispose();
    }
  });
});
