import type {
  RenewalDraftField,
  RenewalWindow,
} from './renewalDraft';
import type { RenewalRiskBand } from './renewalRiskPacket';
import type { RenewalValidationIssue } from './renewalValidation';

export type RenewalActivityEvent =
  | {
      id: string;
      type: 'providers_ready';
    }
  | {
      id: string;
      type: 'draft_updated';
      fields: RenewalDraftField[];
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
      issues: RenewalValidationIssue[];
    }
  | {
      id: string;
      type: 'validation_passed';
    }
  | {
      id: string;
      type: 'packet_ready';
      riskBand: RenewalRiskBand;
      renewalWindow: RenewalWindow;
    };

export type RenewalActivityEventInput =
  | { type: 'providers_ready' }
  | { type: 'draft_updated'; fields: RenewalDraftField[] }
  | { type: 'sample_loaded' }
  | { type: 'demo_reset' }
  | { type: 'review_requested' }
  | { type: 'validation_failed'; issues: RenewalValidationIssue[] }
  | { type: 'validation_passed' }
  | {
      type: 'packet_ready';
      riskBand: RenewalRiskBand;
      renewalWindow: RenewalWindow;
    };

export function createRenewalActivityEvent(
  event: RenewalActivityEventInput
): RenewalActivityEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...event,
  } as RenewalActivityEvent;
}
