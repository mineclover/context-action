import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createRefContext,
  createStoreContext,
} from '@context-action/react';
import type {
  IncidentActivityEvent,
  IncidentDraft,
  IncidentEscalationState,
  IncidentFieldErrors,
} from '../business/incidentBusiness';
import {
  createEmptyIncidentDraft,
  createInitialIncidentEscalationState,
} from '../business/incidentBusiness';

export interface IncidentEscalationStores {
  draft: IncidentDraft;
  validation: {
    fieldErrors: IncidentFieldErrors;
    focusField: keyof IncidentFieldErrors | null;
    hasAttemptedSubmit: boolean;
    summary: string;
  };
  escalation: IncidentEscalationState;
  activity: IncidentActivityEvent[];
}

export interface IncidentEscalationBusinessActions extends ActionPayloadMap {
  updateDraft: Partial<IncidentDraft>;
  submitEscalation: void;
  prefillExample: void;
  resetDemo: void;
}

export type IncidentEscalationActions = IncidentEscalationBusinessActions;

export type IncidentEscalationInspectorTab = 'activity' | 'contract';

export interface IncidentEscalationLayoutActions extends ActionPayloadMap {
  setInspectorTab: { tab: IncidentEscalationInspectorTab };
}

export interface IncidentEscalationLayoutStores {
  inspectorTab: IncidentEscalationInspectorTab;
}

export interface IncidentEscalationRefs {
  incidentTitleInput: HTMLInputElement;
  severitySelect: HTMLSelectElement;
  affectedUsersInput: HTMLInputElement;
  communicationChannelSelect: HTMLSelectElement;
  summaryInput: HTMLTextAreaElement;
  statusPanel: HTMLDivElement;
}

export const initialIncidentValidationState: IncidentEscalationStores['validation'] =
  {
    fieldErrors: {},
    focusField: null,
    hasAttemptedSubmit: false,
    summary:
      '입력 후 escalation packet 생성을 눌러 incident workflow를 확인해 보세요.',
  };

export const initialIncidentEscalationState: IncidentEscalationStores['escalation'] =
  createInitialIncidentEscalationState();

export const initialIncidentActivityState: IncidentEscalationStores['activity'] =
  [
    {
      id: 'boot-1',
      type: 'providers_ready',
    },
  ];

export const {
  Provider: IncidentEscalationStoreProvider,
  useStore: useIncidentEscalationStore,
  useStoreManager: useIncidentEscalationStoreManager,
} = createStoreContext<IncidentEscalationStores>('IncidentEscalationStores', {
  draft: {
    initialValue: createEmptyIncidentDraft(),
    strategy: 'shallow',
  },
  validation: {
    initialValue: initialIncidentValidationState,
    strategy: 'shallow',
  },
  escalation: {
    initialValue: initialIncidentEscalationState,
    strategy: 'shallow',
  },
  activity: {
    initialValue: initialIncidentActivityState,
    strategy: 'reference',
  },
});

export const {
  Provider: IncidentEscalationActionProvider,
  useActionDispatch: useIncidentEscalationDispatch,
  useActionHandler: useIncidentEscalationActionHandler,
  useActionGuard: useIncidentEscalationActionGuard,
  useActionEffectHandler: useIncidentEscalationEffectHandler,
  useActionObserver: useIncidentEscalationActionObserver,
} = createActionContext<IncidentEscalationBusinessActions>(
  'IncidentEscalationActions'
);

export const {
  Provider: IncidentEscalationLayoutActionProvider,
  useActionDispatch: useIncidentEscalationLayoutDispatch,
  useActionEffectHandler: useIncidentEscalationLayoutEffectHandler,
} = createActionContext<IncidentEscalationLayoutActions>(
  'IncidentEscalationLayoutActions'
);

export const {
  Provider: IncidentEscalationLayoutStoreProvider,
  useStore: useIncidentEscalationLayoutStore,
} = createStoreContext<IncidentEscalationLayoutStores>(
  'IncidentEscalationLayoutStores',
  {
    inspectorTab: {
      initialValue: 'activity' as IncidentEscalationInspectorTab,
    },
  }
);

export const {
  Provider: IncidentEscalationRefProvider,
  useRefHandler: useIncidentEscalationRef,
} = createRefContext<IncidentEscalationRefs>('IncidentEscalationRefs');
