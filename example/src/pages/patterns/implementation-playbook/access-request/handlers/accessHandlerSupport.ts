import type {
  AccessActivityEvent,
  AccessRequestField,
  AccessRequestFieldErrors,
  AccessReviewState,
  AccessValidationCode,
  AccessValidationIssue,
  AccessValidationResult,
} from '../business/accessBusiness';

const validationMessages: Record<AccessValidationCode, string> = {
  requester_name_required: '요청자 이름을 입력해 주세요.',
  email_required: '업무용 이메일을 입력해 주세요.',
  email_invalid: '올바른 업무용 이메일 형식으로 입력해 주세요.',
  justification_required: '접근 목적을 적어 주세요.',
  justification_too_short: '접근 목적은 최소 24자 이상으로 적어 주세요.',
  production_requires_admin: '프로덕션 접근은 관리자 권한에서만 요청할 수 있습니다.',
};

const fieldOrder: Array<keyof AccessRequestFieldErrors> = [
  'requesterName',
  'email',
  'scope',
  'justification',
];

const fieldLabels: Record<AccessRequestField, string> = {
  requesterName: '요청자 이름',
  email: '업무용 이메일',
  scope: '권한 범위',
  justification: '접근 목적',
  productionAccess: '프로덕션 접근',
};

export function removeResolvedFieldErrors(
  fieldErrors: AccessRequestFieldErrors,
  changedKeys: string[]
): AccessRequestFieldErrors {
  const nextErrors = { ...fieldErrors };

  for (const key of changedKeys) {
    if (key in nextErrors) {
      delete nextErrors[key as keyof AccessRequestFieldErrors];
    }
  }

  return nextErrors;
}

function toFieldErrors(
  issues: AccessValidationIssue[]
): AccessRequestFieldErrors {
  const nextErrors: AccessRequestFieldErrors = {};

  for (const issue of issues) {
    nextErrors[issue.field] = validationMessages[issue.code];
  }

  return nextErrors;
}

function toFocusField(
  issues: AccessValidationIssue[]
): keyof AccessRequestFieldErrors | null {
  for (const field of fieldOrder) {
    if (issues.some((issue) => issue.field === field)) {
      return field;
    }
  }

  return null;
}

function summarizeIssueFields(issues: AccessValidationIssue[]) {
  const fields = new Set<keyof AccessRequestFieldErrors>();

  for (const issue of issues) {
    fields.add(issue.field);
  }

  return Array.from(fields).map((field) => fieldLabels[field]);
}

export function toValidationViewState(result: AccessValidationResult) {
  return {
    fieldErrors: toFieldErrors(result.issues),
    focusField: toFocusField(result.issues),
    summary: result.isValid
      ? '검증이 완료되었습니다. 리뷰 패키지를 조립할 수 있습니다.'
      : '강조된 항목을 수정한 뒤 다시 시도해 주세요.',
  };
}

export function toReviewViewState(review: AccessReviewState) {
  switch (review.phase) {
    case 'idle':
      return {
        label: '대기',
        message:
          review.reason === 'prefill_loaded'
            ? '샘플 요청이 준비되었습니다. 리뷰 패키지 생성을 눌러 흐름을 확인해 보세요.'
            : review.reason === 'draft_changed'
              ? '입력이 바뀌어 리뷰 준비 상태로 돌아왔습니다.'
              : '입력을 기다리고 있습니다.',
      };
    case 'validating':
      return {
        label: '검증',
        message: '요청 내용을 검증하고 있습니다.',
      };
    case 'blocked':
      return {
        label: '수정 필요',
        message: '강조된 항목을 수정한 뒤 다시 시도해 주세요.',
      };
    case 'packaging':
      return {
        label: '패키징',
        message: '리뷰 패키지를 조립하고 있습니다.',
      };
    case 'ready':
      return {
        label: '준비 완료',
        message: `${review.requesterName}님의 ${review.scope} 접근 요청 리뷰 패키지가 준비되었습니다.`,
      };
  }
}

export function isReviewBusy(review: AccessReviewState) {
  return review.phase === 'validating' || review.phase === 'packaging';
}

export function toActivityEntry(event: AccessActivityEvent) {
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
        step: '요청 갱신',
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
        detail: '리뷰 승인 경로를 바로 볼 수 있도록 예시 요청을 채웠습니다.',
        tone: 'info' as const,
      };
    case 'demo_reset':
      return {
        id: event.id,
        step: '예제 초기화',
        detail: 'draft, validation, review 상태를 초기값으로 되돌렸습니다.',
        tone: 'info' as const,
      };
    case 'review_requested':
      return {
        id: event.id,
        step: '검증 시작',
        detail: 'handler가 최신 access request draft를 읽었습니다.',
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
        step: '리뷰 패키지 조립',
        detail: '검증이 통과되어 business 레이어에서 review packet 조립을 시작했습니다.',
        tone: 'info' as const,
      };
    case 'packet_ready':
      return {
        id: event.id,
        step: '패키지 준비 완료',
        detail: `${event.scope} 요청이 ${event.priority} 우선순위로 정리되었습니다.`,
        tone: 'success' as const,
      };
  }
}
