import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';

export type UsecasePhase =
  | 'idle'
  | 'validating'
  | 'packaging'
  | 'ready'
  | 'blocked';

export type ActivityTone = 'info' | 'success' | 'blocked';

export interface UsecaseWorkflowState {
  resourceId: string;
  reason: string;
  phase: UsecasePhase;
  error: string | null;
  packet: {
    priority: 'normal' | 'high';
    scope: string;
  } | null;
}

export interface UsecaseActivityEvent {
  id: number;
  layer: 'contract' | 'handler' | 'business' | 'facade' | 'recipe';
  label: string;
  detail: string;
  tone: ActivityTone;
}

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

export const initialUsecaseActivity: UsecaseActivityEvent[] = [
  {
    id: 1,
    layer: 'contract',
    label: 'Scope mounted',
    detail: 'Action, Store, Facade, Recipe 경계를 준비했습니다.',
    tone: 'info',
  },
];

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
