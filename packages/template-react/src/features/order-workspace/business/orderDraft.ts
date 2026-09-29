/**
 * Tier 1: Order Draft Model
 * 순수 비즈니스 데이터 모델 및 기본값 생성기.
 */

export interface OrderDraft {
  productId: string;
  quantity: number;
  shippingAddress: string;
  paymentMethod: string;
}

export function createDefaultOrderDraft(): OrderDraft {
  return {
    productId: 'prod-astryx-001',
    quantity: 1,
    shippingAddress: '',
    paymentMethod: 'credit_card',
  };
}
