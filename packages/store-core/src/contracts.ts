/** Framework-neutral state ownership and timeline capabilities. */
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

/** Observation shape for legacy Stores that do not publish version tokens. */
export interface StateSnapshot<T> {
  readonly value: T;
  readonly name: string;
  readonly version?: number;
  readonly lastUpdate: number;
}

/** State-owning backends must publish a monotonically increasing version. */
export interface ReadonlyStateSnapshot<T> extends StateSnapshot<T> {
  readonly version: number;
}

export interface StateReader<T, Snapshot extends StateSnapshot<T> = ReadonlyStateSnapshot<T>> {
  readonly name: string;
  getSnapshot(): Snapshot;
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

/** Lifecycle authority can be separate from the participant's stable identity. */
export interface TransactionBatchControl {
  beginBatch(meta?: StateMutationMeta, options?: { readonly deferNotification?: boolean }): void;
  endBatch(): void;
  cancelBatch(): void;
  resumeNotifications(): void;
  flushNotifications(): void;
}

export interface TransactionBackend<T, Patch = StatePatch> extends TimelineBackend<T, Patch>, TransactionBatchControl {
  isStoreDisposed(): boolean;
}

export interface StateTransition<T> {
  readonly previous: T;
  readonly next: T;
  readonly meta: StateMutationMeta;
  readonly position?: number;
}
