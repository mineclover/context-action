import type { OrderSubmission, OrderSubmissionPhase } from './order-types.js';

export type OrderSubmissionEvent =
  | { type: 'START_VALIDATION' }
  | { type: 'VALIDATION_FAILED'; message: string }
  | { type: 'START_SUBMIT' }
  | { type: 'SUBMIT_SUCCESS'; orderId: string }
  | { type: 'SUBMIT_FAILED'; message: string }
  | { type: 'RESET' };

/**
 * Pure state machine transition for order submission lifecycle.
 */
export function transitionOrderSubmission(
  current: OrderSubmission,
  event: OrderSubmissionEvent,
): OrderSubmission {
  switch (current.phase) {
    case 'idle':
    case 'failed':
      if (event.type === 'START_VALIDATION') {
        return { phase: 'validating' };
      }
      if (event.type === 'RESET') {
        return { phase: 'idle' };
      }
      break;

    case 'validating':
      if (event.type === 'VALIDATION_FAILED') {
        return { phase: 'failed', errorMessage: event.message };
      }
      if (event.type === 'START_SUBMIT') {
        return { phase: 'submitting' };
      }
      if (event.type === 'RESET') {
        return { phase: 'idle' };
      }
      break;

    case 'submitting':
      if (event.type === 'SUBMIT_SUCCESS') {
        return { phase: 'success', orderId: event.orderId };
      }
      if (event.type === 'SUBMIT_FAILED') {
        return { phase: 'failed', errorMessage: event.message };
      }
      break;

    case 'success':
      if (event.type === 'RESET') {
        return { phase: 'idle' };
      }
      break;
  }

  return current;
}
