import { createActionContext, createStoreContext } from '@context-action/react';
import type { OrderDraft } from '../business/orderDraft';
import type { OrderValidationIssue } from '../business/orderValidation';
import type { OrderSubmissionState } from '../business/orderStateMachine';

/**
 * Tier 1: Action Contracts
 */
export interface OrderActions {
  updateDraft: Partial<OrderDraft>;
  resetDraft: void;
  submitOrder: void;
  retrySubmission: void;
}

/**
 * Tier 1: Store Contracts
 */
export interface OrderStores {
  draft: OrderDraft;
  validationIssues: OrderValidationIssue[];
  submission: OrderSubmissionState;
  activityLog: string[];
}

export const {
  Provider: OrderActionProvider,
  useActionDispatch: useOrderActionDispatch,
  useActionHandler: useOrderActionHandler,
} = createActionContext<OrderActions>('OrderActions');

export const {
  Provider: OrderStoreProvider,
  useStore: useOrderStore,
} = createStoreContext<OrderStores>('OrderStores', {
  draft: {
    productId: 'prod-astryx-001',
    quantity: 1,
    shippingAddress: '서울특별시 강남구 테헤란로 123',
    paymentMethod: 'credit_card',
  },
  validationIssues: [],
  submission: {
    phase: 'idle',
    orderId: null,
    errorMessage: null,
  },
  activityLog: ['[시스템] 주문 워크스페이스가 초기화되었습니다.'],
});

export function OrderContextProvider({ children }: { children: React.ReactNode }) {
  return (
    <OrderActionProvider>
      <OrderStoreProvider>{children}</OrderStoreProvider>
    </OrderActionProvider>
  );
}
