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

function cloneOrderState(source: OrderState): OrderState {
  return {
    draft: {
      ...source.draft,
      items: source.draft.items.map((item) => ({ ...item })),
    },
    submission: { ...source.submission },
    validationIssues: source.validationIssues.map((issue) => ({ ...issue })),
    activityLog: source.activityLog.map((entry) => ({ ...entry })),
  };
}

function freezeOrderState(source: OrderState): Readonly<OrderState> {
  const snapshot = cloneOrderState(source);
  for (const item of snapshot.draft.items) Object.freeze(item);
  Object.freeze(snapshot.draft.items);
  Object.freeze(snapshot.draft);
  Object.freeze(snapshot.submission);
  for (const issue of snapshot.validationIssues) Object.freeze(issue);
  Object.freeze(snapshot.validationIssues);
  for (const entry of snapshot.activityLog) Object.freeze(entry);
  Object.freeze(snapshot.activityLog);
  return Object.freeze(snapshot);
}

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
    draft: {
      ...DEFAULT_DRAFT,
      ...initialDraft,
      items: initialDraft?.items?.map((item) => ({ ...item })) ?? [],
    },
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
  let snapshot = freezeOrderState(state);

  let destroyed = false;
  let draftRevision = 0;
  let nextSubmissionToken = 0;
  let activeSubmissionToken = 0;
  let activeSubmissionRevision: number | undefined;
  let lastCompletedSubmissionRevision: number | undefined;
  const listeners = new Set<() => void>();
  const actions = new ActionRegister<OrderActions>({ name: 'ProjectedOrderModel' });

  const commit = (next: OrderState) => {
    // Async actions may finish after the owning element disconnects. Treat
    // those late results as cancelled so a void-dispatched promise cannot
    // surface an unhandled rejection or mutate a disposed domain owner.
    if (destroyed) return;
    state = next;
    snapshot = freezeOrderState(next);
    for (const notify of Array.from(listeners)) notify();
  };

  const addActivity = (state: OrderState, message: string): ActivityEntry[] => [
    { id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now(), message },
    ...state.activityLog.slice(0, 19), // Keep latest 20
  ];

  const markDraftChanged = () => {
    draftRevision += 1;
  };

  const submissionAfterDraftChange = (): OrderState['submission'] => (
    state.submission.phase === 'submitting' ? { phase: 'idle' } : state.submission
  );

  actions.register('updateCustomerName', ({ name }) => {
    if (typeof name !== 'string') throw new TypeError('name must be a string');
    markDraftChanged();
    const updatedDraft = { ...state.draft, customerName: name };
    const issues = validateOrderDraft(updatedDraft);
    commit({
      ...state,
      draft: updatedDraft,
      submission: submissionAfterDraftChange(),
      validationIssues: issues,
    });
  });

  actions.register('updateShippingAddress', ({ address }) => {
    if (typeof address !== 'string') throw new TypeError('address must be a string');
    markDraftChanged();
    const updatedDraft = { ...state.draft, shippingAddress: address };
    const issues = validateOrderDraft(updatedDraft);
    commit({
      ...state,
      draft: updatedDraft,
      submission: submissionAfterDraftChange(),
      validationIssues: issues,
    });
  });

  actions.register('addItem', ({ item }) => {
    if (
      typeof item.id !== 'string' ||
      typeof item.name !== 'string' ||
      !Number.isFinite(item.unitPrice) ||
      item.unitPrice < 0 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0 ||
      !item.id.trim() ||
      !item.name.trim()
    ) {
      throw new TypeError('item must have valid id, name, unitPrice, and positive integer quantity');
    }
    // Copy caller-owned payloads before they enter the domain state. A caller
    // may reuse or mutate its input object after dispatch resolves.
    const incomingItem = { ...item };
    markDraftChanged();
    const existingIndex = state.draft.items.findIndex((i) => i.id === incomingItem.id);
    const items = [...state.draft.items];
    if (existingIndex >= 0) {
      const existing = items[existingIndex]!;
      items[existingIndex] = { ...existing, quantity: existing.quantity + incomingItem.quantity };
    } else {
      items.push(incomingItem);
    }
    const updatedDraft = { ...state.draft, items };
    const issues = validateOrderDraft(updatedDraft);
    commit({
      ...state,
      draft: updatedDraft,
      submission: submissionAfterDraftChange(),
      validationIssues: issues,
      activityLog: addActivity(state, `Added item "${item.name}" (qty: ${item.quantity})`),
    });
  });

  actions.register('removeItem', ({ itemId }) => {
    if (typeof itemId !== 'string' || !itemId.trim()) {
      throw new TypeError('itemId must be a nonempty string');
    }
    markDraftChanged();
    const target = state.draft.items.find((i) => i.id === itemId);
    const items = state.draft.items.filter((i) => i.id !== itemId);
    const updatedDraft = { ...state.draft, items };
    const issues = validateOrderDraft(updatedDraft);
    commit({
      ...state,
      draft: updatedDraft,
      submission: submissionAfterDraftChange(),
      validationIssues: issues,
      activityLog: addActivity(state, `Removed item "${target?.name ?? itemId}"`),
    });
  });

  actions.register('updateItemQuantity', ({ itemId, quantity }) => {
    if (typeof itemId !== 'string' || !Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new TypeError('itemId must be a string and quantity must be a positive integer');
    }
    markDraftChanged();
    const items = state.draft.items.map((i) => (i.id === itemId ? { ...i, quantity } : i));
    const updatedDraft = { ...state.draft, items };
    const issues = validateOrderDraft(updatedDraft);
    commit({
      ...state,
      draft: updatedDraft,
      submission: submissionAfterDraftChange(),
      validationIssues: issues,
    });
  });

  actions.register('submitOrder', async () => {
    if (activeSubmissionRevision === draftRevision || lastCompletedSubmissionRevision === draftRevision) return;
    const requestRevision = draftRevision;
    const requestToken = ++nextSubmissionToken;
    activeSubmissionToken = requestToken;
    activeSubmissionRevision = requestRevision;
    try {
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

      // A reset or a newer draft mutation cancels the in-flight submission.
      // Do not let a stale remote result turn the replacement draft into a
      // success state or emit a success event for the wrong order.
      const currentSubmissionPhase = state.submission.phase as OrderState['submission']['phase'];
      if (
        requestRevision !== draftRevision ||
        activeSubmissionToken !== requestToken ||
        currentSubmissionPhase !== 'submitting'
      ) return;

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
      lastCompletedSubmissionRevision = requestRevision;
    } finally {
      if (activeSubmissionToken === requestToken) {
        activeSubmissionToken = 0;
        activeSubmissionRevision = undefined;
      }
    }
  });

  actions.register('resetDraft', () => {
    markDraftChanged();
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
      getSnapshot: () => snapshot,
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
