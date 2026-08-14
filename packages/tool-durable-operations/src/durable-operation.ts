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

/** Runtime capability required from stores that enforce claim-incarnation fencing. */
export const DURABLE_OPERATION_FENCING_CAPABILITY =
  'context-action/durable-operation-fencing/incarnation-revision-v1' as const;

/** Full optimistic fence for one claim incarnation and record revision. */
export interface DurableOperationFence {
  readonly incarnation: string;
  readonly revision: number;
}

export interface DurableOperationRecord<TResult = unknown> {
  readonly key: string;
  readonly fingerprint: string;
  readonly ownerId: string;
  /** Opaque identity that never changes while one key incarnation exists. */
  readonly incarnation: string;
  /** Monotonic CAS token within one incarnation. */
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
  /** Fence that must accompany every owner or reconciliation transition. */
  readonly fence: DurableOperationFence;
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
 * conditional insert/update/delete keyed by the full incarnation/revision
 * fence. Comparing only a revision is not sufficient after prune/recreate.
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
    /** `undefined` means insert only when the key is absent. */
    expectedFence: DurableOperationFence | undefined,
    next: DurableOperationRecord<TResult> | undefined
  ): MaybePromise<boolean>;
  /**
   * Optional atomic upgrade for records written before incarnation fencing.
   * Implementations must update only when the key exists, its revision equals
   * `expectedRevision`, and its incarnation field is absent.
   * This upgrades stored data only; hosts must not run pre-fencing writers at
   * the same time because an old writer can still replace a migrated record.
   */
  backfillLegacyIncarnation?(
    key: string,
    expectedRevision: number,
    incarnation: string
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
  /** Injectable globally unique incarnation generator for deterministic tests or host policy. */
  readonly createIncarnation?: () => string;
}

/**
 * Application-owned persistence boundary for exactly-once-like mutation
 * handling. Implementations must make `claim` atomic for a given key.
 */
export interface DurableOperationStore<TResult = unknown> {
  /** Fail-closed declaration that this store implements the full fence contract. */
  readonly fencingCapability: typeof DURABLE_OPERATION_FENCING_CAPABILITY;

  claim(
    key: string,
    fingerprint: string,
    ownerId: string,
    options?: DurableOperationClaimOptions
  ): Promise<DurableOperationClaim<TResult>> | DurableOperationClaim<TResult>;

  complete(
    key: string,
    ownerId: string,
    result: TResult,
    /** Fence returned by the owning claim. */
    expectedFence: DurableOperationFence
  ): Promise<DurableOperationRecord<TResult>> | DurableOperationRecord<TResult>;

  fail(
    key: string,
    ownerId: string,
    reason: string,
    result: TResult | undefined,
    /** Fence returned by the owning claim. */
    expectedFence: DurableOperationFence
  ): Promise<DurableOperationRecord<TResult>> | DurableOperationRecord<TResult>;

  markUnknown(
    key: string,
    ownerId: string,
    reason: string,
    /** Optional diagnostic result retained for a later domain resolver. */
    result: TResult | undefined,
    /** Fence returned by the owning claim. */
    expectedFence: DurableOperationFence
  ): Promise<DurableOperationRecord<TResult>> | DurableOperationRecord<TResult>;

  /** Resolve an `unknown` record after a domain status/reconcile decision. */
  resolveUnknown(
    key: string,
    reconcilerId: string,
    resolution: DurableOperationResolution<TResult>,
    /** Fence observed before the domain reconciliation decision began. */
    expectedFence: DurableOperationFence
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
const MAX_OPERATION_INCARNATION_LENGTH = 256;

interface RandomCryptoHost {
  randomUUID?: () => string;
  getRandomValues?: (values: Uint8Array) => Uint8Array;
}

function defaultCreateIncarnation(): string {
  const cryptoHost = (globalThis as typeof globalThis & {
    crypto?: RandomCryptoHost;
  }).crypto;
  if (typeof cryptoHost?.randomUUID === 'function') {
    return cryptoHost.randomUUID();
  }
  if (typeof cryptoHost?.getRandomValues === 'function') {
    const bytes = cryptoHost.getRandomValues(new Uint8Array(16));
    return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  }
  throw new Error(
    'Durable operation fencing requires crypto.randomUUID(), crypto.getRandomValues(), or createIncarnation.'
  );
}

function assertOperationText(value: string, label: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }
}

function assertIncarnation(value: string): void {
  assertOperationText(value, 'Durable operation incarnation');
  if (value.length > MAX_OPERATION_INCARNATION_LENGTH || value.includes('\0')) {
    throw new TypeError(
      `Durable operation incarnation must be visible text within ${MAX_OPERATION_INCARNATION_LENGTH} characters.`
    );
  }
}

function validateFence(fence: DurableOperationFence): void {
  if (!fence || typeof fence !== 'object') {
    throw new TypeError('Durable operation expectedFence is required.');
  }
  assertIncarnation(fence.incarnation);
  if (!Number.isInteger(fence.revision) || fence.revision < 1) {
    throw new TypeError('Durable operation fence revision must be a positive integer.');
  }
}

function fenceFromRecord<TResult>(
  record: DurableOperationRecord<TResult>
): DurableOperationFence {
  return {
    incarnation: record.incarnation,
    revision: record.revision,
  };
}

function claimFromRecord<TResult>(
  status: DurableOperationClaimStatus,
  record: DurableOperationRecord<TResult>
): DurableOperationClaim<TResult> {
  return { status, record, fence: fenceFromRecord(record) };
}

/** Runtime guard used by orchestrators to reject legacy, unfenced stores. */
export function hasDurableOperationFencingCapability(
  value: unknown
): value is Pick<DurableOperationStore<unknown>, 'fencingCapability'> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { fencingCapability?: unknown }).fencingCapability ===
      DURABLE_OPERATION_FENCING_CAPABILITY
  );
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
    createIncarnation: options.createIncarnation ?? defaultCreateIncarnation,
  };
}

function validateLease(leaseMs: number): void {
  if (!Number.isFinite(leaseMs) || leaseMs <= 0) {
    throw new RangeError('Durable operation leaseMs must be positive and finite.');
  }
}

function validateRecord<TResult>(
  record: DurableOperationRecord<TResult>,
  allowMissingIncarnation = false
): void {
  assertOperationText(record.key, 'Durable operation key');
  assertOperationText(record.fingerprint, 'Durable operation fingerprint');
  assertOperationText(record.ownerId, 'Durable operation ownerId');
  if (!(allowMissingIncarnation && record.incarnation === undefined)) {
    assertIncarnation(record.incarnation);
  }
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

  const readValidatedRecord = async (
    key: string
  ): Promise<DurableOperationRecord<TResult> | undefined> => {
    assertOperationText(key, 'Durable operation key');
    for (let attempt = 0; attempt < normalized.maxAttempts; attempt += 1) {
      const record = await backend.read(key);
      if (!record) return undefined;
      if (record.key !== key) {
        throw new TypeError('Durable operation backend returned a mismatched record key.');
      }
      if (Object.getOwnPropertyDescriptor(record, 'incarnation') !== undefined) {
        validateRecord(record);
        return record;
      }

      // Records from the pre-fencing format never published an incarnation.
      // Validate every other field before asking the backend to atomically add
      // one, then re-read rather than trusting the candidate we attempted.
      validateRecord(record, true);
      if (!backend.backfillLegacyIncarnation) {
        throw transitionError(
          key,
          'requires legacy incarnation backfill, but the backend does not support it'
        );
      }
      const incarnation = normalized.createIncarnation();
      assertIncarnation(incarnation);
      await backend.backfillLegacyIncarnation(key, record.revision, incarnation);
    }

    throw transitionError(key, 'could not backfill a legacy incarnation after concurrent updates');
  };

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
      const existing = await readValidatedRecord(key);
      if (existing) {
        if (existing.fingerprint !== fingerprint) {
          return claimFromRecord('conflict', existing);
        }
        if (existing.state === 'unknown') {
          return claimFromRecord('unknown', existing);
        }
        if (terminalState(existing.state)) {
          return claimFromRecord('replay', existing);
        }

        const now = normalized.now();
        if (existing.leaseExpiresAt === undefined || existing.leaseExpiresAt > now) {
          return claimFromRecord('pending', existing);
        }

        const reclaimed: DurableOperationRecord<TResult> = {
          ...existing,
          ownerId,
          revision: existing.revision + 1,
          updatedAt: now,
          leaseExpiresAt: now + leaseMs,
        };
        if (await backend.compareAndSet(key, fenceFromRecord(existing), reclaimed)) {
          return claimFromRecord('owner', reclaimed);
        }
        continue;
      }

      const now = normalized.now();
      const incarnation = normalized.createIncarnation();
      assertIncarnation(incarnation);
      const pending: DurableOperationRecord<TResult> = {
        key,
        fingerprint,
        ownerId,
        incarnation,
        revision: 1,
        state: 'pending',
        createdAt: now,
        updatedAt: now,
        leaseExpiresAt: now + leaseMs,
      };
      if (await backend.compareAndSet(key, undefined, pending)) {
        return claimFromRecord('owner', pending);
      }
    }

    throw transitionError(key, 'could not claim after concurrent updates');
  };

  const transition = async (
    key: string,
    ownerId: string,
    state: DurableOperationState,
    result?: TResult,
    reason?: string,
    expectedFence?: DurableOperationFence
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
    validateFence(expectedFence as DurableOperationFence);

    const existing = await readValidatedRecord(key);
    if (!existing) throw transitionError(key, 'does not exist');
    if (existing.ownerId !== ownerId) {
      throw transitionError(key, `is owned by "${existing.ownerId}"`);
    }
    if (existing.incarnation !== expectedFence!.incarnation ||
        existing.revision !== expectedFence!.revision) {
      throw transitionError(key, 'fence is stale');
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
    if (await backend.compareAndSet(key, fenceFromRecord(existing), next)) return next;

    throw transitionError(key, 'fence changed during transition');
  };

  const resolveUnknown = async (
    key: string,
    reconcilerId: string,
    resolution: DurableOperationResolution<TResult>,
    expectedFence?: DurableOperationFence
  ): Promise<DurableOperationRecord<TResult>> => {
    assertOperationText(key, 'Durable operation key');
    assertOperationText(reconcilerId, 'Durable operation reconcilerId');
    validateFence(expectedFence as DurableOperationFence);
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

    const existing = await readValidatedRecord(key);
    if (!existing) throw transitionError(key, 'does not exist');
    if (existing.state !== 'unknown') {
      throw transitionError(key, `cannot resolve state ${existing.state}`);
    }
    if (existing.incarnation !== expectedFence!.incarnation ||
        existing.revision !== expectedFence!.revision) {
      throw transitionError(key, 'fence is stale');
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
    if (await backend.compareAndSet(key, fenceFromRecord(existing), next)) return next;

    throw transitionError(key, 'fence changed during reconciliation');
  };

  return {
    fencingCapability: DURABLE_OPERATION_FENCING_CAPABILITY,
    claim,
    complete: (key, ownerId, result, expectedFence) =>
      transition(key, ownerId, 'completed', result, undefined, expectedFence),
    fail: (key, ownerId, reason, result, expectedFence) =>
      transition(key, ownerId, 'failed', result, reason, expectedFence),
    markUnknown: (key, ownerId, reason, result, expectedFence) =>
      transition(key, ownerId, 'unknown', result, reason, expectedFence),
    resolveUnknown,
    get: key => {
      assertOperationText(key, 'Durable operation key');
      return readValidatedRecord(key);
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
          for (const listedRecord of page.records) {
            const record = await readValidatedRecord(listedRecord.key);
            if (!record) continue;
            if (!terminalState(record.state) || record.updatedAt >= before) continue;
            if (await backend.compareAndSet(record.key, fenceFromRecord(record), undefined)) {
              removed += 1;
            }
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
        for (const listedRecord of records) {
          const record = await readValidatedRecord(listedRecord.key);
          if (!record) continue;
          if (!terminalState(record.state) || record.updatedAt >= before) continue;
          if (await backend.compareAndSet(record.key, fenceFromRecord(record), undefined)) {
            removed += 1;
          }
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
