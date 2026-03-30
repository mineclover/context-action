import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createRefContext,
  createStoreContext,
} from '@context-action/react';
import type {
  AccessActivityEvent,
  AccessRequestDraft,
  AccessRequestFieldErrors,
  AccessReviewState,
} from '../business/accessBusiness';
import {
  createEmptyAccessRequestDraft,
  createInitialAccessReviewState,
} from '../business/accessBusiness';

export interface AccessRequestStores {
  draft: AccessRequestDraft;
  validation: {
    fieldErrors: AccessRequestFieldErrors;
    focusField: keyof AccessRequestFieldErrors | null;
    hasAttemptedSubmit: boolean;
    summary: string;
  };
  review: AccessReviewState;
  activity: AccessActivityEvent[];
}

export interface AccessRequestActions extends ActionPayloadMap {
  updateDraft: Partial<AccessRequestDraft>;
  submitReview: void;
  prefillExample: void;
  resetDemo: void;
}

export interface AccessRequestRefs {
  requesterNameInput: HTMLInputElement;
  emailInput: HTMLInputElement;
  scopeSelect: HTMLSelectElement;
  justificationInput: HTMLTextAreaElement;
  statusPanel: HTMLDivElement;
}

export const initialAccessValidationState: AccessRequestStores['validation'] = {
  fieldErrors: {},
  focusField: null,
  hasAttemptedSubmit: false,
  summary: '입력 후 리뷰 패키지 생성을 눌러 approval 흐름을 확인해 보세요.',
};

export const initialAccessReviewState: AccessRequestStores['review'] =
  createInitialAccessReviewState();

export const initialAccessActivityState: AccessRequestStores['activity'] = [
  {
    id: 'boot-1',
    type: 'providers_ready',
  },
];

export const {
  Provider: AccessRequestStoreProvider,
  useStore: useAccessRequestStore,
  useStoreManager: useAccessRequestStoreManager,
} = createStoreContext<AccessRequestStores>('AccessRequestStores', {
  draft: {
    initialValue: createEmptyAccessRequestDraft(),
    strategy: 'shallow',
  },
  validation: {
    initialValue: initialAccessValidationState,
    strategy: 'shallow',
  },
  review: {
    initialValue: initialAccessReviewState,
    strategy: 'shallow',
  },
  activity: {
    initialValue: initialAccessActivityState,
    strategy: 'reference',
  },
});

export const {
  Provider: AccessRequestActionProvider,
  useActionDispatch: useAccessRequestDispatch,
  useActionHandler: useAccessRequestActionHandler,
} = createActionContext<AccessRequestActions>('AccessRequestActions');

export const {
  Provider: AccessRequestRefProvider,
  useRefHandler: useAccessRequestRef,
} = createRefContext<AccessRequestRefs>('AccessRequestRefs');
