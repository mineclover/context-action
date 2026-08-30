import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';

export interface AsyncDemoResult {
  id: string;
  message: string;
  status: 'pending' | 'completed' | 'error';
  timestamp: string;
}

export interface CoreAdvancedActions extends ActionPayloadMap {
  increment: void;
  multiply: number;
  divide: number;
  errorAction: void;
  runPriorityTest: string;
  clearPriorityResults: void;
  runAsync: { delay: number; message: string };
  runMultipleAsync: string;
  clearAsyncResults: void;
}

export interface CoreAdvancedStores {
  count: number;
  priorityResults: string[];
  asyncResults: AsyncDemoResult[];
}

export const {
  Provider: CoreAdvancedActionProvider,
  useActionDispatch: useCoreAdvancedDispatch,
  useActionHandler: useCoreAdvancedActionHandler,
} = createActionContext<CoreAdvancedActions>('CoreAdvancedActions', {
  registry: { useConcurrencyQueue: false },
});

export const {
  Provider: CoreAdvancedStoreProvider,
  useStore: useCoreAdvancedStore,
  useStoreManager: useCoreAdvancedStoreManager,
} = createStoreContext<CoreAdvancedStores>('CoreAdvancedStores', {
  count: { initialValue: 0 },
  priorityResults: { initialValue: [] as string[] },
  asyncResults: { initialValue: [] as AsyncDemoResult[] },
});
