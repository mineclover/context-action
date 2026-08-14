import type {
  DurableOperationBackend,
  DurableOperationFence,
  DurableOperationRecord,
} from './durable-operation.js';

/** Minimal host contract required from an IndexedDB factory. */
export interface IndexedDbFactory {
  open(name: string, version?: number): unknown;
}

export interface IndexedDbDurableOperationBackendOptions {
  /** IndexedDB database name. Defaults to `context-action-operations`. */
  readonly databaseName?: string;
  /** Object store name. Defaults to `durable-operations`. */
  readonly storeName?: string;
  /** Schema version used when creating the object store. Defaults to 1. */
  readonly version?: number;
  /** Injectable factory for browser tests or a host-owned IndexedDB instance. */
  readonly indexedDB?: IndexedDbFactory;
}

const DEFAULT_DATABASE_NAME = 'context-action-operations';
const DEFAULT_STORE_NAME = 'durable-operations';
const DEFAULT_VERSION = 1;

function assertName(value: string, label: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }
}

function assertVersion(value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError('IndexedDB version must be a positive integer.');
  }
}

function toError(value: unknown, fallback: string): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'object' && value !== null && 'message' in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return new Error(message);
  }
  return new Error(fallback);
}

function resolveIndexedDb(factory?: IndexedDbFactory): IDBFactory {
  const resolved = factory ?? (
    typeof globalThis === 'undefined'
      ? undefined
      : (globalThis as typeof globalThis & { indexedDB?: IndexedDbFactory }).indexedDB
  );
  if (!resolved) {
    throw new Error('IndexedDB is not available in this runtime.');
  }
  return resolved as IDBFactory;
}

function openDatabase(
  factory: IDBFactory,
  databaseName: string,
  storeName: string,
  version: number
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = factory.open(databaseName, version);
    } catch (error) {
      reject(toError(error, 'IndexedDB open failed.'));
      return;
    }
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(toError(request.error, 'IndexedDB open failed.'));
    request.onblocked = () => reject(new Error('IndexedDB upgrade is blocked by another connection.'));
  });
}

type TransactionBody<TResult> = (
  store: IDBObjectStore,
  setResult: (value: TResult) => void,
  fail: (error: unknown) => void
) => void;

function runTransaction<TResult>(
  databasePromise: Promise<IDBDatabase>,
  storeName: string,
  mode: IDBTransactionMode,
  body: TransactionBody<TResult>
): Promise<TResult> {
  return databasePromise.then(database => new Promise<TResult>((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = database.transaction(storeName, mode);
    } catch (error) {
      reject(toError(error, 'IndexedDB transaction failed.'));
      return;
    }

    let result!: TResult;
    let failed = false;
    const fail = (error: unknown): void => {
      if (failed) return;
      failed = true;
      reject(toError(error, 'IndexedDB request failed.'));
      try {
        transaction.abort();
      } catch {
        // The transaction may already be completing.
      }
    };
    transaction.oncomplete = () => {
      if (!failed) resolve(result);
    };
    transaction.onerror = () => fail(transaction.error);
    transaction.onabort = () => fail(transaction.error ?? new Error('IndexedDB transaction aborted.'));

    try {
      body(transaction.objectStore(storeName), value => {
        result = value;
      }, fail);
    } catch (error) {
      fail(error);
    }
  }));
}

/**
 * Create an IndexedDB backend for `createDurableOperationStore()`.
 *
 * Each claim/update is a single IndexedDB transaction. Cross-tab atomicity is
 * provided by the object store's revision-checked compare-and-set operation;
 * this backend does not share in-memory state or Promises between tabs.
 */
export function createIndexedDbDurableOperationBackend<TResult = unknown>(
  options: IndexedDbDurableOperationBackendOptions = {}
): DurableOperationBackend<TResult> & { close: () => Promise<void> } {
  const databaseName = options.databaseName ?? DEFAULT_DATABASE_NAME;
  const storeName = options.storeName ?? DEFAULT_STORE_NAME;
  const version = options.version ?? DEFAULT_VERSION;
  assertName(databaseName, 'IndexedDB databaseName');
  assertName(storeName, 'IndexedDB storeName');
  assertVersion(version);
  const factory = resolveIndexedDb(options.indexedDB);
  let databasePromise: Promise<IDBDatabase> | undefined;

  const getDatabase = (): Promise<IDBDatabase> => {
    databasePromise ??= openDatabase(factory, databaseName, storeName, version);
    return databasePromise;
  };

  const read = (key: string): Promise<DurableOperationRecord<TResult> | undefined> => {
    assertName(key, 'Durable operation key');
    return runTransaction(getDatabase(), storeName, 'readonly', (store, setResult, fail) => {
      const request = store.get(key);
      request.onsuccess = () => setResult(request.result as DurableOperationRecord<TResult> | undefined);
      request.onerror = () => fail(request.error);
    });
  };

  const list = (): Promise<readonly DurableOperationRecord<TResult>[]> =>
    runTransaction(getDatabase(), storeName, 'readonly', (store, setResult, fail) => {
      const request = store.getAll();
      request.onsuccess = () => setResult(request.result as DurableOperationRecord<TResult>[]);
      request.onerror = () => fail(request.error);
    });

  const compareAndSet = (
    key: string,
    expectedFence: DurableOperationFence | undefined,
    next: DurableOperationRecord<TResult> | undefined
  ): Promise<boolean> => {
    assertName(key, 'Durable operation key');
    if (next !== undefined && next.key !== key) {
      throw new TypeError('Durable operation record key must match the compareAndSet key.');
    }
    return runTransaction(getDatabase(), storeName, 'readwrite', (store, setResult, fail) => {
      const readRequest = store.get(key);
      readRequest.onsuccess = () => {
        const current = readRequest.result as DurableOperationRecord<TResult> | undefined;
        const matches = expectedFence === undefined
          ? current === undefined
          : current?.incarnation === expectedFence.incarnation &&
            current.revision === expectedFence.revision;
        if (!matches) {
          setResult(false);
          return;
        }
        const writeRequest = next === undefined ? store.delete(key) : store.put(next);
        writeRequest.onsuccess = () => setResult(true);
        writeRequest.onerror = () => fail(writeRequest.error);
      };
      readRequest.onerror = () => fail(readRequest.error);
    });
  };

  const backfillLegacyIncarnation = (
    key: string,
    expectedRevision: number,
    incarnation: string
  ): Promise<boolean> => {
    assertName(key, 'Durable operation key');
    assertName(incarnation, 'Durable operation incarnation');
    if (!Number.isInteger(expectedRevision) || expectedRevision < 1) {
      throw new TypeError('Durable operation expected revision must be a positive integer.');
    }
    return runTransaction(getDatabase(), storeName, 'readwrite', (store, setResult, fail) => {
      const readRequest = store.get(key);
      readRequest.onsuccess = () => {
        const current = readRequest.result as (
          DurableOperationRecord<TResult> & { incarnation?: string }
        ) | undefined;
        if (current === undefined || current.revision !== expectedRevision ||
            Object.getOwnPropertyDescriptor(current, 'incarnation') !== undefined) {
          setResult(false);
          return;
        }
        const writeRequest = store.put({ ...current, incarnation });
        writeRequest.onsuccess = () => setResult(true);
        writeRequest.onerror = () => fail(writeRequest.error);
      };
      readRequest.onerror = () => fail(readRequest.error);
    });
  };

  return {
    read,
    list,
    compareAndSet,
    backfillLegacyIncarnation,
    close: async () => {
      const database = databasePromise ? await databasePromise : undefined;
      database?.close();
      databasePromise = undefined;
    },
  };
}
