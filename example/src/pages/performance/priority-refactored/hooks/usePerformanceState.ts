/**
 * @fileoverview Performance State Hooks
 *
 * Context-Driven Architecture의 Hook Layer
 * 성능 상태 스토어 구독 및 계산된 값 제공
 */

import { useStoreValue } from '@context-action/react';
import { useMemo } from 'react';
import { usePerformanceManagementStore } from '../contexts/PriorityContexts';

/**
 * 성능 상태 훅
 *
 * 성능 관리 스토어를 구독하고 계산된 값들을 제공합니다.
 */
export function usePerformanceState() {
  const performanceStore = usePerformanceManagementStore('performanceState');
  const performanceState = useStoreValue(performanceStore);

  const computedValues = useMemo(
    () => ({
      instanceCount: performanceState.instances.length,
      runningInstanceCount: performanceState.runningInstances.length,
      isAnyInstanceRunning: performanceState.runningInstances.length > 0,
      canAddInstance: true, // 인스턴스 추가는 항상 가능
      canRemoveInstance:
        performanceState.instances.length > 1 &&
        performanceState.runningInstances.length === 0,
      canResetInstances: performanceState.runningInstances.length === 0,
      runningInstanceIds: performanceState.runningInstances,
    }),
    [performanceState]
  );

  return {
    performanceState,
    performanceStore,
    ...computedValues,
  };
}

/**
 * 인스턴스별 상태 훅
 *
 * 특정 인스턴스의 실행 상태를 확인합니다.
 */
export function useInstanceState(instanceId: string) {
  const { performanceState } = usePerformanceState();

  const instanceState = useMemo(
    () => ({
      isRunning: performanceState.runningInstances.includes(instanceId),
      canStart: !performanceState.runningInstances.includes(instanceId),
      canStop: performanceState.runningInstances.includes(instanceId),
    }),
    [performanceState, instanceId]
  );

  return instanceState;
}
