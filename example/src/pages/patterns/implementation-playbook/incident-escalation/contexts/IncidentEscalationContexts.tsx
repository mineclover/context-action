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

export interface IncidentEscalationActions extends ActionPayloadMap {
  updateDraft: Partial<IncidentDraft>;
  submitEscalation: void;
  prefillExample: void;
  resetDemo: void;
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
} = createActionContext<IncidentEscalationActions>('IncidentEscalationActions');

export const {
  Provider: IncidentEscalationRefProvider,
  useRefHandler: useIncidentEscalationRef,
} = createRefContext<IncidentEscalationRefs>('IncidentEscalationRefs');
