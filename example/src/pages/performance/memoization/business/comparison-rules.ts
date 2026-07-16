import type { ComparisonStore } from '../types';

export function createInitialComparisonStore(): ComparisonStore {
  return {
    counter: 0,
    calcResult: 0,
    heavyData: [],
    processedResults: [],
    memoryLeakData: [],
  };
}

export function updateCounter(
  current: ComparisonStore,
  delta: number
): ComparisonStore {
  return { ...current, counter: current.counter + delta };
}

export function resetComparisonStore(): ComparisonStore {
  return createInitialComparisonStore();
}

export function setCalculationResult(
  current: ComparisonStore,
  multiplier: number
): ComparisonStore {
  return {
    ...current,
    calcResult: current.counter * multiplier,
  };
}

export function appendHeavyOperationResult(
  current: ComparisonStore,
  result: number[],
  now: number
): ComparisonStore {
  return {
    ...current,
    heavyData: [...current.heavyData, ...result],
    processedResults: [
      ...current.processedResults,
      ...result.map((value, index) => ({
        id: current.processedResults.length + index,
        value,
        timestamp: now,
      })),
    ],
  };
}

export function appendMemoryTaskResult(
  current: ComparisonStore,
  data: ComparisonStore['memoryLeakData']
): ComparisonStore {
  return {
    ...current,
    memoryLeakData: [...current.memoryLeakData, ...data],
  };
}
