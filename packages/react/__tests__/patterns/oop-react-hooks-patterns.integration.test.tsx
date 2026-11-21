import React, {
  act,
  forwardRef,
  memo,
  useActionState,
  useCallback,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useOptimistic,
  useReducer,
  useRef,
  useState,
  useTransition,
} from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createRefContext,
  createStore,
  createStoreContext,
  useStorePath,
  useStoreValue,
} from '@context-action/react';
import { useLocalStore } from '@context-action/react/advanced';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

describe('OOP × React Built-in Hook Usage Patterns', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Archetype 1 · Encapsulated OOP Widget Control (useImperativeHandle + createRefContext + ActionContext)', () => {
    interface FieldHandle {
      readonly focus: () => void;
      readonly validate: () => boolean;
      readonly reset: () => void;
      readonly getValue: () => string;
    }

    it('reproduces mount flicker when reactive state is placed in useImperativeHandle deps', () => {
      const BadRefs = createRefContext<{ field: FieldHandle }>('BadImperativeRefs');
      let mountCount = 0;

      const BadField = forwardRef<FieldHandle>(function BadField(_props, ref) {
        const [value, setValue] = useState('');
        const inputRef = useRef<HTMLInputElement | null>(null);

        // Anti-pattern: `value` in deps forces React to re-invoke setRef(null) -> setRef(next)
        useImperativeHandle(
          ref,
          () => ({
            focus: () => inputRef.current?.focus(),
            validate: () => value.trim().length > 0,
            reset: () => setValue(''),
            getValue: () => value,
          }),
          [value],
        );

        return (
          <input
            ref={inputRef}
            data-testid="bad-field-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        );
      });

      function Harness() {
        const fieldRef = BadRefs.useRefHandler('field');
        const { onMount, setRef } = fieldRef;

        useEffect(() => {
          return onMount(() => {
            mountCount += 1;
          });
        }, [onMount]);

        return <BadField ref={setRef} />;
      }

      render(
        <BadRefs.Provider>
          <Harness />
        </BadRefs.Provider>,
      );

      expect(mountCount).toBe(1);

      fireEvent.change(screen.getByTestId('bad-field-input'), {
        target: { value: 'a' },
      });
      fireEvent.change(screen.getByTestId('bad-field-input'), {
        target: { value: 'ab' },
      });

      expect(mountCount).toBe(3);
    });

    it('keeps a frozen handle identity stable across updates and orchestrates via ActionContext withTarget', async () => {
      interface FormActions extends ActionPayloadMap {
        submitForm: void;
        resetForm: void;
      }

      const FormActionsCtx = createActionContext<FormActions>('StableFacadeActions');
      const FormRefsCtx = createRefContext<{ emailField: FieldHandle }>('StableFacadeRefs');

      let mountCount = 0;
      let coordinatorRenders = 0;
      let viewRenders = 0;
      let lastValidatedResult: boolean | null = null;
      let lastSubmittedValue: string | null = null;
      const observedFieldControllerRef: {
        current: ReturnType<typeof FormRefsCtx.useRefController<'emailField'>> | null;
      } = { current: null };

      const EncapsulatedField = forwardRef<
        FieldHandle,
        { label: string; required?: boolean }
      >(function EncapsulatedField({ label, required = false }, ref) {
        const [value, setValue] = useState('');
        const [error, setError] = useState<string | null>(null);
        const inputRef = useRef<HTMLInputElement | null>(null);

        const latestRef = useRef({ value, label, required });
        useIsomorphicLayoutEffect(() => {
          latestRef.current = { value, label, required };
        }, [value, label, required]);

        useImperativeHandle(
          ref,
          () =>
            Object.freeze({
              focus: () => {
                inputRef.current?.focus();
              },
              validate: () => {
                const current = latestRef.current;
                const valid = !current.required || current.value.trim().length > 0;
                setError(valid ? null : `${current.label} is required`);
                return valid;
              },
              reset: () => {
                latestRef.current = { ...latestRef.current, value: '' };
                setValue('');
                setError(null);
              },
              getValue: () => latestRef.current.value,
            }),
          [],
        );

        return (
          <div>
            <input
              ref={inputRef}
              aria-label={label}
              data-testid="good-field-input"
              value={value}
              onChange={(event) => {
                const next = event.target.value;
                latestRef.current = { ...latestRef.current, value: next };
                setValue(next);
                if (error) setError(null);
              }}
            />
            {error && (
              <span role="alert" data-testid="good-field-error">
                {error}
              </span>
            )}
          </div>
        );
      });

      function Coordinator({ children }: { children: React.ReactNode }) {
        coordinatorRenders += 1;
        const { onMount, withTarget } = FormRefsCtx.useRefController('emailField');

        useEffect(() => {
          return onMount(() => {
            mountCount += 1;
          });
        }, [onMount]);

        FormActionsCtx.useActionCommandHandler(
          'submitForm',
          useCallback(async () => {
            await withTarget((handle) => {
              const valid = handle.validate();
              lastValidatedResult = valid;
              if (!valid) {
                handle.focus();
                return;
              }
              lastSubmittedValue = handle.getValue();
            });
          }, [withTarget]),
        );

        FormActionsCtx.useActionCommandHandler(
          'resetForm',
          useCallback(async () => {
            await withTarget((handle) => {
              handle.reset();
            });
          }, [withTarget]),
        );

        return <>{children}</>;
      }

      function View() {
        viewRenders += 1;
        const emailField = FormRefsCtx.useRefController('emailField');
        observedFieldControllerRef.current = emailField;
        const dispatch = FormActionsCtx.useActionDispatch();

        return (
          <div>
            <EncapsulatedField ref={emailField.setRef} label="Work Email" required />
            <button
              type="button"
              data-testid="submit-form-btn"
              onClick={() => void dispatch('submitForm')}
            >
              Submit
            </button>
            <button
              type="button"
              data-testid="reset-form-btn"
              onClick={() => void dispatch('resetForm')}
            >
              Reset
            </button>
          </div>
        );
      }

      render(
        <FormActionsCtx.Provider>
          <FormRefsCtx.Provider>
            <Coordinator>
              <View />
            </Coordinator>
          </FormRefsCtx.Provider>
        </FormActionsCtx.Provider>,
      );

      expect(mountCount).toBe(1);
      expect(coordinatorRenders).toBe(1);
      expect(viewRenders).toBe(1);
      expect(observedFieldControllerRef.current?.target).not.toBeNull();
      expect(Object.isFrozen(observedFieldControllerRef.current?.target)).toBe(true);

      // Invalid submit focuses input & shows error without remounting ref
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-form-btn'));
      });

      await waitFor(() => {
        expect(lastValidatedResult).toBe(false);
        expect(screen.getByTestId('good-field-error')).toHaveTextContent(
          'Work Email is required',
        );
        expect(document.activeElement).toBe(screen.getByTestId('good-field-input'));
      });
      expect(mountCount).toBe(1);

      // Type valid email, submit, then reset — ref stays mounted once
      fireEvent.change(screen.getByTestId('good-field-input'), {
        target: { value: 'jordan@acme.dev' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-form-btn'));
      });

      await waitFor(() => {
        expect(lastValidatedResult).toBe(true);
        expect(lastSubmittedValue).toBe('jordan@acme.dev');
        expect(screen.queryByTestId('good-field-error')).toBeNull();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('reset-form-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('good-field-input')).toHaveValue('');
      });
      expect(mountCount).toBe(1);
    });
  });

  describe('Archetype 2 · Local Store / Reducer Encapsulation + Imperative Handle', () => {
    it('Variant A: encapsulates useLocalStore inside a frozen domain handle without leaking dispose or setValue', async () => {
      interface StepperState {
        readonly count: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
      }

      interface StepperHandle {
        readonly increment: () => void;
        readonly decrement: () => void;
        readonly reset: () => void;
        readonly getSnapshot: () => StepperState;
      }

      function clampCount(next: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, next));
      }

      const EncapsulatedStepper = forwardRef<
        StepperHandle,
        { initialCount?: number; min?: number; max?: number; step?: number }
      >(function EncapsulatedStepper(
        { initialCount = 0, min = 0, max = 3, step = 1 },
        ref,
      ) {
        const initialCountRef = useRef(initialCount);
        useIsomorphicLayoutEffect(() => {
          initialCountRef.current = initialCount;
        }, [initialCount]);

        const { value, store } = useLocalStore<StepperState>(
          {
            count: clampCount(initialCount, min, max),
            min,
            max,
            step,
          },
          'test-encapsulated-stepper',
        );

        useImperativeHandle(
          ref,
          () =>
            Object.freeze({
              increment: () => {
                store.update((prev) => ({
                  ...prev,
                  count: clampCount(prev.count + prev.step, prev.min, prev.max),
                }));
              },
              decrement: () => {
                store.update((prev) => ({
                  ...prev,
                  count: clampCount(prev.count - prev.step, prev.min, prev.max),
                }));
              },
              reset: () => {
                store.update((prev) => ({
                  ...prev,
                  count: clampCount(initialCountRef.current, prev.min, prev.max),
                }));
              },
              getSnapshot: () => store.getValue(),
            }),
          [store],
        );

        return <output data-testid="stepper-count">{value.count}</output>;
      });

      let handleRef: StepperHandle | null = null;
      let attachCount = 0;
      const onRef = (instance: StepperHandle | null) => {
        if (instance) {
          attachCount += 1;
          handleRef = instance;
        }
      };

      render(<EncapsulatedStepper ref={onRef} initialCount={1} min={0} max={3} />);

      expect(attachCount).toBe(1);
      expect(handleRef).not.toBeNull();
      expect(Object.isFrozen(handleRef)).toBe(true);
      expect('dispose' in handleRef!).toBe(false);
      expect('setValue' in handleRef!).toBe(false);
      expect(screen.getByTestId('stepper-count')).toHaveTextContent('1');

      await act(async () => {
        handleRef!.increment();
        handleRef!.increment();
        handleRef!.increment(); // should clamp at max = 3
      });

      expect(handleRef!.getSnapshot().count).toBe(3);
      await waitFor(() => {
        expect(screen.getByTestId('stepper-count')).toHaveTextContent('3');
      });

      await act(async () => {
        handleRef!.reset();
      });

      expect(handleRef!.getSnapshot().count).toBe(1);
      await waitFor(() => {
        expect(screen.getByTestId('stepper-count')).toHaveTextContent('1');
      });
      expect(attachCount).toBe(1);
    });

    it('Variant B: encapsulates useReducer state machine with empty deps and committed stateRef reads', () => {
      type RunnerStatus = 'idle' | 'running' | 'paused';
      interface RunnerState {
        readonly status: RunnerStatus;
        readonly cycles: number;
      }
      type RunnerAction =
        | { type: 'start' }
        | { type: 'pause' }
        | { type: 'tick' }
        | { type: 'reset' };

      function runnerReducer(state: RunnerState, action: RunnerAction): RunnerState {
        switch (action.type) {
          case 'start':
            return state.status === 'running' ? state : { ...state, status: 'running' };
          case 'pause':
            return state.status === 'running' ? { ...state, status: 'paused' } : state;
          case 'tick':
            return state.status === 'running'
              ? { ...state, cycles: state.cycles + 1 }
              : state;
          case 'reset':
            return { status: 'idle', cycles: 0 };
        }
      }

      interface RunnerHandle {
        readonly start: () => void;
        readonly pause: () => void;
        readonly tick: () => void;
        readonly reset: () => void;
        readonly getStatus: () => RunnerStatus;
        readonly getCycles: () => number;
      }

      const EncapsulatedRunner = forwardRef<RunnerHandle>(
        function EncapsulatedRunner(_props, ref) {
          const [state, dispatch] = useReducer(runnerReducer, {
            status: 'idle',
            cycles: 0,
          });
          const stateRef = useRef(state);
          useIsomorphicLayoutEffect(() => {
            stateRef.current = state;
          }, [state]);

          useImperativeHandle(
            ref,
            () =>
              Object.freeze({
                start: () => dispatch({ type: 'start' }),
                pause: () => dispatch({ type: 'pause' }),
                tick: () => dispatch({ type: 'tick' }),
                reset: () => dispatch({ type: 'reset' }),
                getStatus: () => stateRef.current.status,
                getCycles: () => stateRef.current.cycles,
              }),
            [],
          );

          return (
            <div>
              <span data-testid="runner-status">{state.status}</span>
              <span data-testid="runner-cycles">{state.cycles}</span>
            </div>
          );
        },
      );

      let handleRef: RunnerHandle | null = null;
      let attachCount = 0;
      render(
        <EncapsulatedRunner
          ref={(instance) => {
            if (instance) {
              attachCount += 1;
              handleRef = instance;
            }
          }}
        />,
      );

      expect(attachCount).toBe(1);
      expect(Object.isFrozen(handleRef)).toBe(true);

      act(() => {
        handleRef!.start();
        handleRef!.tick();
        handleRef!.tick();
      });

      expect(handleRef!.getStatus()).toBe('running');
      expect(handleRef!.getCycles()).toBe(2);
      expect(screen.getByTestId('runner-status')).toHaveTextContent('running');
      expect(screen.getByTestId('runner-cycles')).toHaveTextContent('2');

      act(() => {
        handleRef!.pause();
        handleRef!.tick(); // ignored while paused
      });

      expect(handleRef!.getStatus()).toBe('paused');
      expect(handleRef!.getCycles()).toBe(2);
      expect(screen.getByTestId('runner-status')).toHaveTextContent('paused');

      act(() => {
        handleRef!.reset();
      });

      expect(handleRef!.getStatus()).toBe('idle');
      expect(handleRef!.getCycles()).toBe(0);
      expect(attachCount).toBe(1);
    });
  });

  describe('Archetype 3 · High-Frequency Store -> Non-Blocking Derived View (useStorePath + useDeferredValue)', () => {
    it('keeps synchronous input crisp while deferring memoized filtering and ignoring unrelated store paths', async () => {
      interface CatalogItem {
        readonly id: string;
        readonly name: string;
        readonly category: string;
      }
      interface CatalogFilterState {
        query: string;
        items: CatalogItem[];
        unrelatedTick: number;
      }

      const filterStore = createStore<CatalogFilterState>('deferred-catalog', {
        query: '',
        items: [
          { id: '1', name: 'ActionRegister Pipeline', category: 'core' },
          { id: '2', name: 'Store Path Subscription', category: 'react' },
          { id: '3', name: 'TimeTravel Snapshot', category: 'mutative' },
        ],
        unrelatedTick: 0,
      });

      let heavyRenderCount = 0;

      const HeavyCatalogList = memo(function HeavyCatalogList({
        query,
        items,
      }: {
        query: string;
        items: readonly CatalogItem[];
      }) {
        heavyRenderCount += 1;
        const filtered = useMemo(() => {
          const normalized = query.trim().toLowerCase();
          if (!normalized) return items;
          return items.filter(
            (item) =>
              item.name.toLowerCase().includes(normalized) ||
              item.category.toLowerCase().includes(normalized),
          );
        }, [items, query]);

        return (
          <ul data-testid="deferred-list">
            {filtered.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        );
      });

      function CatalogSearchBar() {
        const [draftQuery, setDraftQuery] = useState('');

        return (
          <input
            data-testid="urgent-query-input"
            value={draftQuery}
            onChange={(event) => {
              const next = event.target.value;
              setDraftQuery(next);
              filterStore.update((draft) => {
                draft.query = next;
              });
            }}
          />
        );
      }

      function CatalogResultsView() {
        const query = useStorePath<CatalogFilterState, string>(filterStore, ['query']);
        const items = useStorePath<CatalogFilterState, readonly CatalogItem[]>(
          filterStore,
          ['items'],
        );
        const deferredQuery = useDeferredValue(query);

        return (
          <div>
            <span data-testid="deferred-query-mirror">{deferredQuery}</span>
            <HeavyCatalogList query={deferredQuery} items={items} />
          </div>
        );
      }

      render(
        <div>
          <CatalogSearchBar />
          <CatalogResultsView />
        </div>,
      );
      expect(heavyRenderCount).toBe(1);
      expect(screen.getAllByRole('listitem')).toHaveLength(3);

      fireEvent.change(screen.getByTestId('urgent-query-input'), {
        target: { value: 'a' },
      });
      fireEvent.change(screen.getByTestId('urgent-query-input'), {
        target: { value: 'time' },
      });

      // Controlled local `<input>` reflects `'time'` synchronously without waiting for RAF batching.
      expect(screen.getByTestId('urgent-query-input')).toHaveValue('time');

      await waitFor(() => {
        expect(screen.getByTestId('deferred-query-mirror')).toHaveTextContent('time');
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(1);
        expect(listItems[0]).toHaveTextContent('TimeTravel Snapshot');
      });

      const rendersAfterFilter = heavyRenderCount;
      expect(rendersAfterFilter).toBeGreaterThanOrEqual(2);

      // Granular Mutative draft mutation on an unrelated path must not re-render `CatalogResultsView` / `HeavyCatalogList`
      await act(async () => {
        filterStore.update((draft) => {
          draft.unrelatedTick += 1;
        });
        await waitForNextFrame();
      });
      expect(heavyRenderCount).toBe(rendersAfterFilter);

      filterStore.dispose();
    });

    it('supports direct Store-bound <input> + useDeferredValue via StoreConfig notificationMode: immediate', async () => {
      interface CatalogItem {
        readonly id: string;
        readonly name: string;
      }
      interface FilterState {
        query: string;
        items: CatalogItem[];
        unrelatedTick: number;
      }

      const CatalogCtx = createStoreContext('ImmediateCatalogStores', {
        filterState: {
          initialValue: {
            query: '',
            items: [
              { id: '1', name: 'ActionRegister Pipeline' },
              { id: '2', name: 'Store Path Subscription' },
              { id: '3', name: 'TimeTravel Snapshot' },
            ],
            unrelatedTick: 0,
          } as FilterState,
          notificationMode: 'immediate' as const,
        },
      });

      let heavyRenderCount = 0;

      const HeavyList = memo(function HeavyList({
        query,
        items,
      }: {
        query: string;
        items: readonly CatalogItem[];
      }) {
        heavyRenderCount += 1;
        const normalized = query.trim().toLowerCase();
        const filtered = normalized
          ? items.filter((item) => item.name.toLowerCase().includes(normalized))
          : items;
        return (
          <ul>
            {filtered.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        );
      });

      function DirectSearchBar() {
        const store = CatalogCtx.useStore('filterState');
        const query = useStorePath<FilterState, string>(store, ['query']);

        return (
          <input
            data-testid="immediate-query-input"
            value={query}
            onChange={(event) => {
              const next = event.target.value;
              store.update((draft) => {
                draft.query = next;
              });
            }}
          />
        );
      }

      function Results() {
        const store = CatalogCtx.useStore('filterState');
        const query = useStorePath<FilterState, string>(store, ['query']);
        const items = useStorePath<FilterState, readonly CatalogItem[]>(store, ['items']);
        const deferredQuery = useDeferredValue(query);
        return <HeavyList query={deferredQuery} items={items} />;
      }

      function TickButton() {
        const store = CatalogCtx.useStore('filterState');
        return (
          <button
            type="button"
            data-testid="unrelated-tick-btn"
            onClick={() => {
              store.update((draft) => {
                draft.unrelatedTick += 1;
              });
            }}
          >
            Tick
          </button>
        );
      }

      render(
        <CatalogCtx.Provider>
          <DirectSearchBar />
          <Results />
          <TickButton />
        </CatalogCtx.Provider>,
      );

      expect(heavyRenderCount).toBe(1);

      fireEvent.change(screen.getByTestId('immediate-query-input'), {
        target: { value: 'path' },
      });

      expect(screen.getByTestId('immediate-query-input')).toHaveValue('path');
      await waitFor(() => {
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(1);
        expect(items[0]).toHaveTextContent('Store Path Subscription');
      });

      const rendersAfterSearch = heavyRenderCount;
      fireEvent.click(screen.getByTestId('unrelated-tick-btn'));
      expect(heavyRenderCount).toBe(rendersAfterSearch);
    });
  });

  describe('Archetype 4 · Committed Store + Async Action Optimistic & Form Overlay (React 19)', () => {
    it('shows optimistic state during async dispatchWithResult and commits or rolls back automatically on abort', async () => {
      interface ArticleState {
        readonly liked: boolean;
        readonly count: number;
      }
      interface LikeActions extends ActionPayloadMap {
        toggleLike: { nextLiked: boolean; shouldReject?: boolean };
      }
      interface LikeResultMap {
        toggleLike: ArticleState;
      }

      const LikeActionsCtx = createActionContext<LikeActions, LikeResultMap>(
        'TestOptimisticActions',
      );
      const LikeStoresCtx = createStoreContext('TestOptimisticStores', {
        article: {
          initialValue: { liked: false, count: 10 } as ArticleState,
        },
      });

      let resolvePendingFlight: (() => void) | null = null;
      let observedCommittedStore: ReturnType<typeof LikeStoresCtx.useStore<'article'>> | null =
        null;
      const observedCounts: number[] = [];

      function LikeHandlers({ children }: { children: React.ReactNode }) {
        const articleStore = LikeStoresCtx.useStore('article');
        observedCommittedStore = articleStore;

        LikeActionsCtx.useActionResultHandler(
          'toggleLike',
          useCallback(
            async ({ nextLiked, shouldReject }, controller) => {
              await new Promise<void>((resolve) => {
                resolvePendingFlight = resolve;
              });
              if (shouldReject) {
                controller.abort('Server rejected update');
                return articleStore.getValue();
              }
              const current = articleStore.getValue();
              const committed: ArticleState = {
                liked: nextLiked,
                count:
                  current.liked === nextLiked
                    ? current.count
                    : current.count + (nextLiked ? 1 : -1),
              };
              articleStore.setValue(committed);
              return committed;
            },
            [articleStore],
          ),
        );

        return <>{children}</>;
      }

      function LikePanel() {
        const articleStore = LikeStoresCtx.useStore('article');
        const committed = useStoreValue(articleStore);
        const { dispatchWithResult } = LikeActionsCtx.useActionDispatchWithResult();
        const [isPending, startTransition] = useTransition();

        const [optimistic, applyOptimistic] = useOptimistic<ArticleState, boolean>(
          committed,
          (state, nextLiked) => ({
            liked: nextLiked,
            count:
              state.liked === nextLiked
                ? state.count
                : state.count + (nextLiked ? 1 : -1),
          }),
        );

        useIsomorphicLayoutEffect(() => {
          observedCounts.push(optimistic.count);
        }, [optimistic.count]);

        const trigger = (shouldReject: boolean) => {
          const nextLiked = !committed.liked;
          startTransition(async () => {
            applyOptimistic(nextLiked);
            const execution = await dispatchWithResult('toggleLike', {
              nextLiked,
              shouldReject,
            });
            if (!execution.aborted && execution.success) {
              await waitForNextFrame();
            }
          });
        };

        return (
          <div>
            <span data-testid="committed-count">{committed.count}</span>
            <span data-testid="optimistic-count">{optimistic.count}</span>
            <span data-testid="optimistic-liked">{String(optimistic.liked)}</span>
            <span data-testid="optimistic-pending">{String(isPending)}</span>
            <button
              type="button"
              data-testid="like-commit-btn"
              onClick={() => trigger(false)}
            >
              Commit Like
            </button>
            <button
              type="button"
              data-testid="like-reject-btn"
              onClick={() => trigger(true)}
            >
              Reject Toggle
            </button>
          </div>
        );
      }

      render(
        <LikeActionsCtx.Provider>
          <LikeStoresCtx.Provider>
            <LikeHandlers>
              <LikePanel />
            </LikeHandlers>
          </LikeStoresCtx.Provider>
        </LikeActionsCtx.Provider>,
      );

      expect(screen.getByTestId('committed-count')).toHaveTextContent('10');
      expect(screen.getByTestId('optimistic-count')).toHaveTextContent('10');
      expect(observedCounts).toEqual([10]);

      // 1) In-flight optimistic transition: optimistic UI jumps to 11 while Store stays 10
      await act(async () => {
        fireEvent.click(screen.getByTestId('like-commit-btn'));
      });

      await waitFor(() => {
        expect(resolvePendingFlight).not.toBeNull();
        expect(screen.getByTestId('optimistic-count')).toHaveTextContent('11');
        expect(screen.getByTestId('optimistic-liked')).toHaveTextContent('true');
        expect(screen.getByTestId('committed-count')).toHaveTextContent('10');
        expect(observedCommittedStore?.getValue().count).toBe(10);
      });

      // Settle success -> Store commits 11 with zero 1-frame dip back to 10
      const completeFirst = resolvePendingFlight!;
      resolvePendingFlight = null;
      await act(async () => {
        completeFirst();
        await waitForNextFrame();
      });

      await waitFor(() => {
        expect(screen.getByTestId('committed-count')).toHaveTextContent('11');
        expect(screen.getByTestId('optimistic-count')).toHaveTextContent('11');
        expect(screen.getByTestId('optimistic-pending')).toHaveTextContent('false');
      });
      expect(observedCounts).toEqual([10, 11]);

      // 2) Aborted action: optimistic drops to 10 in-flight, then auto-reverts to committed 11
      await act(async () => {
        fireEvent.click(screen.getByTestId('like-reject-btn'));
      });

      await waitFor(() => {
        expect(resolvePendingFlight).not.toBeNull();
        expect(screen.getByTestId('optimistic-count')).toHaveTextContent('10');
        expect(screen.getByTestId('committed-count')).toHaveTextContent('11');
      });

      const completeReject = resolvePendingFlight!;
      resolvePendingFlight = null;
      await act(async () => {
        completeReject();
      });

      await waitFor(() => {
        expect(screen.getByTestId('committed-count')).toHaveTextContent('11');
        expect(screen.getByTestId('optimistic-count')).toHaveTextContent('11');
        expect(screen.getByTestId('optimistic-liked')).toHaveTextContent('true');
        expect(screen.getByTestId('optimistic-pending')).toHaveTextContent('false');
      });
      expect(observedCounts).toEqual([10, 11, 10, 11]);
    });

    it('achieves zero-flicker useOptimistic + startTransition without waitForNextFrame when Store uses notificationMode: immediate', async () => {
      interface ArticleState {
        readonly liked: boolean;
        readonly count: number;
      }
      interface LikeActions extends ActionPayloadMap {
        toggleLike: { nextLiked: boolean; shouldReject?: boolean };
      }
      interface LikeResultMap {
        toggleLike: ArticleState;
      }

      const LikeActionsCtx = createActionContext<LikeActions, LikeResultMap>(
        'ImmediateOptimisticActions',
      );
      const LikeStoresCtx = createStoreContext('ImmediateOptimisticStores', {
        article: {
          initialValue: { liked: false, count: 10 } as ArticleState,
          notificationMode: 'immediate' as const,
        },
      });

      let resolvePendingFlight: (() => void) | null = null;
      const observedCounts: number[] = [];

      function LikeHandlers({ children }: { children: React.ReactNode }) {
        const articleStore = LikeStoresCtx.useStore('article');

        LikeActionsCtx.useActionResultHandler(
          'toggleLike',
          useCallback(
            async ({ nextLiked, shouldReject }, controller) => {
              await new Promise<void>((resolve) => {
                resolvePendingFlight = resolve;
              });
              if (shouldReject) {
                controller.abort('Server rejected update');
                return articleStore.getValue();
              }
              const current = articleStore.getValue();
              const committed: ArticleState = {
                liked: nextLiked,
                count:
                  current.liked === nextLiked
                    ? current.count
                    : current.count + (nextLiked ? 1 : -1),
              };
              articleStore.setValue(committed);
              return committed;
            },
            [articleStore],
          ),
        );

        return <>{children}</>;
      }

      function LikePanel() {
        const articleStore = LikeStoresCtx.useStore('article');
        const committed = useStoreValue(articleStore);
        const { dispatchWithResult } = LikeActionsCtx.useActionDispatchWithResult();
        const [isPending, startTransition] = useTransition();

        const [optimistic, applyOptimistic] = useOptimistic<ArticleState, boolean>(
          committed,
          (state, nextLiked) => ({
            liked: nextLiked,
            count:
              state.liked === nextLiked
                ? state.count
                : state.count + (nextLiked ? 1 : -1),
          }),
        );

        useIsomorphicLayoutEffect(() => {
          observedCounts.push(optimistic.count);
        }, [optimistic.count]);

        const trigger = (shouldReject: boolean) => {
          const nextLiked = !committed.liked;
          startTransition(async () => {
            applyOptimistic(nextLiked);
            await dispatchWithResult('toggleLike', { nextLiked, shouldReject });
          });
        };

        return (
          <div>
            <span data-testid="imm-committed-count">{committed.count}</span>
            <span data-testid="imm-optimistic-count">{optimistic.count}</span>
            <span data-testid="imm-optimistic-pending">{String(isPending)}</span>
            <button
              type="button"
              data-testid="imm-like-btn"
              onClick={() => trigger(false)}
            >
              Like
            </button>
            <button
              type="button"
              data-testid="imm-reject-btn"
              onClick={() => trigger(true)}
            >
              Reject
            </button>
          </div>
        );
      }

      render(
        <LikeActionsCtx.Provider>
          <LikeStoresCtx.Provider>
            <LikeHandlers>
              <LikePanel />
            </LikeHandlers>
          </LikeStoresCtx.Provider>
        </LikeActionsCtx.Provider>,
      );

      expect(observedCounts).toEqual([10]);

      await act(async () => {
        fireEvent.click(screen.getByTestId('imm-like-btn'));
      });

      await waitFor(() => {
        expect(resolvePendingFlight).not.toBeNull();
        expect(screen.getByTestId('imm-optimistic-count')).toHaveTextContent('11');
        expect(screen.getByTestId('imm-committed-count')).toHaveTextContent('10');
      });

      const completeCommit = resolvePendingFlight!;
      resolvePendingFlight = null;
      await act(async () => {
        completeCommit();
      });

      await waitFor(() => {
        expect(screen.getByTestId('imm-committed-count')).toHaveTextContent('11');
        expect(screen.getByTestId('imm-optimistic-count')).toHaveTextContent('11');
        expect(screen.getByTestId('imm-optimistic-pending')).toHaveTextContent('false');
      });
      // Immediate notification commits without needing waitForNextFrame(), so zero dip back to 10!
      expect(observedCounts).toEqual([10, 11]);

      await act(async () => {
        fireEvent.click(screen.getByTestId('imm-reject-btn'));
      });

      await waitFor(() => {
        expect(resolvePendingFlight).not.toBeNull();
        expect(screen.getByTestId('imm-optimistic-count')).toHaveTextContent('10');
      });

      const completeAbort = resolvePendingFlight!;
      resolvePendingFlight = null;
      await act(async () => {
        completeAbort();
      });

      await waitFor(() => {
        expect(screen.getByTestId('imm-optimistic-count')).toHaveTextContent('11');
        expect(screen.getByTestId('imm-optimistic-pending')).toHaveTextContent('false');
      });
      expect(observedCounts).toEqual([10, 11, 10, 11]);
    });

    it('connects React 19 useActionState form actions to useActionGuard and dispatchWithResult', async () => {
      interface ProfileFormActions extends ActionPayloadMap {
        saveDisplayName: { displayName: string };
      }
      interface ProfileFormResultMap {
        saveDisplayName: { displayName: string };
      }
      interface FormSubmitState {
        readonly status: 'idle' | 'saved' | 'error';
        readonly message: string;
        readonly draftName: string;
        readonly revision: number;
      }

      const ProfileActions = createActionContext<
        ProfileFormActions,
        ProfileFormResultMap
      >('TestProfileFormActions');
      const ProfileStores = createStoreContext('TestProfileFormStores', {
        displayName: 'Anonymous',
      });

      function Handlers({ children }: { children: React.ReactNode }) {
        const displayNameStore = ProfileStores.useStore('displayName');

        ProfileActions.useActionGuard(
          'saveDisplayName',
          useCallback(({ displayName }, controller) => {
            if (displayName.trim().length < 2) {
              controller.abort('Display name must be at least 2 characters.');
            }
          }, []),
        );

        ProfileActions.useActionResultHandler(
          'saveDisplayName',
          useCallback(
            async ({ displayName }) => {
              const trimmed = displayName.trim();
              displayNameStore.setValue(trimmed);
              return { displayName: trimmed };
            },
            [displayNameStore],
          ),
        );

        return <>{children}</>;
      }

      function ProfileForm() {
        const committedName = useStoreValue(ProfileStores.useStore('displayName'));
        const { dispatchWithResult } = ProfileActions.useActionDispatchWithResult();

        const [submitState, formAction, isPending] = useActionState<
          FormSubmitState,
          FormData
        >(
          async (prevState, formData) => {
            const rawName = String(formData.get('displayName') ?? '');
            const execution = await dispatchWithResult('saveDisplayName', {
              displayName: rawName,
            });

            if (execution.aborted || !execution.success) {
              return {
                status: 'error',
                message: execution.abortReason ?? 'Save failed.',
                draftName: rawName,
                revision: prevState.revision + 1,
              };
            }

            const saved = Array.isArray(execution.result)
              ? execution.result[0]
              : execution.result;

            await waitForNextFrame();

            const nextName = saved?.displayName ?? rawName.trim();
            return {
              status: 'saved',
              message: `Saved ${nextName}`,
              draftName: nextName,
              revision: prevState.revision + 1,
            };
          },
          { status: 'idle', message: '', draftName: '', revision: 0 },
        );

        const displayedDefault =
          submitState.status === 'error' ? submitState.draftName : committedName;

        return (
          <form action={formAction}>
            <span data-testid="profile-committed">{committedName}</span>
            <input
              key={`${submitState.revision}:${committedName}`}
              name="displayName"
              data-testid="profile-name-input"
              defaultValue={displayedDefault}
            />
            <button type="submit" data-testid="profile-save-btn" disabled={isPending}>
              Save
            </button>
            <span data-testid="profile-status">{submitState.status}</span>
            <span data-testid="profile-message">{submitState.message}</span>
          </form>
        );
      }

      render(
        <ProfileActions.Provider>
          <ProfileStores.Provider>
            <Handlers>
              <ProfileForm />
            </Handlers>
          </ProfileStores.Provider>
        </ProfileActions.Provider>,
      );

      // Invalid submission aborted by useActionGuard — draft input `'A'` is preserved
      fireEvent.change(screen.getByTestId('profile-name-input'), {
        target: { value: 'A' },
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('profile-save-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('profile-status')).toHaveTextContent('error');
        expect(screen.getByTestId('profile-message')).toHaveTextContent(
          'Display name must be at least 2 characters.',
        );
        expect(screen.getByTestId('profile-committed')).toHaveTextContent('Anonymous');
        expect(screen.getByTestId('profile-name-input')).toHaveValue('A');
      });

      // Valid submission commits to Store, updates input to trimmed name, and returns result
      fireEvent.change(screen.getByTestId('profile-name-input'), {
        target: { value: '  Jordan Lee  ' },
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('profile-save-btn'));
        await waitForNextFrame();
      });

      await waitFor(() => {
        expect(screen.getByTestId('profile-status')).toHaveTextContent('saved');
        expect(screen.getByTestId('profile-message')).toHaveTextContent(
          'Saved Jordan Lee',
        );
        expect(screen.getByTestId('profile-committed')).toHaveTextContent('Jordan Lee');
        expect(screen.getByTestId('profile-name-input')).toHaveValue('Jordan Lee');
      });
    });
  });

  describe('Archetype 5 · External OOP Runtime Lifecycle Bridge (createRefContext + useLayoutEffect + StrictMode / Activity)', () => {
    it('maintains idempotent mount/dispose, exposes frozen facade, and updates callbacks without recreating engine under StrictMode', async () => {
      interface ViewportEngineHandle {
        readonly focusRegion: (regionId: string) => void;
        readonly resize: () => void;
      }
      interface ViewportActions extends ActionPayloadMap {
        focusRegion: { regionId: string };
      }

      const liveEngines = new Set<ViewportEngine>();
      let createdCount = 0;
      let disposedCount = 0;

      class ViewportEngine {
        private disposed = false;

        constructor(
          private readonly hostElement: HTMLElement,
          private readonly onFocusRegion?: (regionId: string) => void,
        ) {
          createdCount += 1;
          liveEngines.add(this);
          this.hostElement.dataset.engineMounted = 'true';
        }

        focusRegion(regionId: string): void {
          if (this.disposed) return;
          this.hostElement.dataset.activeRegion = regionId;
          this.onFocusRegion?.(regionId);
        }

        resize(): void {
          if (this.disposed) return;
          this.hostElement.dataset.resized = 'true';
        }

        dispose(): void {
          if (this.disposed) return;
          this.disposed = true;
          disposedCount += 1;
          liveEngines.delete(this);
          delete this.hostElement.dataset.engineMounted;
        }
      }

      const ViewportActionsCtx = createActionContext<ViewportActions>(
        'TestViewportActions',
      );
      const ViewportRefsCtx = createRefContext<{ engine: ViewportEngineHandle }>(
        'TestViewportRefs',
      );

      const latestObservedControllerRef: {
        current: ReturnType<typeof ViewportRefsCtx.useRefController<'engine'>> | null;
      } = { current: null };

      function ViewportCanvas({
        onRegionFocused,
      }: {
        onRegionFocused?: (regionId: string) => void;
      }) {
        const hostRef = useRef<HTMLDivElement | null>(null);
        const engineController = ViewportRefsCtx.useRefController('engine');
        const { setRef } = engineController;
        latestObservedControllerRef.current = engineController;

        const onRegionFocusedRef = useRef(onRegionFocused);
        useIsomorphicLayoutEffect(() => {
          onRegionFocusedRef.current = onRegionFocused;
        }, [onRegionFocused]);

        useIsomorphicLayoutEffect(() => {
          const hostElement = hostRef.current;
          if (!hostElement) return;

          const instance = new ViewportEngine(hostElement, (regionId) => {
            onRegionFocusedRef.current?.(regionId);
          });

          const facade: ViewportEngineHandle = Object.freeze({
            focusRegion: (regionId: string) => instance.focusRegion(regionId),
            resize: () => instance.resize(),
          });

          setRef(facade);

          return () => {
            setRef(null);
            instance.dispose();
          };
        }, [setRef]);

        return <div ref={hostRef} data-testid="viewport-host" />;
      }

      function Coordinator({ children }: { children: React.ReactNode }) {
        const { withTarget } = ViewportRefsCtx.useRefController('engine');

        ViewportActionsCtx.useActionCommandHandler(
          'focusRegion',
          useCallback(
            async ({ regionId }) => {
              await withTarget((engine) => {
                engine.focusRegion(regionId);
              });
            },
            [withTarget],
          ),
        );

        return <>{children}</>;
      }

      function Controls() {
        const dispatch = ViewportActionsCtx.useActionDispatch();
        return (
          <button
            type="button"
            data-testid="focus-hero-btn"
            onClick={() => void dispatch('focusRegion', { regionId: 'hero' })}
          >
            Focus Hero
          </button>
        );
      }

      function App({
        onRegionFocused,
      }: {
        onRegionFocused: (regionId: string) => void;
      }) {
        return (
          <React.StrictMode>
            <ViewportActionsCtx.Provider>
              <ViewportRefsCtx.Provider>
                <Coordinator>
                  <ViewportCanvas onRegionFocused={onRegionFocused} />
                  <Controls />
                </Coordinator>
              </ViewportRefsCtx.Provider>
            </ViewportActionsCtx.Provider>
          </React.StrictMode>
        );
      }

      const firstCallback = jest.fn();
      const secondCallback = jest.fn();

      const view = render(<App onRegionFocused={firstCallback} />);

      expect(createdCount).toBeGreaterThanOrEqual(1);
      expect(liveEngines.size).toBe(1);
      expect(createdCount - disposedCount).toBe(1);
      expect(latestObservedControllerRef.current?.target).not.toBeNull();
      expect(Object.isFrozen(latestObservedControllerRef.current?.target)).toBe(true);
      expect('dispose' in latestObservedControllerRef.current!.target!).toBe(false);

      await act(async () => {
        fireEvent.click(screen.getByTestId('focus-hero-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('viewport-host')).toHaveAttribute(
          'data-active-region',
          'hero',
        );
        expect(firstCallback).toHaveBeenCalledWith('hero');
      });

      // Passing a fresh inline callback updates latest callback ref WITHOUT recreating engine
      const createdBeforeRerender = createdCount;
      view.rerender(<App onRegionFocused={secondCallback} />);
      expect(createdCount).toBe(createdBeforeRerender);
      expect(liveEngines.size).toBe(1);

      await act(async () => {
        fireEvent.click(screen.getByTestId('focus-hero-btn'));
      });

      await waitFor(() => {
        expect(secondCallback).toHaveBeenCalledWith('hero');
      });
      expect(firstCallback).toHaveBeenCalledTimes(1);

      view.unmount();
      expect(liveEngines.size).toBe(0);
      expect(disposedCount).toBe(createdCount);
    });

    const itWithActivity = typeof React.Activity === 'undefined' ? it.skip : it;

    itWithActivity('detaches cleanly on React.Activity hide and re-attaches on reveal', async () => {
      interface ViewportEngineHandle {
        readonly focusRegion: (regionId: string) => void;
      }
      interface ViewportActions extends ActionPayloadMap {
        focusRegion: { regionId: string };
      }

      const liveEngines = new Set<ViewportEngine>();
      let createdCount = 0;
      let disposedCount = 0;
      let canvasRenders = 0;
      let coordinatorRenders = 0;

      class ViewportEngine {
        private disposed = false;

        constructor(private readonly hostElement: HTMLElement) {
          createdCount += 1;
          liveEngines.add(this);
          this.hostElement.dataset.engineMounted = 'true';
        }

        focusRegion(regionId: string): void {
          if (this.disposed) return;
          this.hostElement.dataset.activeRegion = regionId;
        }

        dispose(): void {
          if (this.disposed) return;
          this.disposed = true;
          disposedCount += 1;
          liveEngines.delete(this);
          delete this.hostElement.dataset.engineMounted;
        }
      }

      const ViewportActionsCtx = createActionContext<ViewportActions>(
        'ActivityViewportActions',
      );
      const ViewportRefsCtx = createRefContext<{ engine: ViewportEngineHandle }>(
        'ActivityViewportRefs',
      );

      function ViewportCanvas() {
        canvasRenders += 1;
        const hostRef = useRef<HTMLDivElement | null>(null);
        const { setRef } = ViewportRefsCtx.useRefController('engine');

        useIsomorphicLayoutEffect(() => {
          const hostElement = hostRef.current;
          if (!hostElement) return;

          const instance = new ViewportEngine(hostElement);
          const facade: ViewportEngineHandle = Object.freeze({
            focusRegion: (regionId: string) => instance.focusRegion(regionId),
          });

          setRef(facade);

          return () => {
            setRef(null);
            instance.dispose();
          };
        }, [setRef]);

        return <div ref={hostRef} data-testid="activity-viewport-host" />;
      }

      function Coordinator({ children }: { children: React.ReactNode }) {
        coordinatorRenders += 1;
        const { withTarget } = ViewportRefsCtx.useRefController('engine');

        ViewportActionsCtx.useActionCommandHandler(
          'focusRegion',
          useCallback(
            async ({ regionId }) => {
              await withTarget((engine) => {
                engine.focusRegion(regionId);
              });
            },
            [withTarget],
          ),
        );

        return <>{children}</>;
      }

      function Controls() {
        const dispatch = ViewportActionsCtx.useActionDispatch();
        return (
          <button
            type="button"
            data-testid="activity-focus-hero-btn"
            onClick={() => void dispatch('focusRegion', { regionId: 'hero' })}
          >
            Focus Hero
          </button>
        );
      }

      const Activity = React.Activity!;

      const renderTree = (mode: 'visible' | 'hidden') => (
        <ViewportActionsCtx.Provider>
          <ViewportRefsCtx.Provider>
            <Coordinator>
              <Activity mode={mode}>
                <ViewportCanvas />
              </Activity>
              <Controls />
            </Coordinator>
          </ViewportRefsCtx.Provider>
        </ViewportActionsCtx.Provider>
      );

      const view = render(renderTree('visible'));

      expect(createdCount).toBe(1);
      expect(disposedCount).toBe(0);
      expect(liveEngines.size).toBe(1);
      expect(canvasRenders).toBe(1);
      expect(coordinatorRenders).toBe(1);

      view.rerender(renderTree('hidden'));

      expect(liveEngines.size).toBe(0);
      expect(disposedCount).toBe(1);
      expect(coordinatorRenders).toBe(2);

      view.rerender(renderTree('visible'));

      expect(createdCount).toBe(2);
      expect(liveEngines.size).toBe(1);
      expect(coordinatorRenders).toBe(3);

      await act(async () => {
        fireEvent.click(screen.getByTestId('activity-focus-hero-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('activity-viewport-host')).toHaveAttribute(
          'data-active-region',
          'hero',
        );
      });

      view.unmount();
      expect(liveEngines.size).toBe(0);
      expect(disposedCount).toBe(2);
    });
  });
});
