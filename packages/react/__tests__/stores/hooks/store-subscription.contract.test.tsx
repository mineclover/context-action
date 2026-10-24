import { act, renderHook } from '@testing-library/react';
import {
  createStore,
  type Store,
  useStorePath,
  useStoreSelector,
  useStoreSelectorWithPaths,
  useStoreValue,
} from '@context-action/react';

type State = { value: number | undefined; other: number };
type Equality = (previous: number | undefined, next: number | undefined) => boolean;
const selectionHooks = {
  useStoreValue: (store: Store<State>, equalityFn: Equality) =>
    useStoreValue(store, state => state.value, { equalityFn }),
  useStoreSelector: (store: Store<State>, equalityFn: Equality) =>
    useStoreSelector(store, state => state.value, equalityFn),
  useStorePath: (store: Store<State>, equalityFn: Equality) =>
    useStorePath<State, number | undefined>(store, ['value'], { equalityFn }),
  useStoreSelectorWithPaths: (store: Store<State>, equalityFn: Equality) =>
    useStoreSelectorWithPaths(store, state => state.value, {
      equalityFn, dependsOn: [['value']],
    }),
};

describe('Store selection and notification contracts', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it.each(Object.keys(selectionHooks) as Array<keyof typeof selectionHooks>)(
    '%s applies custom equality when the previous selection is undefined', name => {
      const store = createStore<State>('undefined-selection', { value: undefined, other: 0 });
      const equality = jest.fn<ReturnType<Equality>, Parameters<Equality>>(
        (previous, next) => Object.is(previous, next) || next === 1,
      );
      const useSelected = selectionHooks[name];
      const { result, unmount } = renderHook(() => useSelected(store, equality));
      try {
        expect(result.current).toBeUndefined();
        act(() => {
          store.setValue({ value: 1, other: 0 });
          jest.advanceTimersToNextFrame();
        });
        expect(equality).toHaveBeenCalledWith(undefined, 1);
        expect(result.current).toBeUndefined();
        act(() => {
          store.setValue({ value: 2, other: 0 });
          jest.advanceTimersToNextFrame();
        });
        expect(result.current).toBe(2);
      } finally {
        unmount();
        store.dispose();
      }
    },
  );

  it.each(Object.keys(selectionHooks) as Array<keyof typeof selectionHooks>)(
    '%s ignores unrelated updates and releases its subscription on unmount', name => {
      const store = createStore<State>('selective-updates', { value: 1, other: 0 });
      const useSelected = selectionHooks[name];
      let renders = 0;
      const { result, unmount } = renderHook(() => {
        renders += 1;
        return useSelected(store, Object.is);
      });
      try {
        const initialRenders = renders;
        act(() => {
          store.setValue({ value: 1, other: 1 });
          jest.advanceTimersToNextFrame();
        });
        expect(result.current).toBe(1);
        expect(renders).toBe(initialRenders);
        act(() => {
          store.setValue({ value: 2, other: 1 });
          jest.advanceTimersToNextFrame();
        });
        expect(result.current).toBe(2);
        expect(renders).toBe(initialRenders + 1);
        unmount();
        expect(store.getListenerCount()).toBe(0);
        act(() => {
          store.setValue({ value: 3, other: 1 });
          jest.advanceTimersToNextFrame();
        });
        expect(renders).toBe(initialRenders + 1);
      } finally {
        unmount();
        store.dispose();
      }
    },
  );

  it.each(Object.keys(selectionHooks) as Array<keyof typeof selectionHooks>)(
    '%s resets equality history and subscriptions when replacing the store', name => {
      const first = createStore<State>('first-selection', { value: 1, other: 0 });
      const second = createStore<State>('second-selection', { value: 2, other: 0 });
      const equality = () => true;
      const useSelected = selectionHooks[name];
      const { result, rerender, unmount } = renderHook(
        ({ store }) => useSelected(store, equality),
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
          jest.advanceTimersToNextFrame();
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

  it.each(['known-then-unknown', 'unknown-then-known'] as const)(
    'preserves full path invalidation in a %s notification batch', order => {
      type NullableState = { a: number; b: number } | null;
      const store = createStore<NullableState>('mixed-patch-batch', { a: 0, b: 0 });
      const listener = jest.fn();
      const patches = jest.fn();
      store.subscribe(listener);
      store.subscribeWithPatches(patches);
      let renders = 0;
      const { result, unmount } = renderHook(() => {
        renders += 1;
        return useStorePath<NullableState, number | undefined>(store, ['b']);
      });
      try {
        expect(result.current).toBe(0);
        act(() => {
          if (order === 'known-then-unknown') {
            store.setValue({ a: 1, b: 0 });
            store.setValue(null);
          } else {
            store.setValue(null);
            store.setValue({ a: 0, b: 1 });
            store.setValue({ a: 1, b: 1 });
          }
          jest.advanceTimersToNextFrame();
        });
        expect(result.current).toBe(order === 'known-then-unknown' ? undefined : 1);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(patches).toHaveBeenCalledTimes(1);
        expect(patches).toHaveBeenLastCalledWith(null);
        expect(store.getLastPatches()).toBeNull();

        act(() => {
          store.setValue({ a: 2, b: 2 });
          jest.advanceTimersToNextFrame();
        });
        expect(result.current).toBe(2);
        const previousRenders = renders;
        act(() => {
          store.setValue({ a: 3, b: 2 });
          jest.advanceTimersToNextFrame();
        });
        expect(store.getLastPatches()).not.toBeNull();
        expect(renders).toBe(previousRenders);
      } finally {
        unmount();
        store.dispose();
      }
    },
  );

  it('delivers reentrant full invalidation in the next frame, not the current patch batch', () => {
    type NullableState = { a: number; b: number } | null;
    const store = createStore<NullableState>('reentrant-full-invalidation', { a: 0, b: 0 });
    let notifications = 0;
    store.subscribe(() => {
      notifications += 1;
      if (notifications === 1) store.setValue(null);
    });
    const patches = jest.fn();
    store.subscribeWithPatches(patches);
    const { result, unmount } = renderHook(() =>
      useStorePath<NullableState, number | undefined>(store, ['b']),
    );
    try {
      act(() => {
        store.setValue({ a: 1, b: 0 });
        jest.advanceTimersToNextFrame();
      });
      expect(notifications).toBe(1);
      expect(result.current).toBe(0);
      expect(patches).toHaveBeenNthCalledWith(1, [{ op: 'replace', path: ['a'], value: 1 }]);
      act(() => { jest.advanceTimersToNextFrame(); });
      expect(notifications).toBe(2);
      expect(result.current).toBeUndefined();
      expect(patches).toHaveBeenNthCalledWith(2, null);
    } finally {
      unmount();
      store.dispose();
    }
  });
});
