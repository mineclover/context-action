/**
 * @fileoverview API Blocking Context - Data/Action Layer
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
 * API 호출 기록
 */
export interface ApiCallRecord {
  id: string;
  endpoint: string;
  timestamp: number;
  status: 'success' | 'blocked' | 'error';
  responseTime?: number;
}

/**
 * 블로킹 상태 데이터
 */
export interface ApiBlockingStateData {
  /** API 호출 기록 목록 */
  apiCalls: ApiCallRecord[];
  /** 현재 블로킹 중인 액션 */
  blockedAction: string | null;
  /** 블로킹 상태 여부 */
  isBlocked: boolean;
  /** 블로킹 종료 시간 */
  blockEndTime: number | null;
  /** 블로킹 지속 시간 (ms) */
  blockDuration: number;
  /** 총 성공한 호출 수 */
  successCount: number;
  /** 총 블로킹된 호출 수 */
  blockedCount: number;
  /** 마지막 호출 시간 */
  lastCallTime: number | null;
}

/**
 * API 블로킹 스토어 스키마
 */
interface ApiBlockingStores {
  blockingState: ApiBlockingStateData;
}

// 새로운 패턴으로 변경 - 자동 타입 추론
const ApiBlockingStores = createDeclarativeStorePattern(
  'ApiBlockingStoreManager',
  {
    blockingState: {
      initialValue: {
        apiCalls: [] as ApiCallRecord[],
        blockedAction: null as string | null,
        isBlocked: false,
        blockEndTime: null as number | null,
        blockDuration: 2000, // 2초
        successCount: 0,
        blockedCount: 0,
        lastCallTime: null as number | null,
      },
      description: 'API blocking state management',
      strategy: 'shallow',
    },
  }
);

// ================================
// ⚡ Action Layer - 액션 정의
// ================================

/**
 * API 블로킹 관련 액션들
 */
export interface ApiBlockingActions extends ActionPayloadMap {
  /** API 호출 시도 액션 */
  apiCall: {
    endpoint: string;
    method?: string;
    timestamp: number;
  };

  /** API 호출 성공 액션 */
  apiCallSuccess: {
    callId: string;
    endpoint: string;
    responseTime: number;
    timestamp: number;
  };

  /** API 호출 블로킹 액션 */
  apiCallBlocked: {
    endpoint: string;
    reason: string;
    timestamp: number;
  };

  /** 블로킹 시작 액션 */
  startBlocking: {
    action: string;
    duration: number;
    timestamp: number;
  };

  /** 블로킹 종료 액션 */
  endBlocking: {
    action: string;
    timestamp: number;
  };

  /** 블로킹 설정 변경 액션 */
  setBlockDuration: {
    duration: number;
  };

  /** 기록 초기화 액션 */
  clearHistory: void;
}

// ================================
// 🏗️ Context 생성 및 Provider
// ================================

// Action Context 생성
export const ApiBlockingActionContext = createActionContext<ApiBlockingActions>(
  {
    name: 'ApiBlockingActions',
  }
);

// Store Context 생성
// Store Context는 이미 ApiBlockingStores로 생성됨

// Providers
export const ApiBlockingActionProvider: React.FC<{
  children: React.ReactNode;
}> = ApiBlockingActionContext.Provider;
export const ApiBlockingStoreProvider: React.FC<{ children: React.ReactNode }> =
  ApiBlockingStores.Provider;

// Hooks export
export const useApiBlockingActionDispatch =
  ApiBlockingActionContext.useActionDispatch;
export const useApiBlockingActionHandler =
  ApiBlockingActionContext.useActionHandler;
export const useApiBlockingStore = ApiBlockingStores.useStore;

// Legacy exports (deprecated)
export const useApiBlockingActionRegister =
  ApiBlockingActionContext.useActionRegister;
// useApiBlockingRegistry removed - not needed in new pattern

/**
 * 통합 Provider
 *
 * Store와 Action Context를 함께 제공합니다.
 */
export const ApiBlockingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ApiBlockingStoreProvider>
      <ApiBlockingActionProvider>{children}</ApiBlockingActionProvider>
    </ApiBlockingStoreProvider>
  );
};
