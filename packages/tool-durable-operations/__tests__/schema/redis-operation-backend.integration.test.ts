import { createClient } from 'redis';
import {
  createDurableOperationStore,
  createNodeRedisDurableOperationClient,
  createRedisDurableOperationBackend,
} from '../../src/index';

const redisUrl = process.env.REDIS_URL?.trim();
const describeRedis = redisUrl ? describe : describe.skip;

describeRedis('Redis durable operation integration', () => {
  const keyPrefix = `context-action:test:${process.pid}:${Date.now()}:`;
  const client = createClient({ url: redisUrl });
  const backend = createRedisDurableOperationBackend({
    client: createNodeRedisDurableOperationClient(client),
    keyPrefix,
  });

  beforeAll(async () => {
    client.on('error', error => {
      // Jest owns the assertion lifecycle; connection failures are surfaced by
      // the command that is awaiting the client rather than an uncaught event.
      console.error(
        'Redis integration client error:',
        error instanceof Error ? error.name : 'UnknownError'
      );
    });
    await client.connect();
  });

  afterAll(async () => {
    if (client.isOpen) await client.quit();
  });

  it('allows exactly one owner across concurrent store instances', async () => {
    const key = 'concurrent-claim';
    const owners = Array.from({ length: 8 }, (_, index) => `owner-${index}`);
    const stores = owners.map(owner =>
      createDurableOperationStore(backend, {
        defaultLeaseMs: 5_000,
        maxAttempts: 32,
      })
    );

    const claims = await Promise.all(
      stores.map((store, index) => store.claim(key, 'same-fingerprint', owners[index]))
    );
    const owned = claims.filter(claim => claim.status === 'owner');
    expect(owned).toHaveLength(1);
    expect(claims.filter(claim => claim.status === 'pending')).toHaveLength(7);

    const ownerIndex = claims.findIndex(claim => claim.status === 'owner');
    await stores[ownerIndex].complete(
      key,
      owners[ownerIndex],
      { accepted: true },
      claims[ownerIndex].fence
    );
    await expect(stores[0].claim(key, 'same-fingerprint', 'replay-owner')).resolves.toMatchObject({
      status: 'replay',
      record: { state: 'completed', result: { accepted: true } },
    });
    await expect(stores[0].prune(Date.now() + 1)).resolves.toBe(1);
  }, 15_000);

  it('reclaims an expired lease, records unknown, and reconciles it', async () => {
    let now = Date.now();
    const store = createDurableOperationStore(backend, {
      now: () => now,
      defaultLeaseMs: 10,
      maxAttempts: 32,
    });
    const key = 'lease-recovery';

    await expect(store.claim(key, 'recovery-fingerprint', 'crashed-owner', { leaseMs: 10 })).resolves.toMatchObject({
      status: 'owner',
    });
    now += 11;
    const reclaimed = await store.claim(
      key,
      'recovery-fingerprint',
      'reclaimer',
      { leaseMs: 100 }
    );
    expect(reclaimed).toMatchObject({
      status: 'owner',
      record: { ownerId: 'reclaimer', revision: 2 },
    });

    const unknown = await store.markUnknown(
      key,
      'reclaimer',
      'worker exited before terminal write',
      { plannedPaths: ['index.html'] },
      reclaimed.fence
    );
    expect(unknown).toMatchObject({
      state: 'unknown',
      revision: 3,
      result: { plannedPaths: ['index.html'] },
    });
    const resolved = await store.resolveUnknown(
      key,
      'domain-recovery-command',
      { state: 'completed', result: { recovered: true } },
      { incarnation: unknown.incarnation, revision: unknown.revision }
    );
    expect(resolved).toMatchObject({
      state: 'completed',
      revision: 4,
      reconciledBy: 'domain-recovery-command',
      result: { recovered: true },
    });

    await expect(store.claim(key, 'recovery-fingerprint', 'new-owner')).resolves.toMatchObject({
      status: 'replay',
      record: { state: 'completed' },
    });
    now += 1_000;
    await expect(store.prune(now)).resolves.toBe(1);
    await expect(store.get(key)).resolves.toBeUndefined();
  }, 15_000);
});

if (!redisUrl) {
  test('documents the opt-in integration contract when Redis is unavailable', () => {
    expect(redisUrl).toBeUndefined();
  });
}
