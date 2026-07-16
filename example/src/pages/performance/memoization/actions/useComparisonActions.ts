import { useCallback, useMemo } from 'react';
import {
  useMemoizedActionDispatch,
  useNonMemoizedActionDispatch,
} from '../contexts/ComparisonContexts';

export function useMemoizedActions() {
  const dispatch = useMemoizedActionDispatch();

  const increment = useCallback(() => dispatch('increment'), [dispatch]);
  const decrement = useCallback(() => dispatch('decrement'), [dispatch]);
  const reset = useCallback(() => dispatch('reset'), [dispatch]);
  const calculate = useCallback(
    (multiplier: number = 10) => dispatch('complexCalculation', { multiplier }),
    [dispatch]
  );
  const performHeavyOperation = useCallback(
    (dataSize: number = 20) => dispatch('heavyOperation', { dataSize }),
    [dispatch]
  );
  const performMemoryTask = useCallback(
    () => dispatch('memoryIntensiveTask'),
    [dispatch]
  );

  return useMemo(
    () => ({
      increment,
      decrement,
      reset,
      calculate,
      performHeavyOperation,
      performMemoryTask,
    }),
    [
      calculate,
      decrement,
      increment,
      performHeavyOperation,
      performMemoryTask,
      reset,
    ]
  );
}

export function useNonMemoizedActions() {
  const dispatch = useNonMemoizedActionDispatch();

  const increment = useCallback(() => dispatch('increment'), [dispatch]);
  const decrement = useCallback(() => dispatch('decrement'), [dispatch]);
  const reset = useCallback(() => dispatch('reset'), [dispatch]);
  const calculate = useCallback(
    (multiplier: number = 10) => dispatch('complexCalculation', { multiplier }),
    [dispatch]
  );
  const performHeavyOperation = useCallback(
    (dataSize: number = 50) => dispatch('heavyOperation', { dataSize }),
    [dispatch]
  );
  const performMemoryTask = useCallback(
    () => dispatch('memoryIntensiveTask'),
    [dispatch]
  );

  return useMemo(
    () => ({
      increment,
      decrement,
      reset,
      calculate,
      performHeavyOperation,
      performMemoryTask,
    }),
    [
      calculate,
      decrement,
      increment,
      performHeavyOperation,
      performMemoryTask,
      reset,
    ]
  );
}

export function usePerformanceTestActions() {
  const memoizedActions = useMemoizedActions();
  const nonMemoizedActions = useNonMemoizedActions();

  return {
    runBasicTest: () => {
      memoizedActions.increment();
      nonMemoizedActions.increment();
    },
    runPerformanceTest: () => {
      memoizedActions.performHeavyOperation(30);
      nonMemoizedActions.performHeavyOperation(30);
    },
    runMemoryTest: () => {
      memoizedActions.performMemoryTask();
      nonMemoizedActions.performMemoryTask();
    },
    resetAll: () => {
      memoizedActions.reset();
      nonMemoizedActions.reset();
    },
    memoized: memoizedActions,
    nonMemoized: nonMemoizedActions,
  };
}
