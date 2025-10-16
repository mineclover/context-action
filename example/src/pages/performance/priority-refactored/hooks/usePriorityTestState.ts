/**
 * @fileoverview Priority Test State Hooks
 *
 * Context-Driven Architecture의 Hook Layer
 * 우선순위 테스트 상태 스토어 구독 및 계산된 값 제공
 */

import { useStoreValue } from '@context-action/react';
import { useMemo } from 'react';
import {
  usePriorityTestStore,
  useTestConfigStore,
} from '../contexts/PriorityContexts';

/**
 * 우선순위 테스트 상태 훅
 *
 * 테스트 실행 상태와 통계를 제공합니다.
 */
export function usePriorityTestState() {
  const executionStateStore = usePriorityTestStore('executionState');
  const executionState = useStoreValue(executionStateStore);

  const testStats = useMemo(
    () => ({
      isRunning: executionState.isRunning,
      totalTests: executionState.totalTests,
      successfulTests: executionState.successfulTests,
      failedTests: executionState.failedTests,
      abortedTests: executionState.abortedTests,
      successRate:
        executionState.totalTests > 0
          ? Math.round(
              (executionState.successfulTests / executionState.totalTests) * 100
            )
          : 0,
      averageExecutionTime: executionState.averageExecutionTime,
      lastExecutionTime: executionState.lastExecutionTime,
      maxExecutionTime: executionState.maxExecutionTime,
      minExecutionTime:
        executionState.minExecutionTime === Number.MAX_VALUE
          ? 0
          : executionState.minExecutionTime,
      hasResults: executionState.executionTimes.length > 0,
    }),
    [executionState]
  );

  return {
    executionState,
    executionStateStore,
    ...testStats,
  };
}

/**
 * 우선순위 카운트 상태 훅
 *
 * 우선순위별 실행 횟수를 제공합니다.
 */
export function usePriorityCountsState() {
  const priorityCountsStore = usePriorityTestStore('priorityCounts');
  const priorityCounts = useStoreValue(priorityCountsStore);

  const countStats = useMemo(
    () => ({
      totalExecutions: Object.values(priorityCounts).reduce(
        (sum, count) => sum + count,
        0
      ),
      executedPriorities: Object.keys(priorityCounts)
        .filter((priority) => (priorityCounts[Number(priority)] || 0) > 0)
        .map(Number),
      highestCount: Math.max(...Object.values(priorityCounts), 0),
      averageCount:
        Object.keys(priorityCounts).length > 0
          ? Object.values(priorityCounts).reduce(
              (sum, count) => sum + count,
              0
            ) / Object.keys(priorityCounts).length
          : 0,
    }),
    [priorityCounts]
  );

  return {
    priorityCounts,
    priorityCountsStore,
    ...countStats,
  };
}

/**
 * 테스트 설정 상태 훅
 *
 * 핸들러 설정과 선택된 딜레이를 제공합니다.
 */
export function useTestConfigState() {
  const handlerConfigsStore = useTestConfigStore('handlerConfigs');
  const selectedDelayStore = useTestConfigStore('selectedDelay');

  const handlerConfigs = useStoreValue(handlerConfigsStore);
  const selectedDelay = useStoreValue(selectedDelayStore);

  const configStats = useMemo(
    () => ({
      handlerCount: handlerConfigs.length,
      priorityRange: {
        min: Math.min(...handlerConfigs.map((config) => config.priority)),
        max: Math.max(...handlerConfigs.map((config) => config.priority)),
      },
      jumpHandlers: handlerConfigs.filter(
        (config) => config.jumpToPriority !== null
      ),
      configsWithDelay: handlerConfigs.map((config) => ({
        ...config,
        delay: selectedDelay,
      })),
    }),
    [handlerConfigs, selectedDelay]
  );

  return {
    handlerConfigs,
    selectedDelay,
    handlerConfigsStore,
    selectedDelayStore,
    ...configStats,
  };
}
