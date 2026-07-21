import type {
  DurableOperationBackend,
  DurableOperationClaim,
  DurableOperationClaimStatus,
  DurableOperationListOptions,
  DurableOperationListPage,
  DurableOperationRecord,
  DurableOperationResolution,
  DurableOperationState,
  DurableOperationStore,
  DurableOperationStoreOptions,
} from '../../src/durable-operation';
import { createDurableOperationStore } from '../../src/durable-operation';

/**
 * Test-only shared durable backend and store factory.
 *
 * Every store instance represents a tab/process. The backend map represents
 * the shared database. CAS is synchronous here, while the adapter itself is
 * async, so tests exercise the same boundary as a Redis/SQL implementation.
 */

export type MockDurableOperationState = DurableOperationState;

export type MockDurableOperationRecord<TResult = unknown> =
  DurableOperationRecord<TResult>;

export interface MockDurableOperationBackend<TResult = unknown>
  extends DurableOperationBackend<TResult> {
  readonly records: Map<string, MockDurableOperationRecord<TResult>>;
}

export type MockDurableOperationClaimStatus = DurableOperationClaimStatus;

export type MockDurableOperationClaim<TResult = unknown> =
  DurableOperationClaim<TResult>;

export function createMockDurableOperationBackend<TResult = unknown>():
  MockDurableOperationBackend<TResult> {
  const records = new Map<string, MockDurableOperationRecord<TResult>>();
  return {
    records,
    read: key => records.get(key),
    list: () => [...records.values()],
    listPage: (options: DurableOperationListOptions = {}): DurableOperationListPage<TResult> => {
      const sorted = [...records.values()].sort((left, right) => left.key.localeCompare(right.key));
      const start = options.cursor === undefined
        ? 0
        : sorted.findIndex(record => record.key > options.cursor!);
      const normalizedStart = start < 0 ? sorted.length : start;
      const limit = (options.limit ?? sorted.length) || 1;
      const page = sorted.slice(normalizedStart, normalizedStart + limit);
      const last = page[page.length - 1];
      return {
        records: page,
        ...(last !== undefined && normalizedStart + page.length < sorted.length
          ? { nextCursor: last.key }
          : {}),
      };
    },
    compareAndSet: (key, expectedRevision, next) => {
      const current = records.get(key);
      const actualRevision = current?.revision;
      if (actualRevision !== expectedRevision) return false;
      if (next === undefined) records.delete(key);
      else records.set(key, next);
      return true;
    },
  };
}

export function createMockDurableOperationStore<TResult = unknown>(
  backend: MockDurableOperationBackend<TResult>,
  ownerId: string,
  now: () => number = Date.now,
  options: DurableOperationStoreOptions = {}
): DurableOperationStore<TResult> {
  if (!ownerId.trim()) throw new TypeError('Mock operation ownerId is required.');
  const store = createDurableOperationStore(backend, { ...options, now });
  return {
    claim: (key, fingerprint, requestedOwnerId, options) =>
      store.claim(key, fingerprint, requestedOwnerId, options),
    complete: (key, transitionOwnerId, result) => {
      if (transitionOwnerId !== ownerId) {
        throw new Error(`Operation transition owner must be "${ownerId}".`);
      }
      return store.complete(key, transitionOwnerId, result);
    },
    fail: (key, transitionOwnerId, reason, result) => {
      if (transitionOwnerId !== ownerId) {
        throw new Error(`Operation transition owner must be "${ownerId}".`);
      }
      return store.fail(key, transitionOwnerId, reason, result);
    },
    markUnknown: (key, transitionOwnerId, reason, result) => {
      if (transitionOwnerId !== ownerId) {
        throw new Error(`Operation transition owner must be "${ownerId}".`);
      }
      return store.markUnknown(key, transitionOwnerId, reason, result);
    },
    resolveUnknown: (
      key,
      reconcilerId,
      resolution: DurableOperationResolution<TResult>,
      expectedRevision
    ) => store.resolveUnknown(key, reconcilerId, resolution, expectedRevision),
    get: key => store.get(key),
    prune: before => store.prune(before),
  };
}
