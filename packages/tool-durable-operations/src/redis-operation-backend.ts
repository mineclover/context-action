import type {
  DurableOperationBackend,
  DurableOperationFence,
  DurableOperationListOptions,
  DurableOperationListPage,
  DurableOperationRecord,
} from './durable-operation.js';

export type DurableOperationRedisMaybePromise<T> = T | Promise<T>;

export interface DurableOperationRedisEvalOptions {
  readonly keys: readonly string[];
  readonly arguments: readonly string[];
}

/**
 * Small driver-neutral Redis surface.
 *
 * node-redis and ioredis expose different `eval`/lex-range signatures, so an
 * application supplies this three-method bridge instead of making this
 * framework package depend on either client. `rangeByLex` must apply Redis
 * `ZRANGEBYLEX` semantics and its limit as one command.
 */
export interface DurableOperationRedisClient {
  get(
    key: string
  ): DurableOperationRedisMaybePromise<string | Uint8Array | null | undefined>;
  eval<TResult = unknown>(
    script: string,
    options: DurableOperationRedisEvalOptions
  ): DurableOperationRedisMaybePromise<TResult>;
  rangeByLex(
    key: string,
    min: string,
    max: string,
    limit: number
  ): DurableOperationRedisMaybePromise<readonly string[]>;
}

/**
 * Structural subset of the node-redis v5 client used by the reference
 * backend. Keeping this type structural avoids a runtime dependency on the
 * driver while still providing a ready-to-use bridge for applications that
 * already use node-redis.
 */
export interface NodeRedisDurableOperationClient {
  get(
    key: string
  ): DurableOperationRedisMaybePromise<string | Uint8Array | null | undefined>;
  eval(
    script: string,
    options: {
      keys: string[];
      arguments: string[];
    }
  ): DurableOperationRedisMaybePromise<unknown>;
  zRangeByLex(
    key: string,
    min: string,
    max: string,
    options: {
      readonly LIMIT: {
        readonly offset: number;
        readonly count: number;
      };
    }
  ): DurableOperationRedisMaybePromise<readonly string[]>;
}

/**
 * Structural subset of ioredis used by the reference backend.
 * `eval` and `zrangebylex` use the positional command form exposed by
 * ioredis, so the bridge translates the framework-neutral options into that
 * form.
 */
export interface IoredisDurableOperationClient {
  get(
    key: string
  ): DurableOperationRedisMaybePromise<string | Uint8Array | null | undefined>;
  eval(
    script: string,
    numberOfKeys: number,
    ...arguments_: readonly string[]
  ): DurableOperationRedisMaybePromise<unknown>;
  zrangebylex(
    key: string,
    min: string,
    max: string,
    ...arguments_: readonly string[]
  ): DurableOperationRedisMaybePromise<readonly string[]>;
}

export interface RedisDurableOperationBackendOptions {
  readonly client: DurableOperationRedisClient;
  /** Prefix for record keys and the lexicographic index. */
  readonly keyPrefix?: string;
  /** Default page size for direct `listPage()` calls. */
  readonly defaultPageSize?: number;
}

function assertRedisDriverMethod(
  client: object,
  method: string,
  label: string
): void {
  if (typeof (client as Record<string, unknown>)[method] !== 'function') {
    throw new TypeError(`${label} must implement ${method}().`);
  }
}

/**
 * Adapt a node-redis client to the driver-neutral backend surface.
 */
export function createNodeRedisDurableOperationClient(
  client: NodeRedisDurableOperationClient
): DurableOperationRedisClient {
  if (!client || typeof client !== 'object') {
    throw new TypeError('node-redis durable operation client is required.');
  }
  assertRedisDriverMethod(client, 'get', 'node-redis durable operation client');
  assertRedisDriverMethod(client, 'eval', 'node-redis durable operation client');
  assertRedisDriverMethod(client, 'zRangeByLex', 'node-redis durable operation client');
  return {
    get: key => client.get(key),
    eval: <TResult = unknown>(script: string, options: DurableOperationRedisEvalOptions) =>
      client.eval(script, {
        keys: [...options.keys],
        arguments: [...options.arguments],
      }) as DurableOperationRedisMaybePromise<TResult>,
    rangeByLex: (key, min, max, limit) =>
      client.zRangeByLex(key, min, max, {
        LIMIT: { offset: 0, count: limit },
      }),
  };
}

/**
 * Adapt an ioredis client to the driver-neutral backend surface.
 */
export function createIoredisDurableOperationClient(
  client: IoredisDurableOperationClient
): DurableOperationRedisClient {
  if (!client || typeof client !== 'object') {
    throw new TypeError('ioredis durable operation client is required.');
  }
  assertRedisDriverMethod(client, 'get', 'ioredis durable operation client');
  assertRedisDriverMethod(client, 'eval', 'ioredis durable operation client');
  assertRedisDriverMethod(client, 'zrangebylex', 'ioredis durable operation client');
  return {
    get: key => client.get(key),
    eval: <TResult = unknown>(script: string, options: DurableOperationRedisEvalOptions) =>
      client.eval(
        script,
        options.keys.length,
        ...options.keys,
        ...options.arguments
      ) as DurableOperationRedisMaybePromise<TResult>,
    rangeByLex: (key, min, max, limit) =>
      client.zrangebylex(key, min, max, 'LIMIT', '0', String(limit)),
  };
}

/** Atomic record/index update used by the Redis backend. */
export const REDIS_DURABLE_OPERATION_CAS_SCRIPT = `
local current = redis.call('GET', KEYS[1])
local expectedIncarnation = ARGV[1]
local expectedRevision = ARGV[2]
if expectedIncarnation == '' then
  if current then return 0 end
else
  if not current then return 0 end
  local decoded = cjson.decode(current)
  if decoded['incarnation'] ~= expectedIncarnation then return 0 end
  if tonumber(decoded['revision']) ~= tonumber(expectedRevision) then return 0 end
end

local nextRecord = ARGV[3]
local indexMember = ARGV[4]
if nextRecord == '' then
  redis.call('DEL', KEYS[1])
  redis.call('ZREM', KEYS[2], indexMember)
else
  redis.call('SET', KEYS[1], nextRecord)
  redis.call('ZADD', KEYS[2], 0, indexMember)
end
return 1
`.trim();

/** Atomic one-time upgrade for records written before incarnation fencing. */
export const REDIS_DURABLE_OPERATION_LEGACY_BACKFILL_SCRIPT = `
local current = redis.call('GET', KEYS[1])
if not current then return 0 end
local decoded = cjson.decode(current)
if decoded['incarnation'] ~= nil then return 0 end
if tonumber(decoded['revision']) ~= tonumber(ARGV[1]) then return 0 end
decoded['incarnation'] = ARGV[2]
redis.call('SET', KEYS[1], cjson.encode(decoded))
return 1
`.trim();

const DEFAULT_KEY_PREFIX = 'context-action:durable-operation:';
const DEFAULT_PAGE_SIZE = 500;

function assertText(value: string, label: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }
}

function assertPageSize(value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError('Redis durable operation page size must be a positive integer.');
  }
}

function encodeKey(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let encoded = '';
  for (const byte of bytes) encoded += byte.toString(16).padStart(2, '0');
  return encoded;
}

function decodeValue(value: string | Uint8Array): string {
  return typeof value === 'string' ? value : new TextDecoder().decode(value);
}

function recordKey(prefix: string, encodedKey: string): string {
  return `${prefix}record:${encodedKey}`;
}

function parseRecord<TResult>(value: string | Uint8Array): DurableOperationRecord<TResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeValue(value));
  } catch (error) {
    throw new Error(
      `Redis durable operation record is not valid JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new TypeError('Redis durable operation record must be an object.');
  }
  return parsed as DurableOperationRecord<TResult>;
}

function normalizeReadValue(
  value: string | Uint8Array | null | undefined
): string | Uint8Array | undefined {
  return value === null || value === undefined ? undefined : value;
}

/**
 * Create a Redis-backed durable operation backend.
 *
 * Records are stored as JSON strings and indexed in a sorted set. The CAS Lua
 * script updates both keys atomically, while `listPage()` uses a keyset-style
 * lex cursor that remains valid when earlier records are deleted by pruning.
 */
export function createRedisDurableOperationBackend<TResult = unknown>(
  options: RedisDurableOperationBackendOptions
): DurableOperationBackend<TResult> {
  if (!options?.client) {
    throw new TypeError('Redis durable operation backend requires a client.');
  }
  const prefix = options.keyPrefix ?? DEFAULT_KEY_PREFIX;
  assertText(prefix, 'Redis durable operation keyPrefix');
  const defaultPageSize = options.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  assertPageSize(defaultPageSize);
  const { client } = options;
  const indexKey = `${prefix}index`;

  const read = async (
    key: string
  ): Promise<DurableOperationRecord<TResult> | undefined> => {
    assertText(key, 'Durable operation key');
    const encodedKey = encodeKey(key);
    const value = normalizeReadValue(await client.get(recordKey(prefix, encodedKey)));
    return value === undefined ? undefined : parseRecord<TResult>(value);
  };

  const compareAndSet = async (
    key: string,
    expectedFence: DurableOperationFence | undefined,
    next: DurableOperationRecord<TResult> | undefined
  ): Promise<boolean> => {
    assertText(key, 'Durable operation key');
    if (next !== undefined && next.key !== key) {
      throw new TypeError('Durable operation record key must match the CAS key.');
    }
    const encodedKey = encodeKey(key);
    const result = await client.eval<number | string>(REDIS_DURABLE_OPERATION_CAS_SCRIPT, {
      keys: [recordKey(prefix, encodedKey), indexKey],
      arguments: [
        expectedFence?.incarnation ?? '',
        expectedFence === undefined ? '' : String(expectedFence.revision),
        next === undefined ? '' : JSON.stringify(next),
        encodedKey,
      ],
    });
    return result === 1 || result === '1';
  };

  const backfillLegacyIncarnation = async (
    key: string,
    expectedRevision: number,
    incarnation: string
  ): Promise<boolean> => {
    assertText(key, 'Durable operation key');
    assertText(incarnation, 'Durable operation incarnation');
    if (!Number.isInteger(expectedRevision) || expectedRevision < 1) {
      throw new TypeError('Durable operation expected revision must be a positive integer.');
    }
    const encodedKey = encodeKey(key);
    const result = await client.eval<number | string>(
      REDIS_DURABLE_OPERATION_LEGACY_BACKFILL_SCRIPT,
      {
        keys: [recordKey(prefix, encodedKey)],
        arguments: [String(expectedRevision), incarnation],
      }
    );
    return result === 1 || result === '1';
  };

  const listPage = async (
    pageOptions: DurableOperationListOptions = {}
  ): Promise<DurableOperationListPage<TResult>> => {
    const limit = pageOptions.limit ?? defaultPageSize;
    assertPageSize(limit);
    if (pageOptions.cursor !== undefined) assertText(pageOptions.cursor, 'Redis durable operation cursor');
    const min = pageOptions.cursor === undefined ? '-' : `(${pageOptions.cursor}`;
    const members = await client.rangeByLex(indexKey, min, '+', limit + 1);
    const pageMembers = members.slice(0, limit);
    const values = await Promise.all(
      pageMembers.map(member => client.get(recordKey(prefix, member)))
    );
    const records = values.flatMap(value => {
      const normalized = normalizeReadValue(value);
      return normalized === undefined ? [] : [parseRecord<TResult>(normalized)];
    });
    const lastMember = pageMembers[pageMembers.length - 1];
    return {
      records,
      ...(members.length > limit && lastMember !== undefined
        ? { nextCursor: lastMember }
        : {}),
    };
  };

  return { read, compareAndSet, backfillLegacyIncarnation, listPage };
}
