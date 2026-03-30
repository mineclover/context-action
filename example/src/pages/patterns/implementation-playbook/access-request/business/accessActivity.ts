import type { AccessRequestField, AccessScope } from './accessDraft';
import type { AccessValidationIssue } from './accessValidation';

export type AccessActivityEvent =
  | {
      id: string;
      type: 'providers_ready';
    }
  | {
      id: string;
      type: 'draft_updated';
      fields: AccessRequestField[];
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
      type: 'review_requested';
    }
  | {
      id: string;
      type: 'validation_failed';
      issues: AccessValidationIssue[];
    }
  | {
      id: string;
      type: 'validation_passed';
    }
  | {
      id: string;
      type: 'packet_ready';
      priority: 'standard' | 'elevated' | 'critical';
      scope: AccessScope;
    };

export type AccessActivityEventInput =
  | { type: 'providers_ready' }
  | { type: 'draft_updated'; fields: AccessRequestField[] }
  | { type: 'sample_loaded' }
  | { type: 'demo_reset' }
  | { type: 'review_requested' }
  | { type: 'validation_failed'; issues: AccessValidationIssue[] }
  | { type: 'validation_passed' }
  | {
      type: 'packet_ready';
      priority: 'standard' | 'elevated' | 'critical';
      scope: AccessScope;
    };

export function createAccessActivityEvent(
  event: AccessActivityEventInput
): AccessActivityEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...event,
  } as AccessActivityEvent;
}
