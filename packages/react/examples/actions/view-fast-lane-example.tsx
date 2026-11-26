/**
 * @fileoverview Dual-Lane React View Action + Scoped Transaction Example
 *
 * Demonstrates how React components isolate high-frequency view interactions
 * (`lane: 'fast'` + `createRefContext` non-subscribing `useRefController`) from
 * transactional state commits (`lane: 'orchestrated'` + scoped `bindActionTransactions`)
 * on the SAME `createActionContext`:
 *
 * - `pointerMove` runs through `useActionDispatch()` -> `dispatchLifecycle.runFast()`
 *   -> Core `dispatchFastSequential()`, updating the DOM imperatively with 0 React re-renders
 *   and 0 transaction trace overhead.
 * - `commitStroke` runs on the orchestrated lane with a guard, typed result, observer,
 *   and scoped `bindActionTransactions(..., { actions: ['commitStroke'] })` for atomic Undo/Redo.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createActionContext, useStoreValue } from '@context-action/react';
import { createRefContext } from '@context-action/react/refs';
import { createTimeTravelStore } from '@context-action/react/time-travel';
import {
  StoreTransactionCoordinator,
  bindActionTransactions,
} from '@context-action/react/transactions';

export interface ViewCanvasActionMap {
  pointerMove: { x: number; y: number };
  commitStroke: { strokeId: string; x: number; y: number };
}

export interface ViewCanvasResultMap {
  commitStroke: { strokeId: string; totalStrokes: number };
}

export interface StrokeEntry {
  strokeId: string;
  x: number;
  y: number;
}

export interface CanvasBoardState {
  strokes: StrokeEntry[];
  revision: number;
}

export const CanvasActions = createActionContext<ViewCanvasActionMap, ViewCanvasResultMap>(
  'DualLaneCanvasView',
  {
    actions: {
      pointerMove: { lane: 'fast' },
      commitStroke: { lane: 'orchestrated', queue: 'serial', timeout: 3000 },
    },
  },
);

export const CanvasRefs = createRefContext('DualLaneCanvasRefs', {
  cursorBadge: {
    name: 'cursorBadge',
    autoCleanup: true,
    validator: (target: unknown): target is HTMLDivElement =>
      target instanceof HTMLDivElement,
  },
  surface: {
    name: 'surface',
    autoCleanup: true,
    validator: (target: unknown): target is HTMLDivElement =>
      target instanceof HTMLDivElement,
  },
});

function CanvasSurfaceView() {
  const dispatch = CanvasActions.useActionDispatch();
  const dispatchWithResult = CanvasActions.useActionResultDispatch();
  const register = CanvasActions.useActionRegister();

  // Zero-re-render imperative ref controllers
  const cursorBadge = CanvasRefs.useRefController('cursorBadge');
  const surface = CanvasRefs.useRefController('surface');
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  // Transactional TimeTravelStore committed only on `commitStroke`
  const boardStore = useMemo(
    () =>
      createTimeTravelStore<CanvasBoardState>('dualLaneCanvasBoard', {
        strokes: [],
        revision: 0,
      }),
    [],
  );
  const coordinator = useMemo(() => new StoreTransactionCoordinator(), []);
  const board = useStoreValue(boardStore);
  const [statusMessage, setStatusMessage] = useState('Move pointer for fast lane; click Commit to save.');

  useEffect(() => {
    if (!register) return undefined;
    const unbind = bindActionTransactions(register, coordinator, {
      actions: ['commitStroke'],
      getParticipants: () => [{ name: 'board', store: boardStore }],
    });
    return () => {
      unbind();
      boardStore.dispose();
    };
  }, [register, coordinator, boardStore]);

  // Fast-lane handler: mutates DOM node directly without triggering React state updates
  const handlePointerMove = useCallback(
    (payload: ViewCanvasActionMap['pointerMove']) => {
      cursorBadge.executeIfMounted(el => {
        el.dataset.coords = `${payload.x},${payload.y}`;
        el.textContent = `Cursor: (${payload.x}, ${payload.y})`;
        el.style.transform = `translate3d(${payload.x}px, ${payload.y}px, 0)`;
      });
    },
    [cursorBadge],
  );
  CanvasActions.useActionCommandHandler('pointerMove', handlePointerMove);

  // Orchestrated guard -> result -> observer pipeline for transactional stroke commit
  const guardCommit = useCallback(
    (
      payload: ViewCanvasActionMap['commitStroke'],
      controller: { abort: (reason?: string) => void },
    ) => {
      if (payload.x < 0 || payload.y < 0) {
        controller.abort('Coordinates must be non-negative');
      }
    },
    [],
  );
  CanvasActions.useActionGuard('commitStroke', guardCommit);

  const runCommit = useCallback(
    (payload: ViewCanvasActionMap['commitStroke']) => {
      let totalStrokes = 0;
      boardStore.update(draft => {
        draft.strokes.push({ strokeId: payload.strokeId, x: payload.x, y: payload.y });
        draft.revision += 1;
        totalStrokes = draft.strokes.length;
      });
      return { strokeId: payload.strokeId, totalStrokes };
    },
    [boardStore],
  );
  CanvasActions.useActionResultHandler('commitStroke', runCommit);

  const onCommitObserved = useCallback(
    (event: {
      payload: ViewCanvasActionMap['commitStroke'];
      outcome: string;
    }) => {
      setStatusMessage(`Stroke ${event.payload.strokeId} ${event.outcome}`);
    },
    [],
  );
  CanvasActions.useActionObserver('commitStroke', onCommitObserved, { when: 'always' });

  const handleSurfacePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const target = surface.target;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      void dispatch('pointerMove', {
        x: Math.round(e.clientX - rect.left),
        y: Math.round(e.clientY - rect.top),
      });
    },
    [dispatch, surface],
  );

  const handleCommitSample = useCallback(async () => {
    const nextIndex = boardStore.getValue().strokes.length + 1;
    await dispatchWithResult('commitStroke', {
      strokeId: `stroke-${nextIndex}`,
      x: 40 * nextIndex,
      y: 24 * nextIndex,
    });
  }, [boardStore, dispatchWithResult]);

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h3>Dual-Lane View Action Example</h3>
      <p>
        Render count: <strong>{renderCountRef.current}</strong> | Committed strokes:{' '}
        <strong>{board.strokes.length}</strong> (rev {board.revision})
      </p>
      <p>{statusMessage}</p>

      <div
        ref={surface.setRef}
        onPointerMove={handleSurfacePointerMove}
        style={{
          position: 'relative',
          height: 180,
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#f8fafc',
        }}
      >
        <div
          ref={cursorBadge.setRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            padding: '4px 8px',
            background: '#0f172a',
            color: '#fff',
            borderRadius: 4,
            fontSize: 12,
            pointerEvents: 'none',
          }}
        >
          Cursor: (0, 0)
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="button" onClick={() => void handleCommitSample()}>
          Commit Stroke (Orchestrated)
        </button>
        <button type="button" onClick={() => coordinator.undo()} disabled={!coordinator.canUndo()}>
          Undo
        </button>
        <button type="button" onClick={() => coordinator.redo()} disabled={!coordinator.canRedo()}>
          Redo
        </button>
      </div>
    </div>
  );
}

export function ViewFastLaneExample() {
  return (
    <CanvasActions.Provider>
      <CanvasRefs.Provider>
        <CanvasSurfaceView />
      </CanvasRefs.Provider>
    </CanvasActions.Provider>
  );
}

export default ViewFastLaneExample;
