/**
 * @fileoverview Throttle Comparison Context - Data/Action Layer
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
 * 스로틀 메트릭 데이터
 */
export interface ThrottleMetrics {
  totalCalls: number;
  throttledCalls: number;
  actualExecutions: number;
  lastExecutionTime: number;
  averageInterval: number;
}

/**
 * 스로틀 비교 상태 데이터
 */
export interface ThrottleComparisonStateData {
  /** 입력 값 */
  inputValue: string;
  /** 자동 테스트 실행 여부 */
  isAutoTesting: boolean;
  /** 테스트 지속 시간 (ms) */
  testDuration: number;
  /** 테스트 간격 (ms) */
  testInterval: number;
  /** 수동 스로틀 메트릭 */
  manualMetrics: ThrottleMetrics;
  /** 내장 스로틀 메트릭 */
  internalMetrics: ThrottleMetrics;
  /** 수동 실행 시간 기록 */
  manualExecutionTimes: number[];
  /** 내장 실행 시간 기록 */
  internalExecutionTimes: number[];
}

// 새로운 패턴으로 변경 - 자동 타입 추론
const ThrottleComparisonStores = createDeclarativeStorePattern(
  'ThrottleComparisonStoreManager',
  {
    throttleState: {
      initialValue: {
        inputValue: '',
        isAutoTesting: false,
        testDuration: 5000,
        testInterval: 50,
        manualMetrics: {
          totalCalls: 0,
          throttledCalls: 0,
          actualExecutions: 0,
          lastExecutionTime: 0,
          averageInterval: 0,
        },
        internalMetrics: {
          totalCalls: 0,
          throttledCalls: 0,
          actualExecutions: 0,
          lastExecutionTime: 0,
          averageInterval: 0,
        },
        manualExecutionTimes: [] as number[],
        internalExecutionTimes: [] as number[],
      },
      description: 'Throttle comparison state with metrics tracking',
      tags: ['throttle', 'comparison', 'performance', 'metrics'],
    },
  }
);

// ================================
// ⚡ Action Layer - 액션 정의
// ================================

/**
 * 스로틀 비교 관련 액션들
 */
export interface ThrottleComparisonActions extends ActionPayloadMap {
  /** 수동 스로틀 액션 */
  manualThrottle: {
    value: string;
    timestamp: number;
  };

  /** 내장 스로틀 액션 */
  internalThrottle: {
    value: string;
    timestamp: number;
  };

  /** 입력값 변경 액션 */
  updateInputValue: {
    value: string;
  };

  /** 테스트 설정 업데이트 액션 */
  updateTestSettings: {
    testDuration?: number;
    testInterval?: number;
  };

  /** 자동 테스트 시작/종료 액션 */
  toggleAutoTest: {
    isRunning: boolean;
  };

  /** 수동 메트릭 업데이트 액션 */
  updateManualMetrics: {
    metrics: Partial<ThrottleMetrics>;
    executionTime?: number;
  };

  /** 내장 메트릭 업데이트 액션 */
  updateInternalMetrics: {
    metrics: Partial<ThrottleMetrics>;
    executionTime?: number;
  };

  /** 메트릭 초기화 액션 */
  resetMetrics: void;
}

// ================================
// 🏗️ Context 생성 및 Provider
// ================================

// Action Context 생성
export const ThrottleComparisonActionContext =
  createActionContext<ThrottleComparisonActions>({
    name: 'ThrottleComparisonActions',
  });

// Store Context 생성
// Store Context는 이미 ThrottleComparisonStores로 생성됨

// Providers
export const ThrottleComparisonActionProvider: React.FC<{
  children: React.ReactNode;
}> = ThrottleComparisonActionContext.Provider;
export const ThrottleComparisonStoreProvider: React.FC<{
  children: React.ReactNode;
}> = ThrottleComparisonStores.Provider;

// Hooks export
export const useThrottleComparisonActionDispatch =
  ThrottleComparisonActionContext.useActionDispatch;
export const useThrottleComparisonActionHandler =
  ThrottleComparisonActionContext.useActionHandler;
export const useThrottleComparisonStore = ThrottleComparisonStores.useStore;

// Legacy exports (deprecated)
export const useThrottleComparisonActionRegister =
  ThrottleComparisonActionContext.useActionRegister;
// useThrottleComparisonRegistry removed - not needed in new pattern

/**
 * 통합 Provider
 *
 * Store와 Action Context를 함께 제공합니다.
 */
export const ThrottleComparisonProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <ThrottleComparisonStoreProvider>
      <ThrottleComparisonActionProvider>
        {children}
      </ThrottleComparisonActionProvider>
    </ThrottleComparisonStoreProvider>
  );
};
