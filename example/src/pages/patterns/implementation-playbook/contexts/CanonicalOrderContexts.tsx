import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createRefContext,
  createStoreContext,
} from '@context-action/react';
import type {
  OrderActivityEvent,
  OrderDraft,
  OrderFieldErrors,
  OrderSubmissionState,
} from '../business/orderBusiness';
import {
  createEmptyOrderDraft,
  createInitialSubmissionState,
} from '../business/orderBusiness';

export interface CanonicalOrderStores {
  draft: OrderDraft;
  validation: {
    fieldErrors: OrderFieldErrors;
    focusField: keyof OrderFieldErrors | null;
    hasAttemptedSubmit: boolean;
    summary: string;
  };
  submission: OrderSubmissionState;
  activity: OrderActivityEvent[];
}

export interface CanonicalOrderActions extends ActionPayloadMap {
  updateDraft: Partial<OrderDraft>;
  submitOrder: void;
  prefillExample: void;
  resetDemo: void;
}

export interface CanonicalOrderRefs {
  customerNameInput: HTMLInputElement;
  emailInput: HTMLInputElement;
  quantityInput: HTMLInputElement;
  statusPanel: HTMLDivElement;
}

export const initialValidationState: CanonicalOrderStores['validation'] = {
  fieldErrors: {},
  focusField: null,
  hasAttemptedSubmit: false,
  summary: '입력 후 견적 생성을 눌러 전체 흐름을 확인해 보세요.',
};

export const initialSubmissionState: CanonicalOrderStores['submission'] =
  createInitialSubmissionState();

export const initialActivityState: CanonicalOrderStores['activity'] = [
  {
    id: 'boot-1',
    occurredAt: new Date().toISOString(),
    type: 'providers_ready',
  },
];

export const {
  Provider: CanonicalOrderStoreProvider,
  useStore: useCanonicalOrderStore,
  useStoreManager: useCanonicalOrderStoreManager,
} = createStoreContext<CanonicalOrderStores>('CanonicalOrderStores', {
  draft: {
    initialValue: createEmptyOrderDraft(),
    strategy: 'shallow',
    description: 'Current order draft managed by Store Context.',
  },
  validation: {
    initialValue: initialValidationState,
    strategy: 'shallow',
  },
  submission: {
    initialValue: initialSubmissionState,
    strategy: 'shallow',
  },
  activity: {
    initialValue: initialActivityState,
    strategy: 'reference',
  },
});

export const {
  Provider: CanonicalOrderActionProvider,
  useActionDispatch: useCanonicalOrderDispatch,
  useActionHandler: useCanonicalOrderActionHandler,
} = createActionContext<CanonicalOrderActions>('CanonicalOrderActions');

export const {
  Provider: CanonicalOrderRefProvider,
  useRefHandler: useCanonicalOrderRef,
} = createRefContext<CanonicalOrderRefs>('CanonicalOrderRefs');
