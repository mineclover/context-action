import {
  createDurableOperationStore,
  createPostgresDurableOperationBackend,
  createPostgresDurableOperationSchemaSql,
  POSTGRES_DURABLE_OPERATION_SCHEMA_SQL,
} from '../../src/index';
import { createFakePostgresClient } from '../support/fake-postgres';

describe('PostgreSQL durable operation backend', () => {
  it('atomically backfills legacy pending and terminal records', async () => {
    const client = createFakePostgresClient();
    const backend = createPostgresDurableOperationBackend<{ ok: boolean }>({ client });
    const baseLegacy = {
      ownerId: 'legacy-owner',
      state: 'pending',
      result: null,
      resultPresent: false,
      reason: null,
      createdAt: 1,
      updatedAt: 1,
      leaseExpiresAt: 10_000,
      reconciledBy: null,
      reconciledAt: null,
    };
    client.rows.set('legacy-pending', {
      ...baseLegacy,
      key: 'legacy-pending',
      fingerprint: 'legacy-pending-fingerprint',
      revision: 3,
    });
    client.rows.set('legacy-terminal', {
      ...baseLegacy,
      key: 'legacy-terminal',
      fingerprint: 'legacy-terminal-fingerprint',
      revision: 2,
      state: 'completed',
      result: { ok: true },
      resultPresent: true,
      leaseExpiresAt: null,
    });
    const store = createDurableOperationStore(backend, {
      now: () => 100,
      createIncarnation: () => 'postgres-legacy-incarnation',
    });

    await expect(store.claim(
      'legacy-pending',
      'legacy-pending-fingerprint',
      'new-owner'
    )).resolves.toMatchObject({
      status: 'pending',
      fence: { incarnation: 'postgres-legacy-incarnation', revision: 3 },
    });
    await expect(store.claim(
      'legacy-terminal',
      'legacy-terminal-fingerprint',
      'new-owner'
    )).resolves.toMatchObject({
      status: 'replay',
      record: { result: { ok: true }, incarnation: 'postgres-legacy-incarnation' },
    });

    client.rows.set('legacy-contention', {
      ...baseLegacy,
      key: 'legacy-contention',
      fingerprint: 'legacy-contention-fingerprint',
      revision: 7,
    });
    const results = await Promise.all([
      backend.backfillLegacyIncarnation!('legacy-contention', 7, 'postgres-contender-a'),
      backend.backfillLegacyIncarnation!('legacy-contention', 7, 'postgres-contender-b'),
    ]);
    expect(results.sort()).toEqual([false, true]);
    await expect(backend.read('legacy-contention')).resolves.toMatchObject({
      incarnation: expect.stringMatching(/^postgres-contender-[ab]$/),
      revision: 7,
    });
  });

  it('uses conditional insert/update/delete CAS and preserves keyset pagination', async () => {
    const client = createFakePostgresClient();
    const backend = createPostgresDurableOperationBackend({
      client,
      tableName: 'app.durable_operations',
    });
    const recordA = {
      key: 'operation-a',
      fingerprint: 'fingerprint-a',
      ownerId: 'owner',
      incarnation: 'incarnation-a',
      state: 'pending' as const,
      revision: 1,
      createdAt: 1,
      updatedAt: 1,
      result: { value: 1 },
    };
    const recordB = { ...recordA, key: 'operation-b', fingerprint: 'fingerprint-b' };

    const [first, second] = await Promise.all([
      backend.compareAndSet(recordA.key, undefined, recordA),
      backend.compareAndSet(recordA.key, undefined, recordA),
    ]);
    expect([first, second].sort()).toEqual([false, true]);
    await expect(backend.read(recordA.key)).resolves.toEqual(recordA);
    await expect(backend.compareAndSet(
      recordA.key,
      { incarnation: 'stale-incarnation', revision: 1 },
      { ...recordA, revision: 2 }
    )).resolves.toBe(false);

    const updated = { ...recordA, revision: 2, updatedAt: 2, state: 'completed' as const };
    await expect(backend.compareAndSet(
      recordA.key,
      { incarnation: recordA.incarnation, revision: 1 },
      updated
    )).resolves.toBe(true);
    await expect(backend.compareAndSet(
      recordA.key,
      { incarnation: recordA.incarnation, revision: 1 },
      recordA
    )).resolves.toBe(false);
    await expect(backend.compareAndSet(recordB.key, undefined, recordB)).resolves.toBe(true);

    const firstPage = await backend.listPage!({ limit: 1 });
    expect(firstPage.records).toEqual([updated]);
    expect(firstPage.nextCursor).toBe('operation-a');
    await expect(backend.listPage!({ cursor: firstPage.nextCursor, limit: 1 })).resolves.toMatchObject({
      records: [recordB],
    });

    await expect(backend.compareAndSet(
      recordA.key,
      { incarnation: recordA.incarnation, revision: 2 },
      undefined
    )).resolves.toBe(true);
    await expect(backend.read(recordA.key)).resolves.toBeUndefined();
    expect(client.queries.some(query => query.text.includes('ON CONFLICT (operation_key) DO NOTHING'))).toBe(true);
    expect(client.queries.some(query => query.text.includes(
      'WHERE operation_key = $1 AND incarnation = $15 AND revision = $16'
    ))).toBe(true);
  });

  it('maps PostgreSQL bigint values and preserves JSONB scalar payloads', async () => {
    const client = createFakePostgresClient();
    const backend = createPostgresDurableOperationBackend({ client });
    const record = {
      key: 'operation-json',
      fingerprint: 'fingerprint',
      ownerId: 'owner',
      incarnation: 'incarnation-json',
      state: 'pending' as const,
      revision: 1,
      createdAt: 1,
      updatedAt: 1,
      result: 'value',
    };
    await expect(backend.compareAndSet(record.key, undefined, record)).resolves.toBe(true);
    const stored = client.rows.get(record.key);
    expect(stored).toMatchObject({ revision: 1, result: 'value' });
    await expect(backend.read(record.key)).resolves.toEqual(record);
  });

  it('preserves an explicit null result separately from an absent result', async () => {
    const client = createFakePostgresClient();
    const backend = createPostgresDurableOperationBackend<null>({ client });
    const record = {
      key: 'operation-null',
      fingerprint: 'fingerprint',
      ownerId: 'owner',
      incarnation: 'incarnation-null',
      state: 'completed' as const,
      revision: 1,
      createdAt: 1,
      updatedAt: 1,
      result: null,
    };
    await expect(backend.compareAndSet(record.key, undefined, record)).resolves.toBe(true);
    expect(client.rows.get(record.key)?.resultPresent).toBe(true);
    await expect(backend.read(record.key)).resolves.toEqual(record);
  });

  it('supports the full durable store contract including lease reclaim and bounded prune', async () => {
    let now = 1_000;
    const backend = createPostgresDurableOperationBackend({
      client: createFakePostgresClient(),
      defaultPageSize: 1,
    });
    const store = createDurableOperationStore(backend, {
      now: () => now,
      defaultLeaseMs: 10,
      retentionMs: 10,
      prunePageSize: 1,
    });

    const first = await store.claim('operation-lease', 'fingerprint', 'owner-a');
    expect(first.status).toBe('owner');
    now = 1_011;
    const reclaimed = await store.claim('operation-lease', 'fingerprint', 'owner-b');
    expect(reclaimed).toMatchObject({
      status: 'owner',
      record: { ownerId: 'owner-b', revision: 2 },
    });
    await store.complete('operation-lease', 'owner-b', { ok: true }, reclaimed.fence);
    await expect(store.claim('operation-lease', 'fingerprint', 'owner-c')).resolves.toMatchObject({
      status: 'replay',
      record: { result: { ok: true } },
    });

    now = 1_022;
    await expect(store.prune()).resolves.toBe(1);
    await expect(store.get('operation-lease')).resolves.toBeUndefined();
  });

  it('rejects unsafe table identifiers before issuing SQL', () => {
    const client = createFakePostgresClient();
    expect(() => createPostgresDurableOperationBackend({
      client,
      tableName: 'durable_operations; DROP TABLE users',
    })).toThrow('tableName must be an identifier');
    expect(client.queries).toHaveLength(0);
  });

  it('publishes an explicit migration boundary instead of auto-migrating', () => {
    const schemaSql = POSTGRES_DURABLE_OPERATION_SCHEMA_SQL;
    expect(schemaSql).toContain('operation_key text PRIMARY KEY');
    expect(schemaSql).toContain('incarnation text NOT NULL');
    const addColumn = schemaSql.indexOf('ADD COLUMN IF NOT EXISTS incarnation text');
    const backfill = schemaSql.indexOf("SET incarnation = 'legacy:' || md5(operation_key");
    const requireValue = schemaSql.indexOf('ALTER COLUMN incarnation SET NOT NULL');
    expect(addColumn).toBeGreaterThan(-1);
    expect(backfill).toBeGreaterThan(addColumn);
    expect(requireValue).toBeGreaterThan(backfill);
    expect(POSTGRES_DURABLE_OPERATION_SCHEMA_SQL).toContain("state IN ('pending', 'completed', 'failed', 'unknown')");
    expect(createPostgresDurableOperationSchemaSql('verify.operations')).toContain(
      'CREATE TABLE IF NOT EXISTS "verify"."operations"'
    );
    expect(createPostgresDurableOperationSchemaSql('verify.operations')).toContain(
      'ON "verify"."operations" (updated_at)'
    );
  });
});
