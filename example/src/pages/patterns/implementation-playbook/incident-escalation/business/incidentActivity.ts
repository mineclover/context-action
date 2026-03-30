import type {
  CommunicationChannel,
  IncidentDraftField,
  IncidentSeverity,
} from './incidentDraft';
import type { IncidentValidationIssue } from './incidentValidation';

export type IncidentActivityEvent =
  | {
      id: string;
      type: 'providers_ready';
    }
  | {
      id: string;
      type: 'draft_updated';
      fields: IncidentDraftField[];
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
      type: 'escalation_requested';
    }
  | {
      id: string;
      type: 'validation_failed';
      issues: IncidentValidationIssue[];
    }
  | {
      id: string;
      type: 'validation_passed';
    }
  | {
      id: string;
      type: 'packet_ready';
      priority: 'standard' | 'elevated' | 'critical';
      severity: IncidentSeverity;
      channel: CommunicationChannel;
    };

export type IncidentActivityEventInput =
  | { type: 'providers_ready' }
  | { type: 'draft_updated'; fields: IncidentDraftField[] }
  | { type: 'sample_loaded' }
  | { type: 'demo_reset' }
  | { type: 'escalation_requested' }
  | { type: 'validation_failed'; issues: IncidentValidationIssue[] }
  | { type: 'validation_passed' }
  | {
      type: 'packet_ready';
      priority: 'standard' | 'elevated' | 'critical';
      severity: IncidentSeverity;
      channel: CommunicationChannel;
    };

export function createIncidentActivityEvent(
  event: IncidentActivityEventInput
): IncidentActivityEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...event,
  } as IncidentActivityEvent;
}
