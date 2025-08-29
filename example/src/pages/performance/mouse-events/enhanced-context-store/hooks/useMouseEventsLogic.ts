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
  useMouseStore, 
  useMouseActionHandler,
  type MousePosition,
  type MouseClick,
  type MouseMovement,
  type ComputedMetrics,
  type ActivityStatus
} from '../context/MouseEventsModel';

/**
 * 마우스 이벤트 비즈니스 로직을 관리하는 Hook
 * 
 * 역할:
 * - 액션 핸들러 등록
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
  
  // 성능 추적용 refs
  const lastUpdateTime = useRef<number>(Date.now());
  const renderStartTime = useRef<number>(0);
  const lastComputedUpdateTime = useRef<number>(0);
  
  // === 내부 헬퍼 함수들 ===
  
  const updateComputedMetrics = useCallback(() => {
    const movement = movementStore.getValue();
    const activity = activityStore.getValue();
    const clicks = clicksStore.getValue();
    
    const now = Date.now();
    const sessionDuration = (now - activity.sessionStartTime) / 1000;
    const totalEvents = movement.moveCount + clicks.total;
    
    // 평균 속도 계산
    const averageVelocity = movement.path.length > 1
      ? movement.path.reduce((sum, point, index, array) => {
          if (index === 0) return sum;
          const prev = array[index - 1];
          const distance = Math.sqrt(
            Math.pow(point.x - prev.x, 2) + Math.pow(point.y - prev.y, 2)
          );
          const deltaTime = point.timestamp - prev.timestamp;
          return sum + (deltaTime > 0 ? distance / deltaTime : 0);
        }, 0) / (movement.path.length - 1)
      : 0;
    
    // 최대 속도 추적
    const currentComputed = computedStore.getValue();
    const maxVelocity = Math.max(currentComputed.maxVelocity, movement.velocity);
    
    const newComputed: ComputedMetrics = {
      averageVelocity,
      maxVelocity,
      totalDistance: movement.distance,
      sessionDuration,
      eventsPerSecond: sessionDuration > 0 ? totalEvents / sessionDuration : 0
    };
    
    computedStore.setValue(newComputed);
  }, [movementStore, activityStore, clicksStore, computedStore]);
  
  const updatePerformanceMetrics = useCallback(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;
    const currentPerf = performanceStore.getValue();
    
    const newRenderCount = currentPerf.renderCount + 1;
    const avgRenderTime = (
      (currentPerf.avgRenderTime * currentPerf.renderCount + renderTime) / 
      newRenderCount
    );
    
    performanceStore.setValue({
      renderCount: newRenderCount,
      lastRenderTime: renderTime,
      avgRenderTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
    });
  }, [performanceStore]);
  
  // === 액션 핸들러: updatePosition ===
  const handleUpdatePosition = useCallback(async (payload: { x: number; y: number; timestamp: number }) => {
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
    if (currentPosition.x !== -999 && currentPosition.y !== -999) {
      const deltaX = x - currentPosition.x;
      const deltaY = y - currentPosition.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const deltaTime = timestamp - currentPosition.timestamp;
      const velocity = deltaTime > 0 ? distance / deltaTime : 0;
      
      const newMovement: MouseMovement = {
        velocity,
        distance: currentMovement.distance + distance,
        isMoving: velocity > 0.1,
        path: [...currentMovement.path, { x, y, timestamp }].slice(-50),
        moveCount: currentMovement.moveCount + 1
      };
      
      movementStore.setValue(newMovement);
      
      // 3. 활동 상태 업데이트
      const newActivity: ActivityStatus = {
        ...currentActivity,
        current: velocity > 0.1 ? 'moving' : 'idle',
        lastActivity: timestamp,
        isInsideArea: true
      };
      
      activityStore.setValue(newActivity);
      
      // 4. 계산된 메트릭스 업데이트 (throttled to 500ms for performance)
      const now = Date.now();
      if (now - lastComputedUpdateTime.current >= 500) {
        updateComputedMetrics();
        lastComputedUpdateTime.current = now;
      }
    }
    
    // 성능 메트릭 업데이트
    updatePerformanceMetrics();
    
  }, [positionStore, movementStore, activityStore, updateComputedMetrics]);
  
  // === 액션 핸들러: recordClick ===
  const handleRecordClick = useCallback(async (payload: MouseClick) => {
    const currentClicks = clicksStore.getValue();
    const currentActivity = activityStore.getValue();
    
    const newClicks = {
      total: currentClicks.total + 1,
      history: [payload, ...currentClicks.history].slice(0, 100),
      recent: [payload, ...currentClicks.recent.filter(
        click => payload.timestamp - click.timestamp <= 2000
      )].slice(0, 10)
    };
    
    clicksStore.setValue(newClicks);
    
    // 활동 상태를 'clicking'으로 변경
    activityStore.setValue({
      ...currentActivity,
      current: 'clicking',
      lastActivity: payload.timestamp
    });
    
    // 300ms 후 상태 복원
    setTimeout(() => {
      const activity = activityStore.getValue();
      if (activity.current === 'clicking') {
        activityStore.setValue({
          ...activity,
          current: 'idle'
        });
      }
    }, 300);
    
  }, [clicksStore, activityStore]);
  
  // === 액션 핸들러: enterArea ===
  const handleEnterArea = useCallback(async (payload: { x: number; y: number; timestamp: number }) => {
    const { x, y, timestamp } = payload;
    const currentActivity = activityStore.getValue();
    
    // 초기 위치 설정
    positionStore.setValue({ x, y, timestamp });
    
    // 영역 진입 상태 설정
    activityStore.setValue({
      ...currentActivity,
      isInsideArea: true,
      lastActivity: timestamp
    });
    
  }, [positionStore, activityStore]);
  
  // === 액션 핸들러: leaveArea ===
  const handleLeaveArea = useCallback(async (payload: { timestamp: number }) => {
    const currentActivity = activityStore.getValue();
    
    activityStore.setValue({
      ...currentActivity,
      current: 'idle',
      isInsideArea: false,
      lastActivity: payload.timestamp
    });
    
  }, [activityStore]);
  
  // === 액션 핸들러: reset ===
  const handleReset = useCallback(async () => {
    const sessionStartTime = Date.now();
    
    positionStore.setValue({ x: -999, y: -999, timestamp: 0 });
    movementStore.setValue({
      velocity: 0,
      distance: 0,
      isMoving: false,
      path: [],
      moveCount: 0
    });
    clicksStore.setValue({
      total: 0,
      history: [],
      recent: []
    });
    activityStore.setValue({
      current: 'idle',
      lastActivity: 0,
      isInsideArea: false,
      sessionStartTime
    });
    computedStore.setValue({
      averageVelocity: 0,
      maxVelocity: 0,
      totalDistance: 0,
      sessionDuration: 0,
      eventsPerSecond: 0
    });
    performanceStore.setValue({
      renderCount: 0,
      lastRenderTime: 0,
      avgRenderTime: 0,
      memoryUsage: 0
    });
    
  }, [positionStore, movementStore, clicksStore, activityStore, computedStore, performanceStore]);
  
  // === 액션 핸들러 등록 ===
  useMouseActionHandler('updatePosition', handleUpdatePosition);
  useMouseActionHandler('recordClick', handleRecordClick);
  useMouseActionHandler('enterArea', handleEnterArea);
  useMouseActionHandler('leaveArea', handleLeaveArea);
  useMouseActionHandler('reset', handleReset);
  
  // === 주기적 메트릭스 업데이트 제거 ===
  // 메트릭스는 사용자 액션 시에만 업데이트 (updatePosition 핸들러에서 처리)
  
  // Hook이 초기화되었음을 알림
  return {
    initialized: true
  };
}