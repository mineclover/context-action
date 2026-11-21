/**
 * @fileoverview Tests for headless-first Store / StoreManager dependency injection on createStoreContext().Provider.
 */

import { act, render, waitFor } from '@testing-library/react';
import React, { Activity } from 'react';
import {
  ActionRegister,
  type ActionPayloadMap,
} from '@context-action/core';
import {
  createActionContext,
  createStore,
  createStoreContext,
  StoreManager,
  useStoreValue,
  type Store,
} from '@context-action/react';

interface SessionState {
  user: string | null;
  visits: number;
}

interface DraftState {
  text: string;
}

interface AppStoreShape {
  session: SessionState;
  draft: DraftState;
}

describe('Headless Store / StoreManager DI on createStoreContext.Provider', () => {
  it('routes React store hooks to an externally created StoreManager with shared ownership and survives unmount/remount', async () => {
    const externalManager = new StoreManager<AppStoreShape>('HeadlessSharedManager', {
      session: { user: null, visits: 0 },
      draft: { text: '' },
    });

    const sessionStore = externalManager.getStore('session');
    sessionStore.setValue({ user: 'alice', visits: 1 });

    const AppStores = createStoreContext<AppStoreShape>('AppStores', {
      session: { user: null, visits: 0 },
      draft: { text: '' },
    });

    let resolvedManager: StoreManager<AppStoreShape> | undefined;
    let resolvedSessionStore: Store<SessionState> | undefined;

    function SessionBadge() {
      resolvedManager = AppStores.useStoreManager();
      resolvedSessionStore = AppStores.useStore('session');
      const session = useStoreValue(resolvedSessionStore);
      return (
        <span data-testid="session">
          {session.user ?? 'anon'}:{session.visits}
        </span>
      );
    }

    const firstView = render(
      <AppStores.Provider manager={externalManager}>
        <SessionBadge />
      </AppStores.Provider>
    );

    expect(resolvedManager).toBe(externalManager);
    expect(resolvedSessionStore).toBe(sessionStore);
    expect(firstView.getByTestId('session').textContent).toBe('alice:1');

    act(() => {
      sessionStore.setValue({ user: 'alice', visits: 2 });
    });
    await waitFor(() => {
      expect(firstView.getByTestId('session').textContent).toBe('alice:2');
    });

    // Default ownership is 'shared': unmount preserves external manager & stores.
    firstView.unmount();
    expect(sessionStore.isStoreDisposed()).toBe(false);
    expect(sessionStore.getValue()).toEqual({ user: 'alice', visits: 2 });

    act(() => {
      sessionStore.setValue({ user: 'bob', visits: 3 });
    });

    // Remounting picks up live external store state cleanly.
    const secondView = render(
      <AppStores.Provider manager={externalManager}>
        <SessionBadge />
      </AppStores.Provider>
    );
    expect(secondView.getByTestId('session').textContent).toBe('bob:3');

    secondView.unmount();
    externalManager.dispose();
  });

  it('supports partial external stores map, preserves shared stores on inline re-renders/clear/unmount, and disposes internal sibling stores', () => {
    const externalSession = createStore<SessionState>('session', {
      user: 'headless-user',
      visits: 5,
    });

    const AppStores = createStoreContext<AppStoreShape>('PartialStores', {
      session: { user: null, visits: 0 },
      draft: { text: 'initial-draft' },
    });

    let observedSession: Store<SessionState> | undefined;
    let observedDraft: Store<DraftState> | undefined;
    let clearStores: (() => void) | undefined;

    function Panel({ tick }: { tick: number }) {
      observedSession = AppStores.useStore('session');
      observedDraft = AppStores.useStore('draft');
      clearStores = AppStores.useStoreClear();
      const session = useStoreValue(observedSession);
      const draft = useStoreValue(observedDraft);
      return (
        <div data-testid="panel">
          {tick}:{session.user}:{draft.text}
        </div>
      );
    }

    const view = render(
      <AppStores.Provider stores={{ session: externalSession }}>
        <Panel tick={1} />
      </AppStores.Provider>
    );

    expect(observedSession).toBe(externalSession);
    const initialDraftStore = observedDraft!;
    expect(initialDraftStore.getValue()).toEqual({ text: 'initial-draft' });
    expect(view.getByTestId('panel').textContent).toBe('1:headless-user:initial-draft');

    act(() => {
      initialDraftStore.setValue({ text: 'edited' });
    });

    // Passing a fresh inline object literal with the same store references must not recreate the manager.
    view.rerender(
      <AppStores.Provider stores={{ session: externalSession }}>
        <Panel tick={2} />
      </AppStores.Provider>
    );
    expect(observedDraft).toBe(initialDraftStore);
    expect(observedDraft?.getValue()).toEqual({ text: 'edited' });
    expect(view.getByTestId('panel').textContent).toBe('2:headless-user:edited');

    // useStoreClear resets manager-owned stores ('draft') without disposing shared external 'session'.
    act(() => {
      clearStores?.();
    });
    expect(initialDraftStore.isStoreDisposed()).toBe(true);
    expect(externalSession.isStoreDisposed()).toBe(false);
    expect(externalSession.getValue()).toEqual({ user: 'headless-user', visits: 5 });

    const recreatedDraftStore = observedDraft!;
    expect(recreatedDraftStore).not.toBe(initialDraftStore);
    expect(recreatedDraftStore.isStoreDisposed()).toBe(false);
    expect(recreatedDraftStore.getValue()).toEqual({ text: 'initial-draft' });

    // Unmount disposes internal lazy stores while leaving shared externalStore alive.
    view.unmount();
    expect(recreatedDraftStore.isStoreDisposed()).toBe(true);
    expect(externalSession.isStoreDisposed()).toBe(false);

    externalSession.dispose();
  });

  it('disposes injected manager and injected stores on unmount when ownership is owned', () => {
    const ownedManager = new StoreManager<AppStoreShape>('OwnedManager', {
      session: { user: null, visits: 0 },
      draft: { text: '' },
    });
    const managedSession = ownedManager.getStore('session');

    const OwnedStoresContext = createStoreContext<AppStoreShape>('OwnedManagerContext', {
      session: { user: null, visits: 0 },
      draft: { text: '' },
    });

    const managerView = render(
      <OwnedStoresContext.Provider manager={ownedManager} ownership="owned">
        <div />
      </OwnedStoresContext.Provider>
    );
    expect(managedSession.isStoreDisposed()).toBe(false);
    managerView.unmount();
    expect(managedSession.isStoreDisposed()).toBe(true);

    const ownedExternalSession = createStore<SessionState>('owned-session', {
      user: 'temp',
      visits: 1,
    });
    const storesView = render(
      <OwnedStoresContext.Provider
        stores={{ session: ownedExternalSession }}
        ownership="owned"
      >
        <div />
      </OwnedStoresContext.Provider>
    );
    expect(ownedExternalSession.isStoreDisposed()).toBe(false);
    storesView.unmount();
    expect(ownedExternalSession.isStoreDisposed()).toBe(true);
  });

  it('respects each manager ownership policy when swapping from a shared manager to an owned manager', () => {
    const sharedMgr = new StoreManager<AppStoreShape>('SharedA', {
      session: { user: 'a', visits: 1 },
      draft: { text: 'a' },
    });
    const ownedMgr = new StoreManager<AppStoreShape>('OwnedB', {
      session: { user: 'b', visits: 2 },
      draft: { text: 'b' },
    });

    const sharedSession = sharedMgr.getStore('session');
    const ownedSession = ownedMgr.getStore('session');

    const SwapStores = createStoreContext<AppStoreShape>('SwapStores', {
      session: { user: null, visits: 0 },
      draft: { text: '' },
    });

    let activeSessionStore: Store<SessionState> | undefined;

    function Reader() {
      activeSessionStore = SwapStores.useStore('session');
      const value = useStoreValue(activeSessionStore);
      return <span data-testid="user">{value.user}</span>;
    }

    const view = render(
      <SwapStores.Provider manager={sharedMgr}>
        <Reader />
      </SwapStores.Provider>
    );
    expect(activeSessionStore).toBe(sharedSession);
    expect(view.getByTestId('user').textContent).toBe('a');

    // Swap sharedMgr -> ownedMgr with ownership="owned".
    // sharedMgr must NOT be disposed during swap cleanup.
    view.rerender(
      <SwapStores.Provider manager={ownedMgr} ownership="owned">
        <Reader />
      </SwapStores.Provider>
    );
    expect(activeSessionStore).toBe(ownedSession);
    expect(view.getByTestId('user').textContent).toBe('b');
    expect(sharedSession.isStoreDisposed()).toBe(false);
    expect(ownedSession.isStoreDisposed()).toBe(false);

    // Swap back ownedMgr (owned) -> sharedMgr (shared): ownedMgr MUST be disposed.
    view.rerender(
      <SwapStores.Provider manager={sharedMgr}>
        <Reader />
      </SwapStores.Provider>
    );
    expect(ownedSession.isStoreDisposed()).toBe(true);
    expect(sharedSession.isStoreDisposed()).toBe(false);
    expect(view.getByTestId('user').textContent).toBe('a');

    view.unmount();
    expect(sharedSession.isStoreDisposed()).toBe(false);
    sharedMgr.dispose();
  });

  it('retains injected stores through React StrictMode effect replay', async () => {
    const externalSession = createStore<SessionState>('strictmode-session', {
      user: 'strict',
      visits: 7,
    });
    const Stores = createStoreContext<{ session: SessionState }>('StrictModeStores', {
      session: { user: null, visits: 0 },
    });

    let seenStore: Store<SessionState> | undefined;

    function Viewer() {
      seenStore = Stores.useStore('session');
      const session = useStoreValue(seenStore);
      return <span data-testid="visits">{session.visits}</span>;
    }

    const view = render(
      <React.StrictMode>
        <Stores.Provider stores={{ session: externalSession }}>
          <Viewer />
        </Stores.Provider>
      </React.StrictMode>
    );

    expect(seenStore).toBe(externalSession);
    expect(view.getByTestId('visits').textContent).toBe('7');

    act(() => {
      externalSession.setValue({ user: 'strict', visits: 8 });
    });

    await waitFor(() => {
      expect(view.getByTestId('visits').textContent).toBe('8');
    });
    expect(externalSession.isStoreDisposed()).toBe(false);

    view.unmount();
    expect(externalSession.isStoreDisposed()).toBe(false);
    externalSession.dispose();
  });

  const itWithActivity = typeof Activity === 'undefined' ? it.skip : it;

  itWithActivity('retains injected stores across React Activity hide/reveal', async () => {
    const externalSession = createStore<SessionState>('activity-session', {
      user: 'active',
      visits: 10,
    });
    const Stores = createStoreContext<{ session: SessionState }>('ActivityStores', {
      session: { user: null, visits: 0 },
    });

    let seenStore: Store<SessionState> | undefined;

    function Viewer() {
      seenStore = Stores.useStore('session');
      const session = useStoreValue(seenStore);
      return <span data-testid="visits">{session.visits}</span>;
    }

    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <Stores.Provider stores={{ session: externalSession }}>
          <Viewer />
        </Stores.Provider>
      </Activity>
    );

    const view = render(tree('visible'));
    expect(seenStore).toBe(externalSession);
    expect(view.getByTestId('visits').textContent).toBe('10');

    await act(async () => {
      view.rerender(tree('hidden'));
      await Promise.resolve();
    });
    expect(externalSession.isStoreDisposed()).toBe(false);

    act(() => {
      externalSession.setValue({ user: 'active', visits: 11 });
    });

    await act(async () => {
      view.rerender(tree('visible'));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(view.getByTestId('visits').textContent).toBe('11');
    });
    expect(externalSession.isStoreDisposed()).toBe(false);

    view.unmount();
    expect(externalSession.isStoreDisposed()).toBe(false);
    externalSession.dispose();
  });

  it('works symmetrically with ActionContext register DI for full headless orchestration', async () => {
    interface OrderActions extends ActionPayloadMap {
      submitOrder: { orderId: string; amount: number };
    }
    interface OrderStores {
      cart: { items: number; total: number; lastOrderId: string | null };
    }

    // Pure headless domain assembly (zero React imports or mounted hooks required)
    const orderRegister = new ActionRegister<OrderActions>({ name: 'HeadlessOrderRegister' });
    const cartStore = createStore<OrderStores['cart']>('cart', {
      items: 2,
      total: 40,
      lastOrderId: null,
    });

    orderRegister.registerCommand('submitOrder', payload => {
      const prev = cartStore.getValue();
      cartStore.setValue({
        items: prev.items + 1,
        total: prev.total + payload.amount,
        lastOrderId: payload.orderId,
      });
    }, { id: 'domain-submit-order' });

    const OrderActionsContext = createActionContext<OrderActions>('OrderActions');
    const OrderStoresContext = createStoreContext<OrderStores>('OrderStores', {
      cart: { items: 0, total: 0, lastOrderId: null },
    });

    let dispatch!: ReturnType<typeof OrderActionsContext.useActionDispatch>;

    function OrderView() {
      dispatch = OrderActionsContext.useActionDispatch();
      const cart = useStoreValue(OrderStoresContext.useStore('cart'));
      return (
        <span data-testid="summary">
          {cart.items}:{cart.total}:{cart.lastOrderId ?? 'none'}
        </span>
      );
    }

    const view = render(
      <OrderActionsContext.Provider register={orderRegister}>
        <OrderStoresContext.Provider stores={{ cart: cartStore }}>
          <OrderView />
        </OrderStoresContext.Provider>
      </OrderActionsContext.Provider>
    );

    expect(view.getByTestId('summary').textContent).toBe('2:40:none');

    await act(async () => {
      await dispatch('submitOrder', { orderId: 'ORD-42', amount: 15 });
    });

    await waitFor(() => {
      expect(view.getByTestId('summary').textContent).toBe('3:55:ORD-42');
    });
    expect(cartStore.getValue()).toEqual({
      items: 3,
      total: 55,
      lastOrderId: 'ORD-42',
    });

    // Unmounting UI leaves headless domain orchestration alive.
    view.unmount();
    expect(cartStore.isStoreDisposed()).toBe(false);

    await orderRegister.dispatch('submitOrder', { orderId: 'ORD-43', amount: 25 });
    expect(cartStore.getValue()).toEqual({
      items: 4,
      total: 80,
      lastOrderId: 'ORD-43',
    });

    await orderRegister.destroyAsync();
    cartStore.dispose();
  });
});
