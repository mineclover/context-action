export type StateMutationOrigin = 'user' | 'system' | 'network' | 'undo' | 'redo' | 'reset';
export interface StateMutationMeta {
  readonly transactionId?: string;
  readonly actionId?: string;
  readonly origin?: StateMutationOrigin;
  readonly label?: string;
}
export interface ReadonlyStateSnapshot<T> {
  readonly value: T;
  readonly name: string;
  readonly version?: number;
  readonly lastUpdate: number;
}
export interface StoreReader<T> {
  readonly name: string;
  getSnapshot(): ReadonlyStateSnapshot<T>;
  subscribe(listener: () => void): () => void;
}
export interface StoreWriter<T> {
  setValue(value: T, meta?: StateMutationMeta): void;
  update(updater: (current: T) => T | undefined, meta?: StateMutationMeta): void;
}
export interface TimelineReader<T> extends StoreReader<T> {
  canUndo(): boolean;
  canRedo(): boolean;
  getPosition(): number;
  getHistoryLength(): number;
}
export type HistoryEntryId = string | number;
export interface TransactionBackend<T = unknown> extends TimelineReader<T> {
  getHistoryEntryId(): HistoryEntryId;
  hasHistoryEntry(entryId: HistoryEntryId): boolean;
  beginBatch(meta?: StateMutationMeta, options?: { deferNotification?: boolean }): void;
  endBatch(): void;
  cancelBatch(): void;
  resumeNotifications(): void;
  flushNotifications(): void;
  isStoreDisposed(): boolean;
  undo(steps?: number, meta?: StateMutationMeta): void;
  redo(steps?: number, meta?: StateMutationMeta): void;
  goToHistoryEntry(entryId: HistoryEntryId, meta?: StateMutationMeta): void;
}
export interface StateTransition<T> {
  readonly previous: T;
  readonly next: T;
  readonly meta: StateMutationMeta;
  readonly position?: number;
}
export interface TimelineWriter {
  undo(steps?: number): void;
  redo(steps?: number): void;
  goTo(position: number): void;
  reset(): void;
}
