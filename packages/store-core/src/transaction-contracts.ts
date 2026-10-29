import type {
  StateMutationMeta,
  StateReader,
  StateSnapshot,
  TransactionBackend,
  TransactionBatchControl,
} from './contracts';

/**
 * Participant identity/observation/navigation, not state ownership. Coordinators
 * do not require setValue/update, patch subscriptions or materialized history.
 * Legacy Store snapshots may omit version; StateBackend still requires it.
 */
export interface TransactionParticipantBackend<T = unknown> extends
  StateReader<T, StateSnapshot<T>>,
  Pick<TransactionBackend<T>,
    | 'getHistoryEntryId' | 'hasHistoryEntry' | 'canUndo' | 'canRedo'
    | 'getPosition' | 'getHistoryLength' | 'goToHistoryEntry' | 'isStoreDisposed'>,
  TransactionBatchControl {}

/** Fixed correlation fields; arbitrary storage-specific metadata stays elsewhere. */
export interface TransactionMeta extends Pick<StateMutationMeta, 'transactionId' | 'actionId' | 'label' | 'origin'> {
  readonly id: string;
}

export type TransactionOptions = Omit<TransactionMeta, 'id'>;

export interface TransactionParticipant<T = unknown> {
  readonly name: string;
  readonly store: TransactionParticipantBackend<T>;
  /** Operation-only authority; history must retain store, not this control. */
  readonly batchControl?: TransactionBatchControl;
}

export interface TransactionHandle {
  readonly meta: TransactionMeta;
  commit(): void;
  rollback(): void;
}

/** Minimal coordination port. It does not promise a React runtime or a run helper. */
export interface TransactionCoordinatorPort {
  begin(participants: readonly TransactionParticipant[], options?: TransactionOptions): TransactionHandle;
}
