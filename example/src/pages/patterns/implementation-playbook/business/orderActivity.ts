import type { OrderDraftField, OrderPlan } from './orderDraft';
import type { OrderValidationIssue } from './orderValidation';

type OrderActivityBase = {
  id: string;
  occurredAt: string;
};

export type OrderActivityEvent = OrderActivityBase &
  (
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
      }
  );

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
    occurredAt: new Date().toISOString(),
    ...event,
  } as OrderActivityEvent;
}
