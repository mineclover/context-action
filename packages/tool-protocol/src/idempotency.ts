/**
 * Small, framework-neutral idempotency primitives for managed tool calls.
 *
 * The registry intentionally stores an in-flight/completed promise rather than
 * request arguments. It is a bounded in-memory guard for one process/provider
 * lifetime; durable exactly-once guarantees require an application-owned
 * persistent store at the mutation boundary.
 */

export type ToolIdempotencyClaimStatus = 'owner' | 'replay' | 'conflict';

export interface ToolIdempotencyRegistryOptions {
  /** How long a settled entry remains replayable. Defaults to five minutes. */
  readonly retentionMs?: number;
  /** Maximum number of settled logical operations retained. Defaults to 1,000. */
  readonly maxEntries?: number;
  /** Injectable clock for deterministic tests. */
  readonly now?: () => number;
}

export interface ToolIdempotencyClaim<TResult> {
  readonly status: ToolIdempotencyClaimStatus;
  readonly promise?: Promise<TResult>;
}

export interface ToolIdempotencyRegistry<TResult = unknown> {
  claim(
    key: string,
    fingerprint: string,
    create: () => Promise<TResult>
  ): ToolIdempotencyClaim<TResult>;
  clear(key?: string): void;
  readonly size: number;
}

interface Entry<TResult> {
  readonly fingerprint: string;
  readonly promise: Promise<TResult>;
  settledAt?: number;
  lastAccessedAt: number;
}

const DEFAULT_RETENTION_MS = 5 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 1000;

function assertNonEmpty(value: string, label: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }
}

function normalizeOptions(
  options: ToolIdempotencyRegistryOptions
): Required<Pick<ToolIdempotencyRegistryOptions, 'retentionMs' | 'maxEntries' | 'now'>> {
  const retentionMs = options.retentionMs ?? DEFAULT_RETENTION_MS;
  if (!Number.isFinite(retentionMs) || retentionMs < 0) {
    throw new RangeError('Idempotency retentionMs must be a finite non-negative number.');
  }

  const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  if (!Number.isInteger(maxEntries) || maxEntries < 1) {
    throw new RangeError('Idempotency maxEntries must be a positive integer.');
  }

  return {
    retentionMs,
    maxEntries,
    now: options.now ?? Date.now,
  };
}

/** Create a bounded in-memory promise-sharing idempotency registry. */
export function createToolIdempotencyRegistry<TResult = unknown>(
  options: ToolIdempotencyRegistryOptions = {}
): ToolIdempotencyRegistry<TResult> {
  const normalized = normalizeOptions(options);
  const entries = new Map<string, Entry<TResult>>();

  const removeExpired = (now: number): void => {
    for (const [key, entry] of entries) {
      if (
        entry.settledAt !== undefined &&
        now - entry.settledAt >= normalized.retentionMs
      ) {
        entries.delete(key);
      }
    }
  };

  const evictOverflow = (): void => {
    while (entries.size > normalized.maxEntries) {
      let oldestKey: string | undefined;
      let oldestAccess = Number.POSITIVE_INFINITY;
      for (const [key, entry] of entries) {
        if (entry.settledAt === undefined) continue;
        if (entry.lastAccessedAt < oldestAccess) {
          oldestKey = key;
          oldestAccess = entry.lastAccessedAt;
        }
      }
      if (oldestKey === undefined) break;
      entries.delete(oldestKey);
    }
  };

  return {
    claim(key, fingerprint, create) {
      assertNonEmpty(key, 'Idempotency key');
      assertNonEmpty(fingerprint, 'Idempotency fingerprint');
      if (typeof create !== 'function') {
        throw new TypeError('Idempotency create must be a function.');
      }

      const now = normalized.now();
      removeExpired(now);
      const existing = entries.get(key);
      if (existing) {
        existing.lastAccessedAt = now;
        return existing.fingerprint === fingerprint
          ? { status: 'replay', promise: existing.promise }
          : { status: 'conflict' };
      }

      const promise = Promise.resolve().then(create);
      entries.set(key, {
        fingerprint,
        promise,
        lastAccessedAt: now,
      });
      void promise.then(
        () => {
          const entry = entries.get(key);
          if (entry?.promise !== promise) return;
          entry.settledAt = normalized.now();
          entry.lastAccessedAt = entry.settledAt;
          evictOverflow();
        },
        () => {
          const entry = entries.get(key);
          if (entry?.promise !== promise) return;
          entry.settledAt = normalized.now();
          entry.lastAccessedAt = entry.settledAt;
          evictOverflow();
        }
      );
      evictOverflow();
      return { status: 'owner', promise };
    },

    clear(key) {
      if (key === undefined) entries.clear();
      else entries.delete(key);
    },

    get size() {
      removeExpired(normalized.now());
      return entries.size;
    },
  };
}

function stableSerialize(value: unknown, seen: WeakSet<object>): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : `number:${String(value)}`;
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'bigint') return `bigint:${value.toString()}`;
  if (typeof value !== 'object') return `${typeof value}:${String(value)}`;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (Array.isArray(value)) {
    const result = `[${value.map(item => stableSerialize(item, seen)).join(',')}]`;
    seen.delete(value);
    return result;
  }

  const result = `{${Object.keys(value)
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableSerialize((value as Record<string, unknown>)[key], seen)}`)
    .join(',')}}`;
  seen.delete(value);
  return result;
}

/**
 * Create a deterministic, non-secret fingerprint for tool name and arguments.
 * The fingerprint is for accidental key-reuse detection, not authentication.
 */
export function createToolCallFingerprint(
  toolName: string,
  argumentsValue: unknown
): string {
  assertNonEmpty(toolName, 'Tool name');
  const serialized = `${toolName}:${stableSerialize(argumentsValue, new WeakSet())}`;
  let hash = 14695981039346656037n;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= BigInt(serialized.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 1099511628211n);
  }
  return `fnv1a64:${hash.toString(16).padStart(16, '0')}:${serialized.length}`;
}

/** Runtime validation for caller-supplied idempotency keys. */
export function isValidToolIdempotencyKey(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 256;
}

/**
 * Build the storage key used by a ToolContext durable operation adapter.
 * JSON tuple encoding avoids collisions when a user-controlled session ID
 * contains punctuation that could otherwise be interpreted as a separator.
 */
export function createToolOperationKey(
  toolName: string,
  idempotencyKey: string,
  sessionId?: string
): string {
  assertNonEmpty(toolName, 'Tool name');
  if (!isValidToolIdempotencyKey(idempotencyKey)) {
    throw new TypeError('Idempotency key must be a non-empty string of at most 256 characters.');
  }
  return JSON.stringify([sessionId ?? 'default', toolName, idempotencyKey]);
}
