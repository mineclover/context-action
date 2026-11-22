/**
 * Interactive Whiteboard / Vector Canvas Dual-Lane Example.
 *
 * Combines:
 * - @context-action/core/element (`createPointerGestureSession`, `createSyncActionPipeline`)
 *   for synchronous pointer capture, Shift grid-snap, Escape cancel, and hit-testing.
 * - @context-action/core (`ActionRegister`) with:
 *   - `previewPoint` / `panViewport` on `lane: 'fast'` (zero trace / lock overhead)
 *   - `commitStroke` / `clearBoard` on `lane: 'orchestrated'` with scoped dispatch trace
 *     and transactional snapshot rollback on abort/failure.
 *
 * Run directly with Node 24+:
 *   node packages/core/examples/canvas-whiteboard-demo.ts
 */

import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import {
  ActionRegister,
  type ActionDispatchTrace,
  type ActionPayloadMap,
  type ActionResultMap,
} from '@context-action/core';
import {
  createPointerGestureSession,
  createSyncActionPipeline,
} from '@context-action/core/element';

interface Point2D {
  x: number;
  y: number;
}

interface StrokeRecord {
  strokeId: string;
  points: readonly Point2D[];
  snapped: boolean;
}

interface BoardActions extends ActionPayloadMap {
  previewPoint: Point2D;
  panViewport: { offsetX: number; offsetY: number };
  commitStroke: { strokeId: string; points: Point2D[]; snapped: boolean };
  clearBoard: { reason: string };
}

interface BoardResults extends ActionResultMap<BoardActions> {
  commitStroke: { revision: number; totalStrokes: number };
  clearBoard: { clearedCount: number };
}

interface BoardSnapshot {
  strokes: StrokeRecord[];
  viewport: { offsetX: number; offsetY: number };
  revision: number;
}

const FRAME_240HZ_US = 4_166.67;

async function main(): Promise<void> {
  // Mutable live board state + undo snapshot ledger managed by scoped transaction trace.
  let boardState: BoardSnapshot = {
    strokes: [],
    viewport: { offsetX: 0, offsetY: 0 },
    revision: 0,
  };
  let previewBuffer: Point2D[] = [];
  const undoStack: BoardSnapshot[] = [];
  const pendingTxSnapshots = new Map<string, BoardSnapshot>();
  const scopedTraceEvents: string[] = [];

  const register = new ActionRegister<BoardActions, BoardResults>({
    name: 'CanvasWhiteboard',
    actions: {
      previewPoint: { lane: 'fast' },
      panViewport: { lane: 'fast' },
      commitStroke: { lane: 'orchestrated', queue: 'serial', timeout: 3000 },
      clearBoard: { lane: 'orchestrated', queue: 'serial' },
    },
  });

  // Scoped transaction ledger: observes ONLY commitStroke & clearBoard.
  const unsubscribeTrace = register.subscribeDispatchTrace(
    (event: ActionDispatchTrace) => {
      scopedTraceEvents.push(`${event.action}:${event.phase}:${event.status ?? 'open'}`);
      if (event.phase === 'started') {
        pendingTxSnapshots.set(event.dispatchId, {
          strokes: boardState.strokes.map(s => ({ ...s, points: [...s.points] })),
          viewport: { ...boardState.viewport },
          revision: boardState.revision,
        });
        return;
      }

      const preTxSnapshot = pendingTxSnapshots.get(event.dispatchId);
      pendingTxSnapshots.delete(event.dispatchId);
      if (!preTxSnapshot) return;

      if (event.status === 'completed') {
        undoStack.push(preTxSnapshot);
      } else {
        // Automatic rollback on guard abort, timeout, or handler error.
        boardState = preTxSnapshot;
      }
    },
    { actions: ['commitStroke', 'clearBoard'] },
  );

  // Fast-lane view handlers: imperative frame buffer + viewport offset updates.
  register.registerCommand('previewPoint', point => {
    previewBuffer.push(point);
  });

  register.registerCommand('panViewport', ({ offsetX, offsetY }) => {
    boardState.viewport.offsetX = offsetX;
    boardState.viewport.offsetY = offsetY;
  });

  // Orchestrated stroke commit: Guard -> Speculative Update + Result -> Observer Audit.
  const auditLog: string[] = [];
  register.registerGuard('commitStroke', (payload, controller) => {
    if (payload.points.length < 2) {
      controller.abort('stroke requires at least 2 points');
      return;
    }
    for (const pt of payload.points) {
      if (pt.x < 0 || pt.y < 0 || pt.x > 4096 || pt.y > 4096) {
        controller.abort(`point (${pt.x}, ${pt.y}) out of canvas bounds`);
        return;
      }
    }
  });

  register.registerResult('commitStroke', payload => {
    // Mutate tentatively before validation/other steps settle; trace rollback restores on abort.
    boardState.revision += 1;
    boardState.strokes.push({
      strokeId: payload.strokeId,
      points: payload.points,
      snapped: payload.snapped,
    });
    return {
      revision: boardState.revision,
      totalStrokes: boardState.strokes.length,
    };
  });

  register.registerObserver<'commitStroke', BoardResults['commitStroke']>(
    'commitStroke',
    event => {
      const resultValue = Array.isArray(event.result)
        ? (event.result[0] as BoardResults['commitStroke'] | undefined)
        : (event.result as BoardResults['commitStroke'] | undefined);
      auditLog.push(
        `committed ${event.payload.strokeId} (${event.payload.points.length} pts, snapped=${event.payload.snapped}, rev=${resultValue?.revision})`,
      );
    },
    { when: 'success' },
  );

  register.registerResult('clearBoard', () => {
    const clearedCount = boardState.strokes.length;
    boardState.strokes = [];
    boardState.revision += 1;
    return { clearedCount };
  });

  // Tier 0 Synchronous Element Pipeline: hit-testing + Shift 8px grid snap.
  const syncDomPipeline = createSyncActionPipeline<{
    pointerMove: { x: number; y: number; shiftKey: boolean };
  }>('CanvasSyncHitTest');

  syncDomPipeline.registerGuard('pointerMove', (payload, controller) => {
    if (!Number.isFinite(payload.x) || !Number.isFinite(payload.y)) {
      controller.abort('non-finite pointer coordinate');
      return;
    }
    if (payload.shiftKey) {
      controller.modifyPayload({
        x: Math.round(payload.x / 8) * 8,
        y: Math.round(payload.y / 8) * 8,
        shiftKey: true,
      });
    }
  });

  syncDomPipeline.register('pointerMove', payload => ({
    x: payload.x,
    y: payload.y,
  }));

  // ---------------------------------------------------------------------------
  // Scenario 1: 5,000-frame freehand stroke + Shift grid snap + orchestrated commit
  // ---------------------------------------------------------------------------
  const pendingCommits: Promise<unknown>[] = [];
  let gestureCommitCount = 0;
  let gestureCancelCount = 0;

  const gesture = createPointerGestureSession({
    onStart(snapshot) {
      previewBuffer = [{ x: snapshot.startX, y: snapshot.startY }];
    },
    onMove(snapshot) {
      const hit = syncDomPipeline.dispatch<
        'pointerMove',
        Point2D
      >('pointerMove', {
        x: snapshot.currentX,
        y: snapshot.currentY,
        shiftKey: snapshot.modifiers.shiftKey,
      });
      if (hit.success && hit.result) {
        // Dispatch to fast lane (fire-and-forget frame update).
        void register.dispatch('previewPoint', hit.result);
      }
    },
    onCommit(snapshot) {
      gestureCommitCount += 1;
      const committedPoints = previewBuffer;
      previewBuffer = [];
      pendingCommits.push(
        register.dispatchWithResult('commitStroke', {
          strokeId: `stroke-${gestureCommitCount}`,
          points: committedPoints,
          snapped: snapshot.modifiers.shiftKey,
        }),
      );
    },
    onCancel() {
      gestureCancelCount += 1;
      previewBuffer = [];
    },
  });

  // Warmup gesture frames
  for (let i = 0; i < 500; i++) {
    await register.dispatch('previewPoint', { x: i, y: i });
  }
  previewBuffer = [];

  const frameCount = 5_000;
  const traceCountBeforeDraw = scopedTraceEvents.length;

  assert.equal(gesture.start({ pointerId: 1, button: 0, clientX: 16, clientY: 16, shiftKey: true }), true);
  const tPreview0 = performance.now();
  for (let i = 1; i <= frameCount; i++) {
    gesture.move({
      pointerId: 1,
      clientX: 16 + i * 0.5,
      clientY: 16 + i * 0.25,
      shiftKey: true,
    });
  }
  // Await flush of the fast-lane queue after the move burst.
  await Promise.resolve();
  const previewMs = performance.now() - tPreview0;
  const traceLeakDuringPreview = scopedTraceEvents.length - traceCountBeforeDraw;

  assert.equal(gesture.commit({ pointerId: 1, clientX: 2516, clientY: 1266, shiftKey: true }), true);
  await Promise.all(pendingCommits.splice(0));

  const lastPoint = boardState.strokes[0]?.points[boardState.strokes[0].points.length - 1];
  assert.equal(boardState.strokes.length, 1);
  assert.equal(boardState.strokes[0]?.points.length, frameCount + 1);
  assert.equal(lastPoint !== undefined && lastPoint.x % 8 === 0 && lastPoint.y % 8 === 0, true);
  assert.equal(traceLeakDuringPreview, 0);
  assert.equal(undoStack.length, 1);
  assert.equal(auditLog.length, 1);

  const usPerFrame = (previewMs * 1_000) / frameCount;
  console.log('Scenario 1 (5,000 Shift-snapped preview frames + transactional commit):', {
    previewFrames: frameCount,
    previewMs: Number(previewMs.toFixed(2)),
    usPerFrame: Number(usPerFrame.toFixed(3)),
    pctOf240HzBudget: `${((usPerFrame / FRAME_240HZ_US) * 100).toFixed(4)}%`,
    traceLeakCount: traceLeakDuringPreview,
    committedRevision: boardState.revision,
    lastPoint,
    auditEntry: auditLog[auditLog.length - 1],
  });

  // ---------------------------------------------------------------------------
  // Scenario 2: Escape-cancelled drag leaves committed strokes & undo stack untouched
  // ---------------------------------------------------------------------------
  let escapePrevented = false;
  assert.equal(gesture.start({ pointerId: 2, button: 0, clientX: 100, clientY: 100 }), true);
  for (let i = 0; i < 200; i++) {
    gesture.move({ pointerId: 2, clientX: 100 + i, clientY: 120 + i });
  }
  await Promise.resolve();
  const handledEsc = gesture.handleKeyDown({
    key: 'Escape',
    preventDefault() {
      escapePrevented = true;
    },
  });
  assert.equal(handledEsc, true);
  assert.equal(escapePrevented, true);
  assert.equal(gestureCancelCount, 1);
  assert.equal(previewBuffer.length, 0);
  assert.equal(boardState.strokes.length, 1);
  assert.equal(undoStack.length, 1);

  console.log('Scenario 2 (Escape cancel):', {
    handledEsc,
    escapePrevented,
    previewBufferAfterCancel: previewBuffer.length,
    totalStrokesUnchanged: boardState.strokes.length,
  });

  // ---------------------------------------------------------------------------
  // Scenario 3: Guard aborts out-of-bounds stroke & transaction stays clean
  // ---------------------------------------------------------------------------
  const undoDepthBeforeAbort = undoStack.length;
  const abortedCommit = await register.dispatchWithResult('commitStroke', {
    strokeId: 'stroke-invalid',
    points: [
      { x: 10, y: 10 },
      { x: -50, y: 20 },
    ],
    snapped: false,
  });
  assert.equal(abortedCommit.aborted, true);
  assert.equal(abortedCommit.outcome, 'cancelled');
  assert.equal(boardState.strokes.length, 1);
  assert.equal(undoStack.length, undoDepthBeforeAbort);

  console.log('Scenario 3 (Out-of-bounds stroke aborted by guard):', {
    aborted: abortedCommit.aborted,
    abortReason: abortedCommit.abortReason,
    totalStrokesUnchanged: boardState.strokes.length,
    undoStackUnchanged: undoStack.length,
  });

  // ---------------------------------------------------------------------------
  // Scenario 4: Fail-closed fast-lane guardrail enforcement
  // ---------------------------------------------------------------------------
  let guardRejected = false;
  try {
    register.registerGuard('previewPoint', () => {});
  } catch (error) {
    guardRejected = error instanceof TypeError;
  }

  let traceRejected = false;
  try {
    register.subscribeDispatchTrace(() => {}, { actions: ['previewPoint'] });
  } catch (error) {
    traceRejected = error instanceof TypeError;
  }

  assert.equal(guardRejected, true);
  assert.equal(traceRejected, true);

  // Quick panViewport fast-lane check
  await register.dispatch('panViewport', { offsetX: 320, offsetY: 180 });
  assert.deepEqual(boardState.viewport, { offsetX: 320, offsetY: 180 });

  console.log('Scenario 4 (Fail-closed fast-lane guardrails):', {
    guardOnFastLaneRejected: guardRejected,
    traceOnFastLaneRejected: traceRejected,
    viewportAfterFastPan: boardState.viewport,
  });

  gesture.dispose();
  syncDomPipeline.destroy();
  unsubscribeTrace();
  await register.destroyAsync();
}

main().catch(error => {
  console.error('Canvas whiteboard demo failed:', error);
  process.exitCode = 1;
});
