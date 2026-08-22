import React, { Activity } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { createStoreContext } from '../../../src/stores/patterns/declarative-store-pattern-v2';
import { createTimeTravelStoreContext } from '../../../src/stores/patterns/time-travel-store-pattern';
import { useStoreValue } from '../../../src/stores/hooks/useStoreValue';

describe('store providers in React Activity boundaries', () => {
  it('keeps a declarative store and its value through hide and reveal', async () => {
    const Stores = createStoreContext('ActivityDeclarativeStore', {
      counter: { count: 0 },
    });
    let counterStore: ReturnType<typeof Stores.useStore<'counter'>> | undefined;

    function Counter() {
      counterStore = Stores.useStore('counter');
      useStoreValue(counterStore);
      return null;
    }

    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <Stores.Provider>
          <Counter />
        </Stores.Provider>
      </Activity>
    );

    const view = render(tree('visible'));
    const originalStore = counterStore!;

    act(() => {
      originalStore.setValue({ count: 1 });
    });
    await waitFor(() => expect(originalStore.getValue()).toEqual({ count: 1 }));

    await act(async () => {
      view.rerender(tree('hidden'));
      await Promise.resolve();
    });
    expect(originalStore.isStoreDisposed()).toBe(false);

    await act(async () => {
      view.rerender(tree('visible'));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(counterStore).toBe(originalStore);
      expect(counterStore?.getValue()).toEqual({ count: 1 });
    });

    view.unmount();
    expect(originalStore.isStoreDisposed()).toBe(true);
  });

  it('keeps time-travel history through hide and reveal', async () => {
    const Stores = createTimeTravelStoreContext('ActivityTimeTravelStore', {
      counter: { initialValue: { count: 0 } },
    });
    let counterStore: ReturnType<typeof Stores.useTimeTravelStore<'counter'>> | undefined;

    function Counter() {
      counterStore = Stores.useTimeTravelStore('counter');
      useStoreValue(counterStore);
      return null;
    }

    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <Stores.Provider>
          <Counter />
        </Stores.Provider>
      </Activity>
    );

    const view = render(tree('visible'));
    const originalStore = counterStore!;

    act(() => {
      originalStore.setValue({ count: 1 });
    });
    await waitFor(() => expect(originalStore.getValue()).toEqual({ count: 1 }));
    expect(originalStore.canUndo()).toBe(true);
    expect(originalStore.getHistory()).toHaveLength(2);

    await act(async () => {
      view.rerender(tree('hidden'));
      await Promise.resolve();
    });
    expect(originalStore.isStoreDisposed()).toBe(false);

    await act(async () => {
      view.rerender(tree('visible'));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(counterStore).toBe(originalStore);
      expect(counterStore?.getValue()).toEqual({ count: 1 });
    });
    expect(originalStore.canUndo()).toBe(true);
    expect(originalStore.getHistory()).toHaveLength(2);

    act(() => {
      originalStore.undo();
    });
    await waitFor(() => expect(originalStore.getValue()).toEqual({ count: 0 }));

    view.unmount();
    expect(originalStore.isStoreDisposed()).toBe(true);
  });

  it('keeps a withProvider declarative store through hide and reveal', async () => {
    const Stores = createStoreContext('ActivityDeclarativeStoreHOC', {
      counter: { count: 0 },
    });
    let counterStore: ReturnType<typeof Stores.useStore<'counter'>> | undefined;

    function Counter() {
      counterStore = Stores.useStore('counter');
      useStoreValue(counterStore);
      return null;
    }

    const CounterWithProvider = Stores.withProvider(Counter);
    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <CounterWithProvider />
      </Activity>
    );

    const view = render(tree('visible'));
    const originalStore = counterStore!;
    act(() => {
      originalStore.setValue({ count: 1 });
    });

    await act(async () => {
      view.rerender(tree('hidden'));
      await Promise.resolve();
    });
    expect(originalStore.isStoreDisposed()).toBe(false);

    await act(async () => {
      view.rerender(tree('visible'));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(counterStore).toBe(originalStore);
      expect(counterStore?.getValue()).toEqual({ count: 1 });
    });

    view.unmount();
    expect(originalStore.isStoreDisposed()).toBe(true);
  });

  it('keeps a withProvider time-travel history through hide and reveal', async () => {
    const Stores = createTimeTravelStoreContext('ActivityTimeTravelStoreHOC', {
      counter: { initialValue: { count: 0 } },
    });
    let counterStore: ReturnType<typeof Stores.useTimeTravelStore<'counter'>> | undefined;

    function Counter() {
      counterStore = Stores.useTimeTravelStore('counter');
      useStoreValue(counterStore);
      return null;
    }

    const CounterWithProvider = Stores.withProvider(Counter);
    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <CounterWithProvider />
      </Activity>
    );

    const view = render(tree('visible'));
    const originalStore = counterStore!;
    act(() => {
      originalStore.setValue({ count: 1 });
    });
    expect(originalStore.canUndo()).toBe(true);

    await act(async () => {
      view.rerender(tree('hidden'));
      await Promise.resolve();
    });
    expect(originalStore.isStoreDisposed()).toBe(false);

    await act(async () => {
      view.rerender(tree('visible'));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(counterStore).toBe(originalStore);
      expect(counterStore?.getValue()).toEqual({ count: 1 });
    });
    expect(originalStore.canUndo()).toBe(true);

    view.unmount();
    expect(originalStore.isStoreDisposed()).toBe(true);
  });
});
