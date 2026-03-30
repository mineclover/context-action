import type { OrderDraft, OrderPlan } from './orderDraft';

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
