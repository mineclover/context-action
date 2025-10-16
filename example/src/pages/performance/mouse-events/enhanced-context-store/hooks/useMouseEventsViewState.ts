/**
 * @fileoverview Mouse Events View State Hook
 *
 * ViewModel Layer: View에 상태를 주입하는 Hook
 * - Store 구독을 통한 reactive 상태 반환
 * - View에서 사용할 계산된 값들 제공
 * - 성능 최적화된 선택적 구독
 */

import { useStoreValue } from '@context-action/react';
import { useMemo } from 'react';
import { useMouseStore } from '../context/MouseEventsModel';

/**
 * 마우스 이벤트 View 상태를 관리하는 Hook
 *
 * 역할:
 * - Store 구독을 통한 reactive 상태 제공
 * - View에 필요한 계산된 값들 반환
 * - 선택적 구독으로 성능 최적화
 */
export function useMouseEventsViewState() {
  // === Store 구독 ===
  const positionStore = useMouseStore('position');
  const movementStore = useMouseStore('movement');
  const clicksStore = useMouseStore('clicks');
  const computedStore = useMouseStore('computed');
  const activityStore = useMouseStore('activity');
  const performanceStore = useMouseStore('performance');

  // === Reactive 상태 구독 ===
  const position = useStoreValue(positionStore);
  const movement = useStoreValue(movementStore);
  const clicks = useStoreValue(clicksStore);
  const computed = useStoreValue(computedStore);
  const activity = useStoreValue(activityStore);
  const performance = useStoreValue(performanceStore);

  // === 계산된 View 상태 ===
  const viewState = useMemo(
    () => ({
      // 위치 정보
      position: {
        current: position,
        isValid: position.x !== -999 && position.y !== -999,
        displayText:
          position.x !== -999 ? `(${position.x}, ${position.y})` : 'Outside',
      },

      // 움직임 정보
      movement: {
        ...movement,
        velocityText:
          movement.velocity > 0.1
            ? `${movement.velocity.toFixed(3)} px/ms`
            : movement.velocity > 0
              ? `${(movement.velocity * 1000).toFixed(0)} px/s`
              : 'Idle',
        distanceText: `${movement.distance.toFixed(1)} px`,
        pathLengthText: `${movement.path.length} points`,
      },

      // 클릭 정보
      clicks: {
        ...clicks,
        totalText: `${clicks.total} clicks`,
        recentText: `${clicks.recent.length} recent`,
        hasHistory: clicks.history.length > 0,
      },

      // 계산된 메트릭스
      computed: {
        ...computed,
        averageVelocityText: `${computed.averageVelocity.toFixed(3)} px/ms`,
        maxVelocityText: `${computed.maxVelocity.toFixed(3)} px/ms`,
        totalDistanceText: `${computed.totalDistance.toFixed(1)} px`,
        sessionDurationText: `${computed.sessionDuration.toFixed(1)}s`,
        eventsPerSecondText: `${computed.eventsPerSecond.toFixed(1)} e/s`,
      },

      // 활동 상태
      activity: {
        ...activity,
        statusText: activity.current.toUpperCase(),
        statusColor:
          activity.current === 'moving'
            ? 'green'
            : activity.current === 'clicking'
              ? 'purple'
              : 'gray',
        isActive: activity.isInsideArea,
        timeSinceActivity:
          activity.lastActivity > 0 ? Date.now() - activity.lastActivity : 0,
      },

      // 성능 메트릭스
      performance: {
        ...performance,
        renderCountText: `${performance.renderCount} renders`,
        avgRenderTimeText: `${performance.avgRenderTime.toFixed(2)}ms avg`,
        memoryUsageText:
          performance.memoryUsage > 0
            ? `${(performance.memoryUsage / 1024 / 1024).toFixed(1)}MB`
            : 'N/A',
      },
    }),
    [position, movement, clicks, computed, activity, performance]
  );

  // === 상태 요약 정보 ===
  const summary = useMemo(
    () => ({
      hasActivity: movement.moveCount > 0 || clicks.total > 0,
      isTracking: activity.isInsideArea,
      totalEvents: movement.moveCount + clicks.total,
      sessionActive: computed.sessionDuration > 0,
    }),
    [
      movement.moveCount,
      clicks.total,
      activity.isInsideArea,
      computed.sessionDuration,
    ]
  );

  return {
    ...viewState,
    summary,
  };
}

/**
 * 개별 Store만 구독하는 최적화된 Hook들
 * 특정 부분만 업데이트가 필요한 컴포넌트에서 사용
 */

export function useMousePosition() {
  const positionStore = useMouseStore('position');
  return useStoreValue(positionStore);
}

export function useMouseMovement() {
  const movementStore = useMouseStore('movement');
  return useStoreValue(movementStore);
}

export function useMouseClicks() {
  const clicksStore = useMouseStore('clicks');
  return useStoreValue(clicksStore);
}

export function useMouseActivity() {
  const activityStore = useMouseStore('activity');
  return useStoreValue(activityStore);
}

export function useComputedMetrics() {
  const computedStore = useMouseStore('computed');
  return useStoreValue(computedStore);
}

export function usePerformanceMetrics() {
  const performanceStore = useMouseStore('performance');
  return useStoreValue(performanceStore);
}
