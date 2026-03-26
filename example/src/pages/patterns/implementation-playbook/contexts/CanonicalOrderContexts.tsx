import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createRefContext,
  createStoreContext,
} from '@context-action/react';
import type {
  OrderDraft,
  OrderFieldErrors,
  OrderQuote,
} from '../business/orderBusiness';
import { createEmptyOrderDraft } from '../business/orderBusiness';

export interface CanonicalOrderStores {
  draft: OrderDraft;
  validation: {
    fieldErrors: OrderFieldErrors;
    focusField: keyof OrderFieldErrors | null;
    hasAttemptedSubmit: boolean;
    summary: string;
  };
  submission: {
    status: 'idle' | 'validating' | 'submitting' | 'success' | 'error';
    message: string;
    quote: OrderQuote | null;
    submittedAt: string | null;
  };
  activity: Array<{
    id: string;
    step: string;
    detail: string;
    tone: 'info' | 'success' | 'warning';
  }>;
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

export const initialSubmissionState: CanonicalOrderStores['submission'] = {
  status: 'idle',
  message: '입력을 기다리고 있습니다.',
  quote: null,
  submittedAt: null,
};

export const initialActivityState: CanonicalOrderStores['activity'] = [
  {
    id: 'boot-1',
    step: '경계 준비 완료',
    detail: 'Action, Store, Ref provider가 모두 마운트되었습니다.',
    tone: 'info',
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
