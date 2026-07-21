import {
  createDurableOperationStore,
  createIoredisDurableOperationClient,
  createNodeRedisDurableOperationClient,
  createRedisDurableOperationBackend,
} from '../../src/index';
import { createFakeRedisClient } from '../support/fake-redis';

describe('Redis durable operation backend', () => {
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

    const firstPage = await backend.listPage!({ limit: 1 });
    expect(firstPage.records).toHaveLength(1);
    expect(firstPage.nextCursor).toBeDefined();
    await expect(backend.compareAndSet(recordA.key, 1, undefined)).resolves.toBe(true);

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

    await store.claim('cleanup-a', 'fingerprint', 'owner');
    await store.complete('cleanup-a', 'owner', { ok: true });
    await store.claim('cleanup-b', 'fingerprint', 'owner');
    await store.complete('cleanup-b', 'owner', { ok: true });
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
      state: 'pending' as const,
      revision: 1,
      createdAt: 1,
      updatedAt: 1,
    };
    await expect(backend.compareAndSet(record.key, undefined, record)).resolves.toBe(true);
    await expect(backend.read(record.key)).resolves.toEqual(record);
  });
});
