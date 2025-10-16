/**
 * @fileoverview Metrics Only Hook
 *
 * Store 최적화: 통계와 메트릭만 구독
 * - 시각적 업데이트와 무관한 데이터만 Store에서 관리
 * - 불필요한 구독 제거로 성능 향상
 */

import { useStoreValue } from '@context-action/react';
import { useMemo } from 'react';
import { useMouseStore } from '../context/MouseEventsModel';

/**
 * 메트릭 전용 Hook - 불필요한 Store 구독 제거
 *
 * 구독하는 Store:
 * - computed: 계산된 통계 (평균 속도, 총 거리 등)
 * - activity: 활동 상태 (세션 정보, 상태 텍스트)
 * - performance: 성능 메트릭 (렌더링 통계)
 * - clicks: 클릭 이벤트 (React로 표시할 클릭 마커용)
 *
 * 구독하지 않는 Store:
 * - position: RefContext에서 직접 처리
 * - movement: RefContext에서 직접 처리 (path, velocity)
 */
export function useMetricsOnly() {
  // === 필수 Store만 구독 (시각적 업데이트 무관) ===
  const computedStore = useMouseStore('computed');
  const activityStore = useMouseStore('activity');
  const performanceStore = useMouseStore('performance');
  const clicksStore = useMouseStore('clicks'); // 클릭 마커 표시용

  // === Reactive 구독 (최소한만) ===
  const computed = useStoreValue(computedStore);
  const activity = useStoreValue(activityStore);
  const performance = useStoreValue(performanceStore);
  const clicks = useStoreValue(clicksStore);

  // === 메트릭 전용 View 상태 ===
  const metricsState = useMemo(
    () => ({
      // 활동 상태 (UI 표시용)
      activity: {
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

      // 계산된 메트릭 (통계 표시용)
      computed: {
        ...computed,
        averageVelocityText: `${computed.averageVelocity.toFixed(3)} px/ms`,
        maxVelocityText: `${computed.maxVelocity.toFixed(3)} px/ms`,
        totalDistanceText: `${computed.totalDistance.toFixed(1)} px`,
        sessionDurationText: `${computed.sessionDuration.toFixed(1)}s`,
        eventsPerSecondText: `${computed.eventsPerSecond.toFixed(1)} e/s`,
      },

      // 성능 메트릭 (개발용)
      performance: {
        ...performance,
        renderCountText: `${performance.renderCount} renders`,
        avgRenderTimeText: `${performance.avgRenderTime.toFixed(2)}ms avg`,
        memoryUsageText:
          performance.memoryUsage > 0
            ? `${(performance.memoryUsage / 1024 / 1024).toFixed(1)}MB`
            : 'N/A',
      },

      // 클릭 정보 (React 마커 표시용만)
      clicks: {
        recent: clicks.recent, // React로 렌더링할 클릭 마커들
        totalText: `${clicks.total} clicks`,
        recentText: `${clicks.recent.length} recent`,
        hasHistory: clicks.history.length > 0,
      },
    }),
    [computed, activity, performance, clicks]
  );

  // === 요약 정보 ===
  const summary = useMemo(
    () => ({
      hasActivity: computed.sessionDuration > 0,
      isTracking: activity.isInsideArea,
      totalEvents: clicks.total, // movement 정보는 RefContext에서 처리하므로 제외
      sessionActive: computed.sessionDuration > 0,
    }),
    [computed.sessionDuration, activity.isInsideArea, clicks.total]
  );

  return {
    ...metricsState,
    summary,
  };
}

/**
 * 개별 메트릭 구독용 최적화 Hook들
 */
export function useActivityStatus() {
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

export function useClicksForMarkers() {
  const clicksStore = useMouseStore('clicks');
  return useStoreValue(clicksStore);
}
