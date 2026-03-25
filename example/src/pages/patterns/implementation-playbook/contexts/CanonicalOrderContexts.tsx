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
  summary: 'Complete the form and submit to see the handler flow.',
};

export const initialSubmissionState: CanonicalOrderStores['submission'] = {
  status: 'idle',
  message: 'Waiting for input.',
  quote: null,
  submittedAt: null,
};

export const initialActivityState: CanonicalOrderStores['activity'] = [
  {
    id: 'boot-1',
    step: 'Boundary ready',
    detail: 'Providers mounted for Action, Store, and Ref contexts.',
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
