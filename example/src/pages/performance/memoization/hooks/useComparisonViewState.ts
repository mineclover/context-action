import { useStoreValue } from '@context-action/react';
import { useComparisonStore } from '../contexts/ComparisonContexts';
import { UI_THRESHOLDS } from '../types';
import { useRerenderMonitor } from './useRerenderMonitor';

/**
 * View State Hook - 순수 상태 관리
 * 이 훅은 UI 렌더링을 위한 상태만 반환하고 비즈니스 로직은 포함하지 않습니다.
 */

export function useMemoizedViewState() {
  const store = useComparisonStore('memoized');
  const value = useStoreValue(store);
  const { renderCount, renderRate } = useRerenderMonitor('Memoized');

  return {
    counter: value.counter,
    calcResult: value.calcResult,
    heavyData: {
      length: value.heavyData.length,
      status: getHeavyDataStatus(value.heavyData.length),
    },
    processedResults: {
      length: value.processedResults.length,
    },
    memoryData: {
      length: value.memoryLeakData.length,
      status: getMemoryDataStatus(value.memoryLeakData.length),
    },
    renderMetrics: {
      count: renderCount,
      rate: renderRate,
      status: getRenderRateStatus(renderRate),
    },
  };
}

export function useNonMemoizedViewState() {
  const store = useComparisonStore('nonMemoized');
  const value = useStoreValue(store);
  const { renderCount, renderRate } = useRerenderMonitor('NonMemoized');

  return {
    counter: value.counter,
    calcResult: value.calcResult,
    heavyData: {
      length: value.heavyData.length,
      status: getHeavyDataStatus(value.heavyData.length),
    },
    processedResults: {
      length: value.processedResults.length,
    },
    memoryData: {
      length: value.memoryLeakData.length,
      status: getMemoryDataStatus(value.memoryLeakData.length),
    },
    renderMetrics: {
      count: renderCount,
      rate: renderRate,
      status: getRenderRateStatus(renderRate),
    },
  };
}

// Helper functions for status determination
function getHeavyDataStatus(length: number): 'normal' | 'heavy' | 'blocked' {
  if (length > 5000) return 'blocked';
  if (length > UI_THRESHOLDS.HEAVY_DATA_WARNING) return 'heavy';
  return 'normal';
}

function getMemoryDataStatus(
  length: number
): 'normal' | 'warning' | 'leak' | 'blocked' {
  if (length > 5000) return 'blocked';
  if (length > UI_THRESHOLDS.MEMORY_DATA_DANGER) return 'leak';
  if (length > UI_THRESHOLDS.MEMORY_DATA_WARNING) return 'warning';
  return 'normal';
}

function getRenderRateStatus(
  rate: number
): 'normal' | 'warning' | 'danger' | 'critical' {
  if (rate > 15) return 'critical';
  if (rate > 10) return 'danger';
  if (rate > 5) return 'warning';
  return 'normal';
}
