import React, { useCallback, useRef } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ActionPayloadMap } from '@context-action/core';
import { createStateStore } from '@context-action/store-core';
import {
  createMutativeStateBackend,
  createMutativeTimelineBackend,
} from '@context-action/mutative';
import {
  createActionContext,
  createStoreContext,
  useStorePath,
  useStoreSelector,
  useStoreValue,
} from '@context-action/react';
import * as rootReactExports from '@context-action/react';
import { createRefContext } from '@context-action/react/refs';
import {
  createTimeTravelStore,
  createTimeTravelStoreContext,
  useTimeTravelControls,
  useTimeTravelPath,
  useTimeTravelSelector,
} from '@context-action/react/time-travel';
import {
  bindActionTransactions,
  StoreTransactionCoordinator,
  useStoreTransactionInspector,
} from '@context-action/react/transactions';

describe('CA-VNEXT-ARCHITECTURE-001 Phase 1 Alignment', () => {
  afterEach(() => {
    cleanup();
  });

  describe('M1b: Native StateBackend DI in createStoreContext', () => {
    const CounterCtx = createStoreContext('CounterVNext', {
      counter: 0,
      label: 'initial',
    });

    function CounterView() {
      const counterStore = CounterCtx.useStore('counter');
      const labelStore = CounterCtx.useStore('label');
      const counter = useStoreValue(counterStore);
      const label = useStoreValue(labelStore);

      return (
        <div>
          <span data-testid="counter-value">{counter}</span>
          <span data-testid="label-value">{label}</span>
          <button
            type="button"
            onClick={() => counterStore.setValue(counter + 10)}
          >
            Increment
          </button>
        </div>
      );
    }

    it('injects createStateStore natively with partial fallback and preserves shared ownership', () => {
      const externalCounter = createStateStore('counter', 10);

      const { unmount } = render(
        <CounterCtx.Provider stores={{ counter: externalCounter }}>
          <CounterView />
        </CounterCtx.Provider>
      );

      expect(screen.getByTestId('counter-value').textContent).toBe('10');
      expect(screen.getByTestId('label-value').textContent).toBe('initial');

      act(() => {
        externalCounter.setValue(20);
      });
      expect(screen.getByTestId('counter-value').textContent).toBe('20');

      fireEvent.click(screen.getByRole('button', { name: 'Increment' }));
      expect(screen.getByTestId('counter-value').textContent).toBe('30');
      expect(externalCounter.getValue()).toBe(30);

      unmount();

      expect(externalCounter.isDisposed?.()).toBe(false);
      externalCounter.setValue(40);
      expect(externalCounter.getValue()).toBe(40);
    });

    it('disposes injected StateBackend on Provider unmount when ownership="owned"', () => {
      const externalCounter = createStateStore('counter', 5);

      const { unmount } = render(
        <CounterCtx.Provider
          stores={{ counter: externalCounter }}
          ownership="owned"
        >
          <CounterView />
        </CounterCtx.Provider>
      );

      expect(screen.getByTestId('counter-value').textContent).toBe('5');
      unmount();

      expect(externalCounter.isDisposed?.()).toBe(true);
    });
  });

  describe('M1a + M1b + M3: Mutative Layer 1 backends with React hooks & TimeTravel context', () => {
    it('supports MutativeStateBackend directly with useStoreValue, useStoreSelector, and useStorePath', () => {
      const profileBackend = createMutativeStateBackend('profile', {
        user: { name: 'Ada', role: 'admin' },
        count: 1,
      });

      let nameRenderCount = 0;

      function ProfileCard() {
        const snapshot = useStoreValue(profileBackend);
        const role = useStoreSelector(profileBackend, (state) => state.user.role);
        return (
          <div>
            <span data-testid="profile-count">{snapshot.count}</span>
            <span data-testid="profile-role">{role}</span>
          </div>
        );
      }

      function NameOnly() {
        nameRenderCount += 1;
        const name = useStorePath<{ user: { name: string; role: string }; count: number }, string>(
          profileBackend,
          ['user', 'name']
        );
        return <span data-testid="profile-name">{name}</span>;
      }

      render(
        <div>
          <ProfileCard />
          <NameOnly />
        </div>
      );

      expect(screen.getByTestId('profile-count').textContent).toBe('1');
      expect(screen.getByTestId('profile-role').textContent).toBe('admin');
      expect(screen.getByTestId('profile-name').textContent).toBe('Ada');
      expect(nameRenderCount).toBe(1);

      act(() => {
        profileBackend.update((draft) => {
          draft.count = 2;
        });
      });

      expect(screen.getByTestId('profile-count').textContent).toBe('2');
      expect(nameRenderCount).toBe(1);

      act(() => {
        profileBackend.update((draft) => {
          draft.user.name = 'Grace';
        });
      });

      expect(screen.getByTestId('profile-name').textContent).toBe('Grace');
      expect(nameRenderCount).toBe(2);

      profileBackend.dispose?.();
    });

    it('supports MutativeTimelineBackend directly and injected into createTimeTravelStoreContext', () => {
      const timeline = createMutativeTimelineBackend(
        'doc',
        { title: 'v1', count: 0 },
        { maxHistory: 10 }
      );

      const DocCtx = createTimeTravelStoreContext('DocVNext', {
        doc: { initialValue: { title: '', count: 0 }, maxHistory: 10 },
      });

      function DirectTimelineConsumer() {
        const value = useStoreValue(timeline);
        const title = useTimeTravelPath<{ title: string; count: number }, string>(
          timeline,
          ['title']
        );
        const controls = useTimeTravelControls(timeline);
        return (
          <div>
            <span data-testid="direct-count">{value.count}</span>
            <span data-testid="direct-title">{title}</span>
            <span data-testid="direct-pos">{controls.position}</span>
            <span data-testid="direct-len">{controls.historyLength}</span>
          </div>
        );
      }

      function ContextTimelineConsumer() {
        const docStore = DocCtx.useStore('doc');
        const value = useStoreValue(docStore);
        const title = DocCtx.useStorePath<'doc', string>('doc', ['title']);
        const controls = DocCtx.useTimeTravelControls('doc');

        return (
          <div>
            <span data-testid="ctx-count">{value.count}</span>
            <span data-testid="ctx-title">{title}</span>
            <span data-testid="ctx-undo">{String(controls.canUndo)}</span>
            <span data-testid="ctx-redo">{String(controls.canRedo)}</span>
            <span data-testid="ctx-pos">{controls.position}</span>
            <button type="button" onClick={() => controls.undo()}>
              CtxUndo
            </button>
            <button type="button" onClick={() => controls.redo()}>
              CtxRedo
            </button>
          </div>
        );
      }

      const { unmount } = render(
        <div>
          <DirectTimelineConsumer />
          <DocCtx.Provider stores={{ doc: timeline }} ownership="shared">
            <ContextTimelineConsumer />
          </DocCtx.Provider>
        </div>
      );

      expect(screen.getByTestId('direct-title').textContent).toBe('v1');
      expect(screen.getByTestId('ctx-title').textContent).toBe('v1');
      expect(screen.getByTestId('ctx-undo').textContent).toBe('false');

      act(() => {
        timeline.update((draft) => {
          draft.title = 'v2';
          draft.count = 1;
        });
      });

      expect(screen.getByTestId('direct-title').textContent).toBe('v2');
      expect(screen.getByTestId('direct-count').textContent).toBe('1');
      expect(screen.getByTestId('ctx-title').textContent).toBe('v2');
      expect(screen.getByTestId('ctx-undo').textContent).toBe('true');
      expect(screen.getByTestId('ctx-pos').textContent).toBe('1');

      fireEvent.click(screen.getByRole('button', { name: 'CtxUndo' }));
      expect(screen.getByTestId('ctx-title').textContent).toBe('v1');
      expect(screen.getByTestId('ctx-redo').textContent).toBe('true');

      fireEvent.click(screen.getByRole('button', { name: 'CtxRedo' }));
      expect(screen.getByTestId('ctx-title').textContent).toBe('v2');

      unmount();
      expect(timeline.isDisposed?.()).toBe(false);

      const ownedTimeline = createMutativeTimelineBackend('doc', {
        title: 'owned',
        count: 0,
      });
      const ownedRender = render(
        <DocCtx.Provider stores={{ doc: ownedTimeline }} ownership="owned">
          <ContextTimelineConsumer />
        </DocCtx.Provider>
      );
      ownedRender.unmount();
      expect(ownedTimeline.isDisposed?.()).toBe(true);
    });

    it('invalidates useTimeTravelControls cache cleanly when swapping TimelineBackend instances', () => {
      const timelineA = createMutativeTimelineBackend('doc', { count: 1 });
      const timelineB = createMutativeTimelineBackend('doc', { count: 2 });
      act(() => {
        timelineA.setValue({ count: 10 });
      });

      function ControlsHarness({ target }: { target: typeof timelineA }) {
        const controls = useTimeTravelControls(target);
        return (
          <span data-testid="swap-controls">
            {controls.position}/{controls.historyLength}:{String(controls.canUndo)}
          </span>
        );
      }

      const { rerender } = render(<ControlsHarness target={timelineA} />);
      expect(screen.getByTestId('swap-controls').textContent).toBe('1/2:true');

      rerender(<ControlsHarness target={timelineB} />);
      expect(screen.getByTestId('swap-controls').textContent).toBe('0/1:false');

      timelineA.dispose?.();
      timelineB.dispose?.();
    });
  });

  describe('M2 + M4b: Contract-level queue policy & symmetric action dispatch hooks', () => {
    interface OrderActions extends ActionPayloadMap {
      submitOrder: { id: string };
      resetDraft: void;
      abortableWork: void;
    }

    interface OrderResults {
      submitOrder: string;
      resetDraft: string;
      abortableWork: string;
    }

    it('preempts serial queue with contract-level immediate policy via useActionResultDispatch and supports useActionScope()', async () => {
      const OrderCtx = createActionContext<OrderActions, OrderResults>(
        'OrderContract',
        {
          actions: {
            resetDraft: { queue: 'immediate' },
          },
        }
      );

      let resolveSubmit: ((value: string) => void) | undefined;
      const executionOrder: string[] = [];
      let abortedSeen = false;

      let resultDispatchRef: ReturnType<typeof OrderCtx.useActionResultDispatch> | undefined;
      let scopeRef: ReturnType<typeof OrderCtx.useActionScope> | undefined;

      function OrderHarness() {
        const resultDispatch = OrderCtx.useActionResultDispatch();
        const scope = OrderCtx.useActionScope();
        const busyRef = useRef(false);

        resultDispatchRef = resultDispatch;
        scopeRef = scope;

        OrderCtx.useActionResultHandler(
          'submitOrder',
          useCallback(({ id }) => {
            executionOrder.push(`submit:start:${id}`);
            return new Promise<string>((resolve) => {
              resolveSubmit = (result) => {
                executionOrder.push(`submit:end:${result}`);
                resolve(result);
              };
            });
          }, [])
        );

        OrderCtx.useActionResultHandler(
          'resetDraft',
          useCallback(() => {
            executionOrder.push('resetDraft');
            busyRef.current = false;
            return 'reset-ok';
          }, [])
        );

        OrderCtx.useActionResultHandler(
          'abortableWork',
          useCallback((_payload, controller) => {
            return new Promise<string>((_resolve, reject) => {
              const signal = controller.signal;
              if (signal?.aborted) {
                abortedSeen = true;
                reject(new Error('Already aborted'));
                return;
              }
              signal?.addEventListener(
                'abort',
                () => {
                  abortedSeen = true;
                  reject(new Error('Aborted by scope'));
                },
                { once: true }
              );
            });
          }, [])
        );

        return <span data-testid="order-ready">ready</span>;
      }

      render(
        <OrderCtx.Provider>
          <OrderHarness />
        </OrderCtx.Provider>
      );

      expect(screen.getByTestId('order-ready').textContent).toBe('ready');

      const submitPromise = resultDispatchRef!('submitOrder', { id: 'o-1' });
      await Promise.resolve();
      expect(executionOrder).toEqual(['submit:start:o-1']);

      // No `{ immediate: true }` call-site flag needed because `actions.resetDraft.queue` is `'immediate'`.
      const resetResult = await resultDispatchRef!('resetDraft');
      expect(resetResult.success).toBe(true);
      expect(resetResult.results).toEqual(['reset-ok']);
      expect(executionOrder).toEqual(['submit:start:o-1', 'resetDraft']);

      resolveSubmit!('submitted-o-1');
      const submitResult = await submitPromise;
      expect(submitResult.success).toBe(true);
      expect(submitResult.results).toEqual(['submitted-o-1']);

      // Verify useActionScope exposes all 4 controls and aborts scoped work.
      expect(typeof scopeRef!.dispatch).toBe('function');
      expect(typeof scopeRef!.dispatchWithResult).toBe('function');
      expect(typeof scopeRef!.abortAll).toBe('function');
      expect(typeof scopeRef!.resetAbortScope).toBe('function');

      const scopedPromise = scopeRef!.dispatchWithResult('abortableWork');
      await Promise.resolve();
      scopeRef!.abortAll();
      await scopedPromise.catch(() => {});
      expect(abortedSeen).toBe(true);
    });
  });

  describe('Phase 2 (v5): Subpath entrypoint isolation', () => {
    it('exports dedicated helpers on ./refs, ./time-travel, and ./transactions while removing them from root', () => {
      const root = rootReactExports as Record<string, unknown>;
      expect(typeof createRefContext).toBe('function');
      expect(typeof createTimeTravelStore).toBe('function');
      expect(typeof createTimeTravelStoreContext).toBe('function');
      expect(typeof useTimeTravelControls).toBe('function');
      expect(typeof useTimeTravelPath).toBe('function');
      expect(typeof useTimeTravelSelector).toBe('function');
      expect(typeof StoreTransactionCoordinator).toBe('function');
      expect(typeof bindActionTransactions).toBe('function');
      expect(typeof useStoreTransactionInspector).toBe('function');

      expect(root.createRefContext).toBeUndefined();
      expect(root.createTimeTravelStore).toBeUndefined();
      expect(root.createTimeTravelStoreContext).toBeUndefined();
      expect(root.useTimeTravelControls).toBeUndefined();
      expect(root.useTimeTravelPath).toBeUndefined();
      expect(root.useTimeTravelSelector).toBeUndefined();
      expect(root.StoreTransactionCoordinator).toBeUndefined();
      expect(root.bindActionTransactions).toBeUndefined();
      expect(root.useStoreTransactionInspector).toBeUndefined();
    });
  });
});
