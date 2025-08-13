/**
 * @fileoverview Scroll Context - Data/Action Layer
 * 
 * Context → Data/Action 계층을 정의합니다.
 * 타입은 Data/Action 레이어에 선언됩니다.
 */

import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createDeclarativeStorePattern,
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

// 새로운 패턴으로 변경 - 자동 타입 추론
const ScrollStores = createDeclarativeStorePattern('ScrollStoreManager', {
  scrollState: {
    initialValue: {
      scrollTop: 0,
      scrollCount: 0,
      isScrolling: false,
      lastScrollTime: null as number | null,
      scrollDirection: 'none' as 'up' | 'down' | 'none',
      previousScrollTop: 0,
      scrollVelocity: 0,
    },
    description: 'Scroll state management with throttling',
    strategy: 'shallow',
  },
});

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
// Store Context는 이미 ScrollStores로 생성됨

// Providers
export const ScrollActionProvider: React.FC<{ children: React.ReactNode }> = ScrollActionContext.Provider;
export const ScrollStoreProvider: React.FC<{ children: React.ReactNode }> = ScrollStores.Provider;

// Hooks export
export const useScrollActionDispatch = ScrollActionContext.useActionDispatch;
export const useScrollActionHandler = ScrollActionContext.useActionHandler;
export const useScrollStore = ScrollStores.useStore;

// Legacy exports (deprecated)
export const useScrollActionRegister = ScrollActionContext.useActionRegister;
// useScrollRegistry removed - not needed in new pattern

// ================================
// 🚀 고급 HOC 패턴들 - Enhanced Features
// ================================

/**
 * ActionProvider와 StoreProvider를 결합하는 커스텀 래퍼
 */
const ScrollProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('🔄 ScrollProviderWrapper render at', new Date().toISOString());
  return (
    <ScrollActionProvider>
      {children}
    </ScrollActionProvider>
  );
};

/**
 * 독립적인 Scroll 인스턴스는 registryId로 구분
 * 예: <ScrollProvider registryId="instance-1"> 형태로 사용
 */

/**
 * 기본 HOC - Store만 제공
 */
export const withScrollStore = ScrollStores.withProvider;

/**
 * 고급 HOC - Store + Action 모두 제공  
 */
export const withScrollProviders = ScrollStores.withProvider;

/**
 * 다중 인스턴스 HOC - registryId를 사용한 방식
 */
export const createScrollHOC = (instanceId: string) => {
  return ScrollStores.withProvider(
    undefined,
    { displayName: `ScrollHOC_${instanceId}`, registryId: instanceId }
  );
};

/**
 * Enhanced Provider - HOC 패턴 지원
 */
export const EnhancedScrollProvider = ScrollStores.withProvider;

/**
 * 통합 Provider - Enhanced with new capabilities
 * 
 * Store와 Action Context를 함께 제공합니다.
 */
export const ScrollProvider: React.FC<{ 
  children: React.ReactNode;
  registryId?: string; // 새로운 기능: 독립적인 레지스트리 ID
}> = ({ children, registryId }) => {
  console.log('🔄 ScrollProvider render at', new Date().toISOString(), 'registryId:', registryId);
  
  return (
    <ScrollStores.Provider registryId={registryId}>
      <ScrollActionProvider>
        {children}
      </ScrollActionProvider>
    </ScrollStores.Provider>
  );
};

// Enhanced hooks
export const useScrollStoreInfo = ScrollStores.useStoreInfo;
export const useScrollStoreClear = ScrollStores.useStoreClear;