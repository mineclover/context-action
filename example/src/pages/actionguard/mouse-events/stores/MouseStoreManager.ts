/**
 * @fileoverview Mouse Store Manager - 스토어 간 동기화 및 지연 평가 관리
 * 
 * 여러 stores 간의 상태 동기화와 computed values의 지연 평가를 담당
 */

import type { Store } from '@context-action/react';
import type {
  MouseStoreCollection,
  MousePosition,
  ClickHistory,
  MousePositionState,
  MousePathState,
  MouseMetricsState,
  MouseClickState,
  MouseComputedState,
} from './MouseStoreDefinitions';
import {
  computeValidPath,
  computeRecentClickCount,
  computeAverageVelocity,
  computeActivityStatus,
  computeHasActivity,
} from './MouseStoreDefinitions';

/**
 * 마우스 스토어 관리자
 * 
 * - 여러 스토어 간의 상태 동기화
 * - 계산된 값들의 지연 평가
 * - 성능 최적화를 위한 배치 업데이트
 */
export class MouseStoreManager {
  private stores: MouseStoreCollection;
  private maxPathLength = 20;
  private maxClickHistory = 10;
  private computeDebounceMs = 16; // ~60fps
  private computeTimer: NodeJS.Timeout | null = null;
  private isComputeScheduled = false;

  constructor(stores: MouseStoreCollection) {
    this.stores = stores;
    
    // 초기 계산된 값들 설정
    this.forceComputedUpdate();
  }

  // ================================
  // 📊 위치 업데이트
  // ================================

  /**
   * 마우스 위치 업데이트
   */
  updatePosition(position: MousePosition, timestamp: number): void {
    const currentPosition = this.stores.position.getValue();
    const currentPath = this.stores.path.getValue();
    const currentMetrics = this.stores.metrics.getValue();

    // 속도 계산
    const timeDiff = currentMetrics.lastMoveTime ? timestamp - currentMetrics.lastMoveTime : 0;
    const deltaX = position.x - currentPosition.current.x;
    const deltaY = position.y - currentPosition.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = timeDiff > 0 ? distance / timeDiff : 0;

    // 위치 상태 업데이트
    this.stores.position.setValue({
      previous: currentPosition.current,
      current: position,
      isInsideArea: currentPosition.isInsideArea,
    });

    // 경로 상태 업데이트
    const newMovePath = [position, ...currentPath.movePath.slice(0, this.maxPathLength - 1)];
    this.stores.path.setValue({
      movePath: newMovePath,
      pathLength: newMovePath.length,
      validPath: currentPath.validPath, // 지연 계산됨
    });

    // 메트릭 상태 업데이트
    this.stores.metrics.setValue({
      moveCount: currentMetrics.moveCount + 1,
      clickCount: currentMetrics.clickCount,
      velocity,
      isMoving: true,
      lastMoveTime: timestamp,
    });

    // 계산된 값들 지연 평가 스케줄링
    this.scheduleComputedUpdate();
  }

  /**
   * 클릭 이벤트 추가
   */
  addClick(position: MousePosition, timestamp: number): void {
    const currentClicks = this.stores.clicks.getValue();
    const currentMetrics = this.stores.metrics.getValue();

    const newClick: ClickHistory = { ...position, timestamp };
    const newClickHistory = [newClick, ...currentClicks.clickHistory.slice(0, this.maxClickHistory - 1)];

    // 클릭 상태 업데이트
    this.stores.clicks.setValue({
      clickHistory: newClickHistory,
      lastClick: newClick,
      recentClickCount: currentClicks.recentClickCount, // 지연 계산됨
    });

    // 메트릭 상태 업데이트
    this.stores.metrics.setValue({
      ...currentMetrics,
      clickCount: currentMetrics.clickCount + 1,
    });

    // 계산된 값들 지연 평가 스케줄링
    this.scheduleComputedUpdate();
  }

  /**
   * 영역 진입/이탈 상태 업데이트
   */
  setInsideArea(isInside: boolean, position?: MousePosition): void {
    const current = this.stores.position.getValue();
    
    this.stores.position.setValue({
      ...current,
      isInsideArea: isInside,
      ...(position && { current: position }),
    });

    this.scheduleComputedUpdate();
  }

  /**
   * 이동 상태 업데이트
   */
  setMoving(isMoving: boolean): void {
    const current = this.stores.metrics.getValue();
    
    this.stores.metrics.setValue({
      ...current,
      isMoving,
    });

    this.scheduleComputedUpdate();
  }

  // ================================
  // 🔄 지연 평가 관리
  // ================================

  /**
   * 계산된 값들의 업데이트를 스케줄링 (디바운싱)
   */
  private scheduleComputedUpdate(): void {
    if (this.isComputeScheduled) return;
    
    this.isComputeScheduled = true;
    
    if (this.computeTimer) {
      clearTimeout(this.computeTimer);
    }

    this.computeTimer = setTimeout(() => {
      this.updateComputedValues();
      this.isComputeScheduled = false;
    }, this.computeDebounceMs);
  }

  /**
   * 모든 계산된 값들을 업데이트 (지연 평가)
   */
  private updateComputedValues(): void {
    const positionState = this.stores.position.getValue();
    const pathState = this.stores.path.getValue();
    const metricsState = this.stores.metrics.getValue();
    const clicksState = this.stores.clicks.getValue();

    // 지연 계산된 값들
    const validPath = computeValidPath(pathState.movePath);
    const recentClickCount = computeRecentClickCount(clicksState.clickHistory);
    const averageVelocity = computeAverageVelocity(validPath);
    const lastClickTime = clicksState.lastClick?.timestamp || null;
    const activityStatus = computeActivityStatus(metricsState.isMoving, recentClickCount, metricsState.velocity, lastClickTime);
    const hasActivity = computeHasActivity(metricsState.moveCount, metricsState.clickCount);
    const totalEvents = metricsState.moveCount + metricsState.clickCount;

    // 디버깅 로그
    console.log('🧮 Lazy computed values updated:', {
      validPathLength: validPath.length,
      recentClickCount,
      averageVelocity: averageVelocity.toFixed(2),
      activityStatus,
      hasActivity,
      totalEvents
    });

    // 경로 상태에 계산된 validPath 업데이트
    this.stores.path.setValue({
      ...pathState,
      validPath,
    });

    // 클릭 상태에 계산된 recentClickCount 업데이트
    this.stores.clicks.setValue({
      ...clicksState,
      recentClickCount,
    });

    // 계산된 상태 업데이트
    this.stores.computed.setValue({
      hasActivity,
      averageVelocity,
      totalEvents,
      activityStatus,
    });
  }

  /**
   * 즉시 계산된 값들을 업데이트 (강제)
   */
  forceComputedUpdate(): void {
    if (this.computeTimer) {
      clearTimeout(this.computeTimer);
      this.computeTimer = null;
    }
    this.isComputeScheduled = false;
    this.updateComputedValues();
  }

  // ================================
  // 🔄 상태 관리
  // ================================

  /**
   * 모든 상태 초기화
   */
  reset(): void {
    this.stores.position.setValue({
      current: { x: -999, y: -999 },
      previous: { x: -999, y: -999 },
      isInsideArea: false,
    });

    this.stores.path.setValue({
      movePath: [],
      pathLength: 0,
      validPath: [],
    });

    this.stores.metrics.setValue({
      moveCount: 0,
      clickCount: 0,
      velocity: 0,
      isMoving: false,
      lastMoveTime: null,
    });

    this.stores.clicks.setValue({
      clickHistory: [],
      lastClick: null,
      recentClickCount: 0,
    });

    this.stores.computed.setValue({
      hasActivity: false,
      averageVelocity: 0,
      totalEvents: 0,
      activityStatus: 'idle',
    });

    // 타이머 정리
    if (this.computeTimer) {
      clearTimeout(this.computeTimer);
      this.computeTimer = null;
    }
    this.isComputeScheduled = false;
    
    // 초기 계산된 값들로 리셋
    this.forceComputedUpdate();
  }

  // ================================
  // 📊 조회 메서드들
  // ================================

  /**
   * 현재 위치 조회
   */
  getCurrentPosition(): MousePosition {
    return this.stores.position.getValue().current;
  }

  /**
   * 유효한 경로 조회 (지연 계산된 값)
   */
  getValidPath(): MousePosition[] {
    return this.stores.path.getValue().validPath;
  }

  /**
   * 현재 메트릭 조회
   */
  getCurrentMetrics() {
    return {
      ...this.stores.metrics.getValue(),
      ...this.stores.computed.getValue(),
    };
  }

  /**
   * 스토어 컬렉션 조회 (외부 접근용)
   */
  getStores(): MouseStoreCollection {
    return this.stores;
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    if (this.computeTimer) {
      clearTimeout(this.computeTimer);
      this.computeTimer = null;
    }
    this.isComputeScheduled = false;
    
    console.log('🗑️ MouseStoreManager disposed');
  }
}