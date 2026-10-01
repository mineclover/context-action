/** Framework-neutral contracts. This package has no React or immutable runtime dependency. */

export type StateMutationOrigin = 'user' | 'system' | 'network' | 'undo' | 'redo' | 'reset';

export interface StateMutationMeta {
  readonly transactionId?: string;
  readonly actionId?: string;
  readonly origin?: StateMutationOrigin;
  readonly label?: string;
}

export type HistoryEntryId = string | number;

export interface ReadonlyStateSnapshot<T> {
  readonly value: T;
  readonly name: string;
  readonly version?: number;
  readonly lastUpdate: number;
}

export interface StateReader<T> {
  readonly name: string;
  getSnapshot(): ReadonlyStateSnapshot<T>;
  subscribe(listener: () => void): () => void;
}

export interface StateWriter<T> {
  setValue(value: T, meta?: StateMutationMeta): void;
  update(updater: (current: T) => T | undefined, meta?: StateMutationMeta): void;
}

export interface StateBackend<T, Patch = unknown> extends StateReader<T>, StateWriter<T> {
  readonly capabilities?: {
    readonly patches?: boolean;
    readonly timeline?: boolean;
    readonly immutableSnapshots?: boolean;
  };
  getLastPatches?(): readonly Patch[] | null;
}

export interface TimelineBackend<T, Patch = unknown> extends StateReader<T> {
  readonly capabilities?: StateBackend<T, Patch>['capabilities'];
  getLastPatches?(): readonly Patch[] | null;
  getHistoryEntryId(): HistoryEntryId;
  hasHistoryEntry(entryId: HistoryEntryId): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  getPosition(): number;
  getHistoryLength(): number;
  undo(steps?: number, meta?: StateMutationMeta): void;
  redo(steps?: number, meta?: StateMutationMeta): void;
  goToHistoryEntry(entryId: HistoryEntryId, meta?: StateMutationMeta): void;
  reset(meta?: StateMutationMeta): void;
}

export interface TransactionBackend<T, Patch = unknown> extends TimelineBackend<T, Patch> {
  beginBatch(meta?: StateMutationMeta, options?: { deferNotification?: boolean }): void;
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
