/**
 * @fileoverview Non-Reactive Metrics Hook
 * 
 * 완전한 Non-Reactive 패턴:
 * - Store 구독 없음
 * - 수동 업데이트만 (버튼 클릭, 특정 이벤트)
 * - React re-render 완전 제거
 * - 필요할 때만 store.getValue()로 데이터 조회
 */

import { useCallback, useState } from 'react';
import { useStoreDataAccess } from './useStoreDataAccess';

/**
 * Non-Reactive 메트릭 Hook
 * 
 * 특징:
 * - 자동 업데이트 없음 (React subscription 없음)
 * - 수동 refresh 방식
 * - Store는 순수 데이터 저장소로만 사용
 * - 최고 성능 (re-render 0회)
 */
export function useNonReactiveMetrics() {
  const storeData = useStoreDataAccess();
  
  // 마지막 업데이트된 데이터 (수동 관리)
  const [lastSnapshot, setLastSnapshot] = useState<any>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  
  // === 수동 데이터 새로고침 ===
  const refreshMetrics = useCallback(() => {
    const snapshot = {
      ...storeData.getCurrentMetrics(),
      clicks: storeData.getCurrentClicks(),
      position: storeData.getCurrentPosition(),
      movement: storeData.getCurrentMovement(),
      timestamp: Date.now()
    };
    
    setLastSnapshot(snapshot);
    setLastUpdateTime(Date.now());
    
    return snapshot;
  }, [storeData]);
  
  // === 특정 메트릭만 새로고침 ===
  const refreshClicksOnly = useCallback(() => {
    const clicks = storeData.getCurrentClicks();
    setLastSnapshot((prev: any) => ({ 
      ...prev, 
      clicks,
      timestamp: Date.now()
    }));
    setLastUpdateTime(Date.now());
    return clicks;
  }, [storeData]);
  
  // === 필수 정보만 새로고침 (경량) ===
  const refreshEssentials = useCallback(() => {
    const essentials = storeData.getEssentialData();
    setLastSnapshot((prev: any) => ({ 
      ...prev, 
      ...essentials,
      timestamp: Date.now()
    }));
    setLastUpdateTime(Date.now());
    return essentials;
  }, [storeData]);
  
  // === 실시간 데이터 조회 (캐싱 없음) ===
  const getLiveData = useCallback(() => {
    return {
      metrics: storeData.getCurrentMetrics(),
      clicks: storeData.getCurrentClicks(),
      position: storeData.getCurrentPosition(),
      movement: storeData.getCurrentMovement(),
      timestamp: Date.now()
    };
  }, [storeData]);
  
  // === 자동 새로고침 제거 ===
  // 선택적 구독 패턴에서는 수동 새로고침만 사용
  
  // === 컴포넌트용 표시 데이터 ===
  const getDisplayData = useCallback(() => {
    const current = lastSnapshot || refreshMetrics();
    
    return {
      // Activity 상태
      activity: {
        isActive: current.isActive,
        statusText: current.activityStatus,
        statusColor: current.activityStatus === 'MOVING' ? 'green' : 
                     current.activityStatus === 'CLICKING' ? 'purple' : 'gray'
      },
      
      // 클릭 정보 
      clicks: {
        recent: current.clicks?.recent || [],
        totalText: current.clicks?.totalText || '0 clicks',
        recentText: current.clicks?.recentText || '0 recent'
      },
      
      // 요약 정보
      summary: {
        hasActivity: current.sessionDuration > 0,
        isTracking: current.isActive,
        lastUpdate: lastUpdateTime
      }
    };
  }, [lastSnapshot, lastUpdateTime, refreshMetrics]);
  
  return {
    // 수동 새로고침
    refreshMetrics,
    refreshClicksOnly,
    refreshEssentials,
    
    // 실시간 조회
    getLiveData,
    
    // 표시용 데이터
    getDisplayData,
    
    // 상태 정보
    lastSnapshot,
    lastUpdateTime,
    timeSinceUpdate: Date.now() - lastUpdateTime
  };
}