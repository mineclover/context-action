import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';

export interface ActionPriorityDemoActions extends ActionPayloadMap {
  authenticate: { username: string; password: string };
  resetResults: void;
  setExecutionStatus: { isExecuting: boolean };
}

export interface ActionPriorityDemoHandlerResult {
  id: string;
  priority: number;
  step: string;
  result: unknown;
  timestamp: number;
  duration: number;
}

export interface ActionPriorityDemoStores {
  executionResults: ActionPriorityDemoHandlerResult[];
  isExecuting: boolean;
}

export const {
  Provider: ActionPriorityDemoActionProvider,
  useActionDispatch: useActionPriorityDemoAction,
  useActionHandler: useActionPriorityDemoActionHandler,
} = createActionContext<ActionPriorityDemoActions>(
  'ActionPriorityDemo-actions'
);

export const {
  Provider: ActionPriorityDemoStoreProvider,
  useStore: useActionPriorityDemoStore,
} = createStoreContext<ActionPriorityDemoStores>('ActionPriorityDemo-stores', {
  executionResults: {
    initialValue: [],
    strategy: 'reference',
    description: 'Ordered results emitted by the priority pipeline.',
  },
  isExecuting: {
    initialValue: false,
    description: 'Whether the authentication pipeline is currently running.',
  },
});
