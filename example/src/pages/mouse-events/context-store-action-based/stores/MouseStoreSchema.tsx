/**
 * @fileoverview Mouse Store Schema - Separated Patterns 정의
 *
 * Action Only + Store Only 패턴으로 마우스 이벤트 상태 관리
 */

import React from 'react';
import { createActionContext, createStoreContext } from '@context-action/react';

// ================================
// 📊 기본 타입 정의
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

// ================================
// 🏪 Store 상태 정의
// ================================

export interface MouseStateData {
  // 기본 상태
  mousePosition: MousePosition;
  previousPosition: MousePosition;
  isInsideArea: boolean;
  isMoving: boolean;

  // 카운터
  moveCount: number;
  clickCount: number;

  // 메트릭
  velocity: number;
  lastMoveTime: number | null;

  // 경로 및 클릭 기록
  movePath: MousePosition[];
  clickHistory: ClickHistory[];

  // 계산된 값들 (지연 평가)
  validPath: MousePosition[];
  recentClickCount: number;
  averageVelocity: number;
  activityStatus: 'idle' | 'moving' | 'clicking';
  totalEvents: number;
  hasActivity: boolean;
}

// ================================
// 🎯 액션 타입 정의
// ================================

export interface MouseActions {
  mouseMove: { position: MousePosition; timestamp: number };
  mouseClick: { position: MousePosition; button: number; timestamp: number };
  mouseEnter: { position: MousePosition; timestamp: number };
  mouseLeave: { position: MousePosition; timestamp: number };
  moveEnd: { position: MousePosition; timestamp: number };
  reset: void;
}

// ================================
// 🏪 기본 Store 초기값
// ================================

export const initialMouseState: MouseStateData = {
  // 기본 상태
  mousePosition: { x: -999, y: -999 },
  previousPosition: { x: -999, y: -999 },
  isInsideArea: false,
  isMoving: false,

  // 카운터
  moveCount: 0,
  clickCount: 0,

  // 메트릭
  velocity: 0,
  lastMoveTime: null,

  // 경로 및 클릭 기록
  movePath: [],
  clickHistory: [],

  // 계산된 값들 (초기값)
  validPath: [],
  recentClickCount: 0,
  averageVelocity: 0,
  activityStatus: 'idle' as const,
  totalEvents: 0,
  hasActivity: false,
};

// ================================
// 🔧 계산 유틸리티 함수들
// ================================

export function computeValidPath(movePath: MousePosition[]): MousePosition[] {
  // 유효한 경로 포인트만 필터링 (예: 경계 내부)
  return movePath.filter((point) => point.x >= 0 && point.y >= 0);
}

export function computeRecentClickCount(clickHistory: ClickHistory[]): number {
  // 최근 5초 내 클릭 수
  const fiveSecondsAgo = Date.now() - 5000;
  return clickHistory.filter((click) => click.timestamp > fiveSecondsAgo)
    .length;
}

export function computeAverageVelocity(validPath: MousePosition[]): number {
  if (validPath.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < Math.min(validPath.length, 10); i++) {
    const prev = validPath[i - 1];
    const curr = validPath[i];
    const distance = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
    totalDistance += distance;
  }

  return totalDistance / Math.min(validPath.length - 1, 9);
}

export function computeActivityStatus(
  isMoving: boolean,
  recentClickCount: number,
  velocity: number,
  lastClickTime: number | null
): 'idle' | 'moving' | 'clicking' {
  const recentClickThreshold = Date.now() - 500; // 0.5초

  if (lastClickTime && lastClickTime > recentClickThreshold) {
    return 'clicking';
  }

  if (isMoving && velocity > 0.1) {
    return 'moving';
  }

  return 'idle';
}

export function computeHasActivity(
  moveCount: number,
  clickCount: number
): boolean {
  return moveCount > 0 || clickCount > 0;
}

// ================================
// 🏪 Separated Patterns 생성
// ================================

const MouseActionContext = createActionContext<MouseActions>({
  name: 'Mouse-actions',
});

const MouseStoreContext = createStoreContext('Mouse-stores', {
  'mouseState': {
    initialValue: initialMouseState,
    strategy: 'shallow',
    debug: process.env.NODE_ENV === 'development',
    description: 'Mouse state store with shallow comparison',
    tags: ['mouse', 'events', 'state'],
    version: '1.0.0',
  },
});

// ================================
// 🔄 구조 분해 할당으로 Export
// ================================

export const {
  Provider: MouseActionProvider,
  useActionDispatch: useMouseActionDispatch,
  useActionHandler: useMouseActionHandler,
} = MouseActionContext;

export const {
  Provider: MouseStoreProvider,
  useStore: useMouseStore,
  useStoreManager: useMouseStoreManager,
} = MouseStoreContext;

// Combined Provider wrapper for convenience
export const MouseProvider = ({ children, registryId }: { children: React.ReactNode; registryId?: string }) => (
  <MouseActionProvider>
    <MouseStoreProvider registryId={registryId}>
      {children}
    </MouseStoreProvider>
  </MouseActionProvider>
);
