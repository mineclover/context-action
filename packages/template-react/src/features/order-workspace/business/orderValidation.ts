import type { OrderDraft } from './orderDraft';

export type OrderValidationCode =
  | 'product_required'
  | 'quantity_too_low'
  | 'quantity_too_high'
  | 'shipping_address_required'
  | 'payment_method_required';

export interface OrderValidationIssue {
  field: keyof OrderDraft;
  code: OrderValidationCode;
}

export interface OrderValidationResult {
  isValid: boolean;
  issues: OrderValidationIssue[];
}

/**
 * 주문 초안 입력값 유효성 검증 순수 함수.
 * UI 문구를 직접 생성하지 않고 구조화된 도메인 검증 코드를 반환합니다.
 *
 * @evidenceReview specs/canonical-order.tsp#OrderValidationPolicy #65a0cfc
 */
export function validateOrderDraft(draft: OrderDraft): OrderValidationResult {
  const issues: OrderValidationIssue[] = [];

  if (!draft.productId || draft.productId.trim().length === 0) {
    issues.push({
      field: 'productId',
      code: 'product_required',
    });
  }

  if (!Number.isFinite(draft.quantity) || draft.quantity < 1) {
    issues.push({
      field: 'quantity',
      code: 'quantity_too_low',
    });
  } else if (draft.quantity > 99) {
    issues.push({
      field: 'quantity',
      code: 'quantity_too_high',
    });
  }

  if (!draft.shippingAddress || draft.shippingAddress.trim().length === 0) {
    issues.push({
      field: 'shippingAddress',
      code: 'shipping_address_required',
    });
  }

  if (!draft.paymentMethod || draft.paymentMethod.trim().length === 0) {
    issues.push({
      field: 'paymentMethod',
      code: 'payment_method_required',
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
