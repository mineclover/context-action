import type {
  IncidentActivityEvent,
  IncidentDraftField,
  IncidentEscalationState,
  IncidentFieldErrors,
  IncidentValidationCode,
  IncidentValidationIssue,
  IncidentValidationResult,
} from '../business/incidentBusiness';

const validationMessages: Record<IncidentValidationCode, string> = {
  incident_title_required: '장애 제목을 입력해 주세요.',
  affected_users_min: '영향 사용자 수는 1 이상이어야 합니다.',
  summary_required: '장애 요약을 적어 주세요.',
  summary_too_short: '장애 요약은 최소 24자 이상으로 적어 주세요.',
  sev1_requires_statuspage: 'sev1 장애는 statuspage 공지 채널이 필요합니다.',
};

const fieldOrder: Array<keyof IncidentFieldErrors> = [
  'incidentTitle',
  'severity',
  'affectedUsers',
  'communicationChannel',
  'summary',
];

const fieldLabels: Record<IncidentDraftField, string> = {
  incidentTitle: '장애 제목',
  severity: '심각도',
  affectedUsers: '영향 사용자 수',
  rollbackReady: 'rollback 준비',
  communicationChannel: '공지 채널',
  summary: '장애 요약',
};

export function removeResolvedFieldErrors(
  fieldErrors: IncidentFieldErrors,
  changedKeys: string[]
): IncidentFieldErrors {
  const nextErrors = { ...fieldErrors };

  for (const key of changedKeys) {
    if (key in nextErrors) {
      delete nextErrors[key as keyof IncidentFieldErrors];
    }
  }

  return nextErrors;
}

function toFieldErrors(issues: IncidentValidationIssue[]): IncidentFieldErrors {
  const nextErrors: IncidentFieldErrors = {};

  for (const issue of issues) {
    nextErrors[issue.field] = validationMessages[issue.code];
  }

  return nextErrors;
}

function toFocusField(
  issues: IncidentValidationIssue[]
): keyof IncidentFieldErrors | null {
  for (const field of fieldOrder) {
    if (issues.some((issue) => issue.field === field)) {
      return field;
    }
  }

  return null;
}

function summarizeIssueFields(issues: IncidentValidationIssue[]) {
  const fields = new Set<keyof IncidentFieldErrors>();

  for (const issue of issues) {
    fields.add(issue.field);
  }

  return Array.from(fields).map((field) => fieldLabels[field]);
}

export function toValidationViewState(result: IncidentValidationResult) {
  return {
    fieldErrors: toFieldErrors(result.issues),
    focusField: toFocusField(result.issues),
    summary: result.isValid
      ? '검증이 완료되었습니다. escalation packet을 조립할 수 있습니다.'
      : '강조된 항목을 수정한 뒤 다시 시도해 주세요.',
  };
}

export function toEscalationViewState(escalation: IncidentEscalationState) {
  switch (escalation.phase) {
    case 'idle':
      return {
        label: '대기',
        message:
          escalation.reason === 'prefill_loaded'
            ? '샘플 incident가 준비되었습니다. escalation packet 생성을 눌러 흐름을 확인해 보세요.'
            : escalation.reason === 'draft_changed'
              ? '입력이 바뀌어 escalation 준비 상태로 돌아왔습니다.'
              : '입력을 기다리고 있습니다.',
      };
    case 'validating':
      return {
        label: '검증',
        message: 'incident 내용을 검증하고 있습니다.',
      };
    case 'blocked':
      return {
        label: '수정 필요',
        message: '강조된 항목을 수정한 뒤 다시 시도해 주세요.',
      };
    case 'assembling':
      return {
        label: '조립',
        message: 'escalation packet을 조립하고 있습니다.',
      };
    case 'ready':
      return {
        label: '준비 완료',
        message: `${escalation.severity?.toUpperCase()} incident escalation packet이 준비되었습니다.`,
      };
  }
}

export function isEscalationBusy(escalation: IncidentEscalationState) {
  return escalation.phase === 'validating' || escalation.phase === 'assembling';
}

export function toActivityEntry(event: IncidentActivityEvent) {
  switch (event.type) {
    case 'providers_ready':
      return {
        id: event.id,
        step: '경계 준비 완료',
        detail: 'Action, Store, Ref provider가 모두 마운트되었습니다.',
        tone: 'info' as const,
      };
    case 'draft_updated':
      return {
        id: event.id,
        step: '장애 정보 갱신',
        detail: event.fields.length
          ? `입력값이 갱신되었습니다: ${event.fields
              .map((field) => fieldLabels[field])
              .join(', ')}`
          : '변경된 항목이 없습니다.',
        tone: 'info' as const,
      };
    case 'sample_loaded':
      return {
        id: event.id,
        step: '샘플 불러오기',
        detail:
          'incident escalation 경로를 바로 볼 수 있도록 예시 입력을 채웠습니다.',
        tone: 'info' as const,
      };
    case 'demo_reset':
      return {
        id: event.id,
        step: '예제 초기화',
        detail: 'draft, validation, escalation 상태를 초기값으로 되돌렸습니다.',
        tone: 'info' as const,
      };
    case 'escalation_requested':
      return {
        id: event.id,
        step: '검증 시작',
        detail: 'handler가 최신 incident draft를 읽었습니다.',
        tone: 'info' as const,
      };
    case 'validation_failed':
      return {
        id: event.id,
        step: '검증 실패',
        detail: summarizeIssueFields(event.issues).length
          ? `${summarizeIssueFields(event.issues).join(', ')} 항목을 확인해 주세요.`
          : '강조된 항목을 수정한 뒤 다시 시도해 주세요.',
        tone: 'warning' as const,
      };
    case 'validation_passed':
      return {
        id: event.id,
        step: '패킷 조립',
        detail:
          '검증이 통과되어 business 레이어에서 escalation packet 조립을 시작했습니다.',
        tone: 'info' as const,
      };
    case 'packet_ready':
      return {
        id: event.id,
        step: '패킷 준비 완료',
        detail: `${event.severity.toUpperCase()} incident가 ${event.priority} 우선순위로 정리되었고 ${event.channel} 채널이 선택되었습니다.`,
        tone: 'success' as const,
      };
  }
}
