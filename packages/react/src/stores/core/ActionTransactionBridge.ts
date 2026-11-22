import type {
  ActionDispatchTrace,
  ActionDispatchTraceListener,
  ActionNames,
  ActionPayloadMap,
  DispatchTraceSubscriptionOptions,
} from '@context-action/core';
import type {
  TransactionCoordinatorPort,
  TransactionHandle,
  TransactionParticipant,
} from '@context-action/store-core';

export interface DispatchTraceSource<
  TActions extends ActionPayloadMap = ActionPayloadMap,
> {
  subscribeDispatchTrace(
    listener: ActionDispatchTraceListener,
    options?: DispatchTraceSubscriptionOptions<TActions>,
  ): () => void;
}

export interface ActionTransactionBridgeOptions<
  TActions extends ActionPayloadMap = ActionPayloadMap,
> {
  /** Limit trace/transaction bridging to these actions so fast-lane siblings keep bypassing trace hooks. */
  actions?: readonly ActionNames<TActions>[];
  getParticipants(event: ActionDispatchTrace): readonly TransactionParticipant[];
}

/**
 * Connects Core dispatch lifecycle to explicit Store transaction participants.
 * Core remains Store-agnostic; this adapter owns the integration policy.
 */
export function bindActionTransactions<
  TActions extends ActionPayloadMap = ActionPayloadMap,
>(
  source: DispatchTraceSource<TActions>,
  coordinator: TransactionCoordinatorPort,
  options: ActionTransactionBridgeOptions<TActions>,
): () => void {
  const pending = new Map<string, TransactionHandle>();
  const onTrace: ActionDispatchTraceListener = event => {
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
  };

  const unsubscribe = options.actions !== undefined
    ? source.subscribeDispatchTrace(onTrace, { actions: options.actions })
    : source.subscribeDispatchTrace(onTrace);

  return () => {
    unsubscribe();
    for (const handle of pending.values()) handle.rollback();
    pending.clear();
  };
}
