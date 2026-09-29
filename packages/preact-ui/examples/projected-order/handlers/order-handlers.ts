import { ActionRegister } from '@context-action/core';
import type { ActionDispatcher } from '@context-action/core';
import type { ReadableSource } from '@context-action/preact';
import { transitionOrderSubmission } from '../business/order-state-machine.js';
import type {
  ActivityEntry,
  OrderActions,
  OrderDraft,
  OrderState,
} from '../business/order-types.js';
import { validateOrderDraft } from '../business/order-validation.js';

export interface OrderModel {
  readonly source: ReadableSource<OrderState>;
  readonly dispatch: ActionDispatcher<OrderActions>;
  destroy(): void;
}

const DEFAULT_DRAFT: OrderDraft = {
  customerName: '',
  shippingAddress: '',
  items: [],
  notes: '',
};

export interface OrderModelOptions {
  initialDraft?: Partial<OrderDraft>;
  submitDelayMs?: number;
}

/**
 * Creates the host-managed OrderModel orchestrating ActionRegister,
 * pure business logic, and snapshot emissions.
 */
export function createOrderModel(options?: OrderModelOptions | Partial<OrderDraft>): OrderModel {
  const initialDraft = options && 'initialDraft' in options ? options.initialDraft : (options as Partial<OrderDraft>);
  const submitDelayMs = options && 'submitDelayMs' in options ? options.submitDelayMs : 0;

  let state: OrderState = {
    draft: { ...DEFAULT_DRAFT, ...initialDraft },
    submission: { phase: 'idle' },
    validationIssues: [],
    activityLog: [
      {
        id: `act_${Date.now()}`,
        timestamp: Date.now(),
        message: 'Order draft workspace initialized',
      },
    ],
  };

  let destroyed = false;
  const listeners = new Set<() => void>();
  const actions = new ActionRegister<OrderActions>({ name: 'ProjectedOrderModel' });

  const commit = (next: OrderState) => {
    if (destroyed) throw new Error('OrderModel is destroyed');
    state = next;
    for (const notify of Array.from(listeners)) notify();
  };

  const addActivity = (state: OrderState, message: string): ActivityEntry[] => [
    { id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now(), message },
    ...state.activityLog.slice(0, 19), // Keep latest 20
  ];

  actions.register('updateCustomerName', ({ name }) => {
    const updatedDraft = { ...state.draft, customerName: name };
    const issues = validateOrderDraft(updatedDraft);
    commit({
      ...state,
      draft: updatedDraft,
      validationIssues: issues,
    });
  });

  actions.register('updateShippingAddress', ({ address }) => {
    const updatedDraft = { ...state.draft, shippingAddress: address };
    const issues = validateOrderDraft(updatedDraft);
    commit({
      ...state,
      draft: updatedDraft,
      validationIssues: issues,
    });
  });

  actions.register('addItem', ({ item }) => {
    const existingIndex = state.draft.items.findIndex((i) => i.id === item.id);
    let items = [...state.draft.items];
    if (existingIndex >= 0) {
      const existing = items[existingIndex]!;
      items[existingIndex] = { ...existing, quantity: existing.quantity + item.quantity };
    } else {
      items.push(item);
    }
    const updatedDraft = { ...state.draft, items };
    const issues = validateOrderDraft(updatedDraft);
    commit({
      ...state,
      draft: updatedDraft,
      validationIssues: issues,
      activityLog: addActivity(state, `Added item "${item.name}" (qty: ${item.quantity})`),
    });
  });

  actions.register('removeItem', ({ itemId }) => {
    const target = state.draft.items.find((i) => i.id === itemId);
    const items = state.draft.items.filter((i) => i.id !== itemId);
    const updatedDraft = { ...state.draft, items };
    const issues = validateOrderDraft(updatedDraft);
    commit({
      ...state,
      draft: updatedDraft,
      validationIssues: issues,
      activityLog: addActivity(state, `Removed item "${target?.name ?? itemId}"`),
    });
  });

  actions.register('updateItemQuantity', ({ itemId, quantity }) => {
    const items = state.draft.items.map((i) => (i.id === itemId ? { ...i, quantity } : i));
    const updatedDraft = { ...state.draft, items };
    const issues = validateOrderDraft(updatedDraft);
    commit({
      ...state,
      draft: updatedDraft,
      validationIssues: issues,
    });
  });

  actions.register('submitOrder', async () => {
    // 1. Validation phase
    const validatingSubmission = transitionOrderSubmission(state.submission, {
      type: 'START_VALIDATION',
    });
    const issues = validateOrderDraft(state.draft);

    if (issues.length > 0) {
      const failedSubmission = transitionOrderSubmission(validatingSubmission, {
        type: 'VALIDATION_FAILED',
        message: issues[0]?.message ?? 'Validation failed',
      });
      commit({
        ...state,
        submission: failedSubmission,
        validationIssues: issues,
        activityLog: addActivity(state, 'Order submission blocked by validation errors'),
      });
      return;
    }

    // 2. Submitting phase
    const submitting = transitionOrderSubmission(validatingSubmission, { type: 'START_SUBMIT' });
    commit({
      ...state,
      submission: submitting,
      validationIssues: [],
      activityLog: addActivity(state, 'Submitting order to server...'),
    });

    // 3. Simulated async remote call
    if (submitDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, submitDelayMs));
    }

    // 4. Success phase
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const successSubmission = transitionOrderSubmission(submitting, {
      type: 'SUBMIT_SUCCESS',
      orderId,
    });

    commit({
      ...state,
      submission: successSubmission,
      activityLog: addActivity(state, `Order successfully placed: ${orderId}`),
    });
  });

  actions.register('resetDraft', () => {
    commit({
      draft: { ...DEFAULT_DRAFT },
      submission: { phase: 'idle' },
      validationIssues: [],
      activityLog: addActivity(state, 'Order draft reset to empty defaults'),
    });
  });

  actions.register('retrySubmission', async () => {
    return actions.dispatch('submitOrder');
  });

  return {
    source: {
      getSnapshot: () => state,
      subscribe(notify) {
        if (destroyed) throw new Error('OrderModel is destroyed');
        listeners.add(notify);
        return () => {
          listeners.delete(notify);
        };
      },
    },
    dispatch: actions.dispatch.bind(actions),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      listeners.clear();
      actions.destroy();
    },
  };
}
