/**
 * Framework-neutral durable operation contracts.
 *
 * A durable store owns the record, not the handler Promise. This distinction
 * makes the contract usable across browser tabs, worker processes, and server
 * hosts where an in-memory Promise cannot be shared.
 */

export type DurableOperationState =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'unknown';

export type DurableOperationClaimStatus =
  | 'owner'
  | 'pending'
  | 'replay'
  | 'unknown'
  | 'conflict';

export interface DurableOperationRecord<TResult = unknown> {
  readonly key: string;
  readonly fingerprint: string;
  readonly ownerId: string;
  /** Monotonic CAS token used to reject stale owner transitions. */
  readonly revision: number;
  readonly state: DurableOperationState;
  readonly result?: TResult;
  readonly reason?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  /** The owner may be replaced after this point when a claim is retried. */
  readonly leaseExpiresAt?: number;
  /** Recovery actor that resolved an unknown outcome, when applicable. */
  readonly reconciledBy?: string;
  readonly reconciledAt?: number;
}

export interface DurableOperationClaim<TResult = unknown> {
  readonly status: DurableOperationClaimStatus;
  readonly record: DurableOperationRecord<TResult>;
}

export interface DurableOperationClaimOptions {
  /** Lease duration for a new or reclaimed pending operation. */
  readonly leaseMs?: number;
}

export interface DurableOperationListOptions {
  /** Opaque keyset cursor returned by the previous page. */
  readonly cursor?: string;
  /** Maximum number of records to return. */
  readonly limit?: number;
}

export interface DurableOperationListPage<TResult = unknown> {
  readonly records: readonly DurableOperationRecord<TResult>[];
  /** Omit when the page is the final page. */
  readonly nextCursor?: string;
}

export type DurableOperationResolution<TResult = unknown> =
  | {
      readonly state: 'completed';
      readonly result: TResult;
      readonly reason?: string;
    }
  | {
      readonly state: 'failed';
      readonly reason: string;
      readonly result?: TResult;
    };

type MaybePromise<T> = T | Promise<T>;

/**
 * Minimal atomic persistence primitive required by the reference adapter.
 * Redis, SQL, IndexedDB, or another backend can implement this with a
 * conditional insert/update/delete keyed by `revision`.
 */
export interface DurableOperationBackend<TResult = unknown> {
  read(key: string): MaybePromise<DurableOperationRecord<TResult> | undefined>;
  /** Compatibility full scan for small stores. Prefer `listPage` on servers. */
  list?(): MaybePromise<readonly DurableOperationRecord<TResult>[]>;
  /**
   * Optional bounded scan for server backends. Cursors should be keyset-style
   * and remain valid while terminal records are deleted during pruning.
   */
  listPage?(
    options?: DurableOperationListOptions
  ): MaybePromise<DurableOperationListPage<TResult>>;
  compareAndSet(
    key: string,
    expectedRevision: number | undefined,
    next: DurableOperationRecord<TResult> | undefined
  ): MaybePromise<boolean>;
}

export interface DurableOperationStoreOptions {
  /** Injectable clock for deterministic tests. */
  readonly now?: () => number;
  /** Default lease used when a claim omits `leaseMs`. Defaults to five minutes. */
  readonly defaultLeaseMs?: number;
  /** Maximum CAS retries before reporting backend contention. Defaults to eight. */
  readonly maxAttempts?: number;
  /** Terminal record retention used by `prune()`. Defaults to one day. */
  readonly retentionMs?: number;
  /** Page size used by a backend's bounded `listPage()` scan. */
  readonly prunePageSize?: number;
  /** Maximum pages per prune call. Defaults to 1,000; use Infinity explicitly for trusted stores. */
  readonly maxPrunePages?: number;
}

/**
 * Application-owned persistence boundary for exactly-once-like mutation
 * handling. Implementations must make `claim` atomic for a given key.
 */
export interface DurableOperationStore<TResult = unknown> {
  claim(
    key: string,
    fingerprint: string,
    ownerId: string,
    options?: DurableOperationClaimOptions
  ): Promise<DurableOperationClaim<TResult>> | DurableOperationClaim<TResult>;

  complete(
    key: string,
    ownerId: string,
    result: TResult
  ): Promise<DurableOperationRecord<TResult>> | DurableOperationRecord<TResult>;

  fail(
    key: string,
    ownerId: string,
    reason: string,
    result?: TResult
  ): Promise<DurableOperationRecord<TResult>> | DurableOperationRecord<TResult>;

  markUnknown(
    key: string,
    ownerId: string,
    reason: string,
    /** Optional diagnostic result retained for a later domain resolver. */
    result?: TResult
  ): Promise<DurableOperationRecord<TResult>> | DurableOperationRecord<TResult>;

  /** Resolve an `unknown` record after a domain status/reconcile decision. */
  resolveUnknown(
    key: string,
    reconcilerId: string,
    resolution: DurableOperationResolution<TResult>,
    expectedRevision?: number
  ): Promise<DurableOperationRecord<TResult>> | DurableOperationRecord<TResult>;

  get(
    key: string
  ): Promise<DurableOperationRecord<TResult> | undefined> |
    DurableOperationRecord<TResult> | undefined;

  /** Remove terminal records older than the configured retention window. */
  prune(
    before?: number
  ): Promise<number> | number;
}

const DEFAULT_OPERATION_LEASE_MS = 5 * 60 * 1000;
const DEFAULT_OPERATION_RETENTION_MS = 24 * 60 * 60 * 1000;
const DEFAULT_OPERATION_MAX_ATTEMPTS = 8;
const DEFAULT_OPERATION_PRUNE_PAGE_SIZE = 500;
const DEFAULT_OPERATION_MAX_PRUNE_PAGES = 1000;

function assertOperationText(value: string, label: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }
}

function normalizeStoreOptions(
  options: DurableOperationStoreOptions
): Required<DurableOperationStoreOptions> {
  const defaultLeaseMs = options.defaultLeaseMs ?? DEFAULT_OPERATION_LEASE_MS;
  const retentionMs = options.retentionMs ?? DEFAULT_OPERATION_RETENTION_MS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_OPERATION_MAX_ATTEMPTS;
  const prunePageSize = options.prunePageSize ?? DEFAULT_OPERATION_PRUNE_PAGE_SIZE;
  const maxPrunePages = options.maxPrunePages ?? DEFAULT_OPERATION_MAX_PRUNE_PAGES;
  if (!Number.isFinite(defaultLeaseMs) || defaultLeaseMs <= 0) {
    throw new RangeError('Durable operation defaultLeaseMs must be positive and finite.');
  }
  if (!Number.isFinite(retentionMs) || retentionMs < 0) {
    throw new RangeError('Durable operation retentionMs must be non-negative and finite.');
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError('Durable operation maxAttempts must be a positive integer.');
  }
  if (!Number.isInteger(prunePageSize) || prunePageSize < 1) {
    throw new RangeError('Durable operation prunePageSize must be a positive integer.');
  }
  if (maxPrunePages !== Infinity && (!Number.isInteger(maxPrunePages) || maxPrunePages < 1)) {
    throw new RangeError('Durable operation maxPrunePages must be a positive integer or Infinity.');
  }
  return {
    now: options.now ?? Date.now,
    defaultLeaseMs,
    maxAttempts,
    retentionMs,
    prunePageSize,
    maxPrunePages,
  };
}

function validateLease(leaseMs: number): void {
  if (!Number.isFinite(leaseMs) || leaseMs <= 0) {
    throw new RangeError('Durable operation leaseMs must be positive and finite.');
  }
}

function validateRecord<TResult>(record: DurableOperationRecord<TResult>): void {
  assertOperationText(record.key, 'Durable operation key');
  assertOperationText(record.fingerprint, 'Durable operation fingerprint');
  assertOperationText(record.ownerId, 'Durable operation ownerId');
  if (!Number.isInteger(record.revision) || record.revision < 1) {
    throw new TypeError('Durable operation revision must be a positive integer.');
  }
  if (!isDurableOperationState(record.state)) {
    throw new TypeError('Durable operation state is invalid.');
  }
  if (!Number.isFinite(record.createdAt) || !Number.isFinite(record.updatedAt)) {
    throw new TypeError('Durable operation timestamps must be finite.');
  }
  if (record.leaseExpiresAt !== undefined && !Number.isFinite(record.leaseExpiresAt)) {
    throw new TypeError('Durable operation leaseExpiresAt must be finite.');
  }
  if (record.reason !== undefined) {
    assertOperationText(record.reason, 'Durable operation reason');
  }
  if (record.reconciledBy !== undefined) {
    assertOperationText(record.reconciledBy, 'Durable operation reconciledBy');
  }
  if (record.reconciledAt !== undefined && !Number.isFinite(record.reconciledAt)) {
    throw new TypeError('Durable operation reconciledAt must be finite.');
  }
}

function terminalState(state: DurableOperationState): boolean {
  return state !== 'pending';
}

function transitionError(key: string, message: string): Error {
  return new Error(`Durable operation "${key}" ${message}.`);
}

/**
 * Create a reference store over an atomic backend.
 *
 * The adapter owns the state machine and CAS retries. The backend owns
 * durability and cross-process atomicity; no Promise or process-local state is
 * shared by this layer.
 */
export function createDurableOperationStore<TResult = unknown>(
  backend: DurableOperationBackend<TResult>,
  options: DurableOperationStoreOptions = {}
): DurableOperationStore<TResult> {
  if (!backend || typeof backend.read !== 'function' ||
      (typeof backend.list !== 'function' && typeof backend.listPage !== 'function') ||
      typeof backend.compareAndSet !== 'function') {
    throw new TypeError('Durable operation backend must implement read, list or listPage, and compareAndSet.');
  }
  const normalized = normalizeStoreOptions(options);

  const claim = async (
    key: string,
    fingerprint: string,
    ownerId: string,
    claimOptions?: DurableOperationClaimOptions
  ): Promise<DurableOperationClaim<TResult>> => {
    assertOperationText(key, 'Durable operation key');
    assertOperationText(fingerprint, 'Durable operation fingerprint');
    assertOperationText(ownerId, 'Durable operation ownerId');
    const leaseMs = claimOptions?.leaseMs ?? normalized.defaultLeaseMs;
    validateLease(leaseMs);

    for (let attempt = 0; attempt < normalized.maxAttempts; attempt += 1) {
      const existing = await backend.read(key);
      if (existing) {
        validateRecord(existing);
        if (existing.fingerprint !== fingerprint) {
          return { status: 'conflict', record: existing };
        }
        if (existing.state === 'unknown') {
          return { status: 'unknown', record: existing };
        }
        if (terminalState(existing.state)) {
          return { status: 'replay', record: existing };
        }

        const now = normalized.now();
        if (existing.leaseExpiresAt === undefined || existing.leaseExpiresAt > now) {
          return { status: 'pending', record: existing };
        }

        const reclaimed: DurableOperationRecord<TResult> = {
          ...existing,
          ownerId,
          revision: existing.revision + 1,
          updatedAt: now,
          leaseExpiresAt: now + leaseMs,
        };
        if (await backend.compareAndSet(key, existing.revision, reclaimed)) {
          return { status: 'owner', record: reclaimed };
        }
        continue;
      }

      const now = normalized.now();
      const pending: DurableOperationRecord<TResult> = {
        key,
        fingerprint,
        ownerId,
        revision: 1,
        state: 'pending',
        createdAt: now,
        updatedAt: now,
        leaseExpiresAt: now + leaseMs,
      };
      if (await backend.compareAndSet(key, undefined, pending)) {
        return { status: 'owner', record: pending };
      }
    }

    throw transitionError(key, 'could not claim after concurrent updates');
  };

  const transition = async (
    key: string,
    ownerId: string,
    state: DurableOperationState,
    result?: TResult,
    reason?: string
  ): Promise<DurableOperationRecord<TResult>> => {
    assertOperationText(key, 'Durable operation key');
    assertOperationText(ownerId, 'Durable operation ownerId');
    if (state === 'pending') {
      throw new TypeError('Durable operation transitions cannot write pending state.');
    }
    if (reason !== undefined) {
      assertOperationText(reason, 'Durable operation reason');
    }
    if ((state === 'failed' || state === 'unknown') && reason === undefined) {
      throw new TypeError(`Durable operation ${state} transitions require a reason.`);
    }

    for (let attempt = 0; attempt < normalized.maxAttempts; attempt += 1) {
      const existing = await backend.read(key);
      if (!existing) throw transitionError(key, 'does not exist');
      validateRecord(existing);
      if (existing.ownerId !== ownerId) {
        throw transitionError(key, `is owned by "${existing.ownerId}"`);
      }
      if (existing.state !== 'pending') {
        throw transitionError(key, `is already ${existing.state}`);
      }
      if (existing.leaseExpiresAt !== undefined && existing.leaseExpiresAt <= normalized.now()) {
        throw transitionError(key, 'lease has expired');
      }

      const next: DurableOperationRecord<TResult> = {
        ...existing,
        state,
        revision: existing.revision + 1,
        updatedAt: normalized.now(),
        ...(result === undefined ? {} : { result }),
        ...(reason === undefined ? {} : { reason }),
        leaseExpiresAt: undefined,
      };
      if (await backend.compareAndSet(key, existing.revision, next)) return next;
    }

    throw transitionError(key, 'could not transition after concurrent updates');
  };

  const resolveUnknown = async (
    key: string,
    reconcilerId: string,
    resolution: DurableOperationResolution<TResult>,
    expectedRevision?: number
  ): Promise<DurableOperationRecord<TResult>> => {
    assertOperationText(key, 'Durable operation key');
    assertOperationText(reconcilerId, 'Durable operation reconcilerId');
    if (expectedRevision !== undefined &&
        (!Number.isInteger(expectedRevision) || expectedRevision < 1)) {
      throw new TypeError('Durable operation expectedRevision must be a positive integer.');
    }
    if (!resolution || typeof resolution !== 'object' ||
        (resolution.state !== 'completed' && resolution.state !== 'failed')) {
      throw new TypeError('Durable operation resolution state is invalid.');
    }
    if (resolution.state === 'completed' && resolution.result === undefined) {
      throw new TypeError('Completed durable operation reconciliation requires a result.');
    }
    if (resolution.state === 'failed') {
      assertOperationText(resolution.reason, 'Durable operation resolution reason');
    }

    for (let attempt = 0; attempt < normalized.maxAttempts; attempt += 1) {
      const existing = await backend.read(key);
      if (!existing) throw transitionError(key, 'does not exist');
      validateRecord(existing);
      if (existing.state !== 'unknown') {
        throw transitionError(key, `cannot resolve state ${existing.state}`);
      }
      if (expectedRevision !== undefined && existing.revision !== expectedRevision) {
        throw transitionError(key, 'revision is stale');
      }

      const now = normalized.now();
      const next: DurableOperationRecord<TResult> = {
        ...existing,
        state: resolution.state,
        revision: existing.revision + 1,
        updatedAt: now,
        ...(resolution.result === undefined ? {} : { result: resolution.result }),
        ...(resolution.reason === undefined ? {} : { reason: resolution.reason }),
        leaseExpiresAt: undefined,
        reconciledBy: reconcilerId,
        reconciledAt: now,
      };
      if (await backend.compareAndSet(key, existing.revision, next)) return next;
      if (expectedRevision !== undefined) throw transitionError(key, 'revision changed during reconciliation');
    }

    throw transitionError(key, 'could not reconcile after concurrent updates');
  };

  return {
    claim,
    complete: (key, ownerId, result) => transition(key, ownerId, 'completed', result),
    fail: (key, ownerId, reason, result) => transition(key, ownerId, 'failed', result, reason),
    markUnknown: (key, ownerId, reason, result) =>
      transition(key, ownerId, 'unknown', result, reason),
    resolveUnknown,
    get: key => {
      assertOperationText(key, 'Durable operation key');
      return backend.read(key);
    },
    prune: async (before = normalized.now() - normalized.retentionMs) => {
      if (!Number.isFinite(before)) throw new RangeError('Durable operation prune cutoff must be finite.');
      let removed = 0;
      if (backend.listPage) {
        let cursor: string | undefined;
        let pageCount = 0;
        const seenCursors = new Set<string>();
        while (true) {
          if (pageCount >= normalized.maxPrunePages) {
            throw transitionError('prune', 'exceeded the configured page limit');
          }
          const page = await backend.listPage({
            ...(cursor === undefined ? {} : { cursor }),
            limit: normalized.prunePageSize,
          });
          if (!page || !Array.isArray(page.records)) {
            throw new TypeError('Durable operation listPage must return a records array.');
          }
          for (const record of page.records) {
            validateRecord(record);
            if (!terminalState(record.state) || record.updatedAt >= before) continue;
            if (await backend.compareAndSet(record.key, record.revision, undefined)) removed += 1;
          }
          pageCount += 1;
          if (page.nextCursor === undefined) break;
          if (typeof page.nextCursor !== 'string' || page.nextCursor.length === 0 ||
              seenCursors.has(page.nextCursor)) {
            throw new Error('Invalid durable operation pagination: cursor did not advance.');
          }
          seenCursors.add(page.nextCursor);
          cursor = page.nextCursor;
        }
      } else if (backend.list) {
        const records = await backend.list();
        for (const record of records) {
          validateRecord(record);
          if (!terminalState(record.state) || record.updatedAt >= before) continue;
          if (await backend.compareAndSet(record.key, record.revision, undefined)) removed += 1;
        }
      } else {
        throw new TypeError('Durable operation backend cannot prune without list or listPage.');
      }
      return removed;
    },
  };
}

export function isDurableOperationState(
  value: unknown
): value is DurableOperationState {
  return (
    value === 'pending' ||
    value === 'completed' ||
    value === 'failed' ||
    value === 'unknown'
  );
}
