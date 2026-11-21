import React from 'react';
import { act, cleanup, render, renderHook } from '@testing-library/react';
import {
  createStore,
  createStoreContext,
  createTimeTravelStore,
  createTimeTravelStoreContext,
  StoreManager,
  TimeTravelStoreManager,
} from '@context-action/react';
import { useLocalStore } from '@context-action/react/advanced';

describe('Store notificationMode, useStoreInfo/useStoreClear stability, and useLocalStore', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Store notificationMode', () => {
    it('defaults to batched mode and coalesces rapid updates until the next frame', () => {
      jest.useFakeTimers();

      const store = createStore('batched-default', { count: 0, label: 'init' });
      expect(store.getNotificationMode()).toBe('batched');

      let regularCalls = 0;
      const patchBatches: Array<Array<(string | number)[]>> = [];

      store.subscribe(() => {
        regularCalls += 1;
      });
      store.subscribeWithPatches((patches) => {
        patchBatches.push((patches ?? []).map((patch) => [...patch.path]));
      });

      store.update((draft) => {
        draft.count = 1;
      });
      store.update((draft) => {
        draft.label = 'updated';
      });

      expect(regularCalls).toBe(0);
      expect(patchBatches).toHaveLength(0);

      jest.advanceTimersByTime(20);

      expect(regularCalls).toBe(1);
      expect(patchBatches).toHaveLength(1);
      expect(patchBatches[0]).toEqual([['count'], ['label']]);

      store.dispose();
    });

    it('supports immediate notificationMode in createStore with synchronous granular patches', () => {
      const store = createStore(
        'immediate-store',
        { count: 0, label: 'init' },
        { notificationMode: 'immediate' }
      );
      expect(store.getNotificationMode()).toBe('immediate');

      let regularCalls = 0;
      const receivedValues: number[] = [];
      const patchBatches: Array<Array<(string | number)[]>> = [];

      store.subscribe(() => {
        regularCalls += 1;
        receivedValues.push(store.getValue().count);
      });
      store.subscribeWithPatches((patches) => {
        patchBatches.push((patches ?? []).map((patch) => [...patch.path]));
      });

      store.update((draft) => {
        draft.count = 1;
      });
      store.update((draft) => {
        draft.count = 2;
      });

      expect(regularCalls).toBe(2);
      expect(receivedValues).toEqual([1, 2]);
      expect(patchBatches).toEqual([[['count']], [['count']]]);

      store.dispose();
    });

    it('flushes a pending batched frame once when switching to immediate mode and avoids double-firing', () => {
      jest.useFakeTimers();

      const store = createStore('switch-mode', { a: 0, b: 'start' });
      let regularCalls = 0;
      const observedPatches: Array<Array<(string | number)[]>> = [];

      store.subscribe(() => {
        regularCalls += 1;
      });
      store.subscribeWithPatches((patches) => {
        observedPatches.push((patches ?? []).map((patch) => [...patch.path]));
      });

      store.update((draft) => {
        draft.a = 1;
      });
      store.update((draft) => {
        draft.b = 'queued';
      });
      expect(regularCalls).toBe(0);

      // Switching to immediate cancels the queued RAF and flushes pending patches once synchronously.
      store.setNotificationMode('immediate');
      expect(store.getNotificationMode()).toBe('immediate');
      expect(regularCalls).toBe(1);
      expect(observedPatches).toEqual([[['a'], ['b']]]);

      // Advancing timers must not fire the cancelled animation frame a second time.
      jest.advanceTimersByTime(30);
      expect(regularCalls).toBe(1);

      // Switching back to batched defers subsequent updates again.
      store.setNotificationMode('batched');
      expect(store.getNotificationMode()).toBe('batched');
      store.update((draft) => {
        draft.a = 2;
      });
      expect(regularCalls).toBe(1);

      jest.advanceTimersByTime(20);
      expect(regularCalls).toBe(2);

      store.dispose();
      // Calling setNotificationMode on a disposed store is a safe no-op.
      store.setNotificationMode('immediate');
      expect(store.getNotificationMode()).toBe('batched');
    });
  });

  describe('TimeTravelStore notificationMode parity', () => {
    it('supports getNotificationMode/setNotificationMode and flushes pending batched frames cleanly', () => {
      jest.useFakeTimers();

      const store = createTimeTravelStore(
        'tt-switch',
        { count: 0 },
        { mutable: true, notificationMode: 'batched' }
      );
      expect(store.getNotificationMode()).toBe('batched');

      let calls = 0;
      store.subscribe(() => {
        calls += 1;
      });

      store.update((draft) => {
        draft.count = 1;
      });
      expect(calls).toBe(0);

      store.setNotificationMode('immediate');
      expect(store.getNotificationMode()).toBe('immediate');
      expect(calls).toBe(1);

      jest.advanceTimersByTime(30);
      expect(calls).toBe(1);

      store.setNotificationMode('batched');
      store.update((draft) => {
        draft.count = 2;
      });
      expect(calls).toBe(1);

      jest.advanceTimersByTime(20);
      expect(calls).toBe(2);

      store.dispose();
      store.setNotificationMode('immediate');
      expect(store.getNotificationMode()).toBe('batched');
    });
  });

  describe('Declarative StoreContext / TimeTravelStoreContext config & hook stability', () => {
    it('passes notificationMode from StoreConfig without misclassifying domain objects that have extra keys', () => {
      const domainValue = {
        initialValue: 'preserved-domain-value',
        extraField: 42,
      } as const;

      const Ctx = createStoreContext('ConfiguredStores', {
        fastCounter: {
          initialValue: { count: 0 },
          notificationMode: 'immediate' as const,
        },
        batchedCounter: { count: 0 },
        domainWithInitialValueField: domainValue,
      });

      const manager = new StoreManager<{
        fastCounter: { count: number };
        batchedCounter: { count: number };
        domainWithInitialValueField: typeof domainValue;
      }>('ConfiguredStores', {
        fastCounter: {
          initialValue: { count: 0 },
          notificationMode: 'immediate',
        },
        batchedCounter: { count: 0 },
        domainWithInitialValueField: domainValue,
      });

      const fast = manager.getStore('fastCounter');
      const batched = manager.getStore('batchedCounter');
      const domain = manager.getStore('domainWithInitialValueField');

      expect(fast.getNotificationMode()).toBe('immediate');
      expect(batched.getNotificationMode()).toBe('batched');
      expect(domain.getValue()).toEqual({
        initialValue: 'preserved-domain-value',
        extraField: 42,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Ctx.Provider>{children}</Ctx.Provider>
      );
      const { result, unmount } = renderHook(() => Ctx.useStore('fastCounter'), { wrapper });
      expect(result.current.getNotificationMode()).toBe('immediate');

      unmount();
      manager.dispose();
    });

    it('forwards notificationMode in TimeTravelStoreManager for both timeTravel true and false', () => {
      const manager = new TimeTravelStoreManager('ConfiguredTT', {
        ttBatched: {
          initialValue: { count: 0 },
          timeTravel: true,
          notificationMode: 'batched',
        },
        plainImmediate: {
          initialValue: { count: 0 },
          timeTravel: false,
          notificationMode: 'immediate',
        },
      });

      expect(manager.getStore('ttBatched').getNotificationMode()).toBe('batched');
      expect(manager.getStore('plainImmediate').getNotificationMode()).toBe('immediate');
      manager.dispose();

      const TTCtx = createTimeTravelStoreContext('ConfiguredTTCtx', {
        ttBatched: {
          initialValue: { count: 0 },
          timeTravel: true,
          notificationMode: 'batched' as const,
        },
        plainImmediate: {
          initialValue: { count: 0 },
          timeTravel: false,
          notificationMode: 'immediate' as const,
        },
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TTCtx.Provider>{children}</TTCtx.Provider>
      );
      const { result, unmount } = renderHook(
        () => ({
          tt: TTCtx.useStore('ttBatched'),
          plain: TTCtx.useStore('plainImmediate'),
        }),
        { wrapper }
      );
      expect(result.current.tt.getNotificationMode()).toBe('batched');
      expect(result.current.plain.getNotificationMode()).toBe('immediate');
      unmount();
    });

    it('keeps useStoreInfo subscriptions and useStoreClear callbacks stable across re-renders', () => {
      const StoreCtx = createStoreContext('StableInfoStore', { count: 0 });
      const manager = new StoreManager('StableInfoStore', { count: 0 });
      const subscribeSpy = jest.spyOn(manager, 'subscribeInfo');

      const clearFns: Array<() => void> = [];

      function Inspector({ tick }: { tick: number }) {
        const info = StoreCtx.useStoreInfo();
        const clear = StoreCtx.useStoreClear();
        clearFns.push(clear);
        return <div data-testid="info">{`${tick}:${info.storeCount}`}</div>;
      }

      const view = render(
        <StoreCtx.Provider manager={manager}>
          <Inspector tick={1} />
        </StoreCtx.Provider>
      );
      const subscribeCallsAfterMount = subscribeSpy.mock.calls.length;

      view.rerender(
        <StoreCtx.Provider manager={manager}>
          <Inspector tick={2} />
        </StoreCtx.Provider>
      );
      view.rerender(
        <StoreCtx.Provider manager={manager}>
          <Inspector tick={3} />
        </StoreCtx.Provider>
      );

      expect(subscribeSpy).toHaveBeenCalledTimes(subscribeCallsAfterMount);
      expect(clearFns).toHaveLength(3);
      expect(clearFns[1]).toBe(clearFns[0]);
      expect(clearFns[2]).toBe(clearFns[0]);

      view.unmount();
      manager.dispose();

      // Also verify TimeTravelStoreContext parity
      const TTCtx = createTimeTravelStoreContext('StableInfoTT', { count: 0 });
      const ttManager = new TimeTravelStoreManager('StableInfoTT', { count: 0 });
      const ttSubscribeSpy = jest.spyOn(ttManager, 'subscribeInfo');
      const ttClearFns: Array<() => void> = [];

      function TTInspector({ tick }: { tick: number }) {
        const info = TTCtx.useStoreInfo();
        const clear = TTCtx.useStoreClear();
        ttClearFns.push(clear);
        return <div>{`${tick}:${info.storeCount}`}</div>;
      }

      const ttView = render(
        <TTCtx.Provider manager={ttManager}>
          <TTInspector tick={1} />
        </TTCtx.Provider>
      );
      const ttCallsAfterMount = ttSubscribeSpy.mock.calls.length;

      ttView.rerender(
        <TTCtx.Provider manager={ttManager}>
          <TTInspector tick={2} />
        </TTCtx.Provider>
      );

      expect(ttSubscribeSpy).toHaveBeenCalledTimes(ttCallsAfterMount);
      expect(ttClearFns).toHaveLength(2);
      expect(ttClearFns[1]).toBe(ttClearFns[0]);

      ttView.unmount();
      ttManager.dispose();
    });
  });

  describe('useLocalStore SSR-safe naming and options forwarding', () => {
    it('assigns deterministic localStore_ names via useId and forwards notificationMode', () => {
      const { result, unmount } = renderHook(() =>
        useLocalStore({ count: 0 }, undefined, { notificationMode: 'immediate' })
      );

      expect(result.current.name).toMatch(/^localStore_.+/);
      expect(result.current.store.getNotificationMode()).toBe('immediate');

      let calls = 0;
      const unsubscribe = result.current.store.subscribe(() => {
        calls += 1;
      });

      act(() => {
        result.current.store.update((draft) => {
          draft.count = 5;
        });
      });

      expect(calls).toBe(1);
      expect(result.current.value.count).toBe(5);

      unsubscribe();
      unmount();
    });
  });
});
