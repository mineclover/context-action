import type { OrderDraft } from './orderDraft';

export interface OrderValidationIssue {
  field: keyof OrderDraft;
  message: string;
}

export interface OrderValidationResult {
  isValid: boolean;
  issues: OrderValidationIssue[];
}

/**
 * 주문 초안 입력값 유효성 검증 순수 함수.
 * 
 * @evidenceReview specs/canonical-order.tsp#OrderValidationPolicy #65a0cfc
 */
export function validateOrderDraft(draft: OrderDraft): OrderValidationResult {
  const issues: OrderValidationIssue[] = [];

  if (!draft.productId || draft.productId.trim().length === 0) {
    issues.push({
      field: 'productId',
      message: '상품을 선택해 주세요.',
    });
  }

  if (!Number.isFinite(draft.quantity) || draft.quantity < 1) {
    issues.push({
      field: 'quantity',
      message: '주문 수량은 1개 이상이어야 합니다.',
    });
  } else if (draft.quantity > 99) {
    issues.push({
      field: 'quantity',
      message: '1회 주문 시 최대 99개까지만 가능합니다.',
    });
  }

  if (!draft.shippingAddress || draft.shippingAddress.trim().length === 0) {
    issues.push({
      field: 'shippingAddress',
      message: '배송지 주소를 입력해 주세요.',
    });
  }

  if (!draft.paymentMethod || draft.paymentMethod.trim().length === 0) {
    issues.push({
      field: 'paymentMethod',
      message: '결제 수단을 선택해 주세요.',
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
