import {
  createDurableOperationStore,
  createIndexedDbDurableOperationBackend,
  type DurableOperationRecord,
} from '../../src/index';
import { createFakeIndexedDbFactory } from '../support/fake-indexeddb';

describe('IndexedDB durable operation backend', () => {
  it('atomically backfills legacy pending and terminal records', async () => {
    type Result = { ok: boolean };
    const factory = createFakeIndexedDbFactory();
    const backend = createIndexedDbDurableOperationBackend<Result>({
      databaseName: 'test-legacy-records',
      indexedDB: factory,
    });
    const pendingLegacy = {
      key: 'legacy-pending',
      fingerprint: 'legacy-pending-fingerprint',
      ownerId: 'legacy-owner',
      revision: 3,
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
    await backend.compareAndSet(pendingLegacy.key, undefined, pendingLegacy);
    await backend.compareAndSet(terminalLegacy.key, undefined, terminalLegacy);
    const store = createDurableOperationStore(backend, {
      now: () => 100,
      createIncarnation: () => 'indexeddb-legacy-incarnation',
    });

    await expect(store.claim(
      pendingLegacy.key,
      pendingLegacy.fingerprint,
      'new-owner'
    )).resolves.toMatchObject({
      status: 'pending',
      fence: { incarnation: 'indexeddb-legacy-incarnation', revision: 3 },
    });
    await expect(store.claim(
      terminalLegacy.key,
      terminalLegacy.fingerprint,
      'new-owner'
    )).resolves.toMatchObject({
      status: 'replay',
      record: { result: { ok: true }, incarnation: 'indexeddb-legacy-incarnation' },
    });

    const contentionLegacy = {
      ...pendingLegacy,
      key: 'legacy-contention',
      fingerprint: 'legacy-contention-fingerprint',
      revision: 7,
    } as unknown as DurableOperationRecord<Result>;
    await backend.compareAndSet(contentionLegacy.key, undefined, contentionLegacy);
    const results = await Promise.all([
      backend.backfillLegacyIncarnation!(contentionLegacy.key, 7, 'indexeddb-contender-a'),
      backend.backfillLegacyIncarnation!(contentionLegacy.key, 7, 'indexeddb-contender-b'),
    ]);
    expect(results.sort()).toEqual([false, true]);
    await expect(backend.read(contentionLegacy.key)).resolves.toMatchObject({
      incarnation: expect.stringMatching(/^indexeddb-contender-[ab]$/),
      revision: 7,
    });
    await backend.close();
  });

  it('persists records and rejects stale revision writes', async () => {
    const factory = createFakeIndexedDbFactory();
    const backend = createIndexedDbDurableOperationBackend({
      databaseName: 'test-records',
      indexedDB: factory,
    });
    const record = {
      key: 'operation-1',
      fingerprint: 'fingerprint',
      ownerId: 'owner',
      incarnation: 'incarnation-1',
      state: 'pending' as const,
      revision: 1,
      createdAt: 1,
      updatedAt: 1,
      leaseExpiresAt: 10,
    };

    await expect(backend.read(record.key)).resolves.toBeUndefined();
    await expect(backend.compareAndSet(record.key, undefined, record)).resolves.toBe(true);
    await expect(backend.read(record.key)).resolves.toEqual(record);
    await expect(backend.compareAndSet(
      record.key,
      { incarnation: 'stale-incarnation', revision: 1 },
      { ...record, revision: 2 }
    )).resolves.toBe(false);
    await expect(backend.compareAndSet(record.key, undefined, { ...record, revision: 2 })).resolves.toBe(false);
    await expect(backend.compareAndSet(
      record.key,
      { incarnation: record.incarnation, revision: 1 },
      { ...record, revision: 2 }
    )).resolves.toBe(true);
    await expect(backend.list!()).resolves.toEqual([{ ...record, revision: 2 }]);

    await backend.close();
    const restartedBackend = createIndexedDbDurableOperationBackend({
      databaseName: 'test-records',
      indexedDB: factory,
    });
    await expect(restartedBackend.read(record.key)).resolves.toEqual({ ...record, revision: 2 });
    await restartedBackend.close();
  });

  it('coordinates claims across independent backend instances', async () => {
    const factory = createFakeIndexedDbFactory();
    const backendA = createIndexedDbDurableOperationBackend({
      databaseName: 'test-tabs',
      indexedDB: factory,
    });
    const backendB = createIndexedDbDurableOperationBackend({
      databaseName: 'test-tabs',
      indexedDB: factory,
    });
    const storeA = createDurableOperationStore(backendA, { now: () => 1_000 });
    const storeB = createDurableOperationStore(backendB, { now: () => 1_000 });

    const [claimA, claimB] = await Promise.all([
      storeA.claim('operation-2', 'fingerprint', 'tab-a'),
      storeB.claim('operation-2', 'fingerprint', 'tab-b'),
    ]);

    expect([claimA.status, claimB.status].sort()).toEqual(['owner', 'pending']);
    const owner = claimA.status === 'owner' ? storeA : storeB;
    const ownerClaim = claimA.status === 'owner' ? claimA : claimB;
    const ownerId = claimA.status === 'owner' ? 'tab-a' : 'tab-b';
    await owner.complete('operation-2', ownerId, { saved: true }, ownerClaim.fence);

    await expect(storeB.claim('operation-2', 'fingerprint', 'tab-b')).resolves.toMatchObject({
      status: 'replay',
      record: { state: 'completed', result: { saved: true } },
    });
    await backendA.close();
    await backendB.close();
  });

  it('fails fast when IndexedDB is unavailable', () => {
    expect(() => createIndexedDbDurableOperationBackend({ indexedDB: undefined })).toThrow(
      'IndexedDB is not available in this runtime.'
    );
  });

  it('rejects records whose key differs from the CAS key', async () => {
    const backend = createIndexedDbDurableOperationBackend({
      databaseName: 'test-key-validation',
      indexedDB: createFakeIndexedDbFactory(),
    });

    expect(() => backend.compareAndSet('operation-1', undefined, {
      key: 'operation-2',
      fingerprint: 'fingerprint',
      ownerId: 'owner',
      incarnation: 'incarnation-2',
      state: 'pending',
      revision: 1,
      createdAt: 1,
      updatedAt: 1,
    })).toThrow('record key must match');
  });
});
