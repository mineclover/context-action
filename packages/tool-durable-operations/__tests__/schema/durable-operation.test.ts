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

    await expect(tabA.claim('save-1', 'fingerprint', 'tab-a')).resolves.toMatchObject({ status: 'owner' });
    handlerExecutions += 1;

    await expect(tabB.claim('save-1', 'fingerprint', 'tab-b')).resolves.toMatchObject({
      status: 'pending',
      record: { ownerId: 'tab-a', state: 'pending' },
    });
    await expect(restartedProcess.claim('save-1', 'fingerprint', 'process-restarted')).resolves.toMatchObject({
      status: 'pending',
    });
    expect(handlerExecutions).toBe(1);

    await tabA.complete('save-1', 'tab-a', { saved: true });

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

    await process.claim('save-3', 'fingerprint', 'process-a');
    await process.markUnknown('save-3', 'process-a', 'worker lost connection after side effect');

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

    await process.claim('save-3-diagnostic', 'fingerprint', 'process-a');
    await process.markUnknown(
      'save-3-diagnostic',
      'process-a',
      'saveAll stopped after a partial filesystem write',
      { plannedPaths: ['index.html', 'styles.css'] }
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

    await owner.claim('save-4', 'fingerprint', 'owner');
    await expect(otherProcess.complete('save-4', 'other', { ok: true })).rejects.toThrow(
      'owned by "owner"'
    );
  });

  it('reclaims a pending operation after its lease expires', async () => {
    let now = 1_000;
    const backend = createMockDurableOperationBackend();
    const owner = createMockDurableOperationStore(backend, 'owner', () => now);
    const recovery = createMockDurableOperationStore(backend, 'recovery', () => now);

    await owner.claim('save-5', 'fingerprint', 'owner', { leaseMs: 100 });
    now = 1_101;

    await expect(recovery.claim('save-5', 'fingerprint', 'recovery', { leaseMs: 100 })).resolves.toMatchObject({
      status: 'owner',
      record: { state: 'pending', ownerId: 'recovery', leaseExpiresAt: 1_201 },
    });
    await expect(owner.complete('save-5', 'owner', { ok: true })).rejects.toThrow(
      'owned by "recovery"'
    );
  });

  it('replays a terminal failure instead of reopening the mutation', async () => {
    const backend = createMockDurableOperationBackend<{ ok: boolean }>();
    const owner = createMockDurableOperationStore(backend, 'owner');
    const recovery = createMockDurableOperationStore(backend, 'recovery');

    await owner.claim('save-6', 'fingerprint', 'owner');
    await owner.fail('save-6', 'owner', 'downstream rejected the write', { ok: false });

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

    await store.claim('save-invalid-reason', 'fingerprint', 'owner');
    await expect(store.fail('save-invalid-reason', 'owner', '   ')).rejects.toThrow(
      'Durable operation reason must be a non-empty string.'
    );
    await expect(store.markUnknown('save-invalid-reason', 'owner', '')).rejects.toThrow(
      'Durable operation reason must be a non-empty string.'
    );
    await expect(store.fail('save-invalid-reason', 'owner', undefined as unknown as string)).rejects.toThrow(
      'failed transitions require a reason'
    );
  });

  it('prunes expired terminal records while retaining pending work', async () => {
    let now = 1_000;
    const backend = createMockDurableOperationBackend();
    const store = createMockDurableOperationStore(backend, 'owner', () => now, {
      retentionMs: 100,
    });

    await store.claim('save-7', 'fingerprint', 'owner');
    await store.complete('save-7', 'owner', { ok: true });
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

    await store.claim('save-page-a', 'fingerprint', 'owner');
    await store.complete('save-page-a', 'owner', { ok: true });
    await store.claim('save-page-b', 'fingerprint', 'owner');
    await store.complete('save-page-b', 'owner', { ok: true });
    now = 2_101;

    await expect(store.prune()).resolves.toBe(2);
    expect(baseBackend.records.size).toBe(0);
  });

  it('resolves an unknown outcome with an explicit revision and recovery actor', async () => {
    const backend = createMockDurableOperationBackend<{ saved: boolean }>();
    const owner = createMockDurableOperationStore(backend, 'owner');
    const recovery = createMockDurableOperationStore(backend, 'recovery');

    await owner.claim('save-reconcile', 'fingerprint', 'owner');
    await owner.markUnknown('save-reconcile', 'owner', 'request disconnected after write');
    const unknown = backend.records.get('save-reconcile');
    expect(unknown?.state).toBe('unknown');

    await expect(recovery.resolveUnknown(
      'save-reconcile',
      'recovery-worker',
      { state: 'completed', result: { saved: true }, reason: 'domain query confirmed the write' },
      unknown!.revision
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

    await owner.claim('save-reconcile-stale', 'fingerprint', 'owner');
    await owner.markUnknown('save-reconcile-stale', 'owner', 'uncertain outcome');
    await expect(owner.resolveUnknown(
      'save-reconcile-stale',
      'recovery-worker',
      { state: 'failed', reason: 'domain query rejected the write' },
      1
    )).rejects.toThrow('revision is stale');
  });
});
