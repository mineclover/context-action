/**
 * @fileoverview Priority Performance Context - Data/Action Layer
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

/**
 * 우선순위 성능 테스트 스토어 스키마
 */
interface PriorityPerformanceStores {
  performanceState: PriorityPerformanceStateData;
}

const priorityPerformanceStoreSchema: StoreSchema<PriorityPerformanceStores> = {
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
};

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
export const PriorityPerformanceActionContext = createActionContext<PriorityPerformanceActions>({
  name: 'PriorityPerformanceActions',
});

// Store Context 생성
const PriorityPerformanceStoreContext = createDeclarativeStores(
  'PriorityPerformanceStoreManager',
  priorityPerformanceStoreSchema
);

// Providers
export const PriorityPerformanceActionProvider: React.FC<{ children: React.ReactNode }> = PriorityPerformanceActionContext.Provider;
export const PriorityPerformanceStoreProvider: React.FC<{ children: React.ReactNode; registryId?: string }> = PriorityPerformanceStoreContext.Provider;

// Hooks export
export const usePriorityPerformanceActionDispatch = PriorityPerformanceActionContext.useActionDispatch;
export const usePriorityPerformanceActionHandler = PriorityPerformanceActionContext.useActionHandler;
export const usePriorityPerformanceStore = PriorityPerformanceStoreContext.useStore;
export const usePriorityPerformanceStores = PriorityPerformanceStoreContext.useStores;

// Legacy exports (deprecated)
export const usePriorityPerformanceActionRegister = PriorityPerformanceActionContext.useActionRegister;
export const usePriorityPerformanceRegistry = PriorityPerformanceStoreContext.useRegistry;

/**
 * 통합 Provider
 * 
 * Store와 Action Context를 함께 제공합니다.
 */
export const PriorityPerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PriorityPerformanceStoreProvider registryId="priority-performance-page">
      <PriorityPerformanceActionProvider>
        {children}
      </PriorityPerformanceActionProvider>
    </PriorityPerformanceStoreProvider>
  );
};