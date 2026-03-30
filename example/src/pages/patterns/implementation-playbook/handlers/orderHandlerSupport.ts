import type {
  OrderActivityEvent,
  OrderDraftField,
  OrderFieldErrors,
  OrderSubmissionState,
  OrderValidationCode,
  OrderValidationIssue,
  OrderValidationResult,
} from '../business/orderBusiness';

const validationMessages: Record<OrderValidationCode, string> = {
  customer_name_required: '담당자 이름을 입력해 주세요.',
  email_required: '업무용 이메일을 입력해 주세요.',
  email_invalid: '올바른 업무용 이메일 형식으로 입력해 주세요.',
  quantity_min: '좌석 수는 1 이상이어야 합니다.',
};

const fieldOrder: Array<keyof OrderFieldErrors> = [
  'customerName',
  'email',
  'quantity',
];

const draftFieldLabels: Record<OrderDraftField, string> = {
  customerName: '담당자 이름',
  email: '업무용 이메일',
  quantity: '좌석 수',
  plan: '플랜',
  onboarding: '온보딩 옵션',
  notes: '도입 메모',
};

export function removeResolvedFieldErrors(
  fieldErrors: OrderFieldErrors,
  changedKeys: string[]
): OrderFieldErrors {
  const nextErrors = { ...fieldErrors };

  for (const key of changedKeys) {
    if (key in nextErrors) {
      delete nextErrors[key as keyof OrderFieldErrors];
    }
  }

  return nextErrors;
}

function toFieldErrors(issues: OrderValidationIssue[]): OrderFieldErrors {
  const fieldErrors: OrderFieldErrors = {};

  for (const issue of issues) {
    fieldErrors[issue.field] = validationMessages[issue.code];
  }

  return fieldErrors;
}

function toFocusField(
  issues: OrderValidationIssue[]
): keyof OrderFieldErrors | null {
  for (const field of fieldOrder) {
    if (issues.some((issue) => issue.field === field)) {
      return field;
    }
  }

  return null;
}

export function toValidationViewState(result: OrderValidationResult) {
  return {
    fieldErrors: toFieldErrors(result.issues),
    focusField: toFocusField(result.issues),
    summary: result.isValid
      ? '검증이 완료되었습니다. 견적을 계산할 수 있습니다.'
      : '강조된 항목을 수정한 뒤 다시 시도해 주세요.',
  };
}

function summarizeIssueFields(issues: OrderValidationIssue[]) {
  const fields = new Set<keyof OrderFieldErrors>();

  for (const issue of issues) {
    fields.add(issue.field);
  }

  return Array.from(fields).map((field) => draftFieldLabels[field]);
}

export function toActivityEntry(event: OrderActivityEvent) {
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
        step: '입력값 갱신',
        detail: event.fields.length
          ? `입력값이 갱신되었습니다: ${event.fields
              .map((field) => draftFieldLabels[field])
              .join(', ')}`
          : '변경된 항목이 없습니다.',
        tone: 'info' as const,
      };

    case 'sample_loaded':
      return {
        id: event.id,
        step: '샘플 불러오기',
        detail: '정상 제출 경로를 바로 볼 수 있도록 예시 입력을 채웠습니다.',
        tone: 'info' as const,
      };

    case 'demo_reset':
      return {
        id: event.id,
        step: '예제 초기화',
        detail: 'draft, validation, submission 상태를 초기값으로 되돌렸습니다.',
        tone: 'info' as const,
      };

    case 'submission_requested':
      return {
        id: event.id,
        step: '검증 시작',
        detail: 'handler가 Store Context에서 최신 draft를 읽었습니다.',
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
        step: '비즈니스 로직 실행',
        detail: '검증이 통과되어 business 레이어에서 견적 계산을 시작했습니다.',
        tone: 'info' as const,
      };

    case 'quote_ready':
      return {
        id: event.id,
        step: '견적 준비 완료',
        detail: `${event.plan === 'starter' ? '스타터' : '팀'} 플랜 최종 견적은 $${event.total.toFixed(
          2
        )} 입니다.`,
        tone: 'success' as const,
      };
  }
}

export function toSubmissionViewState(submission: OrderSubmissionState) {
  switch (submission.phase) {
    case 'idle':
      return {
        label: '대기',
        message:
          submission.reason === 'prefill_loaded'
            ? '샘플 입력이 준비되었습니다. 견적 생성을 눌러 흐름을 확인해 보세요.'
            : submission.reason === 'draft_changed'
              ? '입력이 바뀌어 다시 제출 대기 상태로 돌아왔습니다.'
              : '입력을 기다리고 있습니다.',
      };

    case 'validating':
      return {
        label: '검증',
        message: '입력값을 검증하고 있습니다.',
      };

    case 'blocked':
      return {
        label: '수정 필요',
        message: '강조된 항목을 수정한 뒤 다시 시도해 주세요.',
      };

    case 'calculating':
      return {
        label: '계산',
        message: '견적을 계산하고 상태를 반영하고 있습니다.',
      };

    case 'success':
      return {
        label: '완료',
        message: `${submission.customerName}님 ${submission.plan === 'starter' ? '스타터' : '팀'} 견적이 준비되었습니다.`,
      };
  }
}

export function isSubmissionBusy(submission: OrderSubmissionState) {
  return (
    submission.phase === 'validating' || submission.phase === 'calculating'
  );
}
