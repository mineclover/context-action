import { useCallback } from 'react';
import {
  useComparisonStore,
  useMemoizedActionHandler,
} from '../models/ComparisonModel';
import { PERFORMANCE_LIMITS } from '../types';
import {
  convertToProcessedResults,
  createExpensiveCalculation,
  createMemoryLeakData,
} from '../utils/performanceHelpers';

/**
 * Memoized ViewModel Hook - 메모이제이션된 비즈니스 로직 관리
 * 이 훅은 DemoPage에서 사용되는 메모이제이션 최적화된 핸들러들을 제공합니다.
 */
export function useMemoizedHandlers() {
  const store = useComparisonStore('memoized');

  // ✅ 메모이제이션된 계산 함수 - 한 번만 생성되고 재사용
  const expensiveCalculator = useCallback((baseValue: number) => {
    console.log('💰 Memoized: Expensive calculation');
    return createExpensiveCalculation(baseValue);
  }, []); // 빈 의존성 배열로 완전히 메모이제이션

  // ✅ 메모이제이션된 메모리 데이터 생성 함수
  const memoryDataGenerator = useCallback(() => {
    console.log('💾 Memoized: Memory data generator');
    return createMemoryLeakData();
  }, []); // 빈 의존성 배열로 함수 메모이제이션

  // Basic handlers with lazy evaluation
  const handleIncrement = useCallback(async () => {
    const current = store.getValue();
    store.setValue({ ...current, counter: current.counter + 1 });
  }, [store]);

  const handleDecrement = useCallback(async () => {
    const current = store.getValue();
    store.setValue({ ...current, counter: current.counter - 1 });
  }, [store]);

  const handleReset = useCallback(async () => {
    store.setValue({
      counter: 0,
      calcResult: 0,
      heavyData: [],
      processedResults: [],
      memoryLeakData: [],
    });
  }, [store]);

  const handleCalculation = useCallback(
    async (payload: { multiplier: number }) => {
      const current = store.getValue();
      const result = current.counter * payload.multiplier;
      store.setValue({ ...current, calcResult: result });
    },
    [store]
  );

  // Heavy operation handler
  const handleHeavyOperation = useCallback(
    async (payload: { dataSize: number }) => {
      console.log('🔄 Memoized: Heavy operation executing...');
      const current = store.getValue();

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
      const result = expensiveCalculator(safeDataSize);

      store.setValue({
        ...current,
        heavyData: [...current.heavyData, ...result],
        processedResults: [
          ...current.processedResults,
          ...convertToProcessedResults(result),
        ],
      });
    },
    [store, expensiveCalculator]
  );

  // Memory intensive task handler
  const handleMemoryTask = useCallback(async () => {
    console.log('🔄 Memoized: Memory task executing...');
    const current = store.getValue();

    if (current.memoryLeakData.length > PERFORMANCE_LIMITS.MEMORY_DATA_LIMIT) {
      console.warn('🚨 Memoized: 메모리 한계 도달! 더 이상 추가하지 않습니다.');
      return;
    }

    const newMemoryData = memoryDataGenerator();

    store.setValue({
      ...current,
      memoryLeakData: [...current.memoryLeakData, ...newMemoryData],
    });
  }, [store, memoryDataGenerator]);

  // Register handlers
  useMemoizedActionHandler('increment', handleIncrement);
  useMemoizedActionHandler('decrement', handleDecrement);
  useMemoizedActionHandler('reset', handleReset);
  useMemoizedActionHandler('complexCalculation', handleCalculation);
  useMemoizedActionHandler('heavyOperation', handleHeavyOperation);
  useMemoizedActionHandler('memoryIntensiveTask', handleMemoryTask);

  // Return handler registration status (for debugging)
  return {
    handlersRegistered: true,
    storeType: 'memoized' as const,
  };
}
