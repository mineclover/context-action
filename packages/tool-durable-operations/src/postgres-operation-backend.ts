import type {
  DurableOperationBackend,
  DurableOperationFence,
  DurableOperationListOptions,
  DurableOperationListPage,
  DurableOperationRecord,
} from './durable-operation.js';

export type PostgresDurableOperationMaybePromise<T> = T | Promise<T>;

/**
 * The small structural surface required from `pg` or a pool wrapper.
 *
 * The package intentionally does not depend on `pg`. Applications choose the
 * pool/client lifecycle, credentials, and transaction instrumentation and
 * inject only this query boundary.
 */
export interface PostgresDurableOperationClient {
  query<TRow = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[]
  ): PostgresDurableOperationMaybePromise<PostgresDurableOperationQueryResult<TRow>>;
}

export interface PostgresDurableOperationQueryResult<TRow = Record<string, unknown>> {
  readonly rows: readonly TRow[];
  readonly rowCount?: number | null;
}

export interface PostgresDurableOperationBackendOptions {
  readonly client: PostgresDurableOperationClient;
  /** PostgreSQL table name, optionally qualified as `schema.table`. */
  readonly tableName?: string;
  /** Default page size for direct `listPage()` calls. */
  readonly defaultPageSize?: number;
}

/**
 * PostgreSQL migration for the reference backend.
 *
 * `operation_key` is the keyset cursor and primary key. The state machine
 * remains in `createDurableOperationStore()`; this schema only stores records
 * and lets one conditional INSERT/UPDATE/DELETE act as the CAS boundary.
 */
const POSTGRES_SCHEMA_TEMPLATE = (table: string, indexName: string): string => `
CREATE TABLE IF NOT EXISTS ${table} (
  operation_key text PRIMARY KEY,
  fingerprint text NOT NULL,
  owner_id text NOT NULL,
  incarnation text NOT NULL,
  revision integer NOT NULL,
  state text NOT NULL CHECK (state IN ('pending', 'completed', 'failed', 'unknown')),
  result jsonb,
  result_present boolean NOT NULL DEFAULT false,
  reason text,
  created_at bigint NOT NULL,
  updated_at bigint NOT NULL,
  lease_expires_at bigint,
  reconciled_by text,
  reconciled_at bigint
);
ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS incarnation text;
UPDATE ${table}
   SET incarnation = 'legacy:' || md5(operation_key || ':' || revision::text || ':' || updated_at::text)
 WHERE incarnation IS NULL;
ALTER TABLE ${table} ALTER COLUMN incarnation SET NOT NULL;
CREATE INDEX IF NOT EXISTS ${indexName}
  ON ${table} (updated_at);
`.trim();

const DEFAULT_TABLE_NAME = 'context_action_durable_operations';
const DEFAULT_PAGE_SIZE = 500;

/**
 * Create the application-owned migration for a specific safe table name.
 * The default constant below is convenient for a single shared table; hosts
 * that need an isolated verification table can generate one explicitly.
 */
export function createPostgresDurableOperationSchemaSql(
  tableName = DEFAULT_TABLE_NAME
): string {
  const table = quoteTableName(tableName);
  const indexBase = tableName.split('.').join('_');
  return POSTGRES_SCHEMA_TEMPLATE(table, quoteTableName(`${indexBase}_updated_at_idx`));
}

export const POSTGRES_DURABLE_OPERATION_SCHEMA_SQL =
  createPostgresDurableOperationSchemaSql();

type PostgresDurableOperationRow = {
  readonly key: string;
  readonly fingerprint: string;
  readonly ownerId: string;
  readonly incarnation?: string | null;
  readonly revision: number | string;
  readonly state: DurableOperationRecord['state'];
  readonly result?: unknown | null;
  readonly resultPresent?: boolean | null;
  readonly reason?: string | null;
  readonly createdAt: number | string;
  readonly updatedAt: number | string;
  readonly leaseExpiresAt?: number | string | null;
  readonly reconciledBy?: string | null;
  readonly reconciledAt?: number | string | null;
};

function assertClient(client: PostgresDurableOperationClient): void {
  if (!client || typeof client !== 'object' || typeof client.query !== 'function') {
    throw new TypeError('PostgreSQL durable operation backend requires a query client.');
  }
}

function assertPageSize(value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError('PostgreSQL durable operation page size must be a positive integer.');
  }
}

function assertText(value: string, label: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }
}

function quoteTableName(value: string): string {
  assertText(value, 'PostgreSQL durable operation tableName');
  const parts = value.split('.');
  if (parts.length > 2 || parts.some(part => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(part))) {
    throw new TypeError(
      'PostgreSQL durable operation tableName must be an identifier or schema.identifier.'
    );
  }
  return parts.map(part => `"${part}"`).join('.');
}

function numberValue(value: number | string | null | undefined, label: string): number | undefined {
  if (value === null || value === undefined) return undefined;
  const normalized = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(normalized)) {
    throw new TypeError(`PostgreSQL durable operation ${label} must be finite.`);
  }
  return normalized;
}

function toRecord<TResult>(row: PostgresDurableOperationRow): DurableOperationRecord<TResult> {
  assertText(row.key, 'PostgreSQL durable operation key');
  assertText(row.fingerprint, 'PostgreSQL durable operation fingerprint');
  assertText(row.ownerId, 'PostgreSQL durable operation ownerId');
  const revision = numberValue(row.revision, 'revision');
  const createdAt = numberValue(row.createdAt, 'createdAt');
  const updatedAt = numberValue(row.updatedAt, 'updatedAt');
  if (revision === undefined || createdAt === undefined || updatedAt === undefined) {
    throw new TypeError('PostgreSQL durable operation row is missing required numeric fields.');
  }
  const resultPresent = row.resultPresent === true ||
    (row.resultPresent === undefined && row.result !== null && row.result !== undefined);
  const result = resultPresent ? row.result : undefined;
  const leaseExpiresAt = numberValue(row.leaseExpiresAt, 'leaseExpiresAt');
  const reconciledAt = numberValue(row.reconciledAt, 'reconciledAt');
  return {
    key: row.key,
    fingerprint: row.fingerprint,
    ownerId: row.ownerId,
    ...(row.incarnation === null || row.incarnation === undefined
      ? {}
      : { incarnation: row.incarnation }),
    revision,
    state: row.state,
    ...(result === undefined ? {} : { result: result as TResult }),
    ...(row.reason === null || row.reason === undefined ? {} : { reason: row.reason }),
    createdAt,
    updatedAt,
    ...(leaseExpiresAt === undefined ? {} : { leaseExpiresAt }),
    ...(row.reconciledBy === null || row.reconciledBy === undefined
      ? {}
      : { reconciledBy: row.reconciledBy }),
    ...(reconciledAt === undefined ? {} : { reconciledAt }),
  } as DurableOperationRecord<TResult>;
}

function serializeJson(value: unknown): string | null {
  if (value === undefined) return null;
  try {
    return JSON.stringify(value) ?? null;
  } catch (error) {
    throw new TypeError(
      `PostgreSQL durable operation result is not serializable: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function recordValues<TResult>(record: DurableOperationRecord<TResult>): readonly unknown[] {
  return [
    record.key,
    record.fingerprint,
    record.ownerId,
    record.incarnation,
    record.revision,
    record.state,
    serializeJson(record.result),
    record.result !== undefined,
    record.reason ?? null,
    record.createdAt,
    record.updatedAt,
    record.leaseExpiresAt ?? null,
    record.reconciledBy ?? null,
    record.reconciledAt ?? null,
  ];
}

const SELECT_COLUMNS = `
  operation_key AS "key",
  fingerprint,
  owner_id AS "ownerId",
  incarnation,
  revision,
  state,
  result,
  result_present AS "resultPresent",
  reason,
  created_at AS "createdAt",
  updated_at AS "updatedAt",
  lease_expires_at AS "leaseExpiresAt",
  reconciled_by AS "reconciledBy",
  reconciled_at AS "reconciledAt"`;

/**
 * Create a PostgreSQL-backed durable operation backend.
 *
 * Each CAS is a single conditional statement. PostgreSQL row/unique-key
 * locking makes insert-vs-insert and revision-checked updates atomic across
 * processes; the generic durable store retries only when the conditional
 * statement loses a race. No process-local Promise is shared here.
 */
export function createPostgresDurableOperationBackend<TResult = unknown>(
  options: PostgresDurableOperationBackendOptions
): DurableOperationBackend<TResult> {
  if (!options) throw new TypeError('PostgreSQL durable operation backend options are required.');
  assertClient(options.client);
  const table = quoteTableName(options.tableName ?? DEFAULT_TABLE_NAME);
  const defaultPageSize = options.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  assertPageSize(defaultPageSize);
  const { client } = options;

  const read = async (key: string): Promise<DurableOperationRecord<TResult> | undefined> => {
    assertText(key, 'Durable operation key');
    const result = await client.query<PostgresDurableOperationRow>(
      `SELECT ${SELECT_COLUMNS} FROM ${table} WHERE operation_key = $1`,
      [key]
    );
    const row = result.rows[0];
    return row === undefined ? undefined : toRecord<TResult>(row);
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
    if (next === undefined) {
      if (expectedFence === undefined) return false;
      const deleted = await client.query(
        `DELETE FROM ${table}
          WHERE operation_key = $1 AND incarnation = $2 AND revision = $3
          RETURNING operation_key`,
        [key, expectedFence.incarnation, expectedFence.revision]
      );
      return deleted.rows.length > 0 || deleted.rowCount === 1;
    }

    const values = recordValues(next);
    if (expectedFence === undefined) {
      const inserted = await client.query(
        `INSERT INTO ${table} (
          operation_key, fingerprint, owner_id, incarnation, revision, state, result,
          result_present, reason, created_at, updated_at, lease_expires_at,
          reconciled_by, reconciled_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (operation_key) DO NOTHING
        RETURNING operation_key`,
        values
      );
      return inserted.rows.length > 0 || inserted.rowCount === 1;
    }

    const updated = await client.query(
      `UPDATE ${table}
       SET fingerprint = $2,
           owner_id = $3,
           incarnation = $4,
           revision = $5,
           state = $6,
           result = $7::jsonb,
           result_present = $8,
           reason = $9,
           created_at = $10,
           updated_at = $11,
           lease_expires_at = $12,
           reconciled_by = $13,
           reconciled_at = $14
       WHERE operation_key = $1 AND incarnation = $15 AND revision = $16
       RETURNING operation_key`,
      [...values, expectedFence.incarnation, expectedFence.revision]
    );
    return updated.rows.length > 0 || updated.rowCount === 1;
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
    const updated = await client.query(
      `UPDATE ${table}
          SET incarnation = $3
        WHERE operation_key = $1 AND revision = $2 AND incarnation IS NULL
        RETURNING operation_key`,
      [key, expectedRevision, incarnation]
    );
    return updated.rows.length > 0 || updated.rowCount === 1;
  };

  const listPage = async (
    pageOptions: DurableOperationListOptions = {}
  ): Promise<DurableOperationListPage<TResult>> => {
    const limit = pageOptions.limit ?? defaultPageSize;
    assertPageSize(limit);
    if (pageOptions.cursor !== undefined) assertText(pageOptions.cursor, 'Durable operation cursor');
    const hasCursor = pageOptions.cursor !== undefined;
    const result = await client.query<PostgresDurableOperationRow>(
      `SELECT ${SELECT_COLUMNS} FROM ${table}
       ${hasCursor ? 'WHERE operation_key > $1' : ''}
       ORDER BY operation_key ASC
       LIMIT ${hasCursor ? '$2' : '$1'}`,
      hasCursor ? [pageOptions.cursor, limit + 1] : [limit + 1]
    );
    const rows = result.rows;
    const pageRows = rows.slice(0, limit);
    const lastRow = pageRows[pageRows.length - 1];
    return {
      records: pageRows.map(row => toRecord<TResult>(row)),
      ...(rows.length > limit && lastRow !== undefined ? { nextCursor: lastRow.key } : {}),
    };
  };

  return { read, compareAndSet, backfillLegacyIncarnation, listPage };
}
