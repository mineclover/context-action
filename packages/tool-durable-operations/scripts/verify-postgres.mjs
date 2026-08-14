import assert from 'node:assert/strict';
import {
  createDurableOperationStore,
  createPostgresDurableOperationBackend,
  createPostgresDurableOperationSchemaSql,
} from '../dist/index.js';

const databaseUrl = (process.env.DATABASE_URL ?? process.env.POSTGRES_URL)?.trim();

if (!databaseUrl) {
  console.error('DATABASE_URL (or POSTGRES_URL) is required for the PostgreSQL durable-operation smoke check.');
  process.exit(2);
}

let Pool;
try {
  ({ Pool } = await import('pg'));
} catch {
  console.error('The PostgreSQL smoke check requires an application-installed optional `pg` package.');
  process.exit(2);
}

const endpoint = new URL(databaseUrl);
const tableName = `context_action_verify_${process.pid}_${Date.now()}`;
const quotedTableName = `"${tableName}"`;
const pool = new Pool({ connectionString: databaseUrl });
const backend = createPostgresDurableOperationBackend({
  client: {
    query: (text, values) => pool.query(text, values === undefined ? undefined : [...values]),
  },
  tableName,
});
try {
  let now = Date.now();
  const storeOptions = {
    defaultLeaseMs: 250,
    retentionMs: 0,
    maxAttempts: 32,
    now: () => now,
  };
  const clockedStoreA = createDurableOperationStore(backend, storeOptions);
  const clockedStoreB = createDurableOperationStore(backend, storeOptions);
  const schemaSql = createPostgresDurableOperationSchemaSql(tableName);
  // Exercise an in-place upgrade from the pre-incarnation schema with data.
  // A migration that adds the column and immediately applies NOT NULL would
  // fail here unless it safely backfills existing rows first.
  await pool.query(`
    CREATE TABLE ${quotedTableName} (
      operation_key text PRIMARY KEY,
      fingerprint text NOT NULL,
      owner_id text NOT NULL,
      revision integer NOT NULL,
      state text NOT NULL CHECK (state IN ('pending', 'completed', 'failed', 'unknown')),
      result jsonb,
      result_present boolean NOT NULL DEFAULT false,
      reason text,
      created_at bigint NOT NULL,
      updated_at bigint NOT NULL,
      lease_expires_at bigint,
      reconciled_by text,
      reconciled_at bigint
    )
  `);
  await pool.query(
    `INSERT INTO ${quotedTableName} (
       operation_key, fingerprint, owner_id, revision, state, reason, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      'legacy-migration-record',
      'legacy-fingerprint',
      'legacy-owner',
      1,
      'unknown',
      'legacy outcome requires reconciliation',
      now,
      now,
    ]
  );
  // A host migration runner may retry after a connection loss. The reference
  // migration must therefore backfill data and remain safe to apply more than
  // once before any new operation is claimed.
  await pool.query(schemaSql);
  await pool.query(schemaSql);
  const migratedLegacyRecord = await backend.read('legacy-migration-record');
  assert.equal(migratedLegacyRecord?.incarnation.startsWith('legacy:'), true);
  assert.equal(migratedLegacyRecord?.revision, 1);
  await pool.query(
    `DELETE FROM ${quotedTableName} WHERE operation_key = $1`,
    ['legacy-migration-record']
  );
  const columnMetadata = await pool.query(
    `SELECT column_name AS "columnName"
       FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = $1`,
    [tableName]
  );
  const requiredColumns = new Set(columnMetadata.rows.map(row => row.columnName));
  for (const column of [
    'operation_key',
    'fingerprint',
    'owner_id',
    'incarnation',
    'revision',
    'state',
    'result',
    'result_present',
    'reason',
    'created_at',
    'updated_at',
    'lease_expires_at',
    'reconciled_by',
    'reconciled_at',
  ]) {
    assert.equal(requiredColumns.has(column), true, `missing migration column: ${column}`);
  }
  const indexMetadata = await pool.query(
    `SELECT indexname AS "indexName"
       FROM pg_indexes
      WHERE schemaname = current_schema() AND tablename = $1`,
    [tableName]
  );
  assert.equal(
    indexMetadata.rows.some(row => row.indexName === `${tableName}_updated_at_idx`),
    true,
    'migration must create the updated_at pruning index'
  );
  const serverMetadata = await pool.query(
    'SELECT current_setting(\'server_version\') AS "serverVersion", current_setting(\'transaction_isolation\') AS "transactionIsolation"'
  );
  const postgresVersion = serverMetadata.rows[0]?.serverVersion;
  const postgresIsolation = serverMetadata.rows[0]?.transactionIsolation;
  if (typeof postgresVersion !== 'string' || postgresVersion.length === 0) {
    throw new Error('PostgreSQL did not return server_version.');
  }
  if (typeof postgresIsolation !== 'string' || postgresIsolation.length === 0) {
    throw new Error('PostgreSQL did not return transaction_isolation.');
  }
  const [claimA, claimB] = await Promise.all([
    clockedStoreA.claim('smoke-replay', 'fingerprint-replay', 'smoke-owner-a'),
    clockedStoreB.claim('smoke-replay', 'fingerprint-replay', 'smoke-owner-b'),
  ]);
  const ownerClaim = claimA.status === 'owner' ? claimA : claimB;
  const pendingClaim = claimA.status === 'owner' ? claimB : claimA;
  assert.equal(ownerClaim.status, 'owner');
  assert.equal(pendingClaim.status, 'pending');

  const ownerStore = claimA.status === 'owner' ? clockedStoreA : clockedStoreB;
  const ownerId = claimA.status === 'owner' ? 'smoke-owner-a' : 'smoke-owner-b';
  await ownerStore.complete('smoke-replay', ownerId, { accepted: true }, ownerClaim.fence);
  const replay = await clockedStoreB.claim('smoke-replay', 'fingerprint-replay', 'smoke-replay-owner');
  assert.equal(replay.status, 'replay');
  assert.deepEqual(replay.record.result, { accepted: true });

  const nullClaim = await clockedStoreA.claim('smoke-null-result', 'fingerprint-null', 'smoke-null-owner');
  assert.equal(nullClaim.status, 'owner');
  await clockedStoreA.complete(
    'smoke-null-result',
    'smoke-null-owner',
    null,
    nullClaim.fence
  );
  const nullReplay = await clockedStoreB.claim('smoke-null-result', 'fingerprint-null', 'smoke-null-replay-owner');
  assert.equal(nullReplay.status, 'replay');
  assert.equal(nullReplay.record.result, null);

  const recoveryClaim = await clockedStoreA.claim(
    'smoke-recovery',
    'fingerprint-recovery',
    'smoke-crashed-owner'
  );
  assert.equal(recoveryClaim.status, 'owner');
  await clockedStoreA.markUnknown(
    'smoke-recovery',
    'smoke-crashed-owner',
    'smoke worker exited before terminal write',
    { plannedPaths: ['index.html', 'styles.css'] },
    recoveryClaim.fence
  );
  const unknown = await clockedStoreB.get('smoke-recovery');
  assert.equal(unknown?.state, 'unknown');
  await assert.rejects(
    clockedStoreB.resolveUnknown(
      'smoke-recovery',
      'smoke-stale-recovery-command',
      { state: 'completed', result: { recovered: false } },
      { incarnation: unknown.incarnation, revision: unknown.revision - 1 }
    ),
    /fence is stale/
  );
  const resolved = await clockedStoreB.resolveUnknown(
    'smoke-recovery',
    'smoke-recovery-command',
    { state: 'completed', result: { recovered: true } },
    { incarnation: unknown.incarnation, revision: unknown.revision }
  );
  assert.equal(resolved.state, 'completed');
  assert.equal(resolved.reconciledBy, 'smoke-recovery-command');

  const reclaimClaim = await clockedStoreA.claim(
    'smoke-reclaim',
    'fingerprint-reclaim',
    'smoke-crashed-reclaim-owner',
    { leaseMs: 10 }
  );
  assert.equal(reclaimClaim.status, 'owner');
  now += 11;
  const reclaimed = await clockedStoreB.claim(
    'smoke-reclaim',
    'fingerprint-reclaim',
    'smoke-reclaimer',
    { leaseMs: 100 }
  );
  assert.equal(reclaimed.status, 'owner');
  assert.equal(reclaimed.record.ownerId, 'smoke-reclaimer');
  await clockedStoreB.complete(
    'smoke-reclaim',
    'smoke-reclaimer',
    { recovered: true },
    reclaimed.fence
  );

  const staleAbaClaim = await clockedStoreA.claim(
    'smoke-aba',
    'fingerprint-aba-old',
    'smoke-aba-owner',
    { leaseMs: 10 }
  );
  now += 11;
  const abaTakeover = await clockedStoreB.claim(
    'smoke-aba',
    'fingerprint-aba-old',
    'smoke-aba-takeover',
    { leaseMs: 100 }
  );
  await clockedStoreB.complete(
    'smoke-aba',
    'smoke-aba-takeover',
    { attempt: 'takeover' },
    abaTakeover.fence
  );

  const removed = await clockedStoreA.prune(now + 1);
  assert.equal(removed, 5);
  const freshAbaClaim = await clockedStoreA.claim(
    'smoke-aba',
    'fingerprint-aba-new',
    'smoke-aba-owner',
    { leaseMs: 100 }
  );
  assert.notEqual(freshAbaClaim.fence.incarnation, staleAbaClaim.fence.incarnation);
  await assert.rejects(
    clockedStoreA.complete(
      'smoke-aba',
      'smoke-aba-owner',
      { attempt: 'stale' },
      staleAbaClaim.fence
    ),
    /fence is stale/
  );
  await clockedStoreA.complete(
    'smoke-aba',
    'smoke-aba-owner',
    { attempt: 'fresh' },
    freshAbaClaim.fence
  );
  assert.equal(await clockedStoreA.prune(now + 1), 1);
  console.log(JSON.stringify({
    status: 'ok',
    postgresHost: endpoint.hostname,
    postgresVersion,
    postgresIsolation,
    checks: [
      'server-version',
      'transaction-isolation',
      'idempotent-migration',
      'legacy-row-incarnation-backfill',
      'schema-columns',
      'updated-at-index',
      'atomic-claim',
      'replay',
      'unknown-diagnostic-retention',
      'stale-fence-rejection',
      'unknown-recovery',
      'lease-reclaim',
      'prune-recreate-aba-fence',
      'retention-prune',
    ],
  }));
} finally {
  try {
    await pool.query(`DROP TABLE IF EXISTS ${quotedTableName}`);
  } finally {
    await pool.end();
  }
}
