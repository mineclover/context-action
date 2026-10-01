/**
 * Framework-neutral state contracts and a deliberately small reference store.
 *
 * This package owns no immutable-update, draft, clone, React, or DOM runtime.
 * A backend owns its value semantics; consumers must only rely on the
 * snapshot/subscription and capability contracts below.
 */

export type StateMutationOrigin = 'user' | 'system' | 'network' | 'undo' | 'redo' | 'reset';

/** Metadata is extensible so adapters can preserve their own correlation data. */
export interface StateMutationMeta {
  readonly transactionId?: string;
  readonly actionId?: string;
  readonly origin?: StateMutationOrigin;
  readonly label?: string;
  readonly [key: string]: unknown;
}

/** Patch paths intentionally accept non-string keys such as Map keys and Symbols. */
export interface StatePatch {
  readonly op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  readonly path: readonly unknown[];
  readonly from?: readonly unknown[];
  readonly value?: unknown;
}

export type HistoryEntryId = string | number;

export interface ReadonlyStateSnapshot<T> {
  readonly value: T;
  readonly name: string;
  /** Monotonically increases when the backend publishes a new snapshot. */
  readonly version: number;
  readonly lastUpdate: number;
}

export interface StateReader<T> {
  readonly name: string;
  getSnapshot(): ReadonlyStateSnapshot<T>;
  subscribe(listener: () => void): () => void;
}

export interface StateWriter<T> {
  /** The backend owns mutation safety; values are passed through unchanged. */
  setValue(value: T, meta?: StateMutationMeta): void;
  /** Returning undefined is a no-op. In-place mutation is backend-specific. */
  update(updater: (current: T) => T | undefined, meta?: StateMutationMeta): void;
}

export interface StateBackend<T, Patch = StatePatch> extends StateReader<T>, StateWriter<T> {
  readonly capabilities?: {
    readonly patches?: boolean;
    readonly timeline?: boolean;
    readonly immutableSnapshots?: boolean;
  };
  getLastPatches?(): readonly Patch[] | null;
  /** Optional defensive read. Its absence means reads are backend-owned references. */
  getSafeValue?(): T;
  /** Optional lifecycle hook. Backends are shared by default. */
  dispose?(): void;
  isDisposed?(): boolean;
  subscribeWithPatches?(listener: (patches: readonly Patch[] | null) => void): () => void;
}

export interface TimelineBackend<T, Patch = StatePatch> extends StateBackend<T, Patch> {
  getHistoryEntryId(): HistoryEntryId;
  hasHistoryEntry(entryId: HistoryEntryId): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  getPosition(): number;
  getHistory(): readonly T[];
  getHistoryLength(): number;
  undo(steps?: number, meta?: StateMutationMeta): void;
  redo(steps?: number, meta?: StateMutationMeta): void;
  goTo(position: number, meta?: StateMutationMeta): void;
  goToHistoryEntry(entryId: HistoryEntryId, meta?: StateMutationMeta): void;
  reset(meta?: StateMutationMeta): void;
}

export interface TransactionBackend<T, Patch = StatePatch> extends TimelineBackend<T, Patch> {
  beginBatch(meta?: StateMutationMeta, options?: { readonly deferNotification?: boolean }): void;
  endBatch(): void;
  cancelBatch(): void;
  resumeNotifications(): void;
  flushNotifications(): void;
  isStoreDisposed(): boolean;
}

export interface StateTransition<T> {
  readonly previous: T;
  readonly next: T;
  readonly meta: StateMutationMeta;
  readonly position?: number;
}

export interface StateStoreOptions {
  readonly now?: () => number;
}

/**
 * A trusted-reference backend for applications that already own immutability.
 * No clone, freeze, draft, or patch generation is performed.
 */
export function createStateStore<T>(
  name: string,
  initialValue: T,
  options: StateStoreOptions = {},
): StateBackend<T> {
  const now = options.now ?? Date.now;
  let value = initialValue;
  let version = 0;
  let disposed = false;
  let snapshot: ReadonlyStateSnapshot<T> = { value, name, version, lastUpdate: now() };
  const listeners = new Set<() => void>();

  const notify = (): void => {
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch {
        // A subscriber cannot prevent other subscribers from observing a commit.
      }
    }
  };

  const publish = (next: T): void => {
    if (disposed || Object.is(value, next)) return;
    // Resolve the timestamp before mutating the backend.  A caller-provided
    // clock is part of the store boundary and may throw (for example, when a
    // deterministic test clock is exhausted); a failed timestamp must not
    // leave the value and snapshot out of sync.
    const updatedAt = now();
    value = next;
    version += 1;
    snapshot = { value, name, version, lastUpdate: updatedAt };
    notify();
  };

  const backend: StateBackend<T> = {
    name,
    capabilities: { patches: false, timeline: false, immutableSnapshots: false },
    getSnapshot: () => snapshot,
    subscribe(listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('Store subscriber must be a function.');
      }
      if (disposed) return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setValue(next) {
      publish(next);
    },
    update(updater) {
      if (disposed) return;
      const next = updater(value);
      if (next !== undefined) publish(next);
    },
    isDisposed: () => disposed,
    dispose() {
      if (disposed) return;
      disposed = true;
      listeners.clear();
    },
  };
  return backend;
}
