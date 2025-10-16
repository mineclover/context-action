/**
 * @fileoverview Mouse Events Model - MVVM Architecture
 *
 * Model Layer: 선언적 상태 관리를 통한 데이터 모델 정의
 * - createStoreContext로 상태 모델 정의
 * - createActionContext로 비즈니스 로직 정의
 * - createRefContext로 DOM 참조 관리
 */

import {
  createActionContext,
  createRefContext,
  createStoreContext,
} from '@context-action/react';

// === 데이터 모델 타입 정의 ===

export interface MousePosition {
  x: number;
  y: number;
  timestamp: number;
}

export interface MouseMovement {
  velocity: number;
  distance: number;
  isMoving: boolean;
  path: Array<{ x: number; y: number; timestamp: number }>;
  moveCount: number;
}

export interface MouseClick {
  x: number;
  y: number;
  button: number;
  timestamp: number;
}

export interface MouseClicks {
  total: number;
  history: MouseClick[];
  recent: MouseClick[];
}

export interface ComputedMetrics {
  averageVelocity: number;
  maxVelocity: number;
  totalDistance: number;
  sessionDuration: number;
  eventsPerSecond: number;
}

export interface ActivityStatus {
  current: 'idle' | 'moving' | 'clicking';
  lastActivity: number;
  isInsideArea: boolean;
  sessionStartTime: number;
}

export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  avgRenderTime: number;
  memoryUsage: number;
}

// === DOM 참조 타입 정의 ===
export interface MouseEventRefs
  extends Record<string, HTMLElement | SVGElement> {
  container: HTMLDivElement;
  cursor: HTMLDivElement;
  pathSvg: SVGPathElement;
  coordinates: HTMLDivElement;
  clickMarkers: HTMLDivElement; // 클릭 마커 컨테이너
}

// === 액션 타입 정의 ===
export interface MouseEventActions {
  updatePosition: { x: number; y: number; timestamp: number };
  recordClick: MouseClick;
  enterArea: { x: number; y: number; timestamp: number };
  leaveArea: { timestamp: number };
  reset: void;
}

// === Model Layer: Store Context (상태 모델) ===

/**
 * 마우스 이벤트 상태 모델 - 개별 Store로 세분화된 관리
 */
export const { Provider: MouseStoreProvider, useStore: useMouseStore } =
  createStoreContext('MouseEvents', {
    // 위치 정보 - 가장 자주 업데이트되는 상태
    position: {
      x: -999,
      y: -999,
      timestamp: 0,
    } as MousePosition,

    // 움직임 정보 - 계산된 메트릭스
    movement: {
      velocity: 0,
      distance: 0,
      isMoving: false,
      path: [],
      moveCount: 0,
    } as MouseMovement,

    // 클릭 정보 - 이벤트 기록
    clicks: {
      total: 0,
      history: [],
      recent: [],
    } as MouseClicks,

    // 계산된 메트릭스 - 성능 및 분석 데이터
    computed: {
      averageVelocity: 0,
      maxVelocity: 0,
      totalDistance: 0,
      sessionDuration: 0,
      eventsPerSecond: 0,
    } as ComputedMetrics,

    // 활동 상태 - 현재 상태 정보
    activity: {
      current: 'idle' as const,
      lastActivity: 0,
      isInsideArea: false,
      sessionStartTime: Date.now(),
    } as ActivityStatus,

    // 성능 메트릭스 - 렌더링 및 성능 추적
    performance: {
      renderCount: 0,
      lastRenderTime: 0,
      avgRenderTime: 0,
      memoryUsage: 0,
    } as PerformanceMetrics,
  });

/**
 * 마우스 이벤트 액션 모델 - 비즈니스 로직 정의
 */
export const {
  Provider: MouseActionProvider,
  useActionDispatch: useMouseAction,
  useActionHandler: useMouseActionHandler,
} = createActionContext<MouseEventActions>('MouseEvents');

/**
 * DOM 참조 모델 - 직접적인 DOM 조작을 위한 참조 관리
 */
export const {
  Provider: MouseRefProvider,
  useRefHandler: useMouseRef,
  useRefMountState: useMouseRefMountState,
  useOnMountStateChange: useMouseOnMountStateChange,
  useRefMountChecker: useMouseRefMountChecker,
} = createRefContext<MouseEventRefs>('MouseEvents');

/**
 * 통합 Provider - 모든 Context를 하나로 래핑
 */
export function MouseEventsModelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MouseStoreProvider>
      <MouseActionProvider>
        <MouseRefProvider>{children}</MouseRefProvider>
      </MouseActionProvider>
    </MouseStoreProvider>
  );
}

/**
 * MouseEventsModel 객체 - 모든 hooks를 포함하는 네임스페이스
 */
export const MouseEventsModel = {
  // Store hooks
  useStore: useMouseStore,

  // Action hooks
  useActionDispatch: useMouseAction,
  useActionHandler: useMouseActionHandler,

  // Ref hooks
  useRefHandler: useMouseRef,
  useRefMountState: useMouseRefMountState,
  useOnMountStateChange: useMouseOnMountStateChange,
  useRefMountChecker: useMouseRefMountChecker,

  // Providers
  Provider: MouseEventsModelProvider,
};
