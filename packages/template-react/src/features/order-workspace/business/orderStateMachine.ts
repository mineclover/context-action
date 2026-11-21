import type { OrderValidationCode } from './orderValidation';

/**
 * Tier 1: Order Submission Explicit State Machine
 *
 * @evidenceReview specs/canonical-order.tsp#OrderSubmissionPhase #65a0cfc
 */

export type OrderSubmissionPhase =
  | 'idle'
  | 'validating'
  | 'submitting'
  | 'success'
  | 'failed';

export type OrderSubmissionErrorCode = OrderValidationCode | 'submission_failed';

export interface OrderSubmissionState {
  phase: OrderSubmissionPhase;
  orderId: string | null;
  errorCode: OrderSubmissionErrorCode | null;
}

export type OrderSubmissionEvent =
  | { type: 'submit_requested' }
  | { type: 'validation_passed' }
  | { type: 'validation_failed'; errorCode: OrderValidationCode }
  | { type: 'server_succeeded'; orderId: string }
  | { type: 'server_failed'; errorCode: 'submission_failed' }
  | { type: 'reset' };

export function transitionOrderState(
  current: OrderSubmissionState,
  event: OrderSubmissionEvent
): OrderSubmissionState {
  switch (event.type) {
    case 'submit_requested':
      return current.phase === 'idle' || current.phase === 'failed'
        ? { phase: 'validating', orderId: null, errorCode: null }
        : current;

    case 'validation_passed':
      return current.phase === 'validating'
        ? { phase: 'submitting', orderId: null, errorCode: null }
        : current;

    case 'validation_failed':
      return current.phase === 'validating'
        ? { phase: 'idle', orderId: null, errorCode: event.errorCode }
        : current;

    case 'server_succeeded':
      return current.phase === 'submitting'
        ? { phase: 'success', orderId: event.orderId, errorCode: null }
        : current;

    case 'server_failed':
      return current.phase === 'submitting'
        ? { phase: 'failed', orderId: null, errorCode: event.errorCode }
        : current;

    case 'reset':
      return { phase: 'idle', orderId: null, errorCode: null };

    default:
      return current;
  }
}
