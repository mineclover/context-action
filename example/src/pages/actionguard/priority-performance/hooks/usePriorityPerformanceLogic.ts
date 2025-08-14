/**
 * @fileoverview Priority Performance Logic Hook - Hook Layer
 *
 * Data/Action과 View 사이의 브리지 역할을 하는 Hook입니다.
 * 양방향 데이터 흐름을 관리합니다.
 */

import { useStoreValue } from '@context-action/react';
import { useCallback, useEffect } from 'react';
import {
  type TestInstance,
  usePriorityPerformanceActionDispatch,
  usePriorityPerformanceActionRegister,
  usePriorityPerformanceStore,
} from '../context/PriorityPerformanceContext';

/**
 * 우선순위 성능 테스트 로직 Hook
 *
 * View Layer에 필요한 데이터와 액션을 제공합니다.
 */
export function usePriorityPerformanceLogic() {
  const dispatch = usePriorityPerformanceActionDispatch();
  const register = usePriorityPerformanceActionRegister();
  const performanceStore = usePriorityPerformanceStore('performanceState');
  const performanceState = useStoreValue(performanceStore);

  // 새 인스턴스 생성 헬퍼
  const generateNewInstance = useCallback(
    (instanceNumber: number): TestInstance => {
      const colors = ['🟢', '🟡', '🟠', '🟣', '⚫', '⚪', '🔲', '🔳'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      return {
        id: `instance-${instanceNumber}`,
        title: `${randomColor} Priority Test Instance ${String.fromCharCode(64 + instanceNumber)}`,
      };
    },
    []
  );

  // 액션 핸들러 등록
  useEffect(() => {
    if (!register) return;

    // 인스턴스 추가 핸들러
    const unregisterAdd = register.register('addInstance', (_, controller) => {
      const currentState = performanceStore.getValue();
      const newInstance = generateNewInstance(
        currentState.instances.length + 1
      );

      performanceStore.update((state) => ({
        ...state,
        instances: [...state.instances, newInstance],
      }));

      
    });

    // 인스턴스 제거 핸들러
    const unregisterRemove = register.register(
      'removeInstance',
      ({ instanceId }, controller) => {
        performanceStore.update((state) => ({
          ...state,
          instances: state.instances.filter(
            (instance) => instance.id !== instanceId
          ),
        }));

        
      }
    );

    // 인스턴스 리셋 핸들러
    const unregisterReset = register.register(
      'resetInstances',
      (_, controller) => {
        const defaultInstances: TestInstance[] = [
          { id: 'instance-a', title: '🔴 Priority Test Instance A' },
          { id: 'instance-b', title: '🔵 Priority Test Instance B' },
        ];

        performanceStore.update((state) => ({
          ...state,
          instances: defaultInstances,
        }));

        
      }
    );

    return () => {
      unregisterAdd();
      unregisterRemove();
      unregisterReset();
    };
  }, [register, performanceStore, generateNewInstance]);

  // View에 제공할 인터페이스
  return {
    // Data
    performanceState,

    // Actions
    addInstance: () => {
      dispatch('addInstance');
    },

    removeInstance: (instanceId: string) => {
      dispatch('removeInstance', { instanceId });
    },

    resetInstances: () => {
      dispatch('resetInstances');
    },

    // Computed values
    canOperate: !!register && !!dispatch,
    instanceCount: performanceState.instances.length,
    canRemove: performanceState.instances.length > 1,
  };
}
