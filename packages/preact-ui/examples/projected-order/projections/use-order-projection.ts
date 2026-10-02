import { useProjection } from '@context-action/preact';
import type { ReadonlySignal } from '@preact/signals';
import { calculateOrderSummary } from '../business/order-calculations.js';
import type {
  ActivityEntry,
  OrderDraft,
  OrderItem,
  OrderSubmission,
  OrderSummary,
  ValidationIssue,
} from '../business/order-types.js';
import { OrderSourceContext } from '../contexts/order-contexts.js';

export interface OrderProjection {
  draftSignal: ReadonlySignal<OrderDraft>;
  customerNameSignal: ReadonlySignal<string>;
  shippingAddressSignal: ReadonlySignal<string>;
  itemsSignal: ReadonlySignal<readonly OrderItem[]>;
  summarySignal: ReadonlySignal<OrderSummary>;
  submissionSignal: ReadonlySignal<OrderSubmission>;
  validationIssuesSignal: ReadonlySignal<readonly ValidationIssue[]>;
  activityLogSignal: ReadonlySignal<readonly ActivityEntry[]>;
  isSubmittingSignal: ReadonlySignal<boolean>;
  isSuccessSignal: ReadonlySignal<boolean>;
  canSubmitSignal: ReadonlySignal<boolean>;
  hasErrorsSignal: ReadonlySignal<boolean>;
  getFieldError: (field: string) => string | undefined;
}

/**
 * Projection Hook: Transforms raw domain order state into fine-grained,
 * memoized read-only signals for the view.
 * 
 * View components bind to these signals directly, preventing whole-tree
 * re-renders when individual fields change.
 */
export function useOrderProjection(): OrderProjection {
  const sourceSignal = OrderSourceContext.useSourceSignal();

  const draftSignal = useProjection(sourceSignal, (s) => s.draft);
  const customerNameSignal = useProjection(sourceSignal, (s) => s.draft.customerName);
  const shippingAddressSignal = useProjection(sourceSignal, (s) => s.draft.shippingAddress);
  const itemsSignal = useProjection(sourceSignal, (s) => s.draft.items);

  const summarySignal = useProjection(sourceSignal, (s) =>
    calculateOrderSummary(s.draft.items),
  );

  const submissionSignal = useProjection(sourceSignal, (s) => s.submission);
  const validationIssuesSignal = useProjection(sourceSignal, (s) => s.validationIssues);
  const activityLogSignal = useProjection(sourceSignal, (s) => s.activityLog);

  const isSubmittingSignal = useProjection(
    sourceSignal,
    (s) => s.submission.phase === 'validating' || s.submission.phase === 'submitting',
  );

  const isSuccessSignal = useProjection(
    sourceSignal,
    (s) => s.submission.phase === 'success',
  );

  const canSubmitSignal = useProjection(
    sourceSignal,
    (s) =>
      s.draft.items.length > 0 &&
      s.submission.phase !== 'validating' &&
      s.submission.phase !== 'submitting',
  );

  const hasErrorsSignal = useProjection(
    sourceSignal,
    (s) => s.validationIssues.length > 0,
  );

  const getFieldError = (field: string) =>
    validationIssuesSignal.value.find((issue) => issue.field === field)?.message;

  return {
    draftSignal,
    customerNameSignal,
    shippingAddressSignal,
    itemsSignal,
    summarySignal,
    submissionSignal,
    validationIssuesSignal,
    activityLogSignal,
    isSubmittingSignal,
    isSuccessSignal,
    canSubmitSignal,
    hasErrorsSignal,
    getFieldError,
  };
}
