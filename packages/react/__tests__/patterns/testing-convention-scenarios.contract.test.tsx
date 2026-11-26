import React, { useRef, useState } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createScopedContext,
  createStoreContext,
  useStorePath,
  useStoreValue,
} from '@context-action/react';
import {
  useControlledStoreSync,
  usePointerGesture,
  useRefRegistry,
  useStoreInstance,
} from '@context-action/react/advanced';
import {
  createTimeTravelStore,
  createTimeTravelStoreContext,
  TimeTravelStoreManager,
} from '@context-action/react/time-travel';
import {
  bindActionTransactions,
  StoreTransactionCoordinator,
} from '@context-action/react/transactions';

// ============================================================================
// Shared Workflow Fixture for Scenarios S1 - S4
// ============================================================================

type FsmPhase = 'idle' | 'submitting' | 'success';

interface OrderActions extends ActionPayloadMap {
  editTitle: { title: string };
  submitOrder: { title: string };
  focusTitleInput: void;
  resetWorkflow: void;
}

interface OrderState {
  title: string;
  phase: FsmPhase;
  orderId: string | null;
  errorCode: string | null;
  events: string[];
}

function createOrderWorkflowHarness(submitDelayMs = 400) {
  const Actions = createActionContext<OrderActions>('ConventionOrderActions');
  const Stores = createStoreContext<{ order: OrderState }>(
    'ConventionOrderStores',
    {
      order: {
        initialValue: {
          title: '',
          phase: 'idle',
          orderId: null,
          errorCode: null,
          events: [],
        },
        strategy: 'shallow',
      },
    }
  );

  function HandlerRegistry({ children }: { children: React.ReactNode }) {
    const store = Stores.useStore('order');
    const dispatch = Actions.useActionDispatch();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const generationRef = useRef(0);

    React.useEffect(() => {
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, []);

    Actions.useActionCommandHandler('editTitle', ({ title }) => {
      store.update((draft) => {
        draft.title = title;
        draft.errorCode = null;
        if (draft.phase === 'success') {
          draft.phase = 'idle';
          draft.orderId = null;
          draft.events.push('draft_reopened');
        }
      });
    });

    Actions.useActionGuard('submitOrder', ({ title }, controller) => {
      if (store.getValue().phase === 'submitting') {
        controller.abort('ALREADY_SUBMITTING');
        return;
      }
      if (!title.trim()) {
        controller.abort('TITLE_REQUIRED');
        void dispatch('focusTitleInput');
      }
    });

    Actions.useActionCommandHandler('submitOrder', () => {
      generationRef.current += 1;
      const runGeneration = generationRef.current;

      store.update((draft) => {
        draft.phase = 'submitting';
        draft.errorCode = null;
        draft.events.push('submission_started');
      });

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (runGeneration !== generationRef.current) return;
        store.update((draft) => {
          draft.phase = 'success';
          draft.orderId = `ORD-${runGeneration}`;
          draft.events.push('order_completed');
        });
      }, submitDelayMs);
    });

    Actions.useActionObserver(
      'submitOrder',
      () => {
        store.update((draft) => {
          draft.errorCode = 'TITLE_REQUIRED';
          draft.events.push('validation_failed');
        });
      },
      { when: 'failure' }
    );

    Actions.useActionCommandHandler('resetWorkflow', () => {
      generationRef.current += 1;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      store.setValue({
        title: '',
        phase: 'idle',
        orderId: null,
        errorCode: null,
        events: ['workflow_reset'],
      });
    });

    return <>{children}</>;
  }

  function OrderView() {
    const store = Stores.useStore('order');
    const order = useStoreValue(store);
    const dispatch = Actions.useActionDispatch();
    const refs = useRefRegistry<{ titleInput: HTMLInputElement }>();

    Actions.useActionCommandHandler('focusTitleInput', () => {
      refs.executeIfMounted('titleInput', (el) => el.focus());
    });

    return (
      <div>
        <span data-testid="phase-badge">{order.phase}</span>
        {order.errorCode && (
          <span role="alert" data-testid="error-code">
            {order.errorCode}
          </span>
        )}
        {order.orderId && (
          <span data-testid="order-id">{order.orderId}</span>
        )}
        <ul data-testid="event-log">
          {order.events.map((evt, idx) => (
            <li key={`${evt}-${idx}`}>{evt}</li>
          ))}
        </ul>
        <input
          ref={refs.setRef('titleInput')}
          aria-label="Order title"
          data-testid="title-input"
          value={order.title}
          onChange={(e) =>
            void dispatch('editTitle', { title: e.target.value })
          }
        />
        <button
          type="button"
          data-testid="submit-btn"
          disabled={order.phase === 'submitting'}
          onClick={() =>
            void dispatch('submitOrder', { title: store.getValue().title })
          }
        >
          Submit
        </button>
        <button
          type="button"
          data-testid="reset-btn"
          onClick={() => void dispatch('resetWorkflow')}
        >
          Reset
        </button>
      </div>
    );
  }

  return function OrderHarnessApp() {
    return (
      <Actions.Provider>
        <Stores.Provider>
          <HandlerRegistry>
            <OrderView />
          </HandlerRegistry>
        </Stores.Provider>
      </Actions.Provider>
    );
  };
}

// ============================================================================
// Suite proving Canonical Testing Scenarios S1 - S6
// ============================================================================

describe('CA-TESTING-CONVENTION-001 canonical scenarios (S1-S6)', () => {
  afterEach(() => {
    cleanup();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('S1: blocks invalid submit in Guard, focuses invalid input via RefRegistry, and records failure observer event', async () => {
    const App = createOrderWorkflowHarness();
    render(<App />);

    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-code')).toHaveTextContent(
        'TITLE_REQUIRED'
      );
      expect(document.activeElement).toBe(screen.getByTestId('title-input'));
      expect(screen.getByTestId('phase-badge')).toHaveTextContent('idle');
      expect(screen.getByTestId('event-log')).toHaveTextContent(
        'validation_failed'
      );
    });
  });

  it('S2 & S3: transitions idle -> submitting -> success cleanly, then invalidates settled result on post-success draft edit', async () => {
    jest.useFakeTimers();
    const App = createOrderWorkflowHarness(300);
    render(<App />);

    fireEvent.change(screen.getByTestId('title-input'), {
      target: { value: 'Starter Kit' },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-btn'));
      await Promise.resolve();
    });

    expect(screen.getByTestId('phase-badge')).toHaveTextContent('submitting');
    expect(screen.getByTestId('submit-btn')).toBeDisabled();

    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(screen.getByTestId('phase-badge')).toHaveTextContent('success');
    expect(screen.getByTestId('order-id')).toHaveTextContent('ORD-1');
    expect(screen.getByTestId('event-log')).toHaveTextContent(
      'order_completed'
    );

    // S3: Post-success edit must invalidate stale orderId and return phase -> idle
    fireEvent.change(screen.getByTestId('title-input'), {
      target: { value: 'Starter Kit v2' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('phase-badge')).toHaveTextContent('idle');
      expect(screen.queryByTestId('order-id')).toBeNull();
      expect(screen.getByTestId('event-log')).toHaveTextContent(
        'draft_reopened'
      );
    });
  });

  it('S4: settles mid-flight reset with fake timers inside async act() without stale success overwrite', async () => {
    jest.useFakeTimers();
    const App = createOrderWorkflowHarness(500);
    render(<App />);

    fireEvent.change(screen.getByTestId('title-input'), {
      target: { value: 'In-flight item' },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-btn'));
      await Promise.resolve();
    });
    expect(screen.getByTestId('phase-badge')).toHaveTextContent('submitting');

    await act(async () => {
      jest.advanceTimersByTime(200);
      fireEvent.click(screen.getByTestId('reset-btn'));
      await Promise.resolve();
      // Advance well past original 500ms timer to prove canceled timer cannot overwrite reset baseline
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(screen.getByTestId('phase-badge')).toHaveTextContent('idle');
    expect(screen.queryByTestId('order-id')).toBeNull();
    expect(screen.getByTestId('title-input')).toHaveValue('');
    expect(screen.getByTestId('event-log')).toHaveTextContent('workflow_reset');
  });

  it('S5: isolates derived useStorePath({ select }) subscribers and runs fast-lane pointer preview with 0 committed React renders', async () => {
    interface ScrubActions extends ActionPayloadMap {
      touchUnrelated: void;
      preview: { pct: number };
      commit: { pct: number };
    }
    interface ScrubState {
      user: { name: string };
      metrics: { ticks: number };
      pct: number;
    }

    const ScrubActionsCtx = createActionContext<ScrubActions>(
      'ConventionScrubActions',
      {
        actions: {
          touchUnrelated: { lane: 'orchestrated' },
          preview: { lane: 'fast' },
          commit: { lane: 'orchestrated', queue: 'serial' },
        },
      }
    );

    const ScrubScope = createScopedContext(
      'ConventionScrub',
      ScrubActionsCtx,
      () => {
        const store = useStoreInstance<ScrubState>(() => ({
          user: { name: 'Alice' },
          metrics: { ticks: 0 },
          pct: 20,
        }));
        const refs = useRefRegistry<{
          track: HTMLDivElement;
          thumb: HTMLDivElement;
        }>();

        ScrubActionsCtx.useActionCommandHandler('touchUnrelated', () => {
          store.update((draft) => {
            draft.metrics.ticks += 1;
          });
        });

        ScrubActionsCtx.useActionCommandHandler('preview', ({ pct }) => {
          refs.executeIfMounted('thumb', (el) => {
            el.dataset.previewPct = String(pct);
          });
        });

        ScrubActionsCtx.useActionCommandHandler('commit', ({ pct }) => {
          store.update((draft) => {
            draft.pct = pct;
          });
        });

        return { store, refs };
      }
    );

    let derivedRenders = 0;
    let committedRenders = 0;

    function DerivedSubscriber() {
      const { store } = ScrubScope.useScope();
      const isAlice = useStorePath(store, ['user', 'name'], {
        select: (name) => name === 'Alice',
      });
      derivedRenders += 1;
      return <span data-testid="derived-alice">{String(isAlice)}</span>;
    }

    function CommittedPanel() {
      const { store } = ScrubScope.useScope();
      const pct = useStorePath(store, ['pct']);
      committedRenders += 1;
      return <span data-testid="committed-pct">{pct}</span>;
    }

    function ScrubTrack() {
      const { refs } = ScrubScope.useScope();
      const dispatch = ScrubScope.useActionDispatch();
      const gesture = usePointerGesture({
        onStart(snap) {
          void dispatch('preview', { pct: Math.round(snap.startX) });
        },
        onMove(snap) {
          void dispatch('preview', { pct: Math.round(snap.currentX) });
        },
        onCommit(snap) {
          void dispatch('commit', { pct: Math.round(snap.currentX) });
        },
      });

      return (
        <div>
          <button
            type="button"
            data-testid="unrelated-btn"
            onClick={() => void dispatch('touchUnrelated')}
          >
            Touch Unrelated
          </button>
          <div
            ref={refs.setRef('track')}
            data-testid="scrub-track"
            onPointerDown={(e) => gesture.start(e)}
            onPointerMove={(e) => gesture.move(e)}
            onPointerUp={(e) => gesture.commit(e)}
          >
            <div
              ref={refs.setRef('thumb')}
              data-testid="scrub-thumb"
              data-preview-pct="20"
            />
          </div>
        </div>
      );
    }

    render(
      <ScrubScope.Provider>
        <DerivedSubscriber />
        <CommittedPanel />
        <ScrubTrack />
      </ScrubScope.Provider>
    );

    expect(derivedRenders).toBe(1);
    expect(committedRenders).toBe(1);

    await act(async () => {
      fireEvent.click(screen.getByTestId('unrelated-btn'));
      await Promise.resolve();
    });
    expect(derivedRenders).toBe(1);
    expect(committedRenders).toBe(1);

    const track = screen.getByTestId('scrub-track');
    const thumb = screen.getByTestId('scrub-thumb');

    await act(async () => {
      fireEvent(
        track,
        new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 30 })
      );
      fireEvent(
        track,
        new MouseEvent('pointermove', { bubbles: true, clientX: 75 })
      );
      await Promise.resolve();
    });

    // Preview DOM updated in fast lane with ZERO React re-renders
    expect(thumb.getAttribute('data-preview-pct')).toBe('75');
    expect(committedRenders).toBe(1);
    expect(screen.getByTestId('committed-pct')).toHaveTextContent('20');

    await act(async () => {
      fireEvent(
        track,
        new MouseEvent('pointerup', { bubbles: true, clientX: 75 })
      );
      await Promise.resolve();
    });
    expect(screen.getByTestId('committed-pct')).toHaveTextContent('75');
    expect(committedRenders).toBe(2);
  });

  it('S6a: isolates sibling createScopedContext providers and syncs controlled props via onSync(draft, nextValue)', async () => {
    interface ScopeActions extends ActionPayloadMap {
      setLabel: { label: string };
    }
    interface ScopeState {
      selectedId: string;
      focusedId: string;
      localCount: number;
    }

    const Ctx = createActionContext<ScopeActions>('S6ScopeActions');
    const Scope = createScopedContext(
      'S6Scope',
      Ctx,
      ({ selectedId }: { selectedId?: string }) => {
        const store = useStoreInstance<ScopeState>(() => ({
          selectedId: selectedId ?? 'a',
          focusedId: selectedId ?? 'a',
          localCount: 0,
        }));
        useControlledStoreSync(store, ['selectedId'], selectedId, {
          onSync(draft, nextId) {
            draft.focusedId = nextId;
          },
        });
        Ctx.useActionCommandHandler('setLabel', ({ label }) => {
          store.update((draft) => {
            draft.selectedId = label;
            draft.focusedId = label;
            draft.localCount += 1;
          });
        });
        return { store };
      }
    );

    function Widget({ testId }: { testId: string }) {
      const { store } = Scope.useScope();
      const dispatch = Scope.useActionDispatch();
      const state = useStoreValue(store);
      return (
        <div>
          <span data-testid={`${testId}-val`}>
            {state.selectedId}:{state.focusedId}:{state.localCount}
          </span>
          <button
            type="button"
            data-testid={`${testId}-bump`}
            onClick={() => void dispatch('setLabel', { label: `${testId}-next` })}
          >
            Bump
          </button>
        </div>
      );
    }

    function ControlledHost() {
      const [extId, setExtId] = useState('alpha');
      return (
        <div>
          <button
            type="button"
            data-testid="ext-sync-btn"
            onClick={() => setExtId('beta')}
          >
            Sync
          </button>
          <Scope.Provider selectedId={extId}>
            <Widget testId="first" />
          </Scope.Provider>
          <Scope.Provider>
            <Widget testId="second" />
          </Scope.Provider>
        </div>
      );
    }

    render(<ControlledHost />);
    expect(screen.getByTestId('first-val')).toHaveTextContent('alpha:alpha:0');
    expect(screen.getByTestId('second-val')).toHaveTextContent('a:a:0');

    // Mutate sibling 1 -> sibling 2 stays isolated
    await act(async () => {
      fireEvent.click(screen.getByTestId('first-bump'));
      await Promise.resolve();
    });
    expect(screen.getByTestId('first-val')).toHaveTextContent(
      'first-next:first-next:1'
    );
    expect(screen.getByTestId('second-val')).toHaveTextContent('a:a:0');

    // Controlled prop update -> syncs selectedId + derived focusedId atomically
    await act(async () => {
      fireEvent.click(screen.getByTestId('ext-sync-btn'));
      await Promise.resolve();
    });
    expect(screen.getByTestId('first-val')).toHaveTextContent('beta:beta:1');
    expect(screen.getByTestId('second-val')).toHaveTextContent('a:a:0');
  });

  it('S6b: preserves ownership="shared" TimeTravel state across unmount/remount and rolls back aborted transactions', async () => {
    interface TxActions extends ActionPayloadMap {
      transfer: { amount: number };
    }

    const externalRegister = new ActionRegister<TxActions>({
      name: 'S6SharedTxRegister',
    });
    const checking = createTimeTravelStore('checking', { balance: 100 });
    const savings = createTimeTravelStore('savings', { balance: 50 });
    const coordinator = new StoreTransactionCoordinator();

    const SharedStores = createTimeTravelStoreContext<{
      checking: { balance: number };
    }>('S6SharedStores', {
      checking: { initialValue: { balance: 100 } },
    });
    const SharedManager = new TimeTravelStoreManager<{
      checking: { balance: number };
    }>(
      'S6SharedManager',
      { checking: { initialValue: { balance: 100 } } },
      20,
      {
        externalStores: { checking },
        externalOwnership: 'shared',
      }
    );

    const unregisterTx = externalRegister.register(
      'transfer',
      ({ amount }, controller) => {
        checking.update((draft) => {
          draft.balance -= amount;
        });
        if (amount > 100) {
          controller.abort('Insufficient funds');
          return;
        }
        savings.update((draft) => {
          draft.balance += amount;
        });
      }
    );

    const unbind = bindActionTransactions(externalRegister, coordinator, {
      getParticipants: () => [
        { name: 'checking', store: checking },
        { name: 'savings', store: savings },
      ],
    });

    // Valid atomic transfer 40: checking=60, savings=90
    await externalRegister.dispatch('transfer', { amount: 40 });
    expect(checking.getValue().balance).toBe(60);
    expect(savings.getValue().balance).toBe(90);

    // Aborted transfer 200 aborts midway AFTER decrementing checking -> must roll back BOTH stores cleanly
    const failed = await externalRegister.dispatchWithResult('transfer', {
      amount: 200,
    });
    expect(failed.aborted).toBe(true);
    expect(checking.getValue().balance).toBe(60);
    expect(savings.getValue().balance).toBe(90);

    // Mount, unmount, remount shared store provider -> external state & undo history survive
    function BalanceReader() {
      const store = SharedStores.useStore('checking');
      const val = useStoreValue(store);
      return <span data-testid="shared-balance">{val.balance}</span>;
    }

    const { unmount } = render(
      <SharedStores.Provider manager={SharedManager} ownership="shared">
        <BalanceReader />
      </SharedStores.Provider>
    );
    expect(screen.getByTestId('shared-balance')).toHaveTextContent('60');
    unmount();

    expect(checking.getValue().balance).toBe(60);
    expect(checking.canUndo()).toBe(true);

    render(
      <SharedStores.Provider manager={SharedManager} ownership="shared">
        <BalanceReader />
      </SharedStores.Provider>
    );
    expect(screen.getByTestId('shared-balance')).toHaveTextContent('60');

    unbind();
    unregisterTx();
    await externalRegister.destroyAsync();
  });
});
