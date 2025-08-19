import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createDeclarativeStorePattern,
} from '@context-action/react';
import type React from 'react';

// 실행 상태 관리를 위한 타입 정의
export interface ExecutionStateData {
  isRunning: boolean;
  testResults: string[];
  currentTestId: string | null;
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  abortedTests: number;
  averageExecutionTime: number;
  lastExecutionTime: number;
  maxExecutionTime: number;
  minExecutionTime: number;
  startTime: number;
  executionTimes: number[];
}

// 테스트용 액션 타입 정의
export interface TestActions extends ActionPayloadMap {
  priorityTest: {
    testId: string;
    delay: number; // 미사용 (각 핸들러는 개별 config.delay만 사용)
  };
}

// Priority Test용 Action Context
export const PriorityTestAction = createActionContext<TestActions>({
  name: 'PriorityTest',
});

// Provider 타입을 명시적으로 선언
export const ActionTestProvider: React.FC<{ children: React.ReactNode }> =
  PriorityTestAction.Provider;

// 나머지 hooks export
export const usePriorityActionDispatch = PriorityTestAction.useActionDispatch;
export const usePriorityActionHandler = PriorityTestAction.useActionHandler;

// Legacy exports (deprecated)
export const usePriorityActionRegister = PriorityTestAction.useActionRegister;
export const usePriorityActionContext: () => any =
  PriorityTestAction.useActionContext;
export const PriorityTestActionContext: React.Context<any> =
  PriorityTestAction.context;

// Stores 인스턴스 생성 - 새로운 패턴으로 자동 타입 추론
const PriorityStores = createDeclarativeStorePattern('PriorityTestManager', {
  priorityCounts: {
    initialValue: {} as Record<number, number>,
    description: 'Priority execution counts',
    strategy: 'shallow',
  },
  executionState: {
    initialValue: {
      isRunning: false,
      testResults: [] as string[],
      currentTestId: null as string | null,
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      abortedTests: 0,
      averageExecutionTime: 0,
      lastExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: Number.MAX_VALUE,
      startTime: 0,
      executionTimes: [] as number[],
    },
    description: 'Test execution state and statistics',
    strategy: 'shallow',
  },
});

// Provider 타입을 명시적으로 선언 - 새로운 패턴
export const PriorityTestProvider: React.FC<{
  children: React.ReactNode;
}> = PriorityStores.Provider;

// 나머지 exports - 새로운 패턴
export const usePriorityTestStore = PriorityStores.useStore;
