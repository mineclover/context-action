import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';
import {
  createInitialVisualizationState,
  type ExecutionVisualizationState,
  type FilteringDispatchOptions,
  type FilteringExecutionResult,
  type ProcessDataPayload,
} from '../business/filtering-demo-rules';

export interface AdvancedFilteringActions extends ActionPayloadMap {
  processData: ProcessDataPayload;
  runDemo: {
    demoKey: string;
    filterOptions?: FilteringDispatchOptions;
  };
  clearResults: void;
}

export interface AdvancedFilteringStores {
  executionResults: Record<string, FilteringExecutionResult | null>;
  isLoading: boolean;
  visualization: ExecutionVisualizationState;
}

export const {
  Provider: AdvancedFilteringActionProvider,
  useActionDispatch: useAdvancedFilteringDispatch,
  useActionDispatchWithResult: useAdvancedFilteringDispatchWithResult,
  useActionHandler: useAdvancedFilteringActionHandler,
} = createActionContext<AdvancedFilteringActions>('AdvancedFilteringActions', {
  // runDemo orchestrates a filtered processData dispatch in the same page
  // registry. It must be allowed to await that nested operation directly.
  registry: { useConcurrencyQueue: false },
});

export const {
  Provider: AdvancedFilteringStoreProvider,
  useStore: useAdvancedFilteringStore,
  useStoreManager: useAdvancedFilteringStoreManager,
} = createStoreContext<AdvancedFilteringStores>('AdvancedFilteringStores', {
  executionResults: {
    initialValue: {} as Record<string, FilteringExecutionResult | null>,
    strategy: 'shallow',
  },
  isLoading: { initialValue: false },
  visualization: {
    initialValue: createInitialVisualizationState(),
    strategy: 'shallow',
  },
});

export type {
  ExecutionVisualizationState,
  FilteringDemo,
  FilteringDispatchOptions,
  FilteringExecutionResult,
  FilteringHandler,
  ProcessDataPayload,
} from '../business/filtering-demo-rules';
