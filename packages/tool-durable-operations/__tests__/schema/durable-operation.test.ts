import {
  createDurableOperationStore,
  type DurableOperationBackend,
  type DurableOperationRecord,
} from '../../src/durable-operation';
import {
  createMockDurableOperationBackend,
  createMockDurableOperationStore,
} from '../support/mock-durable-operation-store';

describe('mock durable operation record', () => {
  it('allows only one owner when two processes claim concurrently', async () => {
    const backend = createMockDurableOperationBackend();
    const processA = createMockDurableOperationStore(backend, 'process-a');
    const processB = createMockDurableOperationStore(backend, 'process-b');

    const [claimA, claimB] = await Promise.all([
      processA.claim('save-concurrent', 'fingerprint', 'process-a'),
      processB.claim('save-concurrent', 'fingerprint', 'process-b'),
    ]);

    expect([claimA.status, claimB.status].sort()).toEqual(['owner', 'pending']);
    expect(backend.records.get('save-concurrent')).toMatchObject({
      state: 'pending',
      ownerId: claimA.status === 'owner' ? 'process-a' : 'process-b',
    });
  });

  it('prevents duplicate execution across tabs and a restarted process', async () => {
    const backend = createMockDurableOperationBackend<{ saved: boolean }>();
    const tabA = createMockDurableOperationStore(backend, 'tab-a');
    const tabB = createMockDurableOperationStore(backend, 'tab-b');
    const restartedProcess = createMockDurableOperationStore(backend, 'process-restarted');
    let handlerExecutions = 0;

    const ownerClaim = await tabA.claim('save-1', 'fingerprint', 'tab-a');
    expect(ownerClaim).toMatchObject({ status: 'owner' });
    handlerExecutions += 1;

    await expect(tabB.claim('save-1', 'fingerprint', 'tab-b')).resolves.toMatchObject({
      status: 'pending',
      record: { ownerId: 'tab-a', state: 'pending' },
    });
    await expect(restartedProcess.claim('save-1', 'fingerprint', 'process-restarted')).resolves.toMatchObject({
      status: 'pending',
    });
    expect(handlerExecutions).toBe(1);

    await tabA.complete('save-1', 'tab-a', { saved: true }, ownerClaim.fence);

    await expect(restartedProcess.claim('save-1', 'fingerprint', 'process-restarted')).resolves.toMatchObject({
      status: 'replay',
      record: {
        state: 'completed',
        result: { saved: true },
      },
    });
    expect(handlerExecutions).toBe(1);
  });

  it('rejects key reuse with a different fingerprint across processes', async () => {
    const backend = createMockDurableOperationBackend();
    const firstProcess = createMockDurableOperationStore(backend, 'process-a');
    const secondProcess = createMockDurableOperationStore(backend, 'process-b');

    await firstProcess.claim('save-2', 'fingerprint-a', 'process-a');
    await expect(secondProcess.claim('save-2', 'fingerprint-b', 'process-b')).resolves.toMatchObject({
      status: 'conflict',
      record: {
        state: 'pending',
        ownerId: 'process-a',
      },
    });
  });

  it('preserves unknown outcomes for reconciliation instead of allowing a new claim', async () => {
    const backend = createMockDurableOperationBackend();
    const process = createMockDurableOperationStore(backend, 'process-a');
    const recoveryProcess = createMockDurableOperationStore(backend, 'recovery');

    const claim = await process.claim('save-3', 'fingerprint', 'process-a');
    await process.markUnknown(
      'save-3',
      'process-a',
      'worker lost connection after side effect',
      undefined,
      claim.fence
    );

    await expect(recoveryProcess.claim('save-3', 'fingerprint', 'recovery')).resolves.toMatchObject({
      status: 'unknown',
      record: {
        state: 'unknown',
        reason: 'worker lost connection after side effect',
      },
    });
  });

  it('retains an ambiguous diagnostic result for a domain resolver', async () => {
    const backend = createMockDurableOperationBackend<{ plannedPaths: string[] }>();
    const process = createMockDurableOperationStore(backend, 'process-a');
    const recoveryProcess = createMockDurableOperationStore(backend, 'recovery');

    const claim = await process.claim('save-3-diagnostic', 'fingerprint', 'process-a');
    await process.markUnknown(
      'save-3-diagnostic',
      'process-a',
      'saveAll stopped after a partial filesystem write',
      { plannedPaths: ['index.html', 'styles.css'] },
      claim.fence
    );

    await expect(recoveryProcess.claim(
      'save-3-diagnostic',
      'fingerprint',
      'recovery'
    )).resolves.toMatchObject({
      status: 'unknown',
      record: {
        state: 'unknown',
        result: { plannedPaths: ['index.html', 'styles.css'] },
      },
    });
  });

  it('enforces owner-only state transitions', async () => {
    const backend = createMockDurableOperationBackend();
    const owner = createMockDurableOperationStore(backend, 'owner');
    const otherProcess = createMockDurableOperationStore(backend, 'other');

    const claim = await owner.claim('save-4', 'fingerprint', 'owner');
    await expect(otherProcess.complete('save-4', 'other', { ok: true }, claim.fence)).rejects.toThrow(
      'owned by "owner"'
    );
  });

  it('reclaims a pending operation after its lease expires', async () => {
    let now = 1_000;
    const backend = createMockDurableOperationBackend();
    const owner = createMockDurableOperationStore(backend, 'owner', () => now);
    const recovery = createMockDurableOperationStore(backend, 'recovery', () => now);

    const staleClaim = await owner.claim('save-5', 'fingerprint', 'owner', { leaseMs: 100 });
    now = 1_101;

    await expect(recovery.claim('save-5', 'fingerprint', 'recovery', { leaseMs: 100 })).resolves.toMatchObject({
      status: 'owner',
      record: { state: 'pending', ownerId: 'recovery', leaseExpiresAt: 1_201 },
    });
    await expect(owner.complete('save-5', 'owner', { ok: true }, staleClaim.fence)).rejects.toThrow(
      'owned by "recovery"'
    );
  });

  it('fences a stale execution when the same owner reclaims its expired lease', async () => {
    let now = 1_000;
    const backend = createMockDurableOperationBackend<{ attempt: number }>();
    const store = createDurableOperationStore(backend, { now: () => now });

    const firstClaim = await store.claim('save-same-owner', 'fingerprint', 'owner', {
      leaseMs: 100,
    });
    expect(firstClaim).toMatchObject({ status: 'owner', record: { revision: 1 } });

    now = 1_101;
    const reclaimedClaim = await store.claim(
      'save-same-owner',
      'fingerprint',
      'owner',
      { leaseMs: 100 }
    );
    expect(reclaimedClaim).toMatchObject({ status: 'owner', record: { revision: 2 } });

    await expect(store.complete(
      'save-same-owner',
      'owner',
      { attempt: 1 },
      firstClaim.fence
    )).rejects.toThrow('fence is stale');
    await expect(store.complete(
      'save-same-owner',
      'owner',
      { attempt: 2 },
      reclaimedClaim.fence
    )).resolves.toMatchObject({
      state: 'completed',
      result: { attempt: 2 },
      revision: 3,
    });
  });

  it('fails closed when a transition omits the required fence', async () => {
    const backend = createMockDurableOperationBackend<{ ok: boolean }>();
    const store = createDurableOperationStore(backend);
    await store.claim('save-missing-fence', 'fingerprint', 'owner');
    const legacyComplete = store.complete as unknown as (
      key: string,
      ownerId: string,
      result: { ok: boolean }
    ) => Promise<unknown>;

    await expect(
      legacyComplete('save-missing-fence', 'owner', { ok: true })
    ).rejects.toThrow('expectedFence is required');
    expect(await store.get('save-missing-fence')).toMatchObject({
      state: 'pending',
      revision: 1,
    });
  });

  it('atomically backfills legacy pending and terminal records under contention', async () => {
    type Result = { ok: boolean };
    const backend = createMockDurableOperationBackend<Result>();
    const pendingLegacy = {
      key: 'legacy-pending',
      fingerprint: 'legacy-pending-fingerprint',
      ownerId: 'legacy-owner',
      revision: 4,
      state: 'pending' as const,
      createdAt: 1,
      updatedAt: 1,
      leaseExpiresAt: 10_000,
    } as unknown as DurableOperationRecord<Result>;
    const terminalLegacy = {
      key: 'legacy-terminal',
      fingerprint: 'legacy-terminal-fingerprint',
      ownerId: 'legacy-owner',
      revision: 2,
      state: 'completed' as const,
      result: { ok: true },
      createdAt: 1,
      updatedAt: 1,
    } as unknown as DurableOperationRecord<Result>;
    backend.records.set(pendingLegacy.key, pendingLegacy);
    backend.records.set(terminalLegacy.key, terminalLegacy);
    const processA = createDurableOperationStore(backend, {
      now: () => 100,
      retentionMs: 0,
      createIncarnation: () => 'legacy-backfill-a',
    });
    const processB = createDurableOperationStore(backend, {
      now: () => 100,
      retentionMs: 0,
      createIncarnation: () => 'legacy-backfill-b',
    });

    const [pendingA, pendingB] = await Promise.all([
      processA.claim(pendingLegacy.key, pendingLegacy.fingerprint, 'process-a'),
      processB.claim(pendingLegacy.key, pendingLegacy.fingerprint, 'process-b'),
    ]);
    expect([pendingA.status, pendingB.status]).toEqual(['pending', 'pending']);
    expect(pendingA.fence).toEqual(pendingB.fence);
    expect(['legacy-backfill-a', 'legacy-backfill-b']).toContain(
      pendingA.fence.incarnation
    );

    await expect(processA.claim(
      terminalLegacy.key,
      terminalLegacy.fingerprint,
      'process-a'
    )).resolves.toMatchObject({
      status: 'replay',
      record: { result: { ok: true }, incarnation: expect.any(String) },
    });

    const pruneLegacy = {
      ...terminalLegacy,
      key: 'legacy-prune',
      fingerprint: 'legacy-prune-fingerprint',
    } as unknown as DurableOperationRecord<Result>;
    backend.records.set(pruneLegacy.key, pruneLegacy);
    await expect(processA.prune(2)).resolves.toBe(2);
    expect(backend.records.has(terminalLegacy.key)).toBe(false);
    expect(backend.records.has(pruneLegacy.key)).toBe(false);
    expect(backend.records.has(pendingLegacy.key)).toBe(true);
  });

  it('fails closed for a legacy record when backend backfill is unavailable', async () => {
    const baseBackend = createMockDurableOperationBackend();
    baseBackend.records.set('legacy-unsupported', {
      key: 'legacy-unsupported',
      fingerprint: 'legacy-fingerprint',
      ownerId: 'legacy-owner',
      revision: 1,
      state: 'pending',
      createdAt: 1,
      updatedAt: 1,
      leaseExpiresAt: 10_000,
    } as unknown as DurableOperationRecord);
    const {
      backfillLegacyIncarnation: _backfillLegacyIncarnation,
      ...legacyBackend
    } = baseBackend;
    const store = createDurableOperationStore(legacyBackend, { now: () => 100 });

    await expect(store.claim(
      'legacy-unsupported',
      'legacy-fingerprint',
      'owner'
    )).rejects.toThrow('backend does not support it');
  });

  it('rejects an old incarnation after a terminal record is pruned and recreated', async () => {
    let now = 1_000;
    let incarnation = 0;
    const backend = createMockDurableOperationBackend<{ attempt: string }>();
    const store = createDurableOperationStore(backend, {
      now: () => now,
      retentionMs: 0,
      createIncarnation: () => `incarnation-${++incarnation}`,
    });

    const staleClaim = await store.claim('save-aba', 'old-fingerprint', 'worker-a', {
      leaseMs: 10,
    });
    now = 1_011;
    const takeover = await store.claim('save-aba', 'old-fingerprint', 'worker-b', {
      leaseMs: 10,
    });
    await store.complete(
      'save-aba',
      'worker-b',
      { attempt: 'takeover' },
      takeover.fence
    );
    now = 1_012;
    await expect(store.prune(now)).resolves.toBe(1);

    const freshClaim = await store.claim('save-aba', 'new-fingerprint', 'worker-a', {
      leaseMs: 10,
    });
    expect(freshClaim.record.revision).toBe(staleClaim.record.revision);
    expect(freshClaim.record.incarnation).not.toBe(staleClaim.record.incarnation);
    await expect(store.complete(
      'save-aba',
      'worker-a',
      { attempt: 'stale' },
      staleClaim.fence
    )).rejects.toThrow('fence is stale');
    expect(await store.get('save-aba')).toMatchObject({
      state: 'pending',
      fingerprint: 'new-fingerprint',
      incarnation: freshClaim.record.incarnation,
    });
  });

  it('atomically rejects a stale transition when prune/recreate restores its revision', async () => {
    type Result = { attempt: string };
    let now = 1_000;
    let incarnation = 0;
    const baseBackend = createMockDurableOperationBackend<Result>();
    let releaseStaleCas!: () => void;
    const staleCasGate = new Promise<void>(resolve => {
      releaseStaleCas = resolve;
    });
    let markStaleCasReached!: () => void;
    const staleCasReached = new Promise<void>(resolve => {
      markStaleCasReached = resolve;
    });
    let pauseStaleCas = false;
    const backend: DurableOperationBackend<Result> = {
      ...baseBackend,
      compareAndSet: async (key, expectedFence, next) => {
        if (pauseStaleCas && next?.result?.attempt === 'stale') {
          pauseStaleCas = false;
          markStaleCasReached();
          await staleCasGate;
        }
        return baseBackend.compareAndSet(key, expectedFence, next);
      },
    };
    const store = createDurableOperationStore(backend, {
      now: () => now,
      retentionMs: 0,
      createIncarnation: () => `atomic-incarnation-${++incarnation}`,
    });

    const staleClaim = await store.claim('atomic-aba', 'old-fingerprint', 'same-owner');
    pauseStaleCas = true;
    const staleCompletion = store.complete(
      'atomic-aba',
      'same-owner',
      { attempt: 'stale' },
      staleClaim.fence
    );
    await staleCasReached;

    await store.complete(
      'atomic-aba',
      'same-owner',
      { attempt: 'current' },
      staleClaim.fence
    );
    now = 1_001;
    await expect(store.prune(now)).resolves.toBe(1);
    const freshClaim = await store.claim(
      'atomic-aba',
      'new-fingerprint',
      'same-owner'
    );
    expect(freshClaim.fence).toMatchObject({ revision: staleClaim.fence.revision });
    expect(freshClaim.fence.incarnation).not.toBe(staleClaim.fence.incarnation);

    releaseStaleCas();
    await expect(staleCompletion).rejects.toThrow('fence changed during transition');
    expect(await store.get('atomic-aba')).toMatchObject({
      state: 'pending',
      fingerprint: 'new-fingerprint',
      incarnation: freshClaim.fence.incarnation,
      revision: freshClaim.fence.revision,
    });
  });

  it('rejects stale reconciliation from a pruned incarnation', async () => {
    let now = 2_000;
    let incarnation = 0;
    const backend = createMockDurableOperationBackend<{ attempt: string }>();
    const store = createDurableOperationStore(backend, {
      now: () => now,
      retentionMs: 0,
      createIncarnation: () => `reconcile-incarnation-${++incarnation}`,
    });

    const firstClaim = await store.claim('reconcile-aba', 'old-fingerprint', 'worker');
    const firstUnknown = await store.markUnknown(
      'reconcile-aba',
      'worker',
      'first outcome is unknown',
      undefined,
      firstClaim.fence
    );
    const staleFence = {
      incarnation: firstUnknown.incarnation,
      revision: firstUnknown.revision,
    };
    await store.resolveUnknown(
      'reconcile-aba',
      'reconciler',
      { state: 'failed', reason: 'first outcome was rejected' },
      staleFence
    );
    now = 2_001;
    await expect(store.prune(now)).resolves.toBe(1);

    const freshClaim = await store.claim('reconcile-aba', 'new-fingerprint', 'worker');
    const freshUnknown = await store.markUnknown(
      'reconcile-aba',
      'worker',
      'second outcome is unknown',
      undefined,
      freshClaim.fence
    );
    expect(freshUnknown.revision).toBe(staleFence.revision);
    await expect(store.resolveUnknown(
      'reconcile-aba',
      'stale-reconciler',
      { state: 'completed', result: { attempt: 'stale' } },
      staleFence
    )).rejects.toThrow('fence is stale');
  });

  it('replays a terminal failure instead of reopening the mutation', async () => {
    const backend = createMockDurableOperationBackend<{ ok: boolean }>();
    const owner = createMockDurableOperationStore(backend, 'owner');
    const recovery = createMockDurableOperationStore(backend, 'recovery');

    const claim = await owner.claim('save-6', 'fingerprint', 'owner');
    await owner.fail(
      'save-6',
      'owner',
      'downstream rejected the write',
      { ok: false },
      claim.fence
    );

    await expect(recovery.claim('save-6', 'fingerprint', 'recovery')).resolves.toMatchObject({
      status: 'replay',
      record: {
        state: 'failed',
        reason: 'downstream rejected the write',
        result: { ok: false },
      },
    });
  });

  it('rejects empty reasons for failed and unknown transitions', async () => {
    const backend = createMockDurableOperationBackend();
    const store = createMockDurableOperationStore(backend, 'owner');

    const claim = await store.claim('save-invalid-reason', 'fingerprint', 'owner');
    await expect(store.fail('save-invalid-reason', 'owner', '   ', undefined, claim.fence)).rejects.toThrow(
      'Durable operation reason must be a non-empty string.'
    );
    await expect(store.markUnknown('save-invalid-reason', 'owner', '', undefined, claim.fence)).rejects.toThrow(
      'Durable operation reason must be a non-empty string.'
    );
    await expect(store.fail(
      'save-invalid-reason',
      'owner',
      undefined as unknown as string,
      undefined,
      claim.fence
    )).rejects.toThrow(
      'failed transitions require a reason'
    );
  });

  it('prunes expired terminal records while retaining pending work', async () => {
    let now = 1_000;
    const backend = createMockDurableOperationBackend();
    const store = createMockDurableOperationStore(backend, 'owner', () => now, {
      retentionMs: 100,
    });

    const completedClaim = await store.claim('save-7', 'fingerprint', 'owner');
    await store.complete('save-7', 'owner', { ok: true }, completedClaim.fence);
    await store.claim('save-8', 'fingerprint', 'owner');
    now = 1_101;

    await expect(store.prune()).resolves.toBe(1);
    expect(backend.records.has('save-7')).toBe(false);
    expect(backend.records.has('save-8')).toBe(true);
  });

  it('uses bounded backend pages during retention cleanup', async () => {
    let now = 2_000;
    const baseBackend = createMockDurableOperationBackend();
    const pagedBackend = {
      ...baseBackend,
      list: () => {
        throw new Error('unbounded list should not be used when listPage is available');
      },
    };
    const store = createMockDurableOperationStore(pagedBackend, 'owner', () => now, {
      retentionMs: 100,
      prunePageSize: 1,
      maxPrunePages: 10,
    });

    const claimA = await store.claim('save-page-a', 'fingerprint', 'owner');
    await store.complete('save-page-a', 'owner', { ok: true }, claimA.fence);
    const claimB = await store.claim('save-page-b', 'fingerprint', 'owner');
    await store.complete('save-page-b', 'owner', { ok: true }, claimB.fence);
    now = 2_101;

    await expect(store.prune()).resolves.toBe(2);
    expect(baseBackend.records.size).toBe(0);
  });

  it('resolves an unknown outcome with an explicit revision and recovery actor', async () => {
    const backend = createMockDurableOperationBackend<{ saved: boolean }>();
    const owner = createMockDurableOperationStore(backend, 'owner');
    const recovery = createMockDurableOperationStore(backend, 'recovery');

    const claim = await owner.claim('save-reconcile', 'fingerprint', 'owner');
    const unknownRecord = await owner.markUnknown(
      'save-reconcile',
      'owner',
      'request disconnected after write',
      undefined,
      claim.fence
    );
    const unknown = backend.records.get('save-reconcile');
    expect(unknown?.state).toBe('unknown');

    await expect(recovery.resolveUnknown(
      'save-reconcile',
      'recovery-worker',
      { state: 'completed', result: { saved: true }, reason: 'domain query confirmed the write' },
      { incarnation: unknownRecord.incarnation, revision: unknownRecord.revision }
    )).resolves.toMatchObject({
      state: 'completed',
      result: { saved: true },
      reconciledBy: 'recovery-worker',
      reconciledAt: expect.any(Number),
    });
    await expect(recovery.claim('save-reconcile', 'fingerprint', 'recovery')).resolves.toMatchObject({
      status: 'replay',
      record: { state: 'completed', result: { saved: true } },
    });
  });

  it('rejects reconciliation when the unknown revision is stale', async () => {
    const backend = createMockDurableOperationBackend();
    const owner = createMockDurableOperationStore(backend, 'owner');

    const claim = await owner.claim('save-reconcile-stale', 'fingerprint', 'owner');
    const unknown = await owner.markUnknown(
      'save-reconcile-stale',
      'owner',
      'uncertain outcome',
      undefined,
      claim.fence
    );
    await expect(owner.resolveUnknown(
      'save-reconcile-stale',
      'recovery-worker',
      { state: 'failed', reason: 'domain query rejected the write' },
      { incarnation: unknown.incarnation, revision: 1 }
    )).rejects.toThrow('fence is stale');
  });
});
