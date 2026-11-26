import { ActionRegister } from '@context-action/core';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React, { StrictMode, useEffect } from 'react';
import {
  createActionContext,
  createScopedContext,
  createStore,
  useStorePath,
  useStoreSelectorWithPaths,
  type ScopedContextReturn,
  type StorePath,
} from '@context-action/react';
import {
  useControlledStoreSync,
  useStoreInstance,
} from '@context-action/react/advanced';
import { useRefRegistry, type RefRegistry } from '@context-action/react/refs';
import {
  createTimeTravelStore,
  useTimeTravelPath,
  useTimeTravelSelector,
} from '@context-action/react/time-travel';

interface TypedTestState {
  selectedId: string;
  unrelated: string;
  selectedById: Record<string, boolean | undefined>;
  items: string[];
  nested: {
    coords: { x: number; y: number; label: string };
  };
}

// Compile-time type contract verification (executed for type-check only via `tsc -p __tests__/tsconfig.json`)
export function verifyPathTypeContracts(
  store: ReturnType<typeof createStore<TypedTestState>>,
  ttStore: ReturnType<typeof createTimeTravelStore<TypedTestState>>,
  rowId: string,
  dynamicPath: StorePath,
) {
  const direct: string = useStorePath(store, ['selectedId']);
  const derived: boolean = useStorePath(store, ['selectedId'], {
    select: value => value === 'item-1',
  });
  const recordEntry: boolean | undefined = useStorePath(store, ['selectedById', rowId]);
  const arrayItem: string | undefined = useStorePath(store, ['items', 0]);
  const rootSnapshot: TypedTestState = useStorePath(store, []);
  const dynamicVal: unknown = useStorePath(store, dynamicPath);
  const explicitLegacy: string[] = useStorePath<TypedTestState, string[]>(store, ['items']);
  const multiSelector: string = useStoreSelectorWithPaths(
    store,
    s => `${s.selectedId}:${s.unrelated}`,
    { dependsOn: [['selectedId'], ['unrelated']] },
  );
  const derivedTimeTravel: boolean = useTimeTravelPath(ttStore, ['selectedId'], {
    select: v => v === 'item-1',
  });
  const multiTimeTravelSelector: string = useTimeTravelSelector(
    ttStore,
    s => `${s.selectedId}:${s.unrelated}`,
    { dependsOn: [['selectedId'], ['unrelated']] },
  );
  const dynamicTimeTravelSelector: string = useTimeTravelSelector(
    ttStore,
    s => s.selectedId,
    { dependsOn: [dynamicPath] },
  );
  useControlledStoreSync(store, ['selectedId'], 'item-2');
  useControlledStoreSync(store, dynamicPath, 'item-2');

  // Verify ScopedContextReturn aligned 3-generic form (TActions, TProps, TRuntime)
  type SampleScoped = ScopedContextReturn<{ ping: undefined }, { label?: string }, { ok: boolean }>;
  const sampleCheck: SampleScoped['contextName'] | null = null;

  // @ts-expect-error invalid key on useStorePath
  useStorePath(store, ['nonexistent']);
  // @ts-expect-error invalid key on useStorePath select
  useStorePath(store, ['nonexistent'], { select: v => v });
  // @ts-expect-error invalid nested key on useStorePath
  useStorePath(store, ['nested', 'nonexistent']);
  // @ts-expect-error invalid key in useStoreSelectorWithPaths dependsOn
  useStoreSelectorWithPaths(store, s => s.selectedId, { dependsOn: [['nonexistent']] });
  // invalid key in explicit generic useStoreSelectorWithPaths dependsOn
  useStoreSelectorWithPaths<TypedTestState, boolean>(
    store,
    s => s.selectedId === 'item-1',
    // @ts-expect-error invalid key in explicit generic dependsOn
    { dependsOn: [['nonexistent']] },
  );
  // @ts-expect-error invalid key in useTimeTravelSelector dependsOn
  useTimeTravelSelector(ttStore, s => s.selectedId, { dependsOn: [['nonexistent']] });
  // @ts-expect-error invalid key on useControlledStoreSync
  useControlledStoreSync(store, ['nonexistent'], 'x');
  // @ts-expect-error invalid value type on useControlledStoreSync
  useControlledStoreSync(store, ['selectedId'], 123);
  // @ts-expect-error invalid key on useTimeTravelPath
  useTimeTravelPath(ttStore, ['nonexistent']);

  return {
    direct,
    derived,
    recordEntry,
    arrayItem,
    rootSnapshot,
    dynamicVal,
    explicitLegacy,
    multiSelector,
    derivedTimeTravel,
    multiTimeTravelSelector,
    dynamicTimeTravelSelector,
    sampleCheck,
  };
}

describe('Context-Action React DX & Ergonomics Contracts', () => {
  describe('1. useStorePath derived select & typed path safety', () => {
    it('isolates 50 leaf items to 2 toggled re-renders and keeps subscribePaths zero-churn on inline select', () => {
      const store = createStore<TypedTestState>('DerivedSelect50', {
        selectedId: 'item-0',
        unrelated: 'v0',
        selectedById: {},
        items: ['a', 'b'],
        nested: { coords: { x: 1, y: 2, label: 'init' } },
      });

      const originalSubscribePaths = store.subscribePaths.bind(store);
      const subscribeSpy = jest.fn(originalSubscribePaths);
      store.subscribePaths = subscribeSpy;

      const rowRenders = new Map<string, number>();

      function LeafRow({ id }: { id: string }) {
        rowRenders.set(id, (rowRenders.get(id) ?? 0) + 1);
        const isSelected = useStorePath(store, ['selectedId'], {
          select: selected => selected === id,
        });
        return (
          <div data-testid={`row-${id}`} data-selected={String(isSelected)}>
            {id}
          </div>
        );
      }

      const ids = Array.from({ length: 50 }, (_, idx) => `item-${idx}`);

      function ParentList({ tick }: { tick: number }) {
        return (
          <div data-tick={tick}>
            {ids.map(id => (
              <LeafRow key={id} id={id} />
            ))}
          </div>
        );
      }

      const view = render(<ParentList tick={0} />);
      expect(subscribeSpy).toHaveBeenCalledTimes(50);

      const baseline = new Map(rowRenders);

      // Move selection from item-0 -> item-7: ONLY 2 leaves change boolean output
      act(() => {
        store.update(draft => {
          draft.selectedId = 'item-7';
        });
      });

      let changedLeaves = 0;
      for (const id of ids) {
        const delta = (rowRenders.get(id) ?? 0) - (baseline.get(id) ?? 0);
        if (delta > 0) {
          changedLeaves += 1;
          expect(id === 'item-0' || id === 'item-7').toBe(true);
        }
      }
      expect(changedLeaves).toBe(2);
      expect(view.getByTestId('row-item-0').getAttribute('data-selected')).toBe('false');
      expect(view.getByTestId('row-item-7').getAttribute('data-selected')).toBe('true');

      // Re-render parent (fresh inline `select` closures) -> ZERO new subscribePaths calls
      const beforeParentRerender = subscribeSpy.mock.calls.length;
      view.rerender(<ParentList tick={1} />);
      expect(subscribeSpy).toHaveBeenCalledTimes(beforeParentRerender);

      // Update unrelated path -> ZERO leaf renders
      const afterRerenderCounts = new Map(rowRenders);
      act(() => {
        store.update(draft => {
          draft.unrelated = 'v1';
        });
      });
      for (const id of ids) {
        expect(rowRenders.get(id)).toBe(afterRerenderCounts.get(id));
      }

      view.unmount();
      store.dispose();
    });

    it('updates captured prop inside inline select without tearing and honors equalityFn stability', () => {
      const store = createStore<TypedTestState>('SelectPropAndEquality', {
        selectedId: 'b',
        unrelated: 'u0',
        selectedById: {},
        items: ['x'],
        nested: { coords: { x: 10, y: 20, label: 'first' } },
      });

      const observedCoords: Array<{ x: number; y: number }> = [];
      let equalityRenders = 0;

      function MatchProbe({ targetId }: { targetId: string }) {
        const matched = useStorePath(store, ['selectedId'], {
          select: v => v === targetId,
        });
        equalityRenders += 1;
        const point = useStorePath(store, ['nested', 'coords'], {
          select: coords => ({ x: coords.x, y: coords.y }),
          equalityFn: (a, b) => a.x === b.x && a.y === b.y,
        });
        observedCoords.push(point);
        return <span data-testid="probe">{`${matched}:${point.x},${point.y}`}</span>;
      }

      const view = render(<MatchProbe targetId="a" />);
      expect(view.getByTestId('probe').textContent).toBe('false:10,20');

      // Updating label under nested.coords triggers getSnapshot, but equalityFn preserves reference and skips re-render
      const rendersBeforeLabelChange = equalityRenders;
      act(() => {
        store.update(draft => {
          draft.nested.coords.label = 'second';
        });
      });
      expect(equalityRenders).toBe(rendersBeforeLabelChange);

      // Changing targetId prop updates inline select closure synchronously without tearing
      view.rerender(<MatchProbe targetId="b" />);
      expect(view.getByTestId('probe').textContent).toBe('true:10,20');
      expect(observedCoords[0]).toBe(observedCoords[1]);

      view.unmount();
      store.dispose();
    });
  });

  describe('2. useRefRegistry lifecycle, StrictMode, and zero-render contract', () => {
    it('supports typed ref access, controllers, waitForRefs, and 0 React re-renders on attach/detach', async () => {
      interface WidgetRefs {
        trigger: HTMLButtonElement;
        panel: HTMLDivElement;
        late: HTMLSpanElement;
      }

      let registryRenderCount = 0;
      let latestRegistry!: RefRegistry<WidgetRefs>;

      function RegistryHarness({ show }: { show: boolean }) {
        registryRenderCount += 1;
        const refs = useRefRegistry<WidgetRefs>();
        latestRegistry = refs;
        return (
          <div>
            {show ? (
              <>
                <button ref={refs.setRef('trigger')} type="button">
                  Trigger
                </button>
                <div ref={refs.setRef('panel')} data-label="ok" />
              </>
            ) : null}
          </div>
        );
      }

      const view = render(<RegistryHarness show={true} />);
      expect(registryRenderCount).toBe(1);

      expect(latestRegistry.has('trigger')).toBe(true);
      expect(latestRegistry.get('trigger')).toBeInstanceOf(HTMLButtonElement);
      expect(
        latestRegistry.executeIfMounted('panel', el => el.getAttribute('data-label')),
      ).toBe('ok');

      const ctrl = latestRegistry.controller('panel');
      expect(ctrl.target).toBe(latestRegistry.get('panel'));
      expect(ctrl.checkMountState().isMounted).toBe(true);

      const resolvedAll = await latestRegistry.waitForRefs('trigger', 'panel');
      expect(resolvedAll.trigger).toBeInstanceOf(HTMLButtonElement);
      expect(resolvedAll.panel).toBeInstanceOf(HTMLDivElement);

      const mountCallback = jest.fn();
      const unsubMount = ctrl.onMount(mountCallback);
      expect(mountCallback).toHaveBeenCalledTimes(1);
      unsubMount();

      const opResult = await ctrl.withTarget(el => el.getAttribute('data-label'));
      expect(opResult.success).toBe(true);
      expect(opResult.result).toBe('ok');

      expect(Object.keys(latestRegistry.getAll()).sort()).toEqual(['panel', 'trigger']);

      // Detach refs -> 0 extra re-renders caused by registry itself (1 render strictly from rerender prop flip)
      view.rerender(<RegistryHarness show={false} />);
      expect(registryRenderCount).toBe(2);
      expect(latestRegistry.has('trigger')).toBe(false);
      expect(latestRegistry.get('panel')).toBeNull();

      // Re-attach through clear() smoke + real unmount disposal rejection
      view.rerender(<RegistryHarness show={true} />);
      expect(latestRegistry.has('trigger')).toBe(true);

      const pendingLate = latestRegistry.waitForMount('late');
      const savedSetter = latestRegistry.setRef('late');

      view.unmount();

      await expect(pendingLate).rejects.toThrow(/unmounted/i);

      // Saved setter after disposal is a safe no-op
      const orphan = document.createElement('span');
      savedSetter(orphan);
      expect(latestRegistry.get('late')).toBeNull();
    });

    it('survives React.StrictMode double-mount cleanly', () => {
      interface StrictRefs {
        btn: HTMLButtonElement;
      }

      let registry!: RefRegistry<StrictRefs>;

      function StrictHarness() {
        const refs = useRefRegistry<StrictRefs>();
        registry = refs;
        return (
          <button ref={refs.setRef('btn')} type="button">
            StrictBtn
          </button>
        );
      }

      const view = render(
        <StrictMode>
          <StrictHarness />
        </StrictMode>,
      );

      expect(registry.has('btn')).toBe(true);
      expect(registry.executeIfMounted('btn', el => el.textContent)).toBe('StrictBtn');

      // Simulated callback ref detach + re-attach retains active registry
      const node = registry.get('btn')!;
      const setter = registry.setRef('btn');
      setter(null);
      expect(registry.has('btn')).toBe(false);
      setter(node);
      expect(registry.has('btn')).toBe(true);

      view.unmount();
    });
  });

  describe('3. createScopedContext unified Provider & runtime stabilization', () => {
    it('eliminates Bridge boilerplate, shallow-stabilizes plain runtime objects, and supports DI', async () => {
      interface DialogActions {
        open: undefined;
        close: undefined;
      }

      const Actions = createActionContext<DialogActions>('ScopedDialogActions', {
        actions: {
          open: { lane: 'orchestrated', queue: 'serial' },
          close: { lane: 'orchestrated', queue: 'serial' },
        },
      });

      const Scope = createScopedContext(
        'ScopedDialog',
        Actions,
        ({
          initialOpen = false,
          onToggle,
        }: {
          initialOpen?: boolean;
          onToggle?: (next: boolean) => void;
        }) => {
          const store = useStoreInstance(
            () => ({ isOpen: initialOpen, label: 'steady' }),
            'ScopedDialogStore',
            { notificationMode: 'immediate' },
          );

          const isOpen = useStorePath(store, ['isOpen']);

          Actions.useActionCommandHandler('open', () => {
            store.update(draft => {
              draft.isOpen = true;
            });
          });
          Actions.useActionCommandHandler('close', () => {
            store.update(draft => {
              draft.isOpen = false;
            });
          });
          Actions.useActionObserver(
            'open',
            () => {
              onToggle?.(true);
            },
            { when: 'success' },
          );
          Actions.useActionObserver(
            'close',
            () => {
              onToggle?.(false);
            },
            { when: 'success' },
          );

          return { store, currentOpenFlag: isOpen ? 'ignored' : 'ignored' };
        },
      );

      let memoChildRenders = 0;
      const MemoLabelChild = React.memo(function MemoLabelChild() {
        memoChildRenders += 1;
        const { store } = Scope.useScope();
        const label = useStorePath(store, ['label']);
        return <span data-testid="label">{label}</span>;
      });

      function Controls() {
        const dispatch = Scope.useActionDispatch();
        const { store } = Scope.useScope();
        const isOpen = useStorePath(store, ['isOpen']);
        return (
          <button
            type="button"
            data-testid="toggle"
            data-open={String(isOpen)}
            onClick={() => void dispatch(isOpen ? 'close' : 'open')}
          >
            Toggle
          </button>
        );
      }

      const onToggle = jest.fn();
      const view = render(
        <StrictMode>
          <Scope.Provider initialOpen={false} onToggle={onToggle}>
            <MemoLabelChild />
            <Controls />
          </Scope.Provider>
        </StrictMode>,
      );

      const rendersBeforeOpen = memoChildRenders;
      expect(view.getByTestId('toggle').getAttribute('data-open')).toBe('false');

      // Open action runs directly inside Scope.Provider (no Bridge!) and re-renders ScopeHost via isOpen,
      // while MemoLabelChild stays un-re-rendered thanks to shallow stabilization of `{ store, currentOpenFlag }`.
      await act(async () => {
        fireEvent.click(view.getByTestId('toggle'));
      });

      await waitFor(() => {
        expect(view.getByTestId('toggle').getAttribute('data-open')).toBe('true');
      });
      expect(onToggle).toHaveBeenCalledWith(true);
      expect(memoChildRenders).toBe(rendersBeforeOpen);

      view.unmount();
    });

    it('supports undefined runtime values, throws clearly outside Provider, and preserves shared external registers', async () => {
      interface ExtActions {
        ping: { value: string };
      }

      const ExtActionsCtx = createActionContext<ExtActions>('ExtScopedActions');
      const UndefinedScope = createScopedContext('UndefinedScope', ExtActionsCtx, () => {
        return undefined;
      });

      function OutsideConsumer() {
        UndefinedScope.useScope();
        return null;
      }

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<OutsideConsumer />)).toThrow(
        'UndefinedScope.useScope must be used within UndefinedScope.Provider',
      );
      consoleError.mockRestore();

      const externalRegister = new ActionRegister<ExtActions>({ name: 'SharedExt' });
      const received: string[] = [];
      externalRegister.registerCommand('ping', payload => {
        received.push(payload.value);
      });

      function InsideConsumer() {
        const value = UndefinedScope.useScope();
        const dispatch = UndefinedScope.useActionDispatch();
        return (
          <button
            type="button"
            data-testid="ping-btn"
            data-val={String(value)}
            onClick={() => void dispatch('ping', { value: 'hello' })}
          >
            Ping
          </button>
        );
      }

      const view = render(
        <UndefinedScope.Provider register={externalRegister} ownership="shared">
          <InsideConsumer />
        </UndefinedScope.Provider>,
      );

      expect(view.getByTestId('ping-btn').getAttribute('data-val')).toBe('undefined');

      await act(async () => {
        fireEvent.click(view.getByTestId('ping-btn'));
      });
      expect(received).toEqual(['hello']);

      // Unmounting with ownership="shared" preserves externalRegister
      view.unmount();
      await externalRegister.dispatch('ping', { value: 'after-unmount' });
      expect(received).toEqual(['hello', 'after-unmount']);
      externalRegister.destroy();
    });
  });

  describe('4. ActionContext inline config.condition & config.cleanup latest-ref stability', () => {
    it('evaluates latest inline condition closure without re-registering handlers', async () => {
      interface RunActions {
        run: { score: number };
      }

      const Actions = createActionContext<RunActions>('InlineConditionActions');
      const executed: number[] = [];
      let registerInstance: ActionRegister<RunActions> | null = null;
      const registerSpy: Array<() => void> = [];

      function Harness({
        minScore,
        cleanupLabel,
        enableCleanup = true,
      }: {
        minScore: number;
        cleanupLabel: string;
        enableCleanup?: boolean;
      }) {
        const reg = Actions.useActionRegister();
        useEffect(() => {
          if (!reg || registerInstance === reg) return;
          registerInstance = reg;
          const origRegisterCommand = reg.registerCommand.bind(reg);
          reg.registerCommand = ((action, handler, config) => {
            registerSpy.push(() => {});
            return origRegisterCommand(action, handler, config);
          }) as typeof reg.registerCommand;
        }, [reg]);

        const dispatch = Actions.useActionDispatch();

        Actions.useActionCommandHandler(
          'run',
          payload => {
            executed.push(payload.score);
          },
          {
            condition: payload => payload.score >= minScore,
            cleanup: enableCleanup
              ? () => {
                  cleanedUp.push(cleanupLabel);
                }
              : undefined,
          },
        );

        return (
          <button
            type="button"
            data-testid="run-10"
            onClick={() => void dispatch('run', { score: 10 })}
          >
            Run 10
          </button>
        );
      }

      const cleanedUp: string[] = [];

      function Wrapper(props: { minScore: number; cleanupLabel: string; enableCleanup?: boolean }) {
        return (
          <Actions.Provider>
            <Harness {...props} />
          </Actions.Provider>
        );
      }

      const view = render(<Wrapper minScore={5} cleanupLabel="label-v1" />);

      await act(async () => {
        fireEvent.click(view.getByTestId('run-10'));
      });
      expect(executed).toEqual([10]);

      // Raise minScore threshold across inline closures -> ZERO cleanup firing & latest threshold respected
      view.rerender(<Wrapper minScore={20} cleanupLabel="label-v2" />);
      await Promise.resolve();
      expect(cleanedUp).toEqual([]);
      expect(registerSpy.length).toBe(0);

      await act(async () => {
        fireEvent.click(view.getByTestId('run-10'));
      });
      // Blocked by updated inline condition closure (10 < 20)
      expect(executed).toEqual([10]);

      // Transition cleanup: defined -> undefined must still invoke the v2 cleanup once
      view.rerender(<Wrapper minScore={20} cleanupLabel="label-v2" enableCleanup={false} />);
      await waitFor(() => {
        expect(cleanedUp).toEqual(['label-v2']);
      });

      // Re-enable cleanup -> then unmount executes latest closure exactly once
      view.rerender(<Wrapper minScore={20} cleanupLabel="label-v3" enableCleanup={true} />);
      view.unmount();

      await waitFor(() => {
        expect(cleanedUp).toEqual(['label-v2', 'label-v3']);
      });
    });
  });
});
