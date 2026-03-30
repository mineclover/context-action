import type { OrderDraftField, OrderPlan } from './orderDraft';
import type { OrderValidationIssue } from './orderValidation';

export type OrderActivityEvent =
  | {
      id: string;
      type: 'providers_ready';
    }
  | {
      id: string;
      type: 'draft_updated';
      fields: OrderDraftField[];
    }
  | {
      id: string;
      type: 'sample_loaded';
    }
  | {
      id: string;
      type: 'demo_reset';
    }
  | {
      id: string;
      type: 'submission_requested';
    }
  | {
      id: string;
      type: 'validation_failed';
      issues: OrderValidationIssue[];
    }
  | {
      id: string;
      type: 'validation_passed';
    }
  | {
      id: string;
      type: 'quote_ready';
      total: number;
      plan: OrderPlan;
    };

export type OrderActivityEventInput =
  | {
      type: 'providers_ready';
    }
  | {
      type: 'draft_updated';
      fields: OrderDraftField[];
    }
  | {
      type: 'sample_loaded';
    }
  | {
      type: 'demo_reset';
    }
  | {
      type: 'submission_requested';
    }
  | {
      type: 'validation_failed';
      issues: OrderValidationIssue[];
    }
  | {
      type: 'validation_passed';
    }
  | {
      type: 'quote_ready';
      total: number;
      plan: OrderPlan;
    };

export function createOrderActivityEvent(
  event: OrderActivityEventInput
): OrderActivityEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...event,
  } as OrderActivityEvent;
}
