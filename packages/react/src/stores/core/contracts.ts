import type {
  HistoryEntryId as CoreHistoryEntryId,
  StateMutationMeta as BackendMutationMeta,
  StateMutationOrigin as CoreMutationOrigin,
  StateReader,
  StateSnapshot,
  StateTransition as BackendStateTransition,
  TimelineBackend,
  TransactionParticipantBackend,
} from '@context-action/store-core';

// Compatibility facade: React's legacy metadata has no catch-all index
// signature, and Store snapshots may omit version. Do not alias either to
// the stricter state-owning backend contracts.
export type StateMutationOrigin = CoreMutationOrigin;
export interface StateMutationMeta extends Pick<BackendMutationMeta, 'transactionId' | 'actionId' | 'origin' | 'label'> {}
export interface ReadonlyStateSnapshot<T> extends StateSnapshot<T> {}
export interface StoreReader<T> extends StateReader<T, ReadonlyStateSnapshot<T>> {}
export interface StoreWriter<T> {
  setValue(value: T, meta?: StateMutationMeta): void;
  update(updater: (current: T) => T | undefined, meta?: StateMutationMeta): void;
}
export interface TimelineReader<T> extends StoreReader<T>, Pick<TimelineBackend<T>, 'canUndo' | 'canRedo' | 'getPosition' | 'getHistoryLength'> {}
export type HistoryEntryId = CoreHistoryEntryId;

/** Legacy participant facade, NOT the state-owning store-core TransactionBackend. */
export interface TransactionBackend<T = unknown> extends TransactionParticipantBackend<T> {
  // Keep legacy metadata arguments and convenience undo/redo methods intact.
  beginBatch(meta?: StateMutationMeta, options?: { deferNotification?: boolean }): void;
  undo(steps?: number, meta?: StateMutationMeta): void;
  redo(steps?: number, meta?: StateMutationMeta): void;
  goToHistoryEntry(entryId: HistoryEntryId, meta?: StateMutationMeta): void;
}
export interface StateTransition<T> extends Omit<BackendStateTransition<T>, 'meta'> {
  readonly meta: StateMutationMeta;
}
export interface TimelineWriter {
  undo(steps?: number): void;
  redo(steps?: number): void;
  goTo(position: number): void;
  reset(): void;
}
