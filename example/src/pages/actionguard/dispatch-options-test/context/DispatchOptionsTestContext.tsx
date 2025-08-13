/**
 * @fileoverview Dispatch Options Test Context - Data/Action Layer
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
 * 성능 메트릭 데이터
 */
export interface PerformanceMetrics {
  totalDispatches: number;
  throttledCount: number;
  debouncedCount: number;
  averageExecutionTime: number;
  lastExecutionTime: number;
}

/**
 * 테스트 결과 데이터
 */
export interface TestResult {
  id: string;
  testName: string;
  status: 'pending' | 'success' | 'failed';
  message: string;
  timestamp: Date;
  executionTime: number;
}

/**
 * 폼 데이터
 */
export interface FormData {
  name: string;
  email: string;
  age: string;
}

/**
 * 디스패치 옵션 테스트 상태 데이터
 */
export interface DispatchOptionsTestStateData {
  /** 검색 쿼리 */
  searchQuery: string;
  /** 저장 데이터 */
  saveData: string;
  /** 스크롤 위치 */
  scrollPosition: number;
  /** 폼 데이터 */
  formData: FormData;
  /** 성능 메트릭 */
  metrics: PerformanceMetrics;
  /** 자동 스크롤 상태 */
  isAutoScrolling: boolean;
  /** 일시정지 상태 */
  isPaused: boolean;
  /** 테스트 결과 목록 */
  testResults: TestResult[];
  /** 벌크 테스트 실행 상태 */
  bulkTestRunning: boolean;
  /** 실행 시간 기록 */
  executionTimes: number[];
}

// 새로운 패턴으로 변경 - 자동 타입 추론
const DispatchOptionsTestStores = createDeclarativeStorePattern(
  'DispatchOptionsTestStoreManager',
  {
    testState: {
      initialValue: {
        searchQuery: '',
        saveData: 'test data',
        scrollPosition: 0,
        formData: { name: '', email: '', age: '' },
        metrics: {
          totalDispatches: 0,
          throttledCount: 0,
          debouncedCount: 0,
          averageExecutionTime: 0,
          lastExecutionTime: 0,
        },
        isAutoScrolling: false,
        isPaused: false,
        testResults: [] as TestResult[],
        bulkTestRunning: false,
        executionTimes: [] as number[],
      },
      description: 'Dispatch options test state with performance metrics',
      tags: ['dispatch', 'options', 'performance', 'testing'],
    },
  }
);

// ================================
// ⚡ Action Layer - 액션 정의
// ================================

/**
 * 디스패치 옵션 테스트 관련 액션들
 */
export interface DispatchOptionsTestActions extends ActionPayloadMap {
  /** 사용자 검색 액션 (디바운스) */
  searchUser: {
    query: string;
  };

  /** 데이터 저장 액션 (스로틀) */
  saveData: {
    data: string;
  };

  /** 스크롤 이벤트 액션 (스로틀) */
  scrollEvent: {
    position: number;
  };

  /** 버튼 클릭 액션 */
  buttonClick: {
    buttonId: string;
  };

  /** 폼 검증 액션 */
  validateForm: {
    formData: FormData;
  };

  /** 비동기 작업 액션 */
  asyncOperation: {
    operationType: string;
    delay: number;
  };

  /** 에러 테스트 액션 */
  errorTest: {
    shouldFail: boolean;
  };

  /** 조건부 액션 */
  conditionalAction: {
    condition: boolean;
    data: string;
  };

  /** 우선순위 테스트 액션 */
  priorityTest: {
    priority: number;
    message: string;
  };

  /** 상태 업데이트 액션들 */
  updateSearchQuery: { query: string };
  updateSaveData: { data: string };
  updateScrollPosition: { position: number };
  updateFormData: { formData: Partial<FormData> };
  updateMetrics: {
    metrics: Partial<PerformanceMetrics>;
    executionTime?: number;
    type?: 'throttled' | 'debounced' | 'normal';
  };
  toggleAutoScrolling: { isRunning: boolean };
  togglePause: { isPaused: boolean };
  addTestResult: TestResult;
  resetMetrics: void;
  toggleBulkTest: { isRunning: boolean };
}

// ================================
// 🏗️ Context 생성 및 Provider
// ================================

// Action Context 생성
export const DispatchOptionsTestActionContext =
  createActionContext<DispatchOptionsTestActions>({
    name: 'DispatchOptionsTestActions',
  });

// Store Context 생성
// Store Context는 이미 DispatchOptionsTestStores로 생성됨

// Providers
export const DispatchOptionsTestActionProvider: React.FC<{
  children: React.ReactNode;
}> = DispatchOptionsTestActionContext.Provider;
export const DispatchOptionsTestStoreProvider: React.FC<{
  children: React.ReactNode;
}> = DispatchOptionsTestStores.Provider;

// Hooks export
export const useDispatchOptionsTestActionDispatch =
  DispatchOptionsTestActionContext.useActionDispatch;
export const useDispatchOptionsTestActionHandler =
  DispatchOptionsTestActionContext.useActionHandler;
export const useDispatchOptionsTestStore = DispatchOptionsTestStores.useStore;

// Legacy exports (deprecated)
export const useDispatchOptionsTestActionRegister =
  DispatchOptionsTestActionContext.useActionRegister;
// useDispatchOptionsTestRegistry removed - not needed in new pattern

/**
 * 통합 Provider
 *
 * Store와 Action Context를 함께 제공합니다.
 */
export const DispatchOptionsTestProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <DispatchOptionsTestStoreProvider>
      <DispatchOptionsTestActionProvider>
        {children}
      </DispatchOptionsTestActionProvider>
    </DispatchOptionsTestStoreProvider>
  );
};
