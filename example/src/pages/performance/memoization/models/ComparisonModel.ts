import { createActionContext, createStoreContext } from '@context-action/react';
import type { ComparisonActions, ComparisonStore, MemoryLeakItem } from '../types';

// Model Layer - 선언적 Context 관리

// Store Context (Model - Data Layer)
export const {
  Provider: ComparisonStoreProvider,
  useStore: useComparisonStore,
} = createStoreContext('ComparisonStore', {
  memoized: { 
    counter: 0, 
    calcResult: 0, 
    heavyData: [] as number[],
    processedResults: [] as { id: number; value: number; timestamp: number }[],
    memoryLeakData: [] as MemoryLeakItem[]
  },
  nonMemoized: { 
    counter: 0, 
    calcResult: 0,
    heavyData: [] as number[],
    processedResults: [] as { id: number; value: number; timestamp: number }[],
    memoryLeakData: [] as MemoryLeakItem[]
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
} = createStoreContext('PerformanceControl', {
  autoUpdate: false,
  updateInterval: 100,
});

export const {
  Provider: PerformanceControlActionProvider,
  useActionDispatch: usePerformanceControlDispatch,
  useActionHandler: usePerformanceControlHandler,
} = createActionContext<{
  toggleAutoUpdate: void;
  setUpdateInterval: { interval: number };
}>('PerformanceControlActions');