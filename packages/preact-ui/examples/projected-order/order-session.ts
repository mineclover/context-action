import { connectSourceSignal } from '@context-action/preact';
import { createDisposalScope } from '../../src/disposal-scope.js';
import type { OrderModel } from './handlers/order-handlers.js';
import type { OrderSubmitEventDetail, OrderWorkspaceInput } from './order-contract.js';

export interface OrderWorkspaceOwnerSession {
  readonly destroyed: boolean;
  getInput(): OrderWorkspaceInput;
  destroy(): void;
}

function cloneDraft(draft: ReturnType<OrderModel['source']['getSnapshot']>['draft']) {
  return {
    ...draft,
    items: Object.freeze(draft.items.map((item) => Object.freeze({ ...item }))),
  };
}

/**
 * Creates the per-connection resources for the order element.
 *
 * The model is the element's owner-lifetime domain object. The signal
 * connection and DOM event subscription are connection-lifetime resources and
 * are recreated on every reconnect while the model itself is preserved.
 */
export function createOrderWorkspaceOwnerSession(
  model: OrderModel,
  element: HTMLElement,
  consumeSuppressedChange: () => boolean,
  idPrefix: string,
): OrderWorkspaceOwnerSession {
  const scope = createDisposalScope();
  const connection = connectSourceSignal(model.source);
  scope.add(() => connection.dispose());

  let lastSubmissionPhase = model.source.getSnapshot().submission.phase;
  const unsubscribe = model.source.subscribe(() => {
    if (scope.disposed || !element.isConnected) return;
    const state = model.source.getSnapshot();
    if (consumeSuppressedChange()) {
      lastSubmissionPhase = state.submission.phase;
      return;
    }
    element.dispatchEvent(
      new CustomEvent('order-change', {
        detail: {
          draft: cloneDraft(state.draft),
          submission: { ...state.submission },
        },
        bubbles: true,
        composed: true,
      }),
    );

    if (state.submission.phase === 'success' && lastSubmissionPhase !== 'success') {
      element.dispatchEvent(
        new CustomEvent<OrderSubmitEventDetail>('order-submit-success', {
          detail: { orderId: state.submission.orderId ?? '' },
          bubbles: true,
          composed: true,
        }),
      );
    }
    lastSubmissionPhase = state.submission.phase;
  });
  scope.add(unsubscribe);

  return {
    get destroyed() {
      return scope.disposed;
    },
    getInput() {
      if (scope.disposed) throw new Error('Order workspace connection session is not active');
      return { dispatch: model.dispatch, sourceSignal: connection.signal, idPrefix };
    },
    destroy() {
      scope.dispose();
    },
  };
}
