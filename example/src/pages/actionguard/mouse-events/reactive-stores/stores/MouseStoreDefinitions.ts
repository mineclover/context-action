/**
 * @fileoverview Mouse Store Definitions - 분할된 스토어 정의
 * 
 * Service class 데이터를 여러 stores로 분할하여 세밀한 반응성 제공
 */

import { Store, createStore } from '@context-action/react';

// ================================
// 📊 Store 타입 정의
// ================================

export interface MousePosition {
  x: number;
  y: number;
}

export interface ClickHistory {
  x: number;
  y: number;
  timestamp: number;
}

// 위치 관련 상태
export interface MousePositionState {
  current: MousePosition;
  previous: MousePosition;
  isInsideArea: boolean;
}

// 경로 관련 상태
export interface MousePathState {
  movePath: MousePosition[];
  pathLength: number;
  validPath: MousePosition[]; // 지연 계산
}

// 메트릭 관련 상태
export interface MouseMetricsState {
  moveCount: number;
  clickCount: number;
  velocity: number;
  isMoving: boolean;
  lastMoveTime: number | null;
}

// 클릭 관련 상태
export interface MouseClickState {
  clickHistory: ClickHistory[];
  lastClick: ClickHistory | null;
  recentClickCount: number; // 지연 계산
}

// 계산된 상태 (지연 평가)
export interface MouseComputedState {
  hasActivity: boolean;
  averageVelocity: number;
  totalEvents: number;
  activityStatus: 'idle' | 'moving' | 'clicking';
}

// ================================
// 🏪 Store 생성 함수들
// ================================

/**
 * 마우스 위치 상태 스토어 생성
 */
export function createMousePositionStore(): Store<MousePositionState> {
  return createStore<MousePositionState>('mousePosition', {
    current: { x: -999, y: -999 },
    previous: { x: -999, y: -999 },
    isInsideArea: false,
  });
}

/**
 * 마우스 경로 상태 스토어 생성
 */
export function createMousePathStore(): Store<MousePathState> {
  return createStore<MousePathState>('mousePath', {
    movePath: [],
    pathLength: 0,
    validPath: [], // 초기값, 지연 계산됨
  });
}

/**
 * 마우스 메트릭 상태 스토어 생성
 */
export function createMouseMetricsStore(): Store<MouseMetricsState> {
  return createStore<MouseMetricsState>('mouseMetrics', {
    moveCount: 0,
    clickCount: 0,
    velocity: 0,
    isMoving: false,
    lastMoveTime: null,
  });
}

/**
 * 마우스 클릭 상태 스토어 생성
 */
export function createMouseClickStore(): Store<MouseClickState> {
  return createStore<MouseClickState>('mouseClicks', {
    clickHistory: [],
    lastClick: null,
    recentClickCount: 0, // 초기값, 지연 계산됨
  });
}

/**
 * 계산된 상태 스토어 생성 (지연 평가)
 */
export function createMouseComputedStore(): Store<MouseComputedState> {
  return createStore<MouseComputedState>('mouseComputed', {
    hasActivity: false,
    averageVelocity: 0,
    totalEvents: 0,
    activityStatus: 'idle',
  });
}

// ================================
// 🎯 Store 컬렉션 타입
// ================================

export interface MouseStoreCollection {
  position: Store<MousePositionState>;
  path: Store<MousePathState>;
  metrics: Store<MouseMetricsState>;
  clicks: Store<MouseClickState>;
  computed: Store<MouseComputedState>;
}

/**
 * 모든 마우스 스토어를 생성하는 팩토리 함수
 */
export function createMouseStoreCollection(): MouseStoreCollection {
  return {
    position: createMousePositionStore(),
    path: createMousePathStore(),
    metrics: createMouseMetricsStore(),
    clicks: createMouseClickStore(),
    computed: createMouseComputedStore(),
  };
}

// ================================
// 🔄 지연 평가 헬퍼 함수들
// ================================

/**
 * 유효한 경로 계산 (지연 평가)
 */
export function computeValidPath(movePath: MousePosition[]): MousePosition[] {
  return movePath.filter(pos => pos.x !== -999 && pos.y !== -999 && pos.x !== 0 && pos.y !== 0);
}

/**
 * 최근 클릭 수 계산 (지연 평가)
 */
export function computeRecentClickCount(clickHistory: ClickHistory[], timeWindow: number = 1500): number {
  const now = Date.now();
  return clickHistory.filter(click => now - click.timestamp <= timeWindow).length;
}

/**
 * 평균 속도 계산 (지연 평가)
 */
export function computeAverageVelocity(movePath: MousePosition[]): number {
  if (movePath.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < movePath.length; i++) {
    const deltaX = movePath[i].x - movePath[i - 1].x;
    const deltaY = movePath[i].y - movePath[i - 1].y;
    totalDistance += Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }
  
  return totalDistance / (movePath.length - 1);
}

/**
 * 활동 상태 계산 (지연 평가)
 */
export function computeActivityStatus(
  isMoving: boolean,
  recentClickCount: number,
  velocity: number,
  lastClickTime?: number | null
): 'idle' | 'moving' | 'clicking' {
  const now = Date.now();
  const timeSinceLastClick = lastClickTime ? now - lastClickTime : Infinity;
  
  // 500ms 이내의 매우 최근 클릭만 clicking으로 처리
  if (recentClickCount > 0 && timeSinceLastClick < 500) {
    return 'clicking';
  }
  
  // 이동 중이고 속도가 있으면 moving
  if (isMoving && velocity > 0.1) {
    return 'moving';
  }
  
  return 'idle';
}

/**
 * 활동 여부 계산 (지연 평가)
 */
export function computeHasActivity(moveCount: number, clickCount: number): boolean {
  return moveCount > 0 || clickCount > 0;
}