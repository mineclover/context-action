import {
  type ActionPayloadMap,
  createActionContext,
  createRefContext,
  createStoreContext,
} from '@context-action/react';
import type { ReactNode } from 'react';
import type { OrderActivityEvent } from '../business/orderActivity';
import type { OrderDraft } from '../business/orderDraft';
import type { OrderSubmissionState } from '../business/orderStateMachine';
import type { OrderValidationIssue } from '../business/orderValidation';

/**
 * Tier 1: Business vs Layout Action Contracts (No Mixed Payloads)
 */
export interface OrderBusinessActions extends ActionPayloadMap {
  updateDraft: Partial<OrderDraft>;
  resetDraft: void;
  submitOrder: void;
  retrySubmission: void;
}

export interface OrderLayoutActions extends ActionPayloadMap {
  focusField: { field: keyof OrderDraft };
}

/**
 * Tier 1: Store Contracts
 */
export interface OrderStores {
  draft: OrderDraft;
  validationIssues: OrderValidationIssue[];
  submission: OrderSubmissionState;
  activityLog: OrderActivityEvent[];
}

/**
 * Tier 3: Imperative Focus Ref Targets
 */
export interface OrderRefs {
  productId: HTMLSelectElement;
  quantity: HTMLInputElement;
  shippingAddress: HTMLInputElement;
}

export const {
  Provider: OrderBusinessActionProvider,
  useActionDispatch: useOrderBusinessDispatch,
  useActionGuard: useOrderBusinessActionGuard,
  useActionCommandHandler: useOrderBusinessActionCommandHandler,
  useActionObserver: useOrderBusinessActionObserver,
} = createActionContext<OrderBusinessActions>('OrderBusinessActions');

export const {
  Provider: OrderLayoutActionProvider,
  useActionDispatch: useOrderLayoutDispatch,
  useActionCommandHandler: useOrderLayoutActionCommandHandler,
} = createActionContext<OrderLayoutActions>('OrderLayoutActions');

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
    errorCode: null,
  },
  activityLog: [{ type: 'workspace_initialized' }],
});

export const {
  Provider: OrderRefProvider,
  useRefHandler: useOrderRefHandler,
} = createRefContext<OrderRefs>('OrderRefs');

export function OrderContextProvider({ children }: { children: ReactNode }) {
  return (
    <OrderBusinessActionProvider>
      <OrderLayoutActionProvider>
        <OrderStoreProvider>
          <OrderRefProvider>{children}</OrderRefProvider>
        </OrderStoreProvider>
      </OrderLayoutActionProvider>
    </OrderBusinessActionProvider>
  );
}
