import { useStoreValue } from '@context-action/react';
import { useMemo } from 'react';
import type { OrderActivityEvent } from '../business/orderActivity';
import type { OrderDraft } from '../business/orderDraft';
import type { OrderValidationCode, OrderValidationIssue } from '../business/orderValidation';
import { useOrderRefHandler, useOrderStore } from '../contexts/OrderContexts';

const VALIDATION_MESSAGES: Record<OrderValidationCode, string> = {
  product_required: '상품을 선택해 주세요.',
  quantity_too_low: '주문 수량은 1개 이상이어야 합니다.',
  quantity_too_high: '1회 주문 시 최대 99개까지만 가능합니다.',
  shipping_address_required: '배송지 주소를 입력해 주세요.',
  payment_method_required: '결제 수단을 선택해 주세요.',
};

function formatValidationIssue(issue: OrderValidationIssue): string {
  return VALIDATION_MESSAGES[issue.code];
}

function formatActivityEvent(event: OrderActivityEvent): string {
  switch (event.type) {
    case 'workspace_initialized':
      return '[시스템] 주문 워크스페이스가 초기화되었습니다.';
    case 'draft_reset':
      return '[입력] 주문서가 기본값으로 초기화되었습니다.';
    case 'validation_failed':
      return `[검증 실패] ${event.issueCount}건의 입력 오류가 발견되었습니다.`;
    case 'submission_started':
      return `[서버 전송] 주문 요청을 처리 중입니다... (수량: ${event.quantity})`;
    case 'order_completed':
      return `[주문 성공] 주문이 체결되었습니다! (주문번호: ${event.orderId})`;
  }
}

export function useOrderData() {
  const draftStore = useOrderStore('draft');
  const validationStore = useOrderStore('validationIssues');
  const submissionStore = useOrderStore('submission');
  const activityStore = useOrderStore('activityLog');

  const draft = useStoreValue(draftStore);
  const validationIssues = useStoreValue(validationStore);
  const submission = useStoreValue(submissionStore);
  const activityLog = useStoreValue(activityStore);

  const productIdRef = useOrderRefHandler('productId');
  const quantityRef = useOrderRefHandler('quantity');
  const shippingAddressRef = useOrderRefHandler('shippingAddress');

  const fieldErrors = useMemo(() => {
    const errors: Partial<Record<keyof OrderDraft, string>> = {};
    for (const issue of validationIssues) {
      errors[issue.field] = formatValidationIssue(issue);
    }
    return errors;
  }, [validationIssues]);

  const activityMessages = useMemo(
    () => activityLog.map(formatActivityEvent),
    [activityLog]
  );

  const fieldRefs = useMemo(
    () => ({
      productId: productIdRef,
      quantity: quantityRef,
      shippingAddress: shippingAddressRef,
    }),
    [productIdRef, quantityRef, shippingAddressRef]
  );

  const isSubmitting =
    submission.phase === 'validating' || submission.phase === 'submitting';
  const isSuccess = submission.phase === 'success';

  return {
    draft,
    fieldErrors,
    submission,
    activityMessages,
    isSubmitting,
    isSuccess,
    fieldRefs,
  };
}
