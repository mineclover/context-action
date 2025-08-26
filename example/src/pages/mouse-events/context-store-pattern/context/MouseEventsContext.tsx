/**
 * @fileoverview Mouse Events Context - Data/Action Layer
 *
 * Context → Data/Action 계층을 정의합니다.
 * 타입은 Data/Action 레이어에 선언됩니다.
 */

import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStoreContext,
} from '@context-action/react';
import type React from 'react';

// ================================
// 📊 Data Layer - 타입 및 스토어 정의
// ================================

/**
 * 마우스 위치 데이터
 */
export interface MousePosition {
  x: number;
  y: number;
}

/**
 * 마우스 상태 데이터 (Reactive Stores 통합)
 */
export interface MouseEventsStateData {
  /** 현재 마우스 위치 */
  mousePosition: MousePosition;
  /** 마우스 이동 이벤트 처리 횟수 */
  moveCount: number;
  /** 클릭 이벤트 처리 횟수 */
  clickCount: number;
  /** 마우스 이동 중 여부 */
  isMoving: boolean;
  /** 마지막 이동 시간 */
  lastMoveTime: number | null;
  /** 마우스 이동 경로 (최근 20개 점) */
  movePath: MousePosition[];
  /** 마우스 속도 (px/ms) */
  mouseVelocity: number;
  /** 이전 마우스 위치 */
  previousPosition: MousePosition;
  /** 마우스 영역 내부 여부 */
  isInsideArea: boolean;
  /** 클릭 위치 기록 (최근 10개) */
  clickHistory: Array<MousePosition & { timestamp: number }>;

  // Reactive Stores에서 추가된 계산된 값들
  /** 유효한 경로 (지연 계산) */
  validPath: MousePosition[];
  /** 최근 클릭 수 (지연 계산) */
  recentClickCount: number;
  /** 평균 속도 (지연 계산) */
  averageVelocity: number;
  /** 총 이벤트 수 (지연 계산) */
  totalEvents: number;
  /** 활동 상태 (지연 계산) */
  activityStatus: 'idle' | 'moving' | 'clicking';
  /** 활동 여부 (지연 계산) */
  hasActivity: boolean;
}

/**
 * 개별 마우스 이벤트 스토어들 (분할된 상태 관리)
 */
interface MouseEventsStores {
  // 기본 위치 및 상태
  position: {
    current: MousePosition;
    previous: MousePosition;
    isInsideArea: boolean;
  };

  // 이동 관련 메트릭
  movement: {
    moveCount: number;
    isMoving: boolean;
    velocity: number;
    lastMoveTime: number | null;
    path: MousePosition[];
  };

  // 클릭 관련 데이터
  clicks: {
    count: number;
    history: Array<MousePosition & { timestamp: number }>;
  };

  // 계산된 값들 (지연 평가)
  computed: {
    validPath: MousePosition[];
    recentClickCount: number;
    averageVelocity: number;
    totalEvents: number;
    activityStatus: 'idle' | 'moving' | 'clicking';
    hasActivity: boolean;
  };

  // 성능 메트릭
  performance: {
    containerRenderCount: number;
    totalRenderCount: number;
    averageRenderTime: number;
    lastRenderTime: number;
    sessionStartTime: number;
  };
}

// 새로운 패턴으로 변경 - 자동 타입 추론 사용
const MouseEventsStores = createStoreContext(
  'MouseEventsStoreManager',
  {
    position: {
      initialValue: {
        current: { x: -999, y: -999 },
        previous: { x: -999, y: -999 },
        isInsideArea: false,
      },
      description: 'Mouse position and area state',
      strategy: 'shallow',
    },

    movement: {
      initialValue: {
        moveCount: 0,
        isMoving: false,
        velocity: 0,
        lastMoveTime: null as number | null,
        path: [] as MousePosition[],
      },
      description: 'Mouse movement metrics and tracking',
      strategy: 'shallow',
    },

    clicks: {
      initialValue: {
        count: 0,
        history: [] as Array<MousePosition & { timestamp: number }>,
      },
      description: 'Click events and history tracking',
      strategy: 'shallow',
    },

    computed: {
      initialValue: {
        validPath: [] as MousePosition[],
        recentClickCount: 0,
        averageVelocity: 0,
        totalEvents: 0,
        activityStatus: 'idle' as 'idle' | 'moving' | 'clicking',
        hasActivity: false,
      },
      description: 'Computed values and derived state',
      strategy: 'shallow',
    },

    performance: {
      initialValue: {
        containerRenderCount: 0,
        totalRenderCount: 0,
        averageRenderTime: 0,
        lastRenderTime: 0,
        sessionStartTime: Date.now(),
      },
      description: 'Performance metrics and render tracking',
      strategy: 'reference',
    },
  }
);

// ================================
// ⚡ Action Layer - 액션 정의
// ================================

/**
 * 마우스 이벤트 관련 액션들
 */
export interface MouseEventsActions extends ActionPayloadMap {
  /** 마우스 이동 이벤트 액션 (스로틀링 적용) */
  mouseMove: {
    x: number;
    y: number;
    timestamp: number;
  };

  /** 마우스 클릭 이벤트 액션 */
  mouseClick: {
    x: number;
    y: number;
    button: number;
    timestamp: number;
  };

  /** 마우스 진입 이벤트 액션 */
  mouseEnter: {
    x: number;
    y: number;
    timestamp: number;
  };

  /** 마우스 이탈 이벤트 액션 */
  mouseLeave: {
    x: number;
    y: number;
    timestamp: number;
  };

  /** 마우스 메트릭 업데이트 액션 */
  updateMouseMetrics: {
    position: MousePosition;
    timestamp: number;
  };

  /** 마우스 이동 시작 액션 */
  moveStart: {
    position: MousePosition;
    timestamp: number;
  };

  /** 마우스 이동 종료 액션 */
  moveEnd: {
    position: MousePosition;
    timestamp: number;
  };

  /** 상태 초기화 액션 */
  resetMouseState: void;
}

// ================================
// 🏗️ Context 생성 및 Provider
// ================================

// Action Context 생성
export const MouseEventsActionContext = createActionContext<MouseEventsActions>(
  {
    name: 'MouseEventsActions',
  }
);

// Store Context는 이미 MouseEventsStores로 생성됨

// Providers with logging
export const MouseEventsActionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  console.log(
    '🎯 MouseEventsActionProvider render at',
    new Date().toISOString()
  );
  return (
    <MouseEventsActionContext.Provider>
      {children}
    </MouseEventsActionContext.Provider>
  );
};

export const MouseEventsStoreProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  console.log(
    '🏪 MouseEventsStoreProvider render at',
    new Date().toISOString()
  );
  return <MouseEventsStores.Provider>{children}</MouseEventsStores.Provider>;
};

// Hooks export
export const useMouseEventsActionDispatch =
  MouseEventsActionContext.useActionDispatch;
export const useMouseEventsActionHandler =
  MouseEventsActionContext.useActionHandler;
export const useMouseEventsStore = MouseEventsStores.useStore;

// Enhanced hooks
export const useMouseEventsStoreInfo = MouseEventsStores.useStoreInfo;
export const useMouseEventsStoreClear = MouseEventsStores.useStoreClear;

// Legacy exports (deprecated) - temporarily restored for compatibility
export const useMouseEventsActionRegister =
  MouseEventsActionContext.useActionRegister;

// ================================
// 🔄 개별 Store 접근 및 집계 헬퍼
// ================================

/**
 * 개별 stores에서 MouseEventsStateData로 집계하는 헬퍼 함수
 */
export function aggregateMouseEventsState(
  position: any,
  movement: any,
  clicks: any,
  computed: any
): MouseEventsStateData {
  return {
    // Position data
    mousePosition: position.current,
    previousPosition: position.previous,
    isInsideArea: position.isInsideArea,

    // Movement data
    moveCount: movement.moveCount,
    isMoving: movement.isMoving,
    mouseVelocity: movement.velocity,
    lastMoveTime: movement.lastMoveTime,
    movePath: movement.path,

    // Click data
    clickCount: clicks.count,
    clickHistory: clicks.history,

    // Computed values
    validPath: computed.validPath,
    recentClickCount: computed.recentClickCount,
    averageVelocity: computed.averageVelocity,
    totalEvents: computed.totalEvents,
    activityStatus: computed.activityStatus,
    hasActivity: computed.hasActivity,
  };
}

/**
 * 개별 stores를 사용하는 통합 hook (backward compatibility) - 반응형 버전
 */
export function useAggregatedMouseEventsState(): MouseEventsStateData {
  const positionStore = useMouseEventsStore('position');
  const movementStore = useMouseEventsStore('movement');
  const clicksStore = useMouseEventsStore('clicks');
  const computedStore = useMouseEventsStore('computed');

  // 반응형 구독을 위해 useStoreValue 사용하지 않고 useMemo 사용
  const position = positionStore.getValue();
  const movement = movementStore.getValue();
  const clicks = clicksStore.getValue();
  const computed = computedStore.getValue();

  return aggregateMouseEventsState(position, movement, clicks, computed);
}

/**
 * 통합 Provider
 *
 * Store와 Action Context를 함께 제공합니다.
 */
// ================================
// 🔄 지연 평가 헬퍼 함수들
// ================================

/**
 * 유효한 경로 계산 (지연 평가)
 */
export function computeValidPath(movePath: MousePosition[]): MousePosition[] {
  return movePath.filter(
    (pos) => pos.x !== -999 && pos.y !== -999 && pos.x !== 0 && pos.y !== 0
  );
}

/**
 * 최근 클릭 수 계산 (지연 평가)
 */
export function computeRecentClickCount(
  clickHistory: Array<MousePosition & { timestamp: number }>,
  timeWindow: number = 1500
): number {
  const now = Date.now();
  return clickHistory.filter((click) => now - click.timestamp <= timeWindow)
    .length;
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
 * 활동 상태 계산 (지연 평가) - 개선된 실시간 반응성
 */
export function computeActivityStatus(
  isMoving: boolean,
  recentClickCount: number,
  velocity: number,
  lastClickTime?: number | null
): 'idle' | 'moving' | 'clicking' {
  const now = Date.now();
  const timeSinceLastClick = lastClickTime ? now - lastClickTime : Infinity;

  // 우선순위 1: 300ms 이내의 매우 최근 클릭이면 clicking 상태
  if (recentClickCount > 0 && timeSinceLastClick < 300) {
    return 'clicking';
  }

  // 우선순위 2: 이동 중이고 속도가 충분하면 moving 상태
  if (isMoving && velocity > 0.05) {
    return 'moving';
  }

  // 우선순위 3: 1초 이내 클릭이 있지만 현재 이동 중이 아니면 여전히 clicking
  if (recentClickCount > 0 && timeSinceLastClick < 1000) {
    return 'clicking';
  }

  // 기본값: idle 상태
  return 'idle';
}

/**
 * 활동 여부 계산 (지연 평가)
 */
export function computeHasActivity(
  moveCount: number,
  clickCount: number
): boolean {
  return moveCount > 0 || clickCount > 0;
}

/**
 * 계산된 값들을 업데이트하는 헬퍼 함수 (개별 stores 버전)
 */
export function updateComputedValuesFromStores(
  movement: any,
  clicks: any
): any {
  const validPath = computeValidPath(movement.path);
  const recentClickCount = computeRecentClickCount(clicks.history);
  const averageVelocity = computeAverageVelocity(validPath);
  const lastClickTime = clicks.history[0]?.timestamp || null;
  const activityStatus = computeActivityStatus(
    movement.isMoving,
    recentClickCount,
    movement.velocity,
    lastClickTime
  );
  const hasActivity = computeHasActivity(movement.moveCount, clicks.count);
  const totalEvents = movement.moveCount + clicks.count;

  return {
    validPath,
    recentClickCount,
    averageVelocity,
    totalEvents,
    activityStatus,
    hasActivity,
  };
}

/**
 * 계산된 값들을 업데이트하는 헬퍼 함수 (legacy 버전 - backward compatibility)
 */
export function updateComputedValues(
  currentState: MouseEventsStateData
): Partial<MouseEventsStateData> {
  const validPath = computeValidPath(currentState.movePath);
  const recentClickCount = computeRecentClickCount(currentState.clickHistory);
  const averageVelocity = computeAverageVelocity(validPath);
  const lastClickTime = currentState.clickHistory[0]?.timestamp || null;
  const activityStatus = computeActivityStatus(
    currentState.isMoving,
    recentClickCount,
    currentState.mouseVelocity,
    lastClickTime
  );
  const hasActivity = computeHasActivity(
    currentState.moveCount,
    currentState.clickCount
  );
  const totalEvents = currentState.moveCount + currentState.clickCount;

  return {
    validPath,
    recentClickCount,
    averageVelocity,
    totalEvents,
    activityStatus,
    hasActivity,
  };
}

/**
 * Action 핸들러 등록 컴포넌트
 */
const MouseEventsActionHandlers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const positionStore = useMouseEventsStore('position');
  const movementStore = useMouseEventsStore('movement');
  const clicksStore = useMouseEventsStore('clicks');
  const computedStore = useMouseEventsStore('computed');
  const performanceStore = useMouseEventsStore('performance');

  // Action 핸들러 등록
  useMouseEventsActionHandler('mouseMove', async (payload) => {
    console.log('🎯 mouseMove action:', payload);

    // Position store 업데이트
    const currentPos = positionStore.getValue();
    positionStore.setValue({
      current: { x: payload.x, y: payload.y },
      previous: currentPos.current,
      isInsideArea: true,
    });

    // Movement store 업데이트
    const currentMovement = movementStore.getValue();
    const newPath = [
      ...currentMovement.path.slice(-19),
      { x: payload.x, y: payload.y },
    ];

    // 속도 계산
    const deltaTime = currentMovement.lastMoveTime
      ? payload.timestamp - currentMovement.lastMoveTime
      : 0;
    const deltaX = payload.x - currentPos.current.x;
    const deltaY = payload.y - currentPos.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = deltaTime > 0 ? distance / deltaTime : 0;

    const updatedMovement = {
      moveCount: currentMovement.moveCount + 1,
      isMoving: true,
      velocity,
      lastMoveTime: payload.timestamp,
      path: newPath,
    };

    movementStore.setValue(updatedMovement);

    // Computed store 업데이트 - 전체적으로 다시 계산하여 정확성 확보
    const currentClicks = clicksStore.getValue();
    const currentComputed = computedStore.getValue();

    // 모든 computed 값들을 정확히 다시 계산
    const validPath = computeValidPath(updatedMovement.path);
    const averageVelocity = computeAverageVelocity(validPath);
    const recentClickCount = computeRecentClickCount(currentClicks.history);
    
    // activityStatus 실시간 업데이트 - 마지막 클릭 시간 고려
    const lastClickTime = currentClicks.history[0]?.timestamp || null;
    const activityStatus = computeActivityStatus(
      updatedMovement.isMoving,
      recentClickCount,
      updatedMovement.velocity,
      lastClickTime
    );

    // hasActivity와 totalEvents 정확히 계산
    const hasActivity = computeHasActivity(updatedMovement.moveCount, currentClicks.count);
    const totalEvents = updatedMovement.moveCount + currentClicks.count;

    // 실시간 computed 값들 업데이트
    computedStore.setValue({
      validPath,
      recentClickCount,
      averageVelocity,
      totalEvents,
      activityStatus,
      hasActivity,
    });
  });

  useMouseEventsActionHandler('mouseClick', async (payload) => {
    console.log('🎯 mouseClick action:', payload);

    // Clicks store 업데이트
    const currentClicks = clicksStore.getValue();
    const newHistory = [
      { x: payload.x, y: payload.y, timestamp: payload.timestamp },
      ...currentClicks.history.slice(0, 9),
    ];

    clicksStore.setValue({
      count: currentClicks.count + 1,
      history: newHistory,
    });

    // Computed store 업데이트
    const currentMovement = movementStore.getValue();
    const updatedClicks = clicksStore.getValue();
    const computedValues = updateComputedValuesFromStores(
      currentMovement,
      updatedClicks
    );
    computedStore.setValue(computedValues);
  });

  useMouseEventsActionHandler('mouseEnter', async (payload) => {
    console.log('🎯 mouseEnter action:', payload);

    const currentPos = positionStore.getValue();
    positionStore.setValue({
      ...currentPos,
      isInsideArea: true,
    });
  });

  useMouseEventsActionHandler('mouseLeave', async (payload) => {
    console.log('🎯 mouseLeave action:', payload);

    const currentPos = positionStore.getValue();
    positionStore.setValue({
      ...currentPos,
      isInsideArea: false,
    });

    // Movement 정리
    const currentMovement = movementStore.getValue();
    const updatedMovement = {
      ...currentMovement,
      isMoving: false,
      velocity: 0, // 속도도 0으로 리셋
    };
    movementStore.setValue(updatedMovement);

    // Computed store 업데이트 - 이동 종료 상태 반영
    const currentClicks = clicksStore.getValue();
    const recentClickCount = computeRecentClickCount(currentClicks.history);
    const lastClickTime = currentClicks.history[0]?.timestamp || null;
    
    const activityStatus = computeActivityStatus(
      false, // isMoving = false
      recentClickCount,
      0, // velocity = 0
      lastClickTime
    );

    computedStore.setValue({
      ...computedStore.getValue(),
      activityStatus,
    });
  });

  useMouseEventsActionHandler('moveEnd', async (payload) => {
    console.log('🎯 moveEnd action:', payload);

    const currentMovement = movementStore.getValue();
    // 이동 종료 처리
    if (currentMovement.isMoving) {
      const updatedMovement = {
        ...currentMovement,
        isMoving: false,
        velocity: 0, // 속도도 0으로 리셋
      };
      movementStore.setValue(updatedMovement);

      // Computed store 업데이트 - 이동 종료 상태 반영
      const currentClicks = clicksStore.getValue();
      const recentClickCount = computeRecentClickCount(currentClicks.history);
      const lastClickTime = currentClicks.history[0]?.timestamp || null;
      
      const activityStatus = computeActivityStatus(
        false, // isMoving = false
        recentClickCount,
        0, // velocity = 0
        lastClickTime
      );

      computedStore.setValue({
        ...computedStore.getValue(),
        activityStatus,
      });
    }
  });

  useMouseEventsActionHandler('resetMouseState', async () => {
    console.log('🎯 resetMouseState action');

    // 모든 stores 초기화
    positionStore.setValue({
      current: { x: -999, y: -999 },
      previous: { x: -999, y: -999 },
      isInsideArea: false,
    });

    movementStore.setValue({
      moveCount: 0,
      isMoving: false,
      velocity: 0,
      lastMoveTime: null as number | null,
      path: [],
    });

    clicksStore.setValue({
      count: 0,
      history: [],
    });

    computedStore.setValue({
      validPath: [],
      recentClickCount: 0,
      averageVelocity: 0,
      totalEvents: 0,
      activityStatus: 'idle',
      hasActivity: false,
    });

    performanceStore.setValue({
      containerRenderCount: 0,
      totalRenderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      sessionStartTime: Date.now(),
    });
  });

  // updatePerformanceMetrics 핸들러 제거 - 무한 루프 방지를 위해 사용하지 않음

  return <>{children}</>;
};

/**
 * 통합 Provider - Enhanced with new capabilities
 *
 * Store와 Action Context를 함께 제공합니다.
 */
export const MouseEventsProvider: React.FC<{
  children: React.ReactNode;
  registryId?: string; // 새로운 기능: 독립적인 레지스트리 ID
}> = ({ children, registryId }) => {
  console.log(
    '🔄 MouseEventsProvider render at',
    new Date().toISOString(),
    'registryId:',
    registryId
  );

  return (
    <MouseEventsStores.Provider registryId={registryId}>
      <MouseEventsActionProvider>
        <MouseEventsActionHandlers>{children}</MouseEventsActionHandlers>
      </MouseEventsActionProvider>
    </MouseEventsStores.Provider>
  );
};

// ================================
// 🚀 고급 HOC 패턴들 - Enhanced Features
// ================================

/**
 * ActionProvider와 StoreProvider를 결합하는 커스텀 래퍼
 */
const MouseEventsProviderWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  console.log(
    '🔄 MouseEventsProviderWrapper render at',
    new Date().toISOString()
  );
  return (
    <MouseEventsActionProvider>
      <MouseEventsActionHandlers>{children}</MouseEventsActionHandlers>
    </MouseEventsActionProvider>
  );
};

/**
 * 독립적인 MouseEvents 인스턴스는 registryId로 구분
 * 예: <MouseEventsProvider registryId="instance-1"> 형태로 사용
 */

/**
 * HOC - Component를 MouseEventsStores.Provider로 래핑
 */
export const withMouseEventsStore = MouseEventsStores.withProvider;
