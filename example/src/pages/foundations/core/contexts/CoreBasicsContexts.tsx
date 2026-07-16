import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';

export interface CoreBasicsActions extends ActionPayloadMap {
  increment: void;
  decrement: void;
  setCount: number;
  reset: void;
  generateLog: void;
  asyncOperation: string;
}

export interface CoreBasicsAsyncStatus {
  isRunning: boolean;
  runningCount: number;
}

export interface CoreBasicsStores {
  count: number;
  asyncStatus: CoreBasicsAsyncStatus;
}

export const {
  Provider: CoreActionProvider,
  useActionDispatch: useCoreAction,
  useActionDispatchWithResult: useCoreActionWithResult,
  useActionHandler: useCoreActionHandler,
} = createActionContext<CoreBasicsActions>('CoreBasics');

export const {
  Provider: CoreStoreProvider,
  useStore: useCoreStore,
  useStoreManager: useCoreStoreManager,
} = createStoreContext<CoreBasicsStores>('CoreBasicsStores', {
  count: { initialValue: 0 },
  asyncStatus: {
    initialValue: { isRunning: false, runningCount: 0 },
    strategy: 'shallow',
  },
});
