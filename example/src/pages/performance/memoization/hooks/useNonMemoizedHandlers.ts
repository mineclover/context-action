import {
  useComparisonStore,
  useNonMemoizedActionHandler,
} from '../models/ComparisonModel';
import { PERFORMANCE_LIMITS } from '../types';
import {
  convertToProcessedResults,
  createExpensiveCalculation,
  createMemoryLeakData,
} from '../utils/performanceHelpers';

/**
 * Non-Memoized ViewModel Hook - 메모이제이션 없는 비즈니스 로직 관리
 * 이 훅은 DemoPage에서 사용되는 메모이제이션이 없는 핸들러들을 제공합니다.
 * 성능 차이를 보여주기 위해 의도적으로 최적화를 하지 않습니다.
 */
export function useNonMemoizedHandlers() {
  const store = useComparisonStore('nonMemoized');

  // ❌ Basic handlers - 매번 새로운 함수 생성
  const handleIncrement = async () => {
    const current = store.getValue();
    store.setValue({ ...current, counter: current.counter + 1 });
  };

  const handleDecrement = async () => {
    const current = store.getValue();
    store.setValue({ ...current, counter: current.counter - 1 });
  };

  const handleReset = async () => {
    store.setValue({
      counter: 0,
      calcResult: 0,
      heavyData: [],
      processedResults: [],
      memoryLeakData: [],
    });
  };

  const handleCalculation = async (payload: { multiplier: number }) => {
    const current = store.getValue();
    const result = current.counter * payload.multiplier;
    store.setValue({ ...current, calcResult: result });
  };

  // ❌ Heavy operation handler - 매번 새로운 함수 생성
  const handleHeavyOperation = async (payload: { dataSize: number }) => {
    console.log('💥 Non-Memoized: Heavy operation executing (EVERY RENDER)...');
    const current = store.getValue();

    if (current.heavyData.length > PERFORMANCE_LIMITS.HEAVY_DATA_LIMIT) {
      console.warn(
        '🚨 Non-Memoized: Heavy data 한계 도달! 더 이상 추가하지 않습니다.'
      );
      return;
    }

    // ❌ 매번 새로운 계산 함수 생성 (동일한 로직이지만 매번 재정의)
    const expensiveCalculator = (baseValue: number) => {
      console.log('💸 Non-Memoized: Expensive calculation EVERY RENDER!');
      return createExpensiveCalculation(baseValue);
    };

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
  };

  // ❌ Memory intensive task handler - 매번 새로운 함수 생성
  const handleMemoryTask = async () => {
    console.log(
      '💥 Non-Memoized: Memory leak task executing (EVERY RENDER)...'
    );
    const current = store.getValue();

    if (current.memoryLeakData.length > PERFORMANCE_LIMITS.MEMORY_DATA_LIMIT) {
      console.warn('🚨 메모리 한계 도달! 더 이상 추가하지 않습니다.');
      return;
    }

    // ❌ 매번 새로운 메모리 데이터 생성 함수 정의
    const memoryDataGenerator = () => {
      console.log('💸 Non-Memoized: Memory data generator EVERY RENDER!');
      return createMemoryLeakData();
    };

    const newMemoryData = memoryDataGenerator();

    store.setValue({
      ...current,
      memoryLeakData: [...current.memoryLeakData, ...newMemoryData],
    });
  };

  // Register handlers - 매번 새로운 함수 참조로 인한 재등록
  useNonMemoizedActionHandler('increment', handleIncrement);
  useNonMemoizedActionHandler('decrement', handleDecrement);
  useNonMemoizedActionHandler('reset', handleReset);
  useNonMemoizedActionHandler('complexCalculation', handleCalculation);
  useNonMemoizedActionHandler('heavyOperation', handleHeavyOperation);
  useNonMemoizedActionHandler('memoryIntensiveTask', handleMemoryTask);

  // Return handler registration status (for debugging)
  return {
    handlersRegistered: true,
    storeType: 'nonMemoized' as const,
  };
}
