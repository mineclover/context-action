/** Backward-compatible React re-export of framework-neutral store contracts. */
export type {
  HistoryEntryId,
  ReadonlyStateSnapshot,
  StateBackend,
  StateMutationMeta,
  StateMutationOrigin,
  StateReader,
  StateTransition,
  StateWriter,
  TransactionBackend,
  TimelineBackend,
} from '@context-action/store-core';

export type StoreReader<T> = import('@context-action/store-core').StateReader<T>;
export type StoreWriter<T> = import('@context-action/store-core').StateWriter<T>;
export type TimelineReader<T> = import('@context-action/store-core').TimelineBackend<T>;
export interface TimelineWriter {
  undo(steps?: number): void;
  redo(steps?: number): void;
  goTo(position: number): void;
  reset(): void;
}
