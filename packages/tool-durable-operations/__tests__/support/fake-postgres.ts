import type {
  PostgresDurableOperationClient,
  PostgresDurableOperationQueryResult,
} from '../../src/postgres-operation-backend';

type StoredRow = {
  key: string;
  fingerprint: string;
  ownerId: string;
  incarnation?: string;
  revision: number;
  state: string;
  result: unknown | null;
  resultPresent: boolean;
  reason: string | null;
  createdAt: number;
  updatedAt: number;
  leaseExpiresAt: number | null;
  reconciledBy: string | null;
  reconciledAt: number | null;
};

export interface FakePostgresClient extends PostgresDurableOperationClient {
  readonly rows: Map<string, StoredRow>;
  readonly queries: readonly { text: string; values: readonly unknown[] }[];
}

function toRow(values: readonly unknown[]): StoredRow {
  const [key, fingerprint, ownerId, incarnation, revision, state, result, resultPresent, reason,
    createdAt, updatedAt, leaseExpiresAt, reconciledBy, reconciledAt] = values;
  return {
    key: String(key),
    fingerprint: String(fingerprint),
    ownerId: String(ownerId),
    incarnation: String(incarnation),
    revision: Number(revision),
    state: String(state),
    result: result === null || result === undefined ? null : JSON.parse(String(result)),
    resultPresent: resultPresent === true,
    reason: reason === null || reason === undefined ? null : String(reason),
    createdAt: Number(createdAt),
    updatedAt: Number(updatedAt),
    leaseExpiresAt: leaseExpiresAt === null || leaseExpiresAt === undefined ? null : Number(leaseExpiresAt),
    reconciledBy: reconciledBy === null || reconciledBy === undefined ? null : String(reconciledBy),
    reconciledAt: reconciledAt === null || reconciledAt === undefined ? null : Number(reconciledAt),
  };
}

function cloneRow(row: StoredRow): StoredRow {
  return { ...row };
}

export function createFakePostgresClient(): FakePostgresClient {
  const rows = new Map<string, StoredRow>();
  const queryLog: { text: string; values: readonly unknown[] }[] = [];
  const client: FakePostgresClient = {
    rows,
    queries: queryLog,
    async query<TRow = Record<string, unknown>>(
      text: string,
      values: readonly unknown[] = []
    ): Promise<PostgresDurableOperationQueryResult<TRow>> {
      queryLog.push({ text, values: [...values] });
      if (text.startsWith('SELECT') && text.includes('ORDER BY operation_key')) {
        const hasCursor = text.includes('WHERE operation_key > $1');
        const cursor = hasCursor ? String(values[0]) : undefined;
        const limit = Number(values[hasCursor ? 1 : 0]);
        const selected = [...rows.values()]
          .sort((left, right) => left.key.localeCompare(right.key))
          .filter(row => cursor === undefined || row.key > cursor)
          .slice(0, limit)
          .map(cloneRow);
        return { rows: selected as TRow[], rowCount: selected.length };
      }
      if (text.startsWith('SELECT')) {
        const row = rows.get(String(values[0]));
        return { rows: row === undefined ? [] : [cloneRow(row) as TRow], rowCount: row === undefined ? 0 : 1 };
      }
      if (text.startsWith('INSERT')) {
        const key = String(values[0]);
        if (rows.has(key)) return { rows: [], rowCount: 0 };
        rows.set(key, toRow(values));
        return { rows: [{ operation_key: key } as TRow], rowCount: 1 };
      }
      if (text.startsWith('UPDATE')) {
        if (text.includes('incarnation IS NULL')) {
          const key = String(values[0]);
          const expectedRevision = Number(values[1]);
          const incarnation = String(values[2]);
          const current = rows.get(key);
          if (current === undefined || current.revision !== expectedRevision ||
              Object.prototype.hasOwnProperty.call(current, 'incarnation')) {
            return { rows: [], rowCount: 0 };
          }
          rows.set(key, { ...current, incarnation });
          return { rows: [{ operation_key: key } as TRow], rowCount: 1 };
        }
        const key = String(values[0]);
        const expectedIncarnation = String(values[14]);
        const expectedRevision = Number(values[15]);
        const current = rows.get(key);
        if (current === undefined || current.incarnation !== expectedIncarnation ||
            current.revision !== expectedRevision) {
          return { rows: [], rowCount: 0 };
        }
        rows.set(key, toRow(values.slice(0, 14)));
        return { rows: [{ operation_key: key } as TRow], rowCount: 1 };
      }
      if (text.startsWith('DELETE')) {
        const key = String(values[0]);
        const expectedIncarnation = String(values[1]);
        const expectedRevision = Number(values[2]);
        const current = rows.get(key);
        if (current === undefined || current.incarnation !== expectedIncarnation ||
            current.revision !== expectedRevision) {
          return { rows: [], rowCount: 0 };
        }
        rows.delete(key);
        return { rows: [{ operation_key: key } as TRow], rowCount: 1 };
      }
      throw new Error(`Unsupported fake PostgreSQL query: ${text}`);
    },
  };
  return client;
}
