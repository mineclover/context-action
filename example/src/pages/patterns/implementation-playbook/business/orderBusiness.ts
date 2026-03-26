export type OrderPlan = 'starter' | 'team';

export interface OrderDraft {
  customerName: string;
  email: string;
  quantity: number;
  plan: OrderPlan;
  onboarding: boolean;
  notes: string;
}

export interface OrderFieldErrors {
  customerName?: string;
  email?: string;
  quantity?: string;
}

export interface OrderValidationResult {
  isValid: boolean;
  fieldErrors: OrderFieldErrors;
  focusField: keyof OrderFieldErrors | null;
  summary: string;
}

export interface OrderQuote {
  plan: OrderPlan;
  seats: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  onboardingFee: number;
  total: number;
}

const PLAN_PRICING: Record<OrderPlan, number> = {
  starter: 24,
  team: 42,
};

export function createEmptyOrderDraft(): OrderDraft {
  return {
    customerName: '',
    email: '',
    quantity: 1,
    plan: 'starter',
    onboarding: false,
    notes: '',
  };
}

export function createExampleOrderDraft(): OrderDraft {
  return {
    customerName: 'Avery Kim',
    email: 'avery@example.com',
    quantity: 6,
    plan: 'team',
    onboarding: true,
    notes: '첫 주 온보딩과 운영 가이드가 필요합니다.',
  };
}

export function validateOrderDraft(draft: OrderDraft): OrderValidationResult {
  const fieldErrors: OrderFieldErrors = {};

  if (!draft.customerName.trim()) {
    fieldErrors.customerName = '담당자 이름을 입력해 주세요.';
  }

  if (!draft.email.trim()) {
    fieldErrors.email = '업무용 이메일을 입력해 주세요.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
    fieldErrors.email = '올바른 업무용 이메일 형식으로 입력해 주세요.';
  }

  if (!Number.isFinite(draft.quantity) || draft.quantity < 1) {
    fieldErrors.quantity = '좌석 수는 1 이상이어야 합니다.';
  }

  const focusField =
    fieldErrors.customerName !== undefined
      ? 'customerName'
      : fieldErrors.email !== undefined
        ? 'email'
        : fieldErrors.quantity !== undefined
          ? 'quantity'
          : null;

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    focusField,
    summary:
      Object.keys(fieldErrors).length === 0
        ? '검증이 완료되었습니다. 견적을 계산할 수 있습니다.'
        : '강조된 항목을 수정한 뒤 다시 시도해 주세요.',
  };
}

export function buildOrderQuote(draft: OrderDraft): OrderQuote {
  const unitPrice = PLAN_PRICING[draft.plan];
  const subtotal = unitPrice * draft.quantity;
  const discount = draft.quantity >= 5 ? subtotal * 0.1 : 0;
  const onboardingFee = draft.onboarding ? 199 : 0;

  return {
    plan: draft.plan,
    seats: draft.quantity,
    unitPrice,
    subtotal,
    discount,
    onboardingFee,
    total: subtotal - discount + onboardingFee,
  };
}
