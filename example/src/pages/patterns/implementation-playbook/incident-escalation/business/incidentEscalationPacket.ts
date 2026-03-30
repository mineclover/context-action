import type {
  CommunicationChannel,
  IncidentDraft,
  IncidentSeverity,
} from './incidentDraft';

export type IncidentEscalationPriority = 'standard' | 'elevated' | 'critical';

export interface IncidentEscalationPacket {
  severity: IncidentSeverity;
  communicationChannel: CommunicationChannel;
  escalationTargets: string[];
  checklist: string[];
  priority: IncidentEscalationPriority;
  summary: string;
}

function buildEscalationTargets(
  severity: IncidentSeverity,
  affectedUsers: number
): string[] {
  const targets = ['On-call Engineer'];

  if (severity === 'sev2' || severity === 'sev1') {
    targets.push('Incident Commander');
  }

  if (severity === 'sev1' || affectedUsers >= 5000) {
    targets.push('Customer Support Lead');
  }

  if (severity === 'sev1') {
    targets.push('Executive Bridge');
  }

  return targets;
}

export function buildIncidentEscalationPacket(
  draft: IncidentDraft
): IncidentEscalationPacket {
  const checklist = ['영향 범위 확인', '고객 공지 채널 준비'];

  if (draft.rollbackReady) {
    checklist.push('rollback 실행 준비');
  } else {
    checklist.push('rollback 대안 경로 준비');
  }

  if (draft.communicationChannel === 'statuspage') {
    checklist.push('status page 초안 작성');
  }

  let priority: IncidentEscalationPriority = 'standard';

  if (draft.severity === 'sev2' || draft.affectedUsers >= 1000) {
    priority = 'elevated';
  }

  if (draft.severity === 'sev1' || draft.affectedUsers >= 5000) {
    priority = 'critical';
  }

  return {
    severity: draft.severity,
    communicationChannel: draft.communicationChannel,
    escalationTargets: buildEscalationTargets(
      draft.severity,
      draft.affectedUsers
    ),
    checklist,
    priority,
    summary: `${draft.severity.toUpperCase()} incident escalation packet for ${draft.incidentTitle}`,
  };
}
