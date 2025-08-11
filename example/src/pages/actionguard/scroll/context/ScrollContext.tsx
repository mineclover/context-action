/**
 * @fileoverview Scroll Context - Data/Action Layer
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
 * 스크롤 상태 데이터
 */
export interface ScrollStateData {
  /** 현재 스크롤 위치 */
  scrollTop: number;
  /** 스크롤 이벤트 처리 횟수 */
  scrollCount: number;
  /** 스크롤 중 여부 */
  isScrolling: boolean;
  /** 마지막 스크롤 시간 */
  lastScrollTime: number | null;
  /** 스크롤 방향 (up/down/none) */
  scrollDirection: 'up' | 'down' | 'none';
  /** 이전 스크롤 위치 */
  previousScrollTop: number;
  /** 스크롤 속도 (px/ms) */
  scrollVelocity: number;
}

/**
 * 스크롤 스토어 스키마
 */
interface ScrollStores {
  scrollState: ScrollStateData;
}

const scrollStoreSchema: StoreSchema<ScrollStores> = {
  scrollState: {
    initialValue: {
      scrollTop: 0,
      scrollCount: 0,
      isScrolling: false,
      lastScrollTime: null,
      scrollDirection: 'none',
      previousScrollTop: 0,
      scrollVelocity: 0,
    },
    description: 'Scroll state management with throttling',
    tags: ['scroll', 'performance', 'ui'],
  },
};

// ================================
// ⚡ Action Layer - 액션 정의
// ================================

/**
 * 스크롤 관련 액션들
 */
export interface ScrollActions extends ActionPayloadMap {
  /** 스크롤 이벤트 액션 (스로틀링 적용) */
  scrollEvent: {
    scrollTop: number;
    timestamp: number;
  };
  
  /** 스크롤 메트릭 업데이트 액션 */
  updateScrollMetrics: {
    scrollTop: number;
    scrollDirection: 'up' | 'down' | 'none';
    velocity: number;
    timestamp: number;
  };
  
  /** 스크롤 시작 액션 */
  scrollStart: {
    scrollTop: number;
    timestamp: number;
  };
  
  /** 스크롤 종료 액션 */
  scrollEnd: {
    scrollTop: number;
    timestamp: number;
  };
  
  /** 스크롤 초기화 액션 */
  resetScroll: void;
}

// ================================
// 🏗️ Context 생성 및 Provider
// ================================

// Action Context 생성
export const ScrollActionContext = createActionContext<ScrollActions>({
  name: 'ScrollActions',
});

// Store Context 생성
const ScrollStoreContext = createDeclarativeStores(
  'ScrollStoreManager',
  scrollStoreSchema
);

// Providers
export const ScrollActionProvider: React.FC<{ children: React.ReactNode }> = ScrollActionContext.Provider;
export const ScrollStoreProvider: React.FC<{ children: React.ReactNode; registryId?: string }> = ScrollStoreContext.Provider;

// Hooks export
export const useScrollActionDispatch = ScrollActionContext.useActionDispatch;
export const useScrollActionHandler = ScrollActionContext.useActionHandler;
export const useScrollStore = ScrollStoreContext.useStore;
export const useScrollStores = ScrollStoreContext.useStores;

// Legacy exports (deprecated)
export const useScrollActionRegister = ScrollActionContext.useActionRegister;
export const useScrollRegistry = ScrollStoreContext.useRegistry;

/**
 * 통합 Provider
 * 
 * Store와 Action Context를 함께 제공합니다.
 */
export const ScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ScrollStoreProvider registryId="scroll-page">
      <ScrollActionProvider>
        {children}
      </ScrollActionProvider>
    </ScrollStoreProvider>
  );
};