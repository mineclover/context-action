import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';
import {
  initialUsecaseActivity,
  type UsecaseActivityEvent,
} from './business/live-usecase-activity';
import { type UsecaseWorkflowState } from './business/live-usecase-domain';

export type {
  ActivityTone,
  UsecaseActivityEvent,
} from './business/live-usecase-activity';
export { initialUsecaseActivity } from './business/live-usecase-activity';
export type {
  UsecasePacket,
  UsecasePhase,
  UsecaseWorkflowState,
} from './business/live-usecase-domain';

export interface LiveUsecaseStores {
  workflow: UsecaseWorkflowState;
  activity: UsecaseActivityEvent[];
}

export interface LiveUsecaseActions extends ActionPayloadMap {
  selectResource: string;
  changeReason: string;
  submitRequest: void;
  resetRequest: void;
}

export const initialUsecaseWorkflow: UsecaseWorkflowState = {
  resourceId: 'design-system',
  reason: '',
  phase: 'idle',
  error: null,
  packet: null,
};

export const {
  Provider: LiveUsecaseStoreProvider,
  useStore: useLiveUsecaseStore,
  useStoreManager: useLiveUsecaseStoreManager,
} = createStoreContext<LiveUsecaseStores>('LiveCodeEditorUsecaseStores', {
  workflow: {
    initialValue: initialUsecaseWorkflow,
    strategy: 'shallow',
  },
  activity: {
    initialValue: initialUsecaseActivity,
    strategy: 'reference',
  },
});

export const {
  Provider: LiveUsecaseActionProvider,
  useActionDispatch: useLiveUsecaseDispatch,
  useActionDispatchWithResult: useLiveUsecaseDispatchWithResult,
  useActionHandler: useLiveUsecaseActionHandler,
} = createActionContext<LiveUsecaseActions>('LiveCodeEditorUsecaseActions');
