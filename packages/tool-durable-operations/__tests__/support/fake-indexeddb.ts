type RequestListener = (() => void) | null;

function clone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
}

class FakeRequest<T> {
  result!: T;
  error: Error | null = null;
  onsuccess: RequestListener = null;
  onerror: RequestListener = null;

  constructor(
    private readonly execute: () => T,
    private readonly transaction?: FakeTransaction
  ) {
    const run = (): void => {
      try {
        this.result = this.execute();
        this.onsuccess?.();
      } catch (error) {
        this.error = error instanceof Error ? error : new Error(String(error));
        this.onerror?.();
      } finally {
        this.transaction?.requestDone();
      }
    };
    if (transaction) transaction.schedule(run);
    else queueMicrotask(run);
  }
}

class FakeTransaction {
  oncomplete: RequestListener = null;
  onerror: RequestListener = null;
  onabort: RequestListener = null;
  error: Error | null = null;
  private pending = 0;
  private aborted = false;

  constructor(
    private readonly database: FakeDatabase,
    private readonly storeName: string,
    private readonly ready: Promise<void>,
    private readonly release: () => void
  ) {}

  schedule(run: () => void): void {
    void this.ready.then(() => queueMicrotask(run));
  }

  objectStore(name: string): FakeObjectStore {
    if (name !== this.storeName) throw new Error(`Unknown object store: ${name}`);
    return new FakeObjectStore(this.database.getData(name), this);
  }

  requestStarted(): void {
    this.pending += 1;
  }

  requestDone(): void {
    this.pending -= 1;
    if (this.pending !== 0 || this.aborted) return;
    queueMicrotask(() => {
      if (this.pending === 0 && !this.aborted) {
        this.oncomplete?.();
        this.release();
      }
    });
  }

  abort(): void {
    if (this.aborted) return;
    this.aborted = true;
    this.onabort?.();
    this.release();
  }
}

class FakeObjectStore {
  constructor(
    private readonly records: Map<string, unknown>,
    private readonly transaction: FakeTransaction
  ) {}

  get(key: string): FakeRequest<unknown> {
    this.transaction.requestStarted();
    return new FakeRequest(() => clone(this.records.get(key)), this.transaction);
  }

  getAll(): FakeRequest<unknown[]> {
    this.transaction.requestStarted();
    return new FakeRequest(() => [...this.records.values()].map(value => clone(value)), this.transaction);
  }

  put(value: { key: string }): FakeRequest<undefined> {
    this.transaction.requestStarted();
    return new FakeRequest(() => {
      this.records.set(value.key, clone(value));
      return undefined;
    }, this.transaction);
  }

  delete(key: string): FakeRequest<undefined> {
    this.transaction.requestStarted();
    return new FakeRequest(() => {
      this.records.delete(key);
      return undefined;
    }, this.transaction);
  }
}

class FakeDatabase {
  readonly objectStoreNames = {
    contains: (name: string) => this.stores.has(name),
  };
  private readonly stores = new Map<string, Map<string, unknown>>();
  private writeTail: Promise<void> = Promise.resolve();

  createObjectStore(name: string): void {
    this.stores.set(name, new Map());
  }

  getData(name: string): Map<string, unknown> {
    const data = this.stores.get(name);
    if (!data) throw new Error(`Unknown object store: ${name}`);
    return data;
  }

  transaction(name: string, mode: IDBTransactionMode = 'readonly'): FakeTransaction {
    if (mode !== 'readwrite') {
      return new FakeTransaction(this, name, Promise.resolve(), () => {});
    }
    let release!: () => void;
    const ready = this.writeTail;
    const completion = new Promise<void>(resolve => {
      release = resolve;
    });
    this.writeTail = ready.then(() => completion);
    return new FakeTransaction(this, name, ready, release);
  }

  close(): void {}
}

export function createFakeIndexedDbFactory(): IDBFactory {
  const databases = new Map<string, { version: number; database: FakeDatabase }>();

  const factory = {
    open(name: string, requestedVersion?: number): FakeRequest<FakeDatabase> {
      const current = databases.get(name);
      const version = requestedVersion ?? current?.version ?? 1;
      const request = new FakeRequest(() => {
        let entry = databases.get(name);
        if (!entry) {
          entry = { version: 0, database: new FakeDatabase() };
          databases.set(name, entry);
        }
        if (version < entry.version) throw new Error('VersionError');
        request.result = entry.database;
        if (version > entry.version) {
          entry.version = version;
          request.onupgradeneeded?.();
        }
        return entry.database;
      }) as FakeRequest<FakeDatabase> & { onupgradeneeded?: RequestListener };
      return request;
    },
  };

  return factory as unknown as IDBFactory;
}
