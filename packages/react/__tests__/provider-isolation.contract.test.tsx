import React, { useCallback } from 'react';
import { act, render } from '@testing-library/react';
import type { ActionResultController } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(release => { resolve = release; });
  return { promise, resolve };
}

function createGate() {
  return { started: deferred(), release: deferred(), signal: undefined as AbortSignal | undefined };
}

function createFixture() {
  const Actions = createActionContext<{ increment: { by: number }; hold: void }, { hold: string }>('RepeatedName');
  const Stores = createStoreContext('RepeatedName', { count: 0 });
  type Resources = {
    store: ReturnType<typeof Stores.useStore<'count'>>;
    manager: ReturnType<typeof Stores.useStoreManager>;
    register: NonNullable<ReturnType<typeof Actions.useActionRegister>>;
    dispatch: ReturnType<typeof Actions.useActionDispatchWithResult>;
    clear: ReturnType<typeof Stores.useStoreClear>;
  };
  const instances = new Map<string, Resources>();

  function Registry({ gate }: { gate?: ReturnType<typeof createGate> }) {
    const store = Stores.useStore('count');
    Actions.useActionHandler('increment', useCallback((payload: { by: number }) => {
      store.setValue(store.getValue() + payload.by);
    }, [store]), { id: 'same-handler' });
    Actions.useActionResultHandler('hold', useCallback(async (
      _payload: void, controller: ActionResultController<void, string>,
    ) => {
      if (gate) {
        gate.signal = controller.signal;
        gate.started.resolve();
        await gate.release.promise;
      }
      return 'held';
    }, [gate]), { id: 'same-hold-handler' });
    return null;
  }

  function Probe({ id }: { id: string }) {
    instances.set(id, {
      store: Stores.useStore('count'),
      manager: Stores.useStoreManager(),
      register: Actions.useActionRegister()!,
      dispatch: Actions.useActionDispatchWithResult(),
      clear: Stores.useStoreClear(),
    });
    return null;
  }

  function Scope({ children, gate }: { children: React.ReactNode; gate?: ReturnType<typeof createGate> }) {
    return (
      <Actions.Provider>
        <Stores.Provider registryId="same-registry-label">
          <Registry gate={gate} />
          {children}
        </Stores.Provider>
      </Actions.Provider>
    );
  }
  return { Actions, Stores, Scope, Probe, instances };
}

describe('Provider instance isolation contracts', () => {
  it.each([false, true])('isolates sibling state, handlers, clear and unmount (StrictMode: %s)', async strict => {
    const { Scope, Probe, instances } = createFixture();
    const tree = (showFirst: boolean) => {
      const children = (
        <>
          {showFirst && <Scope key="first"><Probe id="first" /></Scope>}
          <Scope key="second"><Probe id="second" /></Scope>
        </>
      );
      return strict ? <React.StrictMode>{children}</React.StrictMode> : children;
    };
    const view = render(tree(true));
    try {
      const first = instances.get('first')!;
      const second = instances.get('second')!;
      expect(first.store).not.toBe(second.store);
      expect(first.manager.registry).not.toBe(second.manager.registry);
      expect(first.register).not.toBe(second.register);
      expect(first.register.getHandlerCount('increment')).toBe(1);
      expect(second.register.getHandlerCount('increment')).toBe(1);
      await act(async () => {
        await first.dispatch.dispatch('increment', { by: 2 });
        await second.dispatch.dispatch('increment', { by: 7 });
      });
      expect(first.store.getValue()).toBe(2);
      expect(second.store.getValue()).toBe(7);

      act(() => { first.clear(); });
      const reset = instances.get('first')!;
      expect(first.store.isStoreDisposed()).toBe(true);
      expect(reset.store).not.toBe(first.store);
      expect(reset.store.getValue()).toBe(0);
      expect(second.store.isStoreDisposed()).toBe(false);
      expect(second.store.getValue()).toBe(7);
      await act(async () => { await reset.dispatch.dispatch('increment', { by: 3 }); });
      expect(reset.store.getValue()).toBe(3);

      await act(async () => { view.rerender(tree(false)); });
      expect(reset.store.isStoreDisposed()).toBe(true);
      expect(instances.get('second')!.store).toBe(second.store);
      expect(second.store.isStoreDisposed()).toBe(false);
      await expect(first.dispatch.dispatch('increment', { by: 1 })).rejects.toMatchObject({ name: 'AbortError' });
      await act(async () => { await second.dispatch.dispatch('increment', { by: 1 }); });
      expect(second.store.getValue()).toBe(8);
    } finally {
      view.unmount();
    }
  });

  it.each([false, true])('selects the nearest nested scope and preserves its parent (StrictMode: %s)', async strict => {
    const { Scope, Probe, instances } = createFixture();
    const tree = (showInner: boolean) => {
      const children = (
        <Scope>
          <Probe id="outer" />
          {showInner && <Scope><Probe id="inner" /></Scope>}
          <Probe id="outer-reader" />
        </Scope>
      );
      return strict ? <React.StrictMode>{children}</React.StrictMode> : children;
    };
    const view = render(tree(true));
    try {
      const outer = instances.get('outer')!;
      const inner = instances.get('inner')!;
      expect(instances.get('outer-reader')!.store).toBe(outer.store);
      expect(instances.get('outer-reader')!.register).toBe(outer.register);
      expect(inner.store).not.toBe(outer.store);
      expect(inner.register).not.toBe(outer.register);
      await act(async () => { await inner.dispatch.dispatch('increment', { by: 5 }); });
      expect(inner.store.getValue()).toBe(5);
      expect(outer.store.getValue()).toBe(0);
      await act(async () => { view.rerender(tree(false)); });
      expect(inner.store.isStoreDisposed()).toBe(true);
      expect(outer.store.isStoreDisposed()).toBe(false);
      await act(async () => { await outer.dispatch.dispatch('increment', { by: 4 }); });
      expect(instances.get('outer-reader')!.store.getValue()).toBe(4);
    } finally {
      view.unmount();
    }
  });

  it('aborts only the removed Provider while a sibling dispatch is in flight', async () => {
    const { Scope, Probe, instances } = createFixture();
    const firstGate = createGate();
    const secondGate = createGate();
    const tree = (showFirst: boolean) => (
      <>
        {showFirst && <Scope key="first" gate={firstGate}><Probe id="first" /></Scope>}
        <Scope key="second" gate={secondGate}><Probe id="second" /></Scope>
      </>
    );
    const view = render(tree(true));
    const first = instances.get('first')!.dispatch.dispatchWithResult('hold');
    const firstRejected = expect(first).rejects.toMatchObject({ name: 'AbortError' });
    const second = instances.get('second')!.dispatch.dispatchWithResult('hold');
    try {
      await act(async () => { await Promise.all([firstGate.started.promise, secondGate.started.promise]); });
      await act(async () => { view.rerender(tree(false)); });
      await firstRejected;
      expect(firstGate.signal?.aborted).toBe(true);
      expect(secondGate.signal?.aborted).toBe(false);
      await act(async () => {
        secondGate.release.resolve();
        await expect(second).resolves.toMatchObject({ outcome: 'completed', result: 'held' });
      });
    } finally {
      firstGate.release.resolve();
      secondGate.release.resolve();
      await Promise.allSettled([first, second]);
      view.unmount();
    }
  });

  it('isolates withProvider HOC instances even with identical registry labels', () => {
    const Stores = createStoreContext('HocIsolation', { count: 0 });
    const instances = new Map<string, ReturnType<typeof Stores.useStore<'count'>>>();
    function Probe({ id }: { id: string }) {
      instances.set(id, Stores.useStore('count'));
      return null;
    }
    const Wrapped = Stores.withProvider(Probe, { registryId: 'same-label' });
    const tree = (showFirst: boolean) => (
      <>
        {showFirst && <Wrapped key="first" id="first" />}
        <Wrapped key="second" id="second" />
      </>
    );
    const view = render(tree(true));
    try {
      const first = instances.get('first')!;
      const second = instances.get('second')!;
      expect(first).not.toBe(second);
      first.setValue(9);
      expect(second.getValue()).toBe(0);
      view.rerender(tree(false));
      expect(first.isStoreDisposed()).toBe(true);
      expect(second.isStoreDisposed()).toBe(false);
      expect(instances.get('second')).toBe(second);
    } finally {
      view.unmount();
    }
  });
});
