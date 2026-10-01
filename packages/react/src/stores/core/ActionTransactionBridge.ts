import type { ActionDispatchTrace, ActionDispatchTraceListener } from '@context-action/core';
import type {
  StoreTransactionCoordinator,
  StoreTransactionHandle,
  StoreTransactionParticipant,
} from './StoreTransactionCoordinator';

export interface DispatchTraceSource {
  subscribeDispatchTrace(listener: ActionDispatchTraceListener): () => void;
}

export interface ActionTransactionBridgeOptions {
  getParticipants(event: ActionDispatchTrace): readonly StoreTransactionParticipant<any>[];
}

/**
 * Connects Core dispatch lifecycle to explicit Store transaction participants.
 * Core remains Store-agnostic; this adapter owns the integration policy.
 */
export function bindActionTransactions(
  source: DispatchTraceSource,
  coordinator: StoreTransactionCoordinator,
  options: ActionTransactionBridgeOptions,
): () => void {
  const pending = new Map<string, StoreTransactionHandle>();
  const unsubscribe = source.subscribeDispatchTrace(event => {
    if (event.phase === 'started') {
      const participants = options.getParticipants(event);
      if (participants.length === 0) return;
      const handle = coordinator.begin(participants, {
        transactionId: event.transactionId,
        actionId: event.dispatchId,
        origin: event.origin,
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
