import { useStoreValue } from '@context-action/react';
import React, { useCallback } from 'react';
import {
  appendHeavyOperationResult,
  appendMemoryTaskResult,
  resetComparisonStore,
  setCalculationResult,
  updateCounter,
} from '../business/comparison-rules';
import {
  useComparisonStore,
  useMemoizedActionHandler,
  useNonMemoizedActionHandler,
  usePerformanceControlHandler,
  usePerformanceControlStore,
} from '../models/ComparisonModel';
import { PERFORMANCE_LIMITS } from '../types';
import {
  createExpensiveCalculation,
  createMemoryLeakData,
} from '../utils/performanceHelpers';

export function ComparisonHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const memoizedStore = useComparisonStore('memoized');
  const nonMemoizedStore = useComparisonStore('nonMemoized');
  const autoUpdateStore = usePerformanceControlStore('autoUpdate');
  const updateIntervalStore = usePerformanceControlStore('updateInterval');

  // Subscribe only to reproduce the non-memoized lane's registration churn.
  // All registration still remains inside this Registry boundary.
  useStoreValue(nonMemoizedStore);

  const memoizedExpensiveCalculator = useCallback((baseValue: number) => {
    console.log('💰 Memoized: Expensive calculation');
    return createExpensiveCalculation(baseValue);
  }, []);

  const memoizedMemoryDataGenerator = useCallback(() => {
    console.log('💾 Memoized: Memory data generator');
    return createMemoryLeakData();
  }, []);

  useMemoizedActionHandler(
    'increment',
    useCallback(async () => {
      memoizedStore.setValue(updateCounter(memoizedStore.getValue(), 1));
    }, [memoizedStore])
  );

  useMemoizedActionHandler(
    'decrement',
    useCallback(async () => {
      memoizedStore.setValue(updateCounter(memoizedStore.getValue(), -1));
    }, [memoizedStore])
  );

  useMemoizedActionHandler(
    'reset',
    useCallback(async () => {
      memoizedStore.setValue(resetComparisonStore());
    }, [memoizedStore])
  );

  useMemoizedActionHandler(
    'complexCalculation',
    useCallback(
      async (payload) => {
        memoizedStore.setValue(
          setCalculationResult(memoizedStore.getValue(), payload.multiplier)
        );
      },
      [memoizedStore]
    )
  );

  useMemoizedActionHandler(
    'heavyOperation',
    useCallback(
      async (payload) => {
        const current = memoizedStore.getValue();
        if (current.heavyData.length > PERFORMANCE_LIMITS.HEAVY_DATA_LIMIT) {
          console.warn(
            '🚨 Memoized: Heavy data 한계 도달! 더 이상 추가하지 않습니다.'
          );
          return;
        }

        const safeDataSize = Math.min(
          payload.dataSize,
          PERFORMANCE_LIMITS.MAX_DATA_SIZE
        );
        const result = memoizedExpensiveCalculator(safeDataSize);
        memoizedStore.setValue(
          appendHeavyOperationResult(current, result, Date.now())
        );
      },
      [memoizedExpensiveCalculator, memoizedStore]
    )
  );

  useMemoizedActionHandler(
    'memoryIntensiveTask',
    useCallback(async () => {
      const current = memoizedStore.getValue();
      if (
        current.memoryLeakData.length > PERFORMANCE_LIMITS.MEMORY_DATA_LIMIT
      ) {
        console.warn(
          '🚨 Memoized: 메모리 한계 도달! 더 이상 추가하지 않습니다.'
        );
        return;
      }

      memoizedStore.setValue(
        appendMemoryTaskResult(current, memoizedMemoryDataGenerator())
      );
    }, [memoizedMemoryDataGenerator, memoizedStore])
  );

  // These functions intentionally remain un-memoized to make the comparison
  // visible: the Registry re-registers this lane when its Store changes.
  const nonMemoizedIncrement = async () => {
    nonMemoizedStore.setValue(updateCounter(nonMemoizedStore.getValue(), 1));
  };

  const nonMemoizedDecrement = async () => {
    nonMemoizedStore.setValue(updateCounter(nonMemoizedStore.getValue(), -1));
  };

  const nonMemoizedReset = async () => {
    nonMemoizedStore.setValue(resetComparisonStore());
  };

  const nonMemoizedCalculation = async (payload: { multiplier: number }) => {
    nonMemoizedStore.setValue(
      setCalculationResult(nonMemoizedStore.getValue(), payload.multiplier)
    );
  };

  const nonMemoizedHeavyOperation = async (payload: { dataSize: number }) => {
    const current = nonMemoizedStore.getValue();
    if (current.heavyData.length > PERFORMANCE_LIMITS.HEAVY_DATA_LIMIT) {
      console.warn(
        '🚨 Non-Memoized: Heavy data 한계 도달! 더 이상 추가하지 않습니다.'
      );
      return;
    }

    const expensiveCalculator = (baseValue: number) => {
      console.log('💸 Non-Memoized: Expensive calculation EVERY RENDER!');
      return createExpensiveCalculation(baseValue);
    };
    const safeDataSize = Math.min(
      payload.dataSize,
      PERFORMANCE_LIMITS.MAX_DATA_SIZE
    );
    nonMemoizedStore.setValue(
      appendHeavyOperationResult(
        current,
        expensiveCalculator(safeDataSize),
        Date.now()
      )
    );
  };

  const nonMemoizedMemoryTask = async () => {
    const current = nonMemoizedStore.getValue();
    if (current.memoryLeakData.length > PERFORMANCE_LIMITS.MEMORY_DATA_LIMIT) {
      console.warn(
        '🚨 Non-Memoized: 메모리 한계 도달! 더 이상 추가하지 않습니다.'
      );
      return;
    }

    const memoryDataGenerator = () => {
      console.log('💸 Non-Memoized: Memory data generator EVERY RENDER!');
      return createMemoryLeakData();
    };
    nonMemoizedStore.setValue(
      appendMemoryTaskResult(current, memoryDataGenerator())
    );
  };

  useNonMemoizedActionHandler('increment', nonMemoizedIncrement);
  useNonMemoizedActionHandler('decrement', nonMemoizedDecrement);
  useNonMemoizedActionHandler('reset', nonMemoizedReset);
  useNonMemoizedActionHandler('complexCalculation', nonMemoizedCalculation);
  useNonMemoizedActionHandler('heavyOperation', nonMemoizedHeavyOperation);
  useNonMemoizedActionHandler('memoryIntensiveTask', nonMemoizedMemoryTask);

  usePerformanceControlHandler(
    'toggleAutoUpdate',
    useCallback(async () => {
      autoUpdateStore.setValue(!autoUpdateStore.getValue());
    }, [autoUpdateStore])
  );

  usePerformanceControlHandler(
    'setUpdateInterval',
    useCallback(
      async (payload) => {
        updateIntervalStore.setValue(payload.interval);
      },
      [updateIntervalStore]
    )
  );

  return <>{children}</>;
}
