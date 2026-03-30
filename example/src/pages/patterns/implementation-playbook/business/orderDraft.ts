export type OrderPlan = 'starter' | 'team';

export interface OrderDraft {
  customerName: string;
  email: string;
  quantity: number;
  plan: OrderPlan;
  onboarding: boolean;
  notes: string;
}

export type OrderDraftField = keyof OrderDraft;

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
