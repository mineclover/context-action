import type { ActionDispatchTrace, ActionDispatchTraceListener } from '@context-action/core';
import type {
  TransactionCoordinatorPort,
  TransactionHandle,
  TransactionParticipant,
} from '@context-action/store-core';

export interface DispatchTraceSource {
  subscribeDispatchTrace(listener: ActionDispatchTraceListener): () => void;
}

export interface ActionTransactionBridgeOptions {
  getParticipants(event: ActionDispatchTrace): readonly TransactionParticipant[];
}

/**
 * Connects Core dispatch lifecycle to explicit Store transaction participants.
 * Core remains Store-agnostic; this adapter owns the integration policy.
 */
export function bindActionTransactions(
  source: DispatchTraceSource,
  coordinator: TransactionCoordinatorPort,
  options: ActionTransactionBridgeOptions,
): () => void {
  const pending = new Map<string, TransactionHandle>();
  const unsubscribe = source.subscribeDispatchTrace(event => {
    if (event.phase === 'started') {
      const participants = options.getParticipants(event);
      if (participants.length === 0) return;
      const handle = coordinator.begin(participants, {
        ...(event.transactionId === undefined ? {} : { transactionId: event.transactionId }),
        actionId: event.dispatchId,
        ...(event.origin === undefined ? {} : { origin: event.origin }),
        label: event.label ?? event.action,
      });
      pending.set(event.dispatchId, handle);
      return;
    }

    const handle = pending.get(event.dispatchId);
    if (!handle) return;
    pending.delete(event.dispatchId);
    if (event.status === 'completed' || event.status === 'completed_with_errors') handle.commit();
    else handle.rollback();
  });

  return () => {
    unsubscribe();
    for (const handle of pending.values()) handle.rollback();
    pending.clear();
  };
}
