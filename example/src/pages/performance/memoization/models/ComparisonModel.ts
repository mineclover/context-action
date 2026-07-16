import { createActionContext, createStoreContext } from '@context-action/react';
import { createInitialComparisonStore } from '../business/comparison-rules';
import type {
  ComparisonActions,
  ComparisonStores,
  PerformanceControlActions,
  PerformanceControlStores,
} from '../types';

// Model Layer - 선언적 Context 관리

// Store Context (Model - Data Layer)
export const {
  Provider: ComparisonStoreProvider,
  useStore: useComparisonStore,
} = createStoreContext<ComparisonStores>('ComparisonStore', {
  memoized: {
    initialValue: createInitialComparisonStore(),
    strategy: 'reference',
    description: 'State for the stable-handler comparison lane.',
  },
  nonMemoized: {
    initialValue: createInitialComparisonStore(),
    strategy: 'reference',
    description: 'State for the re-registration comparison lane.',
  },
});

// Action Contexts (Model - Business Logic Layer)
export const {
  Provider: MemoizedActionProvider,
  useActionDispatch: useMemoizedActionDispatch,
  useActionHandler: useMemoizedActionHandler,
} = createActionContext<ComparisonActions>('MemoizedComparison');

export const {
  Provider: NonMemoizedActionProvider,
  useActionDispatch: useNonMemoizedActionDispatch,
  useActionHandler: useNonMemoizedActionHandler,
} = createActionContext<ComparisonActions>('NonMemoizedComparison');

// Performance Control Model
export const {
  Provider: PerformanceControlProvider,
  useStore: usePerformanceControlStore,
} = createStoreContext<PerformanceControlStores>('PerformanceControl', {
  autoUpdate: {
    initialValue: false,
    description: 'Whether the comparison lanes receive automatic actions.',
  },
  updateInterval: {
    initialValue: 100,
    description: 'Interval used by both automatic comparison lanes.',
  },
});

export const {
  Provider: PerformanceControlActionProvider,
  useActionDispatch: usePerformanceControlDispatch,
  useActionHandler: usePerformanceControlHandler,
} = createActionContext<PerformanceControlActions>('PerformanceControlActions');
