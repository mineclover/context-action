import type {
  RenewalActivityEvent,
  RenewalDraftField,
  RenewalFieldErrors,
  RenewalReviewState,
  RenewalValidationCode,
  RenewalValidationIssue,
  RenewalValidationResult,
} from '../business/renewalBusiness';

const validationMessages: Record<RenewalValidationCode, string> = {
  account_name_required: '계정 이름을 입력해 주세요.',
  usage_score_range: '사용량 점수는 0에서 100 사이여야 합니다.',
  risk_notes_required: '리스크 메모를 적어 주세요.',
  risk_notes_too_short: '리스크 메모는 최소 24자 이상으로 적어 주세요.',
  short_window_requires_sponsor:
    '30일 이내 갱신은 executive sponsor가 필요합니다.',
};

const fieldOrder: Array<keyof RenewalFieldErrors> = [
  'accountName',
  'renewalWindow',
  'usageScore',
  'riskNotes',
];

const fieldLabels: Record<RenewalDraftField, string> = {
  accountName: '계정 이름',
  renewalWindow: '갱신 윈도우',
  usageScore: '사용량 점수',
  riskNotes: '리스크 메모',
  executiveSponsor: 'executive sponsor',
};

export function removeResolvedFieldErrors(
  fieldErrors: RenewalFieldErrors,
  changedKeys: string[]
): RenewalFieldErrors {
  const nextErrors = { ...fieldErrors };

  for (const key of changedKeys) {
    if (key in nextErrors) {
      delete nextErrors[key as keyof RenewalFieldErrors];
    }
  }

  return nextErrors;
}

function toFieldErrors(issues: RenewalValidationIssue[]): RenewalFieldErrors {
  const nextErrors: RenewalFieldErrors = {};

  for (const issue of issues) {
    nextErrors[issue.field] = validationMessages[issue.code];
  }

  return nextErrors;
}

function toFocusField(
  issues: RenewalValidationIssue[]
): keyof RenewalFieldErrors | null {
  for (const field of fieldOrder) {
    if (issues.some((issue) => issue.field === field)) {
      return field;
    }
  }

  return null;
}

function summarizeIssueFields(issues: RenewalValidationIssue[]) {
  const fields = new Set<keyof RenewalFieldErrors>();

  for (const issue of issues) {
    fields.add(issue.field);
  }

  return Array.from(fields).map((field) => fieldLabels[field]);
}

export function toValidationViewState(result: RenewalValidationResult) {
  return {
    fieldErrors: toFieldErrors(result.issues),
    focusField: toFocusField(result.issues),
    summary: result.isValid
      ? '검증이 완료되었습니다. renewal review packet을 만들 수 있습니다.'
      : '강조된 항목을 수정한 뒤 다시 시도해 주세요.',
  };
}

export function toReviewViewState(review: RenewalReviewState) {
  switch (review.phase) {
    case 'idle':
      return {
        label: '대기',
        message:
          review.reason === 'prefill_loaded'
            ? '샘플 renewal review가 준비되었습니다. packet 생성을 눌러 흐름을 확인해 보세요.'
            : review.reason === 'draft_changed'
              ? '입력이 바뀌어 renewal review 준비 상태로 돌아왔습니다.'
              : '입력을 기다리고 있습니다.',
      };
    case 'validating':
      return {
        label: '검증',
        message: 'renewal input을 검증하고 있습니다.',
      };
    case 'blocked':
      return {
        label: '수정 필요',
        message: '강조된 항목을 수정한 뒤 다시 시도해 주세요.',
      };
    case 'scoring':
      return {
        label: '점수 계산',
        message: 'renewal risk packet을 계산하고 있습니다.',
      };
    case 'ready':
      return {
        label: '준비 완료',
        message: `${review.accountName} renewal review packet이 준비되었습니다.`,
      };
  }
}

export function isReviewBusy(review: RenewalReviewState) {
  return review.phase === 'validating' || review.phase === 'scoring';
}

export function toActivityEntry(event: RenewalActivityEvent) {
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
        step: '리뷰 정보 갱신',
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
        detail: 'renewal review 경로를 바로 볼 수 있도록 예시 입력을 채웠습니다.',
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
        detail: 'handler가 최신 renewal review draft를 읽었습니다.',
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
        step: '리스크 점수 계산',
        detail: '검증이 통과되어 business 레이어에서 renewal review packet 계산을 시작했습니다.',
        tone: 'info' as const,
      };
    case 'packet_ready':
      return {
        id: event.id,
        step: '리뷰 패킷 준비 완료',
        detail: `${event.renewalWindow} window가 ${event.riskBand} 리스크로 정리되었습니다.`,
        tone: 'success' as const,
      };
  }
}
