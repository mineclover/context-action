import type { IncidentSeverity } from './incidentDraft';
import type { IncidentEscalationPacket } from './incidentEscalationPacket';

export type IncidentEscalationPhase =
  | 'idle'
  | 'validating'
  | 'blocked'
  | 'assembling'
  | 'ready';

export type IncidentEscalationState =
  | {
      phase: 'idle';
      reason: 'boot' | 'draft_changed' | 'prefill_loaded' | 'reset';
      packet: null;
      escalatedAt: null;
      incidentTitle: null;
      severity: null;
    }
  | {
      phase: 'validating';
      reason: 'escalation_requested';
      packet: null;
      escalatedAt: null;
      incidentTitle: null;
      severity: null;
    }
  | {
      phase: 'blocked';
      reason: 'validation_failed';
      packet: null;
      escalatedAt: null;
      incidentTitle: null;
      severity: null;
    }
  | {
      phase: 'assembling';
      reason: 'validation_passed';
      packet: null;
      escalatedAt: null;
      incidentTitle: null;
      severity: null;
    }
  | {
      phase: 'ready';
      reason: 'packet_ready';
      packet: IncidentEscalationPacket;
      escalatedAt: string;
      incidentTitle: string;
      severity: IncidentSeverity;
    };

export type IncidentEscalationEvent =
  | { type: 'draft_changed' }
  | { type: 'prefill_loaded' }
  | { type: 'reset' }
  | { type: 'escalation_requested' }
  | { type: 'validation_failed' }
  | { type: 'validation_passed' }
  | {
      type: 'packet_ready';
      packet: IncidentEscalationPacket;
      escalatedAt: string;
      incidentTitle: string;
      severity: IncidentSeverity;
    };

function createIdleState(
  reason: 'boot' | 'draft_changed' | 'prefill_loaded' | 'reset'
): IncidentEscalationState {
  return {
    phase: 'idle',
    reason,
    packet: null,
    escalatedAt: null,
    incidentTitle: null,
    severity: null,
  };
}

export function createInitialIncidentEscalationState(): IncidentEscalationState {
  return createIdleState('boot');
}

export function transitionIncidentEscalationState(
  current: IncidentEscalationState,
  event: IncidentEscalationEvent
): IncidentEscalationState {
  switch (event.type) {
    case 'draft_changed':
      return createIdleState('draft_changed');
    case 'prefill_loaded':
      return createIdleState('prefill_loaded');
    case 'reset':
      return createIdleState('reset');
    case 'escalation_requested':
      if (
        current.phase === 'idle' ||
        current.phase === 'blocked' ||
        current.phase === 'ready'
      ) {
        return {
          phase: 'validating',
          reason: 'escalation_requested',
          packet: null,
          escalatedAt: null,
          incidentTitle: null,
          severity: null,
        };
      }
      return current;
    case 'validation_failed':
      if (current.phase === 'validating') {
        return {
          phase: 'blocked',
          reason: 'validation_failed',
          packet: null,
          escalatedAt: null,
          incidentTitle: null,
          severity: null,
        };
      }
      return current;
    case 'validation_passed':
      if (current.phase === 'validating') {
        return {
          phase: 'assembling',
          reason: 'validation_passed',
          packet: null,
          escalatedAt: null,
          incidentTitle: null,
          severity: null,
        };
      }
      return current;
    case 'packet_ready':
      if (current.phase === 'assembling') {
        return {
          phase: 'ready',
          reason: 'packet_ready',
          packet: event.packet,
          escalatedAt: event.escalatedAt,
          incidentTitle: event.incidentTitle,
          severity: event.severity,
        };
      }
      return current;
  }
}
