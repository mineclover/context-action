import {
  createDurableOperationStore,
  createIoredisDurableOperationClient,
  createNodeRedisDurableOperationClient,
  createRedisDurableOperationBackend,
} from '../../src/index';
import { createFakeRedisClient } from '../support/fake-redis';

describe('Redis durable operation backend', () => {
  it('atomically backfills legacy pending and terminal records', async () => {
    const keyPrefix = 'test:legacy:';
    const client = createFakeRedisClient();
    const backend = createRedisDurableOperationBackend({ client, keyPrefix });
    const seedLegacy = (record: Record<string, unknown>) => {
      const encodedKey = [...new TextEncoder().encode(String(record.key))]
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      client.values.set(`${keyPrefix}record:${encodedKey}`, JSON.stringify(record));
      client.members.add(encodedKey);
    };
    seedLegacy({
      key: 'legacy-pending',
      fingerprint: 'legacy-pending-fingerprint',
      ownerId: 'legacy-owner',
      revision: 3,
      state: 'pending',
      createdAt: 1,
      updatedAt: 1,
      leaseExpiresAt: 10_000,
    });
    seedLegacy({
      key: 'legacy-terminal',
      fingerprint: 'legacy-terminal-fingerprint',
      ownerId: 'legacy-owner',
      revision: 2,
      state: 'completed',
      result: { ok: true },
      createdAt: 1,
      updatedAt: 1,
    });
    const store = createDurableOperationStore(backend, {
      now: () => 100,
      createIncarnation: () => 'redis-legacy-incarnation',
    });

    await expect(store.claim(
      'legacy-pending',
      'legacy-pending-fingerprint',
      'new-owner'
    )).resolves.toMatchObject({
      status: 'pending',
      fence: { incarnation: 'redis-legacy-incarnation', revision: 3 },
    });
    await expect(store.claim(
      'legacy-terminal',
      'legacy-terminal-fingerprint',
      'new-owner'
    )).resolves.toMatchObject({
      status: 'replay',
      record: { result: { ok: true }, incarnation: 'redis-legacy-incarnation' },
    });

    seedLegacy({
      key: 'legacy-contention',
      fingerprint: 'legacy-contention-fingerprint',
      ownerId: 'legacy-owner',
      revision: 7,
      state: 'pending',
      createdAt: 1,
      updatedAt: 1,
      leaseExpiresAt: 10_000,
    });
    const results = await Promise.all([
      backend.backfillLegacyIncarnation!('legacy-contention', 7, 'redis-contender-a'),
      backend.backfillLegacyIncarnation!('legacy-contention', 7, 'redis-contender-b'),
    ]);
    expect(results.sort()).toEqual([false, true]);
    await expect(backend.read('legacy-contention')).resolves.toMatchObject({
      incarnation: expect.stringMatching(/^redis-contender-[ab]$/),
      revision: 7,
    });
  });

  it('uses atomic CAS and preserves a keyset cursor during deletion', async () => {
    const client = createFakeRedisClient();
    const backend = createRedisDurableOperationBackend({
      client,
      keyPrefix: 'test:durable:',
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
    };
    const recordB = { ...recordA, key: 'operation-b', fingerprint: 'fingerprint-b' };

    const [first, second] = await Promise.all([
      backend.compareAndSet(recordA.key, undefined, recordA),
      backend.compareAndSet(recordA.key, undefined, recordA),
    ]);
    expect([first, second].sort()).toEqual([false, true]);
    await expect(backend.compareAndSet(recordB.key, undefined, recordB)).resolves.toBe(true);
    await expect(backend.read(recordA.key)).resolves.toEqual(recordA);
    await expect(backend.compareAndSet(
      recordA.key,
      { incarnation: 'stale-incarnation', revision: 1 },
      { ...recordA, revision: 2 }
    )).resolves.toBe(false);

    const firstPage = await backend.listPage!({ limit: 1 });
    expect(firstPage.records).toHaveLength(1);
    expect(firstPage.nextCursor).toBeDefined();
    await expect(backend.compareAndSet(
      recordA.key,
      { incarnation: recordA.incarnation, revision: 1 },
      undefined
    )).resolves.toBe(true);

    await expect(backend.listPage!({ cursor: firstPage.nextCursor, limit: 1 })).resolves.toMatchObject({
      records: [recordB],
    });
  });

  it('rejects a record key mismatch before issuing an EVAL', async () => {
    const client = createFakeRedisClient();
    const backend = createRedisDurableOperationBackend({ client });

    await expect(backend.compareAndSet('operation-a', undefined, {
      key: 'operation-b',
      fingerprint: 'fingerprint',
      ownerId: 'owner',
      incarnation: 'incarnation-mismatch',
      state: 'pending',
      revision: 1,
      createdAt: 1,
      updatedAt: 1,
    })).rejects.toThrow('record key must match');
    expect(client.values.size).toBe(0);
  });

  it('supports page-only server cleanup without a full list scan', async () => {
    let now = 5_000;
    const backend = createRedisDurableOperationBackend({
      client: createFakeRedisClient(),
      keyPrefix: 'test:cleanup:',
    });
    const store = createDurableOperationStore(backend, {
      now: () => now,
      retentionMs: 10,
      prunePageSize: 1,
    });

    const claimA = await store.claim('cleanup-a', 'fingerprint', 'owner');
    await store.complete('cleanup-a', 'owner', { ok: true }, claimA.fence);
    const claimB = await store.claim('cleanup-b', 'fingerprint', 'owner');
    await store.complete('cleanup-b', 'owner', { ok: true }, claimB.fence);
    now = 5_011;

    await expect(store.prune()).resolves.toBe(2);
  });

  it('bridges the node-redis command shape without changing backend semantics', async () => {
    const driver = createFakeRedisClient();
    const client = createNodeRedisDurableOperationClient({
      get: driver.get,
      eval: driver.eval,
      zRangeByLex: (key, min, max, options) =>
        driver.rangeByLex(key, min, max, options.LIMIT.count),
    });
    const backend = createRedisDurableOperationBackend({ client });

    const record = {
      key: 'node-redis-operation',
      fingerprint: 'fingerprint',
      ownerId: 'owner',
      incarnation: 'node-redis-incarnation',
      state: 'pending' as const,
      revision: 1,
      createdAt: 1,
      updatedAt: 1,
    };
    await expect(backend.compareAndSet(record.key, undefined, record)).resolves.toBe(true);
    await expect(backend.read(record.key)).resolves.toEqual(record);
  });

  it('bridges the ioredis positional command shape without changing backend semantics', async () => {
    const driver = createFakeRedisClient();
    const client = createIoredisDurableOperationClient({
      get: driver.get,
      eval: async <TResult>(script: string, numberOfKeys: number, ...args: readonly string[]) =>
        driver.eval(script, {
          keys: args.slice(0, numberOfKeys),
          arguments: args.slice(numberOfKeys),
        }) as Promise<TResult>,
      zrangebylex: (key, min, max, _command, _offset, count) =>
        driver.rangeByLex(key, min, max, Number(count)),
    });
    const backend = createRedisDurableOperationBackend({ client });

    const record = {
      key: 'ioredis-operation',
      fingerprint: 'fingerprint',
      ownerId: 'owner',
      incarnation: 'ioredis-incarnation',
      state: 'pending' as const,
      revision: 1,
      createdAt: 1,
      updatedAt: 1,
    };
    await expect(backend.compareAndSet(record.key, undefined, record)).resolves.toBe(true);
    await expect(backend.read(record.key)).resolves.toEqual(record);
  });
});
