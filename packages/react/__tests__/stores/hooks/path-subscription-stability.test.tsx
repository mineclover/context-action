import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { createStore } from '../../../src/stores/core/Store';
import { createTimeTravelStore } from '../../../src/stores/core/TimeTravelStore';
import {
  useStorePath,
  useStoreSelectorWithPaths,
} from '../../../src/stores/hooks/useStorePath';
import {
  useTimeTravelPath,
  useTimeTravelSelector,
} from '../../../src/stores/hooks/useTimeTravelPath';
import { createTimeTravelStoreContext } from '../../../src/stores/patterns/time-travel-store-pattern';
import {
  createPathSignature,
  createPathsSignature,
} from '../../../src/stores/utils/path-signature';

type CollisionState = {
  'a.b': string;
  a: { b: string };
};

describe('path subscription signatures', () => {
  it('preserves segment types and path boundaries without special-character collisions', () => {
    expect(createPathSignature([1])).not.toBe(createPathSignature(['1']));
    expect(createPathSignature(['a.b'])).not.toBe(createPathSignature(['a', 'b']));
    expect(createPathSignature(['a|b', '~', '/'])).not.toBe(
      createPathSignature(['a', 'b|~', '/'])
    );
    expect(createPathsSignature([['a|b']])).not.toBe(
      createPathsSignature([['a'], ['b']])
    );
    expect(createPathsSignature([['b'], ['a']])).toBe(
      createPathsSignature([['a'], ['b']])
    );
  });

  it('updates standalone hook snapshots when switching between dotted and nested paths', async () => {
    const store = createStore<CollisionState>('standalone-path-collision', {
      'a.b': 'flat',
      a: { b: 'nested' },
    });

    function PathValue({ nested }: { nested: boolean }) {
      const value = useStorePath<CollisionState, string>(
        store,
        nested ? ['a', 'b'] : ['a.b']
      );
      return <span data-testid="standalone-path">{value}</span>;
    }

    function SelectedValue({ nested }: { nested: boolean }) {
      const value = useStoreSelectorWithPaths(
        store,
        (state) => (nested ? state.a.b : state['a.b']),
        { dependsOn: [nested ? ['a', 'b'] : ['a.b']] }
      );
      return <span data-testid="standalone-selector">{value}</span>;
    }

    const { rerender, unmount } = render(
      <>
        <PathValue nested={false} />
        <SelectedValue nested={false} />
      </>
    );

    expect(screen.getByTestId('standalone-path')).toHaveTextContent('flat');
    expect(screen.getByTestId('standalone-selector')).toHaveTextContent('flat');

    rerender(
      <>
        <PathValue nested />
        <SelectedValue nested />
      </>
    );

    expect(screen.getByTestId('standalone-path')).toHaveTextContent('nested');
    expect(screen.getByTestId('standalone-selector')).toHaveTextContent('nested');

    act(() => {
      store.update((draft) => {
        draft.a.b = 'nested-updated';
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('standalone-path')).toHaveTextContent('nested-updated');
      expect(screen.getByTestId('standalone-selector')).toHaveTextContent('nested-updated');
    });

    rerender(
      <>
        <PathValue nested={false} />
        <SelectedValue nested={false} />
      </>
    );

    expect(screen.getByTestId('standalone-path')).toHaveTextContent('flat');
    expect(screen.getByTestId('standalone-selector')).toHaveTextContent('flat');

    act(() => {
      store.update((draft) => {
        draft['a.b'] = 'flat-updated';
        return draft;
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('standalone-path')).toHaveTextContent('flat-updated');
      expect(screen.getByTestId('standalone-selector')).toHaveTextContent('flat-updated');
    });

    unmount();
    store.dispose();
  });

  it('resets the time-travel path cache and refreshes dependency snapshots on signature changes', async () => {
    const store = createTimeTravelStore<CollisionState>('time-travel-path-collision', {
      'a.b': 'flat',
      a: { b: 'nested' },
    });
    let subscribeCount = 0;
    const originalSubscribeWithPatches = store.subscribeWithPatches;
    store.subscribeWithPatches = (listener) => {
      subscribeCount += 1;
      return originalSubscribeWithPatches(listener);
    };

    function PathValue({ nested }: { nested: boolean }) {
      const value = useTimeTravelPath<CollisionState, string>(
        store,
        nested ? ['a', 'b'] : ['a.b'],
        { equalityFn: (previous, current) => previous === 'flat' && current === 'nested' }
      );
      return <span data-testid="time-travel-path">{value}</span>;
    }

    function SelectedValue({ nested }: { nested: boolean }) {
      const value = useTimeTravelSelector(
        store,
        (state) => (nested ? state.a.b : state['a.b']),
        { dependsOn: [nested ? ['a', 'b'] : ['a.b']] }
      );
      return <span data-testid="time-travel-selector">{value}</span>;
    }

    const { rerender, unmount } = render(
      <>
        <PathValue nested={false} />
        <SelectedValue nested={false} />
      </>
    );

    expect(screen.getByTestId('time-travel-path')).toHaveTextContent('flat');
    const initialSubscribeCount = subscribeCount;

    rerender(
      <>
        <PathValue nested={false} />
        <SelectedValue nested={false} />
      </>
    );
    expect(subscribeCount).toBe(initialSubscribeCount);

    rerender(
      <>
        <PathValue nested />
        <SelectedValue nested />
      </>
    );

    expect(screen.getByTestId('time-travel-path')).toHaveTextContent('nested');
    expect(screen.getByTestId('time-travel-selector')).toHaveTextContent('nested');

    act(() => {
      store.setValue({ 'a.b': 'flat', a: { b: 'nested-updated' } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('time-travel-path')).toHaveTextContent('nested-updated');
      expect(screen.getByTestId('time-travel-selector')).toHaveTextContent('nested-updated');
    });

    rerender(
      <>
        <PathValue nested={false} />
        <SelectedValue nested={false} />
      </>
    );

    expect(screen.getByTestId('time-travel-path')).toHaveTextContent('flat');
    expect(screen.getByTestId('time-travel-selector')).toHaveTextContent('flat');

    act(() => {
      store.setValue({ 'a.b': 'flat-updated', a: { b: 'nested-updated' } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('time-travel-path')).toHaveTextContent('flat-updated');
      expect(screen.getByTestId('time-travel-selector')).toHaveTextContent('flat-updated');
    });

    unmount();
    store.dispose();
  });

  it('refreshes context hook path and dependsOn snapshots after a colliding legacy key transition', async () => {
    const {
      Provider,
      useStore,
      useStorePath: useContextStorePath,
      useStoreSelector,
    } = createTimeTravelStoreContext<{ value: CollisionState }>('PathCollisionContext', {
      value: { initialValue: { 'a.b': 'flat', a: { b: 'nested' } } },
    });

    function Values({ nested }: { nested: boolean }) {
      const pathValue = useContextStorePath<'value', string>(
        'value',
        nested ? ['a', 'b'] : ['a.b']
      );
      const selectedValue = useStoreSelector(
        'value',
        (state) => (nested ? state.a.b : state['a.b']),
        { dependsOn: [nested ? ['a', 'b'] : ['a.b']] }
      );

      return (
        <>
          <span data-testid="context-path">{pathValue}</span>
          <span data-testid="context-selector">{selectedValue}</span>
        </>
      );
    }

    function UpdateNestedValue() {
      const store = useStore('value');
      return (
        <>
          <button
            type="button"
            onClick={() => store.setValue({ 'a.b': 'flat', a: { b: 'nested-updated' } })}
          >
            update nested
          </button>
          <button
            type="button"
            onClick={() => store.setValue({ 'a.b': 'flat-updated', a: { b: 'nested-updated' } })}
          >
            update flat
          </button>
        </>
      );
    }

    const { rerender } = render(
      <Provider>
        <Values nested={false} />
        <UpdateNestedValue />
      </Provider>
    );

    expect(screen.getByTestId('context-path')).toHaveTextContent('flat');
    expect(screen.getByTestId('context-selector')).toHaveTextContent('flat');

    rerender(
      <Provider>
        <Values nested />
        <UpdateNestedValue />
      </Provider>
    );

    expect(screen.getByTestId('context-path')).toHaveTextContent('nested');
    expect(screen.getByTestId('context-selector')).toHaveTextContent('nested');

    act(() => {
      screen.getByRole('button', { name: 'update nested' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('context-path')).toHaveTextContent('nested-updated');
      expect(screen.getByTestId('context-selector')).toHaveTextContent('nested-updated');
    });

    rerender(
      <Provider>
        <Values nested={false} />
        <UpdateNestedValue />
      </Provider>
    );

    expect(screen.getByTestId('context-path')).toHaveTextContent('flat');
    expect(screen.getByTestId('context-selector')).toHaveTextContent('flat');

    act(() => {
      screen.getByRole('button', { name: 'update flat' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('context-path')).toHaveTextContent('flat-updated');
      expect(screen.getByTestId('context-selector')).toHaveTextContent('flat-updated');
    });
  });
});
