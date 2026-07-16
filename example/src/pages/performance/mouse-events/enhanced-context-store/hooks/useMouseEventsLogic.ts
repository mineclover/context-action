/**
 * @fileoverview Mouse Events Business Logic Hook
 *
 * ViewModel Layer: 비즈니스 로직을 처리하는 핵심 Hook
 * - Store 상태 변경 로직
 * - 계산된 메트릭스 업데이트
 * - 성능 추적 및 최적화
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  activityAfterClick,
  activityAfterMovement,
  calculateMovement,
  clicksAfterClick,
  computedMetricsFromState,
} from '../business/enhanced-mouse-event-rules';
import {
  type MouseClick,
  type MousePosition,
  useMouseRefMountState,
  useMouseStore,
} from '../contexts/EnhancedContextStoreContexts';

/**
 * 마우스 이벤트 비즈니스 로직을 관리하는 Hook - 진짜 반응형 마운트 상태 기반
 *
 * 역할:
 * - 액션 핸들러 구현과 Store 오케스트레이션
 * - Handler Registry에 주입할 semantic handler 반환
 * - Store 간 데이터 동기화
 * - 계산된 메트릭스 업데이트
 * - 성능 최적화
 */
export function useMouseEventsLogic() {
  // Store 참조
  const positionStore = useMouseStore('position');
  const movementStore = useMouseStore('movement');
  const clicksStore = useMouseStore('clicks');
  const computedStore = useMouseStore('computed');
  const activityStore = useMouseStore('activity');
  const performanceStore = useMouseStore('performance');

  // Container 참조 (마운트 상태 확인용)
  // 🎯 진짜 반응형 마운트 상태 - RefContext 기본 제공
  const containerMountState = useMouseRefMountState('container');
  const { isMounted: isContainerMounted, mountedTarget: containerElement } =
    containerMountState;

  // 성능 추적용 refs
  const _lastUpdateTime = useRef<number>(Date.now());
  const renderStartTime = useRef<number>(0);
  const lastComputedUpdateTime = useRef<number>(0);

  // === 내부 헬퍼 함수들 ===

  const updateComputedMetrics = useCallback(() => {
    const movement = movementStore.getValue();
    const activity = activityStore.getValue();
    const clicks = clicksStore.getValue();
    const currentComputed = computedStore.getValue();
    computedStore.setValue(
      computedMetricsFromState(
        movement,
        activity,
        clicks,
        currentComputed,
        Date.now()
      )
    );
  }, [movementStore, activityStore, clicksStore, computedStore]);

  const updatePerformanceMetrics = useCallback(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;
    const currentPerf = performanceStore.getValue();

    const newRenderCount = currentPerf.renderCount + 1;
    const avgRenderTime =
      (currentPerf.avgRenderTime * currentPerf.renderCount + renderTime) /
      newRenderCount;

    performanceStore.setValue({
      renderCount: newRenderCount,
      lastRenderTime: renderTime,
      avgRenderTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
    });
  }, [performanceStore]);

  // === 액션 핸들러: updatePosition ===
  const handleUpdatePosition = useCallback(
    async (payload: { x: number; y: number; timestamp: number }) => {
      const { x, y, timestamp } = payload;
      const currentPosition = positionStore.getValue();
      const currentMovement = movementStore.getValue();
      const currentActivity = activityStore.getValue();

      // 성능 메트릭 시작
      renderStartTime.current = performance.now();

      // 1. 위치 업데이트
      const newPosition: MousePosition = { x, y, timestamp };
      positionStore.setValue(newPosition);

      // 2. 움직임 계산 및 업데이트
      const newMovement = calculateMovement(
        currentPosition,
        currentMovement,
        newPosition
      );
      if (newMovement) {
        movementStore.setValue(newMovement);

        // 3. 활동 상태 업데이트
        activityStore.setValue(
          activityAfterMovement(
            currentActivity,
            timestamp,
            newMovement.velocity
          )
        );

        // 4. 계산된 메트릭스 업데이트 (throttled to 500ms for performance)
        const now = Date.now();
        if (now - lastComputedUpdateTime.current >= 500) {
          updateComputedMetrics();
          lastComputedUpdateTime.current = now;
        }
      }

      // 성능 메트릭 업데이트
      updatePerformanceMetrics();
    },
    [positionStore, movementStore, activityStore, updateComputedMetrics]
  );

  // === 액션 핸들러: recordClick ===
  const handleRecordClick = useCallback(
    async (payload: MouseClick) => {
      const currentClicks = clicksStore.getValue();
      const currentActivity = activityStore.getValue();

      const newClicks = clicksAfterClick(currentClicks, payload);

      clicksStore.setValue(newClicks);

      // 활동 상태를 'clicking'으로 변경
      activityStore.setValue(
        activityAfterClick(currentActivity, payload.timestamp)
      );

      // 300ms 후 상태 복원
      setTimeout(() => {
        const activity = activityStore.getValue();
        if (activity.current === 'clicking') {
          activityStore.setValue({
            ...activity,
            current: 'idle',
          });
        }
      }, 300);
    },
    [clicksStore, activityStore]
  );

  // === 액션 핸들러: enterArea ===
  const handleEnterArea = useCallback(
    async (payload: { x: number; y: number; timestamp: number }) => {
      const { x, y, timestamp } = payload;
      const currentActivity = activityStore.getValue();

      // 초기 위치 설정
      positionStore.setValue({ x, y, timestamp });

      // 영역 진입 상태 설정
      activityStore.setValue({
        ...currentActivity,
        isInsideArea: true,
        lastActivity: timestamp,
      });
    },
    [positionStore, activityStore]
  );

  // === 액션 핸들러: leaveArea ===
  const handleLeaveArea = useCallback(
    async (payload: { timestamp: number }) => {
      const currentActivity = activityStore.getValue();

      activityStore.setValue({
        ...currentActivity,
        current: 'idle',
        isInsideArea: false,
        lastActivity: payload.timestamp,
      });
    },
    [activityStore]
  );

  // === 액션 핸들러: reset ===
  const handleReset = useCallback(async () => {
    const sessionStartTime = Date.now();

    positionStore.setValue({ x: -999, y: -999, timestamp: 0 });
    movementStore.setValue({
      velocity: 0,
      distance: 0,
      isMoving: false,
      path: [],
      moveCount: 0,
    });
    clicksStore.setValue({
      total: 0,
      history: [],
      recent: [],
    });
    activityStore.setValue({
      current: 'idle',
      lastActivity: 0,
      isInsideArea: false,
      sessionStartTime,
    });
    computedStore.setValue({
      averageVelocity: 0,
      maxVelocity: 0,
      totalDistance: 0,
      sessionDuration: 0,
      eventsPerSecond: 0,
    });
    performanceStore.setValue({
      renderCount: 0,
      lastRenderTime: 0,
      avgRenderTime: 0,
      memoryUsage: 0,
    });
  }, [
    positionStore,
    movementStore,
    clicksStore,
    activityStore,
    computedStore,
    performanceStore,
  ]);

  // === 반응형 마운트 상태에 따른 핸들러 활성화 ===
  useEffect(() => {
    if (isContainerMounted && containerElement) {
      console.log(
        '🎯 [useMouseEventsLogic] Container mounted via reactive state'
      );
      console.log('🚀 [useMouseEventsLogic] Handlers are now ready');
    } else {
      console.log(
        '🔄 [useMouseEventsLogic] Container unmounted, handlers deactivated'
      );
    }
  }, [isContainerMounted, containerElement]);

  // === 주기적 메트릭스 업데이트 제거 ===
  // 메트릭스는 사용자 액션 시에만 업데이트 (updatePosition 핸들러에서 처리)

  // 🎯 반응형 Hook 초기화 상태 반환 - 진짜 마운트 상태 기반
  return {
    initialized: true,
    containerMounted: isContainerMounted,
    isWaitingForMount: containerMountState.isWaitingForMount, // RefContext 기본 제공
    containerElement: containerElement,
    // 추가 반응형 정보
    reactiveState: containerMountState,
    handlers: {
      updatePosition: handleUpdatePosition,
      recordClick: handleRecordClick,
      enterArea: handleEnterArea,
      leaveArea: handleLeaveArea,
      reset: handleReset,
    },
  };
}
