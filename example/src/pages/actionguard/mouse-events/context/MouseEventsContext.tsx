/**
 * @fileoverview Mouse Events Context - Data/Action Layer
 * 
 * Context → Data/Action 계층을 정의합니다.
 * 타입은 Data/Action 레이어에 선언됩니다.
 */

import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createDeclarativeStores,
  type StoreSchema,
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
 * 마우스 상태 데이터
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
  /** 마우스 이동 경로 (최근 10개 점) */
  movePath: MousePosition[];
  /** 마우스 속도 (px/ms) */
  mouseVelocity: number;
  /** 이전 마우스 위치 */
  previousPosition: MousePosition;
  /** 마우스 영역 내부 여부 */
  isInsideArea: boolean;
  /** 클릭 위치 기록 (최근 5개) */
  clickHistory: Array<MousePosition & { timestamp: number }>;
}

/**
 * 마우스 이벤트 스토어 스키마
 */
interface MouseEventsStores {
  mouseState: MouseEventsStateData;
}

const mouseEventsStoreSchema: StoreSchema<MouseEventsStores> = {
  mouseState: {
    initialValue: {
      mousePosition: { x: 0, y: 0 },
      moveCount: 0,
      clickCount: 0,
      isMoving: false,
      lastMoveTime: null,
      movePath: [],
      mouseVelocity: 0,
      previousPosition: { x: 0, y: 0 },
      isInsideArea: true,
      clickHistory: [],
    },
    description: 'Mouse events state management with throttling',
    tags: ['mouse', 'events', 'performance', 'ui'],
  },
};

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
    velocity: number;
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
export const MouseEventsActionContext = createActionContext<MouseEventsActions>({
  name: 'MouseEventsActions',
});

// Store Context 생성
const MouseEventsStoreContext = createDeclarativeStores(
  'MouseEventsStoreManager',
  mouseEventsStoreSchema
);

// Providers
export const MouseEventsActionProvider: React.FC<{ children: React.ReactNode }> = MouseEventsActionContext.Provider;
export const MouseEventsStoreProvider: React.FC<{ children: React.ReactNode; registryId?: string }> = MouseEventsStoreContext.Provider;

// Hooks export
export const useMouseEventsActionDispatch = MouseEventsActionContext.useActionDispatch;
export const useMouseEventsActionHandler = MouseEventsActionContext.useActionHandler;
export const useMouseEventsStore = MouseEventsStoreContext.useStore;
export const useMouseEventsStores = MouseEventsStoreContext.useStores;

// Legacy exports (deprecated)
export const useMouseEventsActionRegister = MouseEventsActionContext.useActionRegister;
export const useMouseEventsRegistry = MouseEventsStoreContext.useRegistry;

/**
 * 통합 Provider
 * 
 * Store와 Action Context를 함께 제공합니다.
 */
export const MouseEventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MouseEventsStoreProvider registryId="mouse-events-page">
      <MouseEventsActionProvider>
        {children}
      </MouseEventsActionProvider>
    </MouseEventsStoreProvider>
  );
};