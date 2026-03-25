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
    notes: 'Need rollout support for the first week.',
  };
}

export function validateOrderDraft(draft: OrderDraft): OrderValidationResult {
  const fieldErrors: OrderFieldErrors = {};

  if (!draft.customerName.trim()) {
    fieldErrors.customerName = 'Customer name is required.';
  }

  if (!draft.email.trim()) {
    fieldErrors.email = 'Work email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
    fieldErrors.email = 'Enter a valid work email address.';
  }

  if (!Number.isFinite(draft.quantity) || draft.quantity < 1) {
    fieldErrors.quantity = 'Quantity must be at least 1.';
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
        ? 'Validation passed. Ready to calculate quote.'
        : 'Please fix the highlighted fields before submitting.',
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
