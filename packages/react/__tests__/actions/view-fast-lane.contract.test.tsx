import { act, render, waitFor } from '@testing-library/react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { performance } from 'node:perf_hooks';
import { createActionContext } from '@context-action/react';
import { createRefContext } from '@context-action/react/refs';
import { createTimeTravelStore } from '@context-action/react/time-travel';
import {
  StoreTransactionCoordinator,
  bindActionTransactions,
} from '@context-action/react/transactions';

describe('React dual-lane view fast-lane contract', () => {
  it('routes lane: "fast" useActionDispatch calls through dispatchLifecycle.runFast and bypasses run()', async () => {
    const Actions = createActionContext<{
      pointerMove: { x: number; y: number };
      commitStroke: { id: string };
    }>('FastLanePassThrough', {
      actions: {
        pointerMove: { lane: 'fast' },
        commitStroke: { lane: 'orchestrated', queue: 'serial' },
      },
    });

    const pointerHandler = jest.fn();
    const commitHandler = jest.fn();
    let dispatch: ReturnType<typeof Actions.useActionDispatch> | undefined;
    let actionCtx: ReturnType<typeof Actions.useActionContext> | undefined;

    function Consumer() {
      Actions.useActionCommandHandler('pointerMove', pointerHandler);
      Actions.useActionCommandHandler('commitStroke', commitHandler);
      dispatch = Actions.useActionDispatch();
      actionCtx = Actions.useActionContext();
      return null;
    }

    const view = render(
      <Actions.Provider>
        <Consumer />
      </Actions.Provider>,
    );

    await waitFor(() => {
      expect(actionCtx?.actionRegisterRef.current?.getHandlerCount('pointerMove')).toBe(1);
      expect(actionCtx?.actionRegisterRef.current?.getHandlerCount('commitStroke')).toBe(1);
    });

    const runSpy = jest.spyOn(actionCtx!.dispatchLifecycle, 'run');
    const runFastSpy = jest.spyOn(actionCtx!.dispatchLifecycle, 'runFast');

    await act(async () => {
      await dispatch!('pointerMove', { x: 10, y: 20 });
      await dispatch!('pointerMove', { x: 11, y: 22 }, { immediate: true });
    });

    expect(runFastSpy).toHaveBeenCalledTimes(2);
    expect(runSpy).toHaveBeenCalledTimes(0);
    expect(pointerHandler).toHaveBeenCalledTimes(2);

    await act(async () => {
      await dispatch!('commitStroke', { id: 'stroke-1' });
    });

    expect(runSpy).toHaveBeenCalledTimes(1);
    expect(runFastSpy).toHaveBeenCalledTimes(2);
    expect(commitHandler).toHaveBeenCalledTimes(1);

    runSpy.mockRestore();
    runFastSpy.mockRestore();

    await act(async () => {
      view.unmount();
    });
  });

  it('keeps React re-renders at zero across 1,000 pointerMove dispatches while isolating scoped transactions & undo', async () => {
    const CanvasActions = createActionContext<{
      pointerMove: { x: number; y: number };
      commitStroke: { value: number };
    }>('ZeroRerenderView', {
      actions: {
        pointerMove: { lane: 'fast' },
        commitStroke: { lane: 'orchestrated', queue: 'serial' },
      },
    });

    const CanvasRefs = createRefContext('ZeroRerenderViewRefs', {
      cursorBadge: {
        name: 'cursorBadge',
        autoCleanup: true,
        validator: (target: unknown): target is HTMLDivElement =>
          target instanceof HTMLDivElement,
      },
    });

    const store = createTimeTravelStore('zeroRerenderBoard', {
      strokes: [] as number[],
    });
    const coordinator = new StoreTransactionCoordinator();
    const getParticipantsSpy = jest.fn(() => [{ name: 'board', store }]);

    let renderCount = 0;
    let dispatch: ReturnType<typeof CanvasActions.useActionDispatch> | undefined;
    let badgeElement: HTMLDivElement | null = null;
    let currentRegister: ReturnType<typeof CanvasActions.useActionRegister> = null;

    function CanvasView() {
      renderCount += 1;
      dispatch = CanvasActions.useActionDispatch();
      currentRegister = CanvasActions.useActionRegister();
      const cursorBadge = CanvasRefs.useRefController('cursorBadge');

      const setBadgeRef = useCallback(
        (node: HTMLDivElement | null) => {
          badgeElement = node;
          cursorBadge.setRef(node);
        },
        [cursorBadge],
      );

      useEffect(() => {
        if (!currentRegister) return undefined;
        return bindActionTransactions(currentRegister, coordinator, {
          actions: ['commitStroke'],
          getParticipants: getParticipantsSpy,
        });
      }, [currentRegister]);

      const onPointerMove = useCallback(
        (payload: { x: number; y: number }) => {
          cursorBadge.executeIfMounted(el => {
            el.dataset.coords = `${payload.x},${payload.y}`;
          });
        },
        [cursorBadge],
      );
      CanvasActions.useActionCommandHandler('pointerMove', onPointerMove);

      const onCommitStroke = useCallback((payload: { value: number }) => {
        store.update(draft => {
          draft.strokes.push(payload.value);
        });
      }, []);
      CanvasActions.useActionCommandHandler('commitStroke', onCommitStroke);

      return <div ref={setBadgeRef} data-testid="cursor-badge" />;
    }

    const view = render(
      <CanvasActions.Provider>
        <CanvasRefs.Provider>
          <CanvasView />
        </CanvasRefs.Provider>
      </CanvasActions.Provider>,
    );

    await waitFor(() => {
      expect(currentRegister?.getHandlerCount('pointerMove')).toBe(1);
      expect(currentRegister?.getHandlerCount('commitStroke')).toBe(1);
      expect(badgeElement).not.toBeNull();
    });

    const rendersBeforeMove = renderCount;
    expect(rendersBeforeMove).toBe(1);

    await act(async () => {
      for (let i = 0; i < 1000; i++) {
        await dispatch!('pointerMove', { x: i, y: i * 2 });
      }
    });

    expect(renderCount).toBe(rendersBeforeMove);
    expect(badgeElement!.dataset.coords).toBe('999,1998');
    expect(getParticipantsSpy).not.toHaveBeenCalled();

    await act(async () => {
      await dispatch!('commitStroke', { value: 77 });
    });

    expect(getParticipantsSpy).toHaveBeenCalledTimes(1);
    expect(store.getValue()).toEqual({ strokes: [77] });

    coordinator.undo();
    expect(store.getValue()).toEqual({ strokes: [] });

    await act(async () => {
      view.unmount();
    });
    store.dispose();
  });

  it('falls back to dispatchLifecycle.run on explicit caller options and rejects post-unmount dispatches', async () => {
    const Actions = createActionContext<{
      pointerMove: { x: number; y: number };
    }>('FastLaneFailClosed', {
      actions: {
        pointerMove: { lane: 'fast' },
      },
    });

    let dispatch: ReturnType<typeof Actions.useActionDispatch> | undefined;
    let actionCtx: ReturnType<typeof Actions.useActionContext> | undefined;
    const handler = jest.fn();

    function Consumer() {
      Actions.useActionCommandHandler('pointerMove', handler);
      dispatch = Actions.useActionDispatch();
      actionCtx = Actions.useActionContext();
      return null;
    }

    const view = render(
      <Actions.Provider>
        <Consumer />
      </Actions.Provider>,
    );

    await waitFor(() => {
      expect(actionCtx?.actionRegisterRef.current?.getHandlerCount('pointerMove')).toBe(1);
    });

    const runSpy = jest.spyOn(actionCtx!.dispatchLifecycle, 'run');
    const runFastSpy = jest.spyOn(actionCtx!.dispatchLifecycle, 'runFast');
    const callerController = new AbortController();

    await act(async () => {
      await dispatch!('pointerMove', { x: 1, y: 2 }, { signal: callerController.signal });
    });

    expect(runSpy).toHaveBeenCalledTimes(1);
    expect(runFastSpy).toHaveBeenCalledTimes(0);
    expect(handler).toHaveBeenCalledTimes(1);

    runSpy.mockRestore();
    runFastSpy.mockRestore();

    await act(async () => {
      view.unmount();
    });

    await expect(dispatch!('pointerMove', { x: 3, y: 4 })).rejects.toMatchObject({
      name: 'AbortError',
      message: 'Action provider unmounted',
    });
  });

  it('measures React useActionDispatch dual-lane throughput with isolated scoped transaction binding', async () => {
    const Actions = createActionContext<{
      pointerMove: { x: number; y: number };
      commitMove: { x: number; y: number };
    }>('ReactDualLaneBenchmark', {
      actions: {
        pointerMove: { lane: 'fast' },
        commitMove: { lane: 'orchestrated' },
      },
    });

    const coordinator = new StoreTransactionCoordinator();
    let fastCount = 0;
    let orchestratedCount = 0;
    let txChecks = 0;
    let dispatch: ReturnType<typeof Actions.useActionDispatch> | undefined;
    let registerRef: ReturnType<typeof Actions.useActionRegister> = null;

    function BenchConsumer() {
      const reg = Actions.useActionRegister();
      registerRef = reg;
      dispatch = Actions.useActionDispatch();
      const coordinatorMemo = useMemo(() => coordinator, []);
      const pointerRef = useRef((_payload: { x: number; y: number }) => {
        fastCount += 1;
      });
      const commitRef = useRef((_payload: { x: number; y: number }) => {
        orchestratedCount += 1;
      });

      Actions.useActionCommandHandler('pointerMove', pointerRef.current);
      Actions.useActionCommandHandler('commitMove', commitRef.current);

      useEffect(() => {
        if (!reg) return undefined;
        return bindActionTransactions(reg, coordinatorMemo, {
          actions: ['commitMove'],
          getParticipants: () => {
            txChecks += 1;
            return [];
          },
        });
      }, [reg, coordinatorMemo]);

      return null;
    }

    const view = render(
      <Actions.Provider>
        <BenchConsumer />
      </Actions.Provider>,
    );

    await waitFor(() => {
      expect(registerRef?.getHandlerCount('pointerMove')).toBe(1);
      expect(registerRef?.getHandlerCount('commitMove')).toBe(1);
    });

    const warmup = 500;
    const iterations = 5000;

    await act(async () => {
      for (let i = 0; i < warmup; i++) {
        await dispatch!('pointerMove', { x: i, y: i });
        await dispatch!('commitMove', { x: i, y: i });
      }
    });

    const tFast0 = performance.now();
    await act(async () => {
      for (let i = 0; i < iterations; i++) {
        await dispatch!('pointerMove', { x: i, y: i });
      }
    });
    const fastLaneMs = performance.now() - tFast0;

    const tOrch0 = performance.now();
    await act(async () => {
      for (let i = 0; i < iterations; i++) {
        await dispatch!('commitMove', { x: i, y: i });
      }
    });
    const orchestratedMs = performance.now() - tOrch0;

    expect(fastCount).toBe(warmup + iterations);
    expect(orchestratedCount).toBe(warmup + iterations);
    expect(txChecks).toBe(warmup + iterations);

    if (process.env.BENCH_LOG === '1') {
      console.info('React useActionDispatch benchmark:', {
        iterations,
        fastLaneMs: Number(fastLaneMs.toFixed(2)),
        orchestratedMs: Number(orchestratedMs.toFixed(2)),
        speedup: `${(orchestratedMs / Math.max(fastLaneMs, 0.01)).toFixed(1)}x`,
        fastUsPerOp: Number(((fastLaneMs * 1000) / iterations).toFixed(3)),
        orchestratedUsPerOp: Number(((orchestratedMs * 1000) / iterations).toFixed(3)),
        txChecksOnFastLane: txChecks - (warmup + iterations),
      });
    }

    await act(async () => {
      view.unmount();
    });
  });
});
