import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';
import type {
  PriorityExecutionStatus,
  RegisteredPriorityAction,
} from '../business/priority-demo-rules';

export interface PriorityDemoActions extends ActionPayloadMap {
  registerWord: { priority: number; word: string };
  executeRegistered: void;
  clear: void;
}

export interface PriorityDemoStores {
  registeredActions: RegisteredPriorityAction[];
  executionResult: string;
  isExecuting: boolean;
  executionStatus: PriorityExecutionStatus[];
}

export const {
  Provider: PriorityDemoActionProvider,
  useActionDispatch: usePriorityDemoAction,
  useActionHandler: usePriorityDemoActionHandler,
} = createActionContext<PriorityDemoActions>('ActionGuardPriorityDemo');

export const {
  Provider: PriorityDemoStoreProvider,
  useStore: usePriorityDemoStore,
} = createStoreContext<PriorityDemoStores>('ActionGuardPriorityDemo', {
  registeredActions: {
    initialValue: [],
    strategy: 'reference',
    description: 'Priority words registered by the demo user.',
  },
  executionResult: {
    initialValue: '',
    description: 'Words emitted by the ordered execution run.',
  },
  isExecuting: {
    initialValue: false,
    description: 'Whether the priority sequence is currently executing.',
  },
  executionStatus: {
    initialValue: [],
    strategy: 'reference',
    description: 'Presentation status for every registered priority action.',
  },
});

export type {
  PriorityExecutionStatus,
  RegisteredPriorityAction,
} from '../business/priority-demo-rules';
