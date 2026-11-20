import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createRefContext,
  createStoreContext,
} from '@context-action/react';
import type {
  RenewalActivityEvent,
  RenewalFieldErrors,
  RenewalReviewDraft,
  RenewalReviewState,
} from '../business/renewalBusiness';
import {
  createEmptyRenewalReviewDraft,
  createInitialRenewalReviewState,
} from '../business/renewalBusiness';

export interface RenewalRiskReviewStores {
  draft: RenewalReviewDraft;
  validation: {
    fieldErrors: RenewalFieldErrors;
    focusField: keyof RenewalFieldErrors | null;
    hasAttemptedSubmit: boolean;
    summary: string;
  };
  review: RenewalReviewState;
  activity: RenewalActivityEvent[];
}

export interface RenewalRiskReviewBusinessActions extends ActionPayloadMap {
  updateDraft: Partial<RenewalReviewDraft>;
  submitReview: void;
  prefillExample: void;
  resetDemo: void;
}

export type RenewalRiskReviewActions = RenewalRiskReviewBusinessActions;

export type RenewalRiskReviewInspectorTab = 'activity' | 'contract';

export interface RenewalRiskReviewLayoutActions extends ActionPayloadMap {
  setInspectorTab: { tab: RenewalRiskReviewInspectorTab };
}

export interface RenewalRiskReviewLayoutStores {
  inspectorTab: RenewalRiskReviewInspectorTab;
}

export interface RenewalRiskReviewRefs {
  accountNameInput: HTMLInputElement;
  renewalWindowSelect: HTMLSelectElement;
  usageScoreInput: HTMLInputElement;
  riskNotesInput: HTMLTextAreaElement;
  statusPanel: HTMLDivElement;
}

export const initialRenewalValidationState: RenewalRiskReviewStores['validation'] =
  {
    fieldErrors: {},
    focusField: null,
    hasAttemptedSubmit: false,
    summary:
      '입력 후 renewal review packet 생성을 눌러 lifecycle 흐름을 확인해 보세요.',
  };

export const initialRenewalReviewState: RenewalRiskReviewStores['review'] =
  createInitialRenewalReviewState();

export const initialRenewalActivityState: RenewalRiskReviewStores['activity'] =
  [
    {
      id: 'boot-1',
      type: 'providers_ready',
    },
  ];

export const {
  Provider: RenewalRiskReviewStoreProvider,
  useStore: useRenewalRiskReviewStore,
  useStoreManager: useRenewalRiskReviewStoreManager,
} = createStoreContext<RenewalRiskReviewStores>('RenewalRiskReviewStores', {
  draft: {
    initialValue: createEmptyRenewalReviewDraft(),
    strategy: 'shallow',
  },
  validation: {
    initialValue: initialRenewalValidationState,
    strategy: 'shallow',
  },
  review: {
    initialValue: initialRenewalReviewState,
    strategy: 'shallow',
  },
  activity: {
    initialValue: initialRenewalActivityState,
    strategy: 'reference',
  },
});

export const {
  Provider: RenewalRiskReviewActionProvider,
  useActionDispatch: useRenewalRiskReviewDispatch,
  useActionHandler: useRenewalRiskReviewActionHandler,
  useActionGuard: useRenewalRiskReviewActionGuard,
  useActionCommandHandler: useRenewalRiskReviewCommandHandler,
  useActionObserver: useRenewalRiskReviewActionObserver,
} = createActionContext<RenewalRiskReviewBusinessActions>(
  'RenewalRiskReviewActions'
);

export const {
  Provider: RenewalRiskReviewLayoutActionProvider,
  useActionDispatch: useRenewalRiskReviewLayoutDispatch,
  useActionCommandHandler: useRenewalRiskReviewLayoutCommandHandler,
} = createActionContext<RenewalRiskReviewLayoutActions>(
  'RenewalRiskReviewLayoutActions'
);

export const {
  Provider: RenewalRiskReviewLayoutStoreProvider,
  useStore: useRenewalRiskReviewLayoutStore,
} = createStoreContext<RenewalRiskReviewLayoutStores>(
  'RenewalRiskReviewLayoutStores',
  {
    inspectorTab: {
      initialValue: 'activity' as RenewalRiskReviewInspectorTab,
    },
  }
);

export const {
  Provider: RenewalRiskReviewRefProvider,
  useRefHandler: useRenewalRiskReviewRef,
} = createRefContext<RenewalRiskReviewRefs>('RenewalRiskReviewRefs');
