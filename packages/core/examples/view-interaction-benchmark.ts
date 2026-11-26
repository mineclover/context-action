/**
 * View-Interaction Action Speed Benchmark across all 3 Context-Action execution tiers.
 *
 * Run directly with Node 24+:
 *   node packages/core/examples/view-interaction-benchmark.ts
 */

import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import {
  ActionRegister,
  type ActionDispatchTrace,
  type ActionPayloadMap,
  type ActionResultMap,
} from '@context-action/core';
import { createSyncActionPipeline } from '@context-action/core/element';

interface PointerEventPayload {
  x: number;
  y: number;
  dx: number;
}

interface ViewBenchmarkActions extends ActionPayloadMap {
  pointerMove: PointerEventPayload;
  commitStroke: { strokeId: string; pointCount: number };
}

interface ViewBenchmarkResults extends ActionResultMap<ViewBenchmarkActions> {
  commitStroke: { revision: number; pointCount: number };
}

interface TierBenchmarkResult {
  tier: string;
  totalMs: number;
  opsPerSec: number;
  usPerOp: number;
  msPer1000Events: number;
  p50Burst100Us: number;
  p95Burst100Us: number;
  p99Burst100Us: number;
  pctOf60HzFramePerEvent: string;
  pctOf240HzFramePerEvent: string;
}

const SUSTAINED_EVENTS = 10_000;
const WARMUP_EVENTS = 2_000;
const BURST_ROUNDS = 200;
const BURST_SIZE = 100;
const WARMUP_BURSTS = 20;
const FRAME_60HZ_US = 16_666.67;
const FRAME_240HZ_US = 4_166.67;

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx] ?? 0;
}

function buildRow(
  tier: string,
  sustainedMs: number,
  burstUsSamples: readonly number[],
): TierBenchmarkResult {
  const sortedBursts = [...burstUsSamples].sort((a, b) => a - b);
  const opsPerSec = Math.round((SUSTAINED_EVENTS / Math.max(sustainedMs, 0.001)) * 1_000);
  const usPerOp = (sustainedMs * 1_000) / SUSTAINED_EVENTS;
  const msPer1000Events = sustainedMs / (SUSTAINED_EVENTS / 1_000);

  return {
    tier,
    totalMs: Number(sustainedMs.toFixed(3)),
    opsPerSec,
    usPerOp: Number(usPerOp.toFixed(3)),
    msPer1000Events: Number(msPer1000Events.toFixed(3)),
    p50Burst100Us: Number(percentile(sortedBursts, 50).toFixed(2)),
    p95Burst100Us: Number(percentile(sortedBursts, 95).toFixed(2)),
    p99Burst100Us: Number(percentile(sortedBursts, 99).toFixed(2)),
    pctOf60HzFramePerEvent: `${((usPerOp / FRAME_60HZ_US) * 100).toFixed(4)}%`,
    pctOf240HzFramePerEvent: `${((usPerOp / FRAME_240HZ_US) * 100).toFixed(4)}%`,
  };
}

function measureSyncTier(
  name: string,
  withClampGuard: boolean,
): { row: TierBenchmarkResult; checksum: number } {
  const pipeline = createSyncActionPipeline<{ pointerMove: PointerEventPayload }>(name);
  let sum = 0;

  if (withClampGuard) {
    pipeline.registerGuard('pointerMove', (payload, controller) => {
      if (payload.x > 4096) {
        controller.modifyPayload({ x: 4096, y: payload.y, dx: payload.dx });
      }
    });
  }

  pipeline.register('pointerMove', payload => {
    sum += payload.dx;
  });

  const payload: PointerEventPayload = { x: 120, y: 240, dx: 1 };
  for (let i = 0; i < WARMUP_EVENTS; i++) {
    const out = pipeline.dispatch('pointerMove', payload);
    assert.equal(out.success, true);
  }
  for (let b = 0; b < WARMUP_BURSTS; b++) {
    for (let i = 0; i < BURST_SIZE; i++) {
      pipeline.dispatch('pointerMove', payload);
    }
  }

  sum = 0;
  const t0 = performance.now();
  for (let i = 0; i < SUSTAINED_EVENTS; i++) {
    pipeline.dispatch('pointerMove', payload);
  }
  const sustainedMs = performance.now() - t0;

  const burstSamples: number[] = [];
  for (let b = 0; b < BURST_ROUNDS; b++) {
    const b0 = performance.now();
    for (let i = 0; i < BURST_SIZE; i++) {
      pipeline.dispatch('pointerMove', payload);
    }
    burstSamples.push((performance.now() - b0) * 1_000);
  }

  pipeline.destroy();
  return {
    row: buildRow(name, sustainedMs, burstSamples),
    checksum: sum,
  };
}

async function measureFastLaneTier(): Promise<{
  row: TierBenchmarkResult;
  checksum: number;
  commitTraceLeakCount: number;
  fastTraceSubscriptionRejected: boolean;
}> {
  const register = new ActionRegister<ViewBenchmarkActions, ViewBenchmarkResults>({
    name: 'ViewFastLaneBenchmark',
    actions: {
      pointerMove: { lane: 'fast' },
      commitStroke: { lane: 'orchestrated', queue: 'serial' },
    },
  });

  let sum = 0;
  let leakCount = 0;
  register.registerCommand('pointerMove', payload => {
    sum += payload.dx;
  });

  let revision = 0;
  register.registerResult('commitStroke', payload => {
    revision += 1;
    return { revision, pointCount: payload.pointCount };
  });

  let fastTraceSubscriptionRejected = false;
  try {
    register.subscribeDispatchTrace(() => {}, { actions: ['pointerMove'] });
  } catch (error) {
    fastTraceSubscriptionRejected = error instanceof TypeError;
  }

  const unsubScoped = register.subscribeDispatchTrace(
    () => {
      leakCount += 1;
    },
    { actions: ['commitStroke'] },
  );

  const payload: PointerEventPayload = { x: 120, y: 240, dx: 1 };
  for (let i = 0; i < WARMUP_EVENTS; i++) {
    await register.dispatch('pointerMove', payload);
  }
  for (let b = 0; b < WARMUP_BURSTS; b++) {
    for (let i = 0; i < BURST_SIZE; i++) {
      await register.dispatch('pointerMove', payload);
    }
  }

  sum = 0;
  const leakBefore = leakCount;
  const t0 = performance.now();
  for (let i = 0; i < SUSTAINED_EVENTS; i++) {
    await register.dispatch('pointerMove', payload);
  }
  const sustainedMs = performance.now() - t0;

  const burstSamples: number[] = [];
  for (let b = 0; b < BURST_ROUNDS; b++) {
    const b0 = performance.now();
    for (let i = 0; i < BURST_SIZE; i++) {
      await register.dispatch('pointerMove', payload);
    }
    burstSamples.push((performance.now() - b0) * 1_000);
  }
  const commitTraceLeakCount = leakCount - leakBefore;

  // Verify the scoped orchestrated sibling still emits trace events on commit.
  const commitOutcome = await register.dispatchWithResult('commitStroke', {
    strokeId: 's-1',
    pointCount: 42,
  });
  const commitResult = Array.isArray(commitOutcome.result)
    ? commitOutcome.result[0]
    : commitOutcome.result;
  assert.equal(commitResult?.revision, 1);
  assert.equal(leakCount, 2); // started + finished for commitStroke

  unsubScoped();
  await register.destroyAsync();

  return {
    row: buildRow('action-fast-lane', sustainedMs, burstSamples),
    checksum: sum,
    commitTraceLeakCount,
    fastTraceSubscriptionRejected,
  };
}

async function measureOrchestratedGlobalTraceTier(): Promise<{
  row: TierBenchmarkResult;
  checksum: number;
  traceEvents: number;
}> {
  const register = new ActionRegister<{ pointerMove: PointerEventPayload }>({
    name: 'ViewOrchestratedGlobalTraceBenchmark',
    actions: {
      pointerMove: { lane: 'orchestrated' },
    },
  });

  let sum = 0;
  let traceEvents = 0;
  register.registerCommand('pointerMove', payload => {
    sum += payload.dx;
  });

  const unsubGlobal = register.subscribeDispatchTrace((_event: ActionDispatchTrace) => {
    traceEvents += 1;
  });

  const payload: PointerEventPayload = { x: 120, y: 240, dx: 1 };
  for (let i = 0; i < WARMUP_EVENTS; i++) {
    await register.dispatch('pointerMove', payload);
  }
  for (let b = 0; b < WARMUP_BURSTS; b++) {
    for (let i = 0; i < BURST_SIZE; i++) {
      await register.dispatch('pointerMove', payload);
    }
  }

  sum = 0;
  traceEvents = 0;
  const t0 = performance.now();
  for (let i = 0; i < SUSTAINED_EVENTS; i++) {
    await register.dispatch('pointerMove', payload);
  }
  const sustainedMs = performance.now() - t0;

  const burstSamples: number[] = [];
  for (let b = 0; b < BURST_ROUNDS; b++) {
    const b0 = performance.now();
    for (let i = 0; i < BURST_SIZE; i++) {
      await register.dispatch('pointerMove', payload);
    }
    burstSamples.push((performance.now() - b0) * 1_000);
  }

  unsubGlobal();
  await register.destroyAsync();

  return {
    row: buildRow('action-orchestrated-global-trace', sustainedMs, burstSamples),
    checksum: sum,
    traceEvents,
  };
}

async function measureOrchestratedCommitTier(): Promise<{
  row: TierBenchmarkResult;
  checksum: number;
}> {
  const register = new ActionRegister<
    { pointerMove: PointerEventPayload },
    { pointerMove: { accepted: true } }
  >({
    name: 'ViewOrchestratedCommitBenchmark',
    actions: {
      pointerMove: { lane: 'orchestrated' },
    },
  });

  let sum = 0;
  let observed = 0;
  register.registerGuard('pointerMove', payload => {
    assert.ok(Number.isFinite(payload.x));
  });
  register.registerResult('pointerMove', payload => {
    sum += payload.dx;
    return { accepted: true };
  });
  register.registerObserver('pointerMove', () => {
    observed += 1;
  });

  const unsubScoped = register.subscribeDispatchTrace(() => {}, { actions: ['pointerMove'] });

  const payload: PointerEventPayload = { x: 120, y: 240, dx: 1 };
  for (let i = 0; i < WARMUP_EVENTS; i++) {
    await register.dispatchWithResult('pointerMove', payload);
  }
  for (let b = 0; b < WARMUP_BURSTS; b++) {
    for (let i = 0; i < BURST_SIZE; i++) {
      await register.dispatchWithResult('pointerMove', payload);
    }
  }

  sum = 0;
  observed = 0;
  const t0 = performance.now();
  for (let i = 0; i < SUSTAINED_EVENTS; i++) {
    await register.dispatchWithResult('pointerMove', payload);
  }
  const sustainedMs = performance.now() - t0;

  const burstSamples: number[] = [];
  for (let b = 0; b < BURST_ROUNDS; b++) {
    const b0 = performance.now();
    for (let i = 0; i < BURST_SIZE; i++) {
      await register.dispatchWithResult('pointerMove', payload);
    }
    burstSamples.push((performance.now() - b0) * 1_000);
  }

  assert.equal(observed, SUSTAINED_EVENTS + BURST_ROUNDS * BURST_SIZE);
  unsubScoped();
  await register.destroyAsync();

  return {
    row: buildRow('action-orchestrated-commit', sustainedMs, burstSamples),
    checksum: sum,
  };
}

async function main(): Promise<void> {
  const expectedChecksum = SUSTAINED_EVENTS + BURST_ROUNDS * BURST_SIZE;

  const tier0Bare = measureSyncTier('sync-pipeline-bare', false);
  const tier0Guarded = measureSyncTier('sync-pipeline-guarded', true);
  const tier1Fast = await measureFastLaneTier();
  const tier2GlobalTrace = await measureOrchestratedGlobalTraceTier();
  const tier2Commit = await measureOrchestratedCommitTier();

  assert.equal(tier0Bare.checksum, expectedChecksum);
  assert.equal(tier0Guarded.checksum, expectedChecksum);
  assert.equal(tier1Fast.checksum, expectedChecksum);
  assert.equal(tier2GlobalTrace.checksum, expectedChecksum);
  assert.equal(tier2Commit.checksum, expectedChecksum);
  assert.equal(tier1Fast.commitTraceLeakCount, 0);
  assert.equal(tier1Fast.fastTraceSubscriptionRejected, true);
  assert.equal(tier2GlobalTrace.traceEvents, expectedChecksum * 2);

  const rows: TierBenchmarkResult[] = [
    tier0Bare.row,
    tier0Guarded.row,
    tier1Fast.row,
    tier2GlobalTrace.row,
    tier2Commit.row,
  ];

  console.log(
    `View-Interaction Speed Benchmark (${SUSTAINED_EVENTS.toLocaleString()} sustained events + ${BURST_ROUNDS}x${BURST_SIZE} bursts)`,
  );
  console.table(rows);

  console.log('Speedup & Isolation Summary:', {
    syncBareVsOrchestratedCommit: `${(
      tier2Commit.row.totalMs / Math.max(tier0Bare.row.totalMs, 0.001)
    ).toFixed(1)}x`,
    syncBareVsGlobalTrace: `${(
      tier2GlobalTrace.row.totalMs / Math.max(tier0Bare.row.totalMs, 0.001)
    ).toFixed(1)}x`,
    fastLaneVsOrchestratedCommit: `${(
      tier2Commit.row.totalMs / Math.max(tier1Fast.row.totalMs, 0.001)
    ).toFixed(1)}x`,
    fastLaneVsGlobalTrace: `${(
      tier2GlobalTrace.row.totalMs / Math.max(tier1Fast.row.totalMs, 0.001)
    ).toFixed(1)}x`,
    commitTraceLeakCount: tier1Fast.commitTraceLeakCount,
    fastTraceSubscriptionRejected: tier1Fast.fastTraceSubscriptionRejected,
  });
}

main().catch(error => {
  console.error('View-interaction benchmark failed:', error);
  process.exitCode = 1;
});
