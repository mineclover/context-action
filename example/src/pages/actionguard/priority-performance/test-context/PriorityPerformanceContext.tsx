/**
 * @fileoverview Priority Performance Context - Data/Action Layer
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
 * 테스트 인스턴스 데이터
 */
export interface TestInstance {
  id: string;
  title: string;
}

/**
 * 우선순위 성능 테스트 상태 데이터
 */
export interface PriorityPerformanceStateData {
  /** 테스트 인스턴스 목록 */
  instances: TestInstance[];
}

// 새로운 패턴으로 변경 - 자동 타입 추론
const PriorityPerformanceStores = createStoreContext(
  'PriorityPerformanceStoreManager',
  {
    performanceState: {
      initialValue: {
        instances: [
          { id: 'instance-a', title: '🔴 Priority Test Instance A' },
          { id: 'instance-b', title: '🔵 Priority Test Instance B' },
        ],
      },
      description: 'Priority performance test state with multiple instances',
      tags: ['priority', 'performance', 'testing', 'instances'],
    },
  }
);

// ================================
// ⚡ Action Layer - 액션 정의
// ================================

/**
 * 우선순위 성능 테스트 관련 액션들
 */
export interface PriorityPerformanceActions extends ActionPayloadMap {
  /** 인스턴스 추가 액션 */
  addInstance: void;

  /** 인스턴스 제거 액션 */
  removeInstance: {
    instanceId: string;
  };

  /** 인스턴스 리셋 액션 */
  resetInstances: void;
}

// ================================
// 🏗️ Context 생성 및 Provider
// ================================

// Action Context 생성
export const PriorityPerformanceActionContext =
  createActionContext<PriorityPerformanceActions>({
    name: 'PriorityPerformanceActions',
  });

// Store Context 생성
// Store Context는 이미 PriorityPerformanceStores로 생성됨

// Providers
export const PriorityPerformanceActionProvider: React.FC<{
  children: React.ReactNode;
}> = PriorityPerformanceActionContext.Provider;
export const PriorityPerformanceStoreProvider: React.FC<{
  children: React.ReactNode;
}> = PriorityPerformanceStores.Provider;

// Hooks export
export const usePriorityPerformanceActionDispatch =
  PriorityPerformanceActionContext.useActionDispatch;
export const usePriorityPerformanceActionHandler =
  PriorityPerformanceActionContext.useActionHandler;
export const usePriorityPerformanceStore = PriorityPerformanceStores.useStore;

// Legacy exports (deprecated)
export const usePriorityPerformanceActionRegister =
  PriorityPerformanceActionContext.useActionRegister;
// usePriorityPerformanceRegistry removed - not needed in new pattern

/**
 * 통합 Provider
 *
 * Store와 Action Context를 함께 제공합니다.
 */
export const PriorityPerformanceProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <PriorityPerformanceStoreProvider>
      <PriorityPerformanceActionProvider>
        {children}
      </PriorityPerformanceActionProvider>
    </PriorityPerformanceStoreProvider>
  );
};
