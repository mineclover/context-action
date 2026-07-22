import assert from 'node:assert/strict';
import { createClient } from 'redis';
import {
  createDurableOperationStore,
  createNodeRedisDurableOperationClient,
  createRedisDurableOperationBackend,
} from '../dist/index.js';

const redisUrl = process.env.REDIS_URL?.trim();

if (!redisUrl) {
  console.error('REDIS_URL is required for the Redis durable-operation smoke check.');
  process.exit(2);
}

let endpoint;
try {
  endpoint = new URL(redisUrl);
} catch {
  console.error('REDIS_URL must be a valid redis:// or rediss:// URL.');
  process.exit(2);
}
if (endpoint.protocol !== 'redis:' && endpoint.protocol !== 'rediss:') {
  console.error('REDIS_URL must use redis:// or rediss://.');
  process.exit(2);
}

const keyPrefix = `context-action:verify:${process.pid}:${Date.now()}:`;
const client = createClient({ url: redisUrl });
const backend = createRedisDurableOperationBackend({
  client: createNodeRedisDurableOperationClient(client),
  keyPrefix,
});

async function cleanup() {
  // The smoke check uses three known records. The sorted-set index is removed
  // separately because the backend intentionally exposes no driver-specific
  // cleanup API.
  const encodeKey = value => Buffer.from(value).toString('hex');
  await client.del(
    `${keyPrefix}record:${encodeKey('smoke-replay')}`,
    `${keyPrefix}record:${encodeKey('smoke-recovery')}`,
    `${keyPrefix}record:${encodeKey('smoke-reclaim')}`,
    `${keyPrefix}index`
  );
}

try {
  client.on('error', error => {
    console.error(
      'Redis durable-operation smoke client error:',
      error instanceof Error ? error.name : 'UnknownError'
    );
  });
  await client.connect();
  const serverInfo = await client.info('server');
  const redisVersion = serverInfo
    .split(/\r?\n/)
    .find(line => line.startsWith('redis_version:'))
    ?.slice('redis_version:'.length)
    .trim();
  if (!redisVersion) {
    throw new Error('Redis INFO server did not return redis_version.');
  }

  let now = Date.now();
  const storeOptions = {
    defaultLeaseMs: 250,
    retentionMs: 0,
    maxAttempts: 32,
    now: () => now,
  };
  const clockedStoreA = createDurableOperationStore(backend, storeOptions);
  const clockedStoreB = createDurableOperationStore(backend, storeOptions);

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
  await ownerStore.complete('smoke-replay', ownerId, { accepted: true });
  const replay = await clockedStoreB.claim(
    'smoke-replay',
    'fingerprint-replay',
    'smoke-replay-owner'
  );
  assert.equal(replay.status, 'replay');
  assert.deepEqual(replay.record.result, { accepted: true });

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
    { plannedPaths: ['index.html', 'styles.css'] }
  );
  const unknown = await clockedStoreB.get('smoke-recovery');
  assert.equal(unknown?.state, 'unknown');
  assert.deepEqual(unknown?.result, {
    plannedPaths: ['index.html', 'styles.css'],
  });
  await assert.rejects(
    clockedStoreB.resolveUnknown(
      'smoke-recovery',
      'smoke-stale-recovery-command',
      { state: 'completed', result: { recovered: false } },
      unknown.revision - 1
    ),
    /revision is stale/
  );
  const resolved = await clockedStoreB.resolveUnknown(
    'smoke-recovery',
    'smoke-recovery-command',
    { state: 'completed', result: { recovered: true } },
    unknown.revision
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
  await clockedStoreB.complete('smoke-reclaim', 'smoke-reclaimer', { recovered: true });

  // The smoke store uses a deterministic clock. Use that same clock for the
  // cutoff so the lease-reclaim record (which is intentionally advanced by
  // 11ms) cannot race the wall clock on a fast CI runner.
  const removed = await clockedStoreA.prune(now + 1);
  assert.equal(removed, 3);

  console.log(JSON.stringify({
    status: 'ok',
    redisUrl: endpoint.hostname,
    redisVersion,
    checks: [
      'server-version',
      'atomic-claim',
      'replay',
      'unknown-diagnostic-retention',
      'stale-revision-rejection',
      'unknown-recovery',
      'lease-reclaim',
      'retention-prune',
    ],
  }));
} finally {
  if (client.isOpen) {
    try {
      await cleanup();
    } finally {
      await client.quit();
    }
  }
}
