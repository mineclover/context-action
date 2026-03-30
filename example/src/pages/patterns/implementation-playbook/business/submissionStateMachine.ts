import type { OrderPlan } from './orderDraft';
import type { OrderQuote } from './orderQuote';

export type OrderSubmissionPhase =
  | 'idle'
  | 'validating'
  | 'blocked'
  | 'calculating'
  | 'success';

export type OrderSubmissionState =
  | {
      phase: 'idle';
      reason: 'boot' | 'draft_changed' | 'prefill_loaded' | 'reset';
      quote: null;
      submittedAt: null;
      customerName: null;
      plan: null;
    }
  | {
      phase: 'validating';
      reason: 'submit_requested';
      quote: null;
      submittedAt: null;
      customerName: null;
      plan: null;
    }
  | {
      phase: 'blocked';
      reason: 'validation_failed';
      quote: null;
      submittedAt: null;
      customerName: null;
      plan: null;
    }
  | {
      phase: 'calculating';
      reason: 'validation_passed';
      quote: null;
      submittedAt: null;
      customerName: null;
      plan: null;
    }
  | {
      phase: 'success';
      reason: 'quote_ready';
      quote: OrderQuote;
      submittedAt: string;
      customerName: string;
      plan: OrderPlan;
    };

export type OrderSubmissionEvent =
  | { type: 'draft_changed' }
  | { type: 'prefill_loaded' }
  | { type: 'reset' }
  | { type: 'submit_requested' }
  | { type: 'validation_failed' }
  | { type: 'validation_passed' }
  | {
      type: 'quote_ready';
      quote: OrderQuote;
      submittedAt: string;
      customerName: string;
      plan: OrderPlan;
    };

function createIdleState(
  reason: 'boot' | 'draft_changed' | 'prefill_loaded' | 'reset'
): OrderSubmissionState {
  return {
    phase: 'idle',
    reason,
    quote: null,
    submittedAt: null,
    customerName: null,
    plan: null,
  };
}

export function createInitialSubmissionState(): OrderSubmissionState {
  return createIdleState('boot');
}

export function transitionOrderSubmissionState(
  current: OrderSubmissionState,
  event: OrderSubmissionEvent
): OrderSubmissionState {
  switch (event.type) {
    case 'draft_changed':
      return createIdleState('draft_changed');

    case 'prefill_loaded':
      return createIdleState('prefill_loaded');

    case 'reset':
      return createIdleState('reset');

    case 'submit_requested':
      if (
        current.phase === 'idle' ||
        current.phase === 'blocked' ||
        current.phase === 'success'
      ) {
        return {
          phase: 'validating',
          reason: 'submit_requested',
          quote: null,
          submittedAt: null,
          customerName: null,
          plan: null,
        };
      }

      return current;

    case 'validation_failed':
      if (current.phase === 'validating') {
        return {
          phase: 'blocked',
          reason: 'validation_failed',
          quote: null,
          submittedAt: null,
          customerName: null,
          plan: null,
        };
      }

      return current;

    case 'validation_passed':
      if (current.phase === 'validating') {
        return {
          phase: 'calculating',
          reason: 'validation_passed',
          quote: null,
          submittedAt: null,
          customerName: null,
          plan: null,
        };
      }

      return current;

    case 'quote_ready':
      if (current.phase === 'calculating') {
        return {
          phase: 'success',
          reason: 'quote_ready',
          quote: event.quote,
          submittedAt: event.submittedAt,
          customerName: event.customerName,
          plan: event.plan,
        };
      }

      return current;
  }
}
