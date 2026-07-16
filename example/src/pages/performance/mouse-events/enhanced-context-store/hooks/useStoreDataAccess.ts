/**
 * @fileoverview Store Data Access Hook - Non-Reactive Pattern
 *
 * Store 최적화: 구독 없이 필요할 때만 데이터 조회
 * - useStoreValue() 구독 제거
 * - store.getValue()로 on-demand 접근
 * - React re-render 완전 제거
 */

import { useCallback, useRef } from 'react';
import { useMouseStore } from '../contexts/EnhancedContextStoreContexts';

/**
 * Non-Reactive Store 데이터 접근 Hook
 *
 * 핵심 원칙:
 * 1. Store 구독 없음 (useStoreValue 사용 안함)
 * 2. 필요할 때만 store.getValue()로 데이터 조회
 * 3. React re-render 없음
 * 4. Store는 순수 데이터 저장소 역할만
 */
export function useStoreDataAccess() {
  // Store 참조만 가져오기 (구독 없음)
  const computedStore = useMouseStore('computed');
  const activityStore = useMouseStore('activity');
  const performanceStore = useMouseStore('performance');
  const clicksStore = useMouseStore('clicks');
  const positionStore = useMouseStore('position');
  const movementStore = useMouseStore('movement');

  // 캐시용 refs (필요시 성능 최적화)
  const lastAccessTimeRef = useRef<number>(0);
  const cachedDataRef = useRef<any>(null);

  // === On-Demand 데이터 조회 함수들 ===

  const getCurrentMetrics = useCallback(() => {
    const computed = computedStore.getValue();
    const activity = activityStore.getValue();
    const performance = performanceStore.getValue();

    return {
      averageVelocity: computed.averageVelocity.toFixed(3),
      maxVelocity: computed.maxVelocity.toFixed(3),
      totalDistance: computed.totalDistance.toFixed(1),
      sessionDuration: computed.sessionDuration.toFixed(1),
      eventsPerSecond: computed.eventsPerSecond.toFixed(1),
      renderCount: performance.renderCount,
      avgRenderTime: performance.avgRenderTime.toFixed(2),
      activityStatus: activity.current.toUpperCase(),
      isActive: activity.isInsideArea,
    };
  }, [computedStore, activityStore, performanceStore]);

  const getCurrentClicks = useCallback(() => {
    const clicks = clicksStore.getValue();
    return {
      recent: clicks.recent,
      total: clicks.total,
      totalText: `${clicks.total} clicks`,
      recentText: `${clicks.recent.length} recent`,
    };
  }, [clicksStore]);

  const getCurrentPosition = useCallback(() => {
    const position = positionStore.getValue();
    return {
      x: position.x,
      y: position.y,
      displayText:
        position.x !== -999 ? `(${position.x}, ${position.y})` : 'Outside',
      isValid: position.x !== -999 && position.y !== -999,
    };
  }, [positionStore]);

  const getCurrentMovement = useCallback(() => {
    const movement = movementStore.getValue();
    return {
      velocity: movement.velocity,
      distance: movement.distance,
      pathLength: movement.path.length,
      moveCount: movement.moveCount,
      isMoving: movement.isMoving,
    };
  }, [movementStore]);

  // === 캐시된 데이터 조회 (성능 최적화) ===
  const getCachedMetrics = useCallback(
    (maxAge: number = 100) => {
      const now = Date.now();

      if (now - lastAccessTimeRef.current < maxAge && cachedDataRef.current) {
        return cachedDataRef.current;
      }

      const data = getCurrentMetrics();
      lastAccessTimeRef.current = now;
      cachedDataRef.current = data;

      return data;
    },
    [getCurrentMetrics]
  );

  // === 필요한 데이터만 선별 조회 ===
  const getEssentialData = useCallback(() => {
    return {
      activity: {
        isActive: activityStore.getValue().isInsideArea,
        statusText: activityStore.getValue().current.toUpperCase(),
      },
      clicks: clicksStore.getValue().recent,
      hasActivity: computedStore.getValue().sessionDuration > 0,
    };
  }, [activityStore, clicksStore, computedStore]);

  // === 디버깅용 데이터 덤프 ===
  const dumpAllStoreData = useCallback(() => {
    return {
      position: positionStore.getValue(),
      movement: movementStore.getValue(),
      clicks: clicksStore.getValue(),
      computed: computedStore.getValue(),
      activity: activityStore.getValue(),
      performance: performanceStore.getValue(),
    };
  }, [
    positionStore,
    movementStore,
    clicksStore,
    computedStore,
    activityStore,
    performanceStore,
  ]);

  return {
    // 개별 데이터 조회
    getCurrentMetrics,
    getCurrentClicks,
    getCurrentPosition,
    getCurrentMovement,

    // 최적화된 조회
    getCachedMetrics,
    getEssentialData,

    // 디버깅
    dumpAllStoreData,

    // 직접 Store 접근 (필요시)
    stores: {
      position: positionStore,
      movement: movementStore,
      clicks: clicksStore,
      computed: computedStore,
      activity: activityStore,
      performance: performanceStore,
    },
  };
}
