import { act, render, waitFor } from '@testing-library/react';
import React, { useCallback, useEffect, useLayoutEffect } from 'react';
import { performance } from 'node:perf_hooks';
import {
  createActionContext,
  createStore,
  useStorePath,
  useStoreSelector,
  useStoreValue,
  type PatchAwareStore,
} from '@context-action/react';
import { createRefContext } from '@context-action/react/refs';
import { patchesAffectPath } from '../../src/stores/utils/patch-affects-path';

interface GridState {
  cells: number[];
}

interface ScalingRow {
  mode: string;
  subscribers: number;
  updates: number;
  filterEvaluations: number;
  targetWakeups: number;
  totalMs: number;
  usPerUpdate: number;
}

function createGridState(size: number): GridState {
  const cells = new Array<number>(size);
  for (let i = 0; i < size; i += 1) {
    cells[i] = 0;
  }
  return { cells };
}

async function waitForCondition(predicate: () => boolean, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for batched frame flush');
    }
    await new Promise<void>(resolve => {
      setTimeout(resolve, 4);
    });
  }
}

describe('Pseudo-signal architecture empirical proofs', () => {
  it('proves O(N) patch-listener fan-out and quantitative reductions from store sharding and RAF batching', async () => {
    const subscriberCounts = [10, 100, 1000, 5000] as const;
    const scalingRows: ScalingRow[] = [];

    // 1. Verify exact O(N) filter evaluations on N = 500 immediate subscribers vs N = 5000 scaling
    {
      const n = 500;
      const store = createStore('grid-immediate-500', createGridState(n), {
        notificationMode: 'immediate',
      });
      let filterEvaluations = 0;
      let targetWakeups = 0;
      let unrelatedWakeups = 0;
      const unsubs: Array<() => void> = [];

      for (let i = 0; i < n; i += 1) {
        const targetPath = ['cells', i] as const;
        unsubs.push(
          store.subscribeWithPatches(patches => {
            filterEvaluations += 1;
            if (patchesAffectPath(patches, targetPath)) {
              if (i === 0) targetWakeups += 1;
              else unrelatedWakeups += 1;
            }
          }),
        );
      }

      const updates = 20;
      for (let u = 1; u <= updates; u += 1) {
        store.update(draft => {
          draft.cells[0] = u;
        });
      }

      expect(filterEvaluations).toBe(updates * n); // 10,000 O(N) evaluations
      expect(targetWakeups).toBe(updates); // Only 20 true wakeups
      expect(unrelatedWakeups).toBe(0);

      for (const unsub of unsubs) unsub();
      store.dispose();
    }

    // 2. Mitigation A: Shard 500 cells into 10 row stores (50 subscribers per shard) -> 10x fewer filter calls
    {
      const shardCount = 10;
      const cellsPerShard = 50;
      const stores = Array.from({ length: shardCount }, (_, s) =>
        createStore(`grid-shard-${s}`, createGridState(cellsPerShard), {
          notificationMode: 'immediate',
        }),
      );
      let filterEvaluations = 0;
      let targetWakeups = 0;
      let unrelatedWakeups = 0;
      const unsubs: Array<() => void> = [];

      for (let s = 0; s < shardCount; s += 1) {
        const shardStore = stores[s]!;
        for (let c = 0; c < cellsPerShard; c += 1) {
          const path = ['cells', c] as const;
          unsubs.push(
            shardStore.subscribeWithPatches(patches => {
              filterEvaluations += 1;
              if (patchesAffectPath(patches, path)) {
                if (s === 0 && c === 0) targetWakeups += 1;
                else unrelatedWakeups += 1;
              }
            }),
          );
        }
      }

      const updates = 20;
      for (let u = 1; u <= updates; u += 1) {
        stores[0]!.update(draft => {
          draft.cells[0] = u;
        });
      }

      expect(filterEvaluations).toBe(updates * cellsPerShard); // 1,000 vs 10,000 (10x reduction)
      expect(targetWakeups).toBe(updates);
      expect(unrelatedWakeups).toBe(0);

      for (const unsub of unsubs) unsub();
      for (const s of stores) s.dispose();
    }

    // 3. Mitigation B: notificationMode: 'batched' coalesces 50 rapid updates into 1 frame flush -> 50x fewer checks
    {
      const n = 500;
      const batchedStore = createStore('grid-batched-500', createGridState(n), {
        notificationMode: 'batched',
      });
      let filterEvaluations = 0;
      let cell0Wakeups = 0;
      let cell1Wakeups = 0;
      let unrelatedWakeups = 0;
      const unsubs: Array<() => void> = [];

      for (let i = 0; i < n; i += 1) {
        const path = ['cells', i] as const;
        unsubs.push(
          batchedStore.subscribeWithPatches(patches => {
            filterEvaluations += 1;
            if (patchesAffectPath(patches, path)) {
              if (i === 0) cell0Wakeups += 1;
              else if (i === 1) cell1Wakeups += 1;
              else unrelatedWakeups += 1;
            }
          }),
        );
      }

      // Perform 50 rapid mutations alternating between cell 0 and cell 1 inside one frame
      const updates = 50;
      for (let u = 1; u <= updates; u += 1) {
        batchedStore.update(draft => {
          if (u % 2 === 0) draft.cells[0] = u;
          else draft.cells[1] = u;
        });
      }

      // Immediately after synchronous burst, no listener notifications have fired yet
      expect(filterEvaluations).toBe(0);

      await waitForCondition(() => filterEvaluations >= n);

      expect(filterEvaluations).toBe(n); // 500 total vs 25,000 in immediate mode (50x fewer checks)
      expect(cell0Wakeups).toBe(1);
      expect(cell1Wakeups).toBe(1);
      expect(unrelatedWakeups).toBe(0);

      for (const unsub of unsubs) unsub();
      batchedStore.dispose();
    }

    // 4. Optional scaling benchmark table across N = 10, 100, 1000, 5000 (BENCH_LOG=1)
    if (process.env.BENCH_LOG === '1') {
      const benchUpdates = 200;
      for (const n of subscriberCounts) {
        const store = createStore(`scale-immediate-${n}`, createGridState(n), {
          notificationMode: 'immediate',
        });
        let filterEvaluations = 0;
        let targetWakeups = 0;
        const unsubs: Array<() => void> = [];
        for (let i = 0; i < n; i += 1) {
          const path = ['cells', i] as const;
          unsubs.push(
            store.subscribeWithPatches(patches => {
              filterEvaluations += 1;
              if (patchesAffectPath(patches, path) && i === 0) {
                targetWakeups += 1;
              }
            }),
          );
        }

        const t0 = performance.now();
        for (let u = 1; u <= benchUpdates; u += 1) {
          store.update(draft => {
            draft.cells[0] = u;
          });
        }
        const totalMs = performance.now() - t0;

        scalingRows.push({
          mode: 'single-store-immediate',
          subscribers: n,
          updates: benchUpdates,
          filterEvaluations,
          targetWakeups,
          totalMs: Number(totalMs.toFixed(2)),
          usPerUpdate: Number(((totalMs * 1000) / benchUpdates).toFixed(2)),
        });

        for (const unsub of unsubs) unsub();
        store.dispose();
      }

      // Compare 5000 total subscribers when sharded across 50 row stores (100 cells/shard)
      {
        const shards = 50;
        const perShard = 100;
        const shardStores = Array.from({ length: shards }, (_, s) =>
          createStore(`scale-shard-${s}`, createGridState(perShard), {
            notificationMode: 'immediate',
          }),
        );
        let filterEvaluations = 0;
        let targetWakeups = 0;
        const unsubs: Array<() => void> = [];
        for (let s = 0; s < shards; s += 1) {
          for (let c = 0; c < perShard; c += 1) {
            const path = ['cells', c] as const;
            unsubs.push(
              shardStores[s]!.subscribeWithPatches(patches => {
                filterEvaluations += 1;
                if (patchesAffectPath(patches, path) && s === 0 && c === 0) {
                  targetWakeups += 1;
                }
              }),
            );
          }
        }

        const t0 = performance.now();
        for (let u = 1; u <= benchUpdates; u += 1) {
          shardStores[0]!.update(draft => {
            draft.cells[0] = u;
          });
        }
        const totalMs = performance.now() - t0;

        scalingRows.push({
          mode: 'sharded-50x100-immediate',
          subscribers: shards * perShard,
          updates: benchUpdates,
          filterEvaluations,
          targetWakeups,
          totalMs: Number(totalMs.toFixed(2)),
          usPerUpdate: Number(((totalMs * 1000) / benchUpdates).toFixed(2)),
        });

        for (const unsub of unsubs) unsub();
        for (const s of shardStores) s.dispose();
      }

      // Compare 5000 subscribers with notificationMode: 'batched' coalescing 50 updates into 1 frame
      {
        const n = 5000;
        const batched = createStore('scale-batched-5000', createGridState(n), {
          notificationMode: 'batched',
        });
        let filterEvaluations = 0;
        let targetWakeups = 0;
        const unsubs: Array<() => void> = [];
        for (let i = 0; i < n; i += 1) {
          const path = ['cells', i] as const;
          unsubs.push(
            batched.subscribeWithPatches(patches => {
              filterEvaluations += 1;
              if (patchesAffectPath(patches, path) && i === 0) {
                targetWakeups += 1;
              }
            }),
          );
        }

        const burstUpdates = 50;
        const t0 = performance.now();
        for (let u = 1; u <= burstUpdates; u += 1) {
          batched.update(draft => {
            draft.cells[0] = u;
          });
        }
        await waitForCondition(() => filterEvaluations >= n);
        const totalMs = performance.now() - t0;

        scalingRows.push({
          mode: 'single-store-batched-burst',
          subscribers: n,
          updates: burstUpdates,
          filterEvaluations,
          targetWakeups,
          totalMs: Number(totalMs.toFixed(2)),
          usPerUpdate: Number(((totalMs * 1000) / burstUpdates).toFixed(2)),
        });

        for (const unsub of unsubs) unsub();
        batched.dispose();
      }

      console.info('O(N) Fan-Out & Mitigation Scaling Table:', scalingRows);
    }
  });

  it('proves useStorePath skips unrelated selector re-evaluations and update() narrows patches compared to setValue()', async () => {
    interface AppState {
      user: { name: string; age: number };
      metrics: { ticks: number };
    }

    const store = createStore<AppState>(
      'signal-precision',
      {
        user: { name: 'Ada', age: 36 },
        metrics: { ticks: 0 },
      },
      { notificationMode: 'immediate' },
    );

    let nameSnapshotReads = 0;
    let ageSnapshotReads = 0;
    let agePatchCallbackHits = 0;

    const trackedNameStore: PatchAwareStore<AppState> = {
      getValue: () => store.getValue(),
      getSnapshot: () => {
        nameSnapshotReads += 1;
        return store.getSnapshot();
      },
      subscribe: cb => store.subscribe(cb),
      subscribeWithPatches: cb => store.subscribeWithPatches(cb),
    };

    const trackedAgeStore: PatchAwareStore<AppState> = {
      getValue: () => store.getValue(),
      getSnapshot: () => {
        ageSnapshotReads += 1;
        return store.getSnapshot();
      },
      subscribe: cb => store.subscribe(cb),
      subscribeWithPatches: cb =>
        store.subscribeWithPatches(patches => {
          if (patchesAffectPath(patches, ['user', 'age'])) {
            agePatchCallbackHits += 1;
          }
          cb(patches);
        }),
    };

    let selectorEvaluations = 0;
    let pathRenderCount = 0;
    let selectorRenderCount = 0;
    let ageRenderCount = 0;

    function PathNameLeaf() {
      pathRenderCount += 1;
      const name = useStorePath(trackedNameStore, ['user', 'name']);
      return <span data-testid="path-name">{String(name)}</span>;
    }

    function PathAgeLeaf() {
      ageRenderCount += 1;
      const age = useStorePath(trackedAgeStore, ['user', 'age']);
      return <span data-testid="path-age">{String(age)}</span>;
    }

    function SelectorNameLeaf() {
      selectorRenderCount += 1;
      const name = useStoreSelector(store, state => {
        selectorEvaluations += 1;
        return state.user.name;
      });
      return <span data-testid="selector-name">{name}</span>;
    }

    const view = render(
      <>
        <PathNameLeaf />
        <PathAgeLeaf />
        <SelectorNameLeaf />
      </>,
    );

    await waitFor(() => {
      expect(pathRenderCount).toBe(1);
      expect(ageRenderCount).toBe(1);
      expect(selectorRenderCount).toBe(1);
    });

    const baselineNameReads = nameSnapshotReads;
    const baselineAgeReads = ageSnapshotReads;
    const baselineSelectorEvals = selectorEvaluations;

    // Dispatch 50 unrelated updates to ['metrics', 'ticks']
    await act(async () => {
      for (let i = 1; i <= 50; i += 1) {
        store.update(draft => {
          draft.metrics.ticks = i;
        });
      }
    });

    // Neither leaf re-rendered, but useStoreSelector re-ran its selector 50 times while useStorePath ran 0 times!
    expect(pathRenderCount).toBe(1);
    expect(selectorRenderCount).toBe(1);
    expect(nameSnapshotReads - baselineNameReads).toBe(0);
    expect(selectorEvaluations - baselineSelectorEvals).toBe(50);

    // Compare update() vs setValue() patch precision against unrelated sibling ['user', 'age']
    const ageHitsBeforeUpdate = agePatchCallbackHits;
    const ageReadsBeforeUpdate = ageSnapshotReads;
    await act(async () => {
      store.update(draft => {
        draft.user.name = 'Kim';
      });
    });
    expect(agePatchCallbackHits - ageHitsBeforeUpdate).toBe(0); // Narrow ['user', 'name'] patch!
    expect(ageSnapshotReads - ageReadsBeforeUpdate).toBe(0);
    expect(ageRenderCount).toBe(1);

    const ageHitsBeforeSetValue = agePatchCallbackHits;
    const ageReadsBeforeSetValue = ageSnapshotReads;
    await act(async () => {
      const current = store.getValue();
      store.setValue({
        ...current,
        user: { ...current.user, name: 'Park' },
      });
    });
    // setValue() rewrites top-level key 'user', waking AgeLeaf's path check even though age stayed 36
    expect(agePatchCallbackHits - ageHitsBeforeSetValue).toBe(1);
    expect(ageSnapshotReads - ageReadsBeforeSetValue).toBeGreaterThanOrEqual(1);
    expect(ageRenderCount).toBe(1); // Object.is(36, 36) still prevents re-render
    expect(baselineAgeReads).toBeGreaterThanOrEqual(1);

    await act(async () => {
      view.unmount();
    });
    store.dispose();
  });

  it('proves component-function granularity: container subscription vs Shell(useActionDispatch) + Leaf(useStorePath)', async () => {
    interface DashboardState {
      price: number;
      stock: number;
    }

    interface DashboardActions {
      updatePrice: { price: number };
      updateStock: { stock: number };
    }

    const antiStore = createStore<DashboardState>(
      'anti-container-store',
      { price: 100, stock: 25 },
      { notificationMode: 'immediate' },
    );
    const antiRenders = { container: 0, price: 0, stock: 0, chart: 0 };

    function AntiPriceView({ price }: { price: number }) {
      antiRenders.price += 1;
      return <span>{price}</span>;
    }
    function AntiStockView({ stock }: { stock: number }) {
      antiRenders.stock += 1;
      return <span>{stock}</span>;
    }
    function AntiHeavyChart() {
      antiRenders.chart += 1;
      return <span>chart</span>;
    }
    function AntiContainerDashboard() {
      antiRenders.container += 1;
      const state = useStoreValue(antiStore);
      return (
        <>
          <AntiPriceView price={state.price} />
          <AntiStockView stock={state.stock} />
          <AntiHeavyChart />
        </>
      );
    }

    const antiView = render(<AntiContainerDashboard />);
    expect(antiRenders).toEqual({ container: 1, price: 1, stock: 1, chart: 1 });

    for (let i = 1; i <= 5; i += 1) {
      await act(async () => {
        antiStore.update(draft => {
          draft.price = 100 + i;
        });
      });
    }

    const antiExtraTotal =
      (antiRenders.container - 1)
      + (antiRenders.price - 1)
      + (antiRenders.stock - 1)
      + (antiRenders.chart - 1);
    expect(antiRenders).toEqual({ container: 6, price: 6, stock: 6, chart: 6 });
    expect(antiExtraTotal).toBe(20);

    await act(async () => {
      antiView.unmount();
    });
    antiStore.dispose();

    // Recommended pattern: Shell holds only useActionDispatch(); Leafs subscribe via useStorePath()
    const Actions = createActionContext<DashboardActions>('LeafShellActions');
    const leafStore = createStore<DashboardState>(
      'leaf-signal-store',
      { price: 100, stock: 25 },
      { notificationMode: 'immediate' },
    );
    const leafRenders = { shell: 0, price: 0, stock: 0, chart: 0 };
    let dispatchRef: ReturnType<typeof Actions.useActionDispatch> | undefined;

    function PriceLeaf() {
      leafRenders.price += 1;
      const price = useStorePath<DashboardState, number>(leafStore, ['price']);
      return <span>{price}</span>;
    }
    function StockLeaf() {
      leafRenders.stock += 1;
      const stock = useStorePath<DashboardState, number>(leafStore, ['stock']);
      return <span>{stock}</span>;
    }
    function LeafHeavyChart() {
      leafRenders.chart += 1;
      return <span>chart</span>;
    }
    function ShellDashboard() {
      leafRenders.shell += 1;
      dispatchRef = Actions.useActionDispatch();
      const register = Actions.useActionRegister();

      Actions.useActionCommandHandler(
        'updatePrice',
        useCallback(payload => {
          leafStore.update(draft => {
            draft.price = payload.price;
          });
        }, []),
      );
      Actions.useActionCommandHandler(
        'updateStock',
        useCallback(payload => {
          leafStore.update(draft => {
            draft.stock = payload.stock;
          });
        }, []),
      );

      expect(register).not.toBeNull();
      return (
        <>
          <PriceLeaf />
          <StockLeaf />
          <LeafHeavyChart />
        </>
      );
    }

    const leafView = render(
      <Actions.Provider>
        <ShellDashboard />
      </Actions.Provider>,
    );

    await waitFor(() => {
      expect(dispatchRef).toBeDefined();
    });
    expect(leafRenders).toEqual({ shell: 1, price: 1, stock: 1, chart: 1 });

    for (let i = 1; i <= 5; i += 1) {
      await act(async () => {
        await dispatchRef!('updatePrice', { price: 100 + i });
      });
    }

    const leafExtraAfterPrice =
      (leafRenders.shell - 1)
      + (leafRenders.price - 1)
      + (leafRenders.stock - 1)
      + (leafRenders.chart - 1);
    expect(leafRenders).toEqual({ shell: 1, price: 6, stock: 1, chart: 1 });
    expect(leafExtraAfterPrice).toBe(5); // 75% fewer renders than anti-pattern (5 vs 20)

    await act(async () => {
      await dispatchRef!('updateStock', { stock: 99 });
    });
    expect(leafRenders).toEqual({ shell: 1, price: 6, stock: 2, chart: 1 });

    await act(async () => {
      leafView.unmount();
    });
    leafStore.dispose();
  });

  it('proves intentional useEffect/useLayoutEffect compatibility in Leaf components alongside 0-effect fast-lane refs', async () => {
    interface CoexistState {
      price: number;
      theme: 'light' | 'dark';
    }

    interface CoexistActions {
      pointerMove: { x: number; y: number };
      updatePrice: { price: number };
      updateTheme: { theme: 'light' | 'dark' };
    }

    const Actions = createActionContext<CoexistActions>('UseEffectCoexistence', {
      actions: {
        pointerMove: { lane: 'fast' },
        updatePrice: { lane: 'orchestrated', queue: 'serial' },
        updateTheme: { lane: 'orchestrated', queue: 'serial' },
      },
    });
    const Refs = createRefContext('UseEffectCoexistenceRefs', {
      cursor: {
        name: 'cursor',
        autoCleanup: true,
        validator: (target: unknown): target is HTMLDivElement =>
          target instanceof HTMLDivElement,
      },
    });
    const store = createStore<CoexistState>(
      'coexist-store',
      { price: 100, theme: 'light' },
      { notificationMode: 'immediate' },
    );

    const priceLifecycle: string[] = [];
    const themeLifecycle: string[] = [];
    let shellRenders = 0;
    let overlayRenders = 0;
    let cursorNode: HTMLDivElement | null = null;
    let dispatch: ReturnType<typeof Actions.useActionDispatch> | undefined;
    let currentRegister: ReturnType<typeof Actions.useActionRegister> = null;

    function PriceEffectLeaf() {
      const price = useStorePath<CoexistState, number>(store, ['price']);
      priceLifecycle.push(`price-render:${price}`);

      useLayoutEffect(() => {
        priceLifecycle.push(`price-layout:${price}`);
      }, [price]);

      useEffect(() => {
        priceLifecycle.push(`price-effect:${price}`);
        return () => {
          priceLifecycle.push(`price-cleanup:${price}`);
        };
      }, [price]);

      return <span>{price}</span>;
    }

    function ThemeEffectLeaf() {
      const theme = useStorePath<CoexistState, CoexistState['theme']>(store, ['theme']);
      themeLifecycle.push(`theme-render:${theme}`);

      useEffect(() => {
        themeLifecycle.push(`theme-effect:${theme}`);
        return () => {
          themeLifecycle.push(`theme-cleanup:${theme}`);
        };
      }, [theme]);

      return <span>{theme}</span>;
    }

    function CursorOverlay() {
      overlayRenders += 1;
      const cursorRef = Refs.useRefController('cursor');

      const setCursor = useCallback(
        (node: HTMLDivElement | null) => {
          cursorNode = node;
          cursorRef.setRef(node);
        },
        [cursorRef],
      );

      Actions.useActionCommandHandler(
        'pointerMove',
        useCallback(
          payload => {
            cursorRef.executeIfMounted(el => {
              el.dataset.pos = `${payload.x},${payload.y}`;
            });
          },
          [cursorRef],
        ),
      );

      return <div ref={setCursor} data-testid="cursor" />;
    }

    function Shell() {
      shellRenders += 1;
      dispatch = Actions.useActionDispatch();
      currentRegister = Actions.useActionRegister();

      Actions.useActionCommandHandler(
        'updatePrice',
        useCallback(payload => {
          store.update(draft => {
            draft.price = payload.price;
          });
        }, []),
      );
      Actions.useActionCommandHandler(
        'updateTheme',
        useCallback(payload => {
          store.update(draft => {
            draft.theme = payload.theme;
          });
        }, []),
      );

      return (
        <>
          <PriceEffectLeaf />
          <ThemeEffectLeaf />
          <CursorOverlay />
        </>
      );
    }

    const view = render(
      <Actions.Provider>
        <Refs.Provider>
          <Shell />
        </Refs.Provider>
      </Actions.Provider>,
    );

    await waitFor(() => {
      expect(currentRegister?.getHandlerCount('pointerMove')).toBe(1);
      expect(currentRegister?.getHandlerCount('updatePrice')).toBe(1);
      expect(cursorNode).not.toBeNull();
    });

    expect(priceLifecycle).toEqual(['price-render:100', 'price-layout:100', 'price-effect:100']);
    expect(themeLifecycle).toEqual(['theme-render:light', 'theme-effect:light']);
    expect(shellRenders).toBe(1);
    expect(overlayRenders).toBe(1);

    // Clear initial mount entries to inspect transition ordering cleanly
    priceLifecycle.length = 0;
    themeLifecycle.length = 0;

    // Price updates trigger full render -> useLayoutEffect -> prev cleanup -> useEffect ONLY on PriceEffectLeaf
    await act(async () => {
      await dispatch!('updatePrice', { price: 120 });
    });
    await act(async () => {
      await dispatch!('updatePrice', { price: 150 });
    });

    expect(priceLifecycle).toEqual([
      'price-render:120',
      'price-layout:120',
      'price-cleanup:100',
      'price-effect:120',
      'price-render:150',
      'price-layout:150',
      'price-cleanup:120',
      'price-effect:150',
    ]);
    expect(themeLifecycle).toEqual([]); // Sibling ThemeEffectLeaf completely untouched
    expect(shellRenders).toBe(1);
    expect(overlayRenders).toBe(1);

    // High-frequency fast-lane pointer moves bypass React renders & effects completely
    priceLifecycle.length = 0;
    await act(async () => {
      for (let i = 0; i < 100; i += 1) {
        await dispatch!('pointerMove', { x: i, y: i * 2 });
      }
    });

    expect(cursorNode!.dataset.pos).toBe('99,198');
    expect(priceLifecycle).toEqual([]);
    expect(themeLifecycle).toEqual([]);
    expect(shellRenders).toBe(1);
    expect(overlayRenders).toBe(1);

    await act(async () => {
      view.unmount();
    });
    expect(priceLifecycle).toEqual(['price-cleanup:150']);
    expect(themeLifecycle).toEqual(['theme-cleanup:light']);
    store.dispose();
  });
});
