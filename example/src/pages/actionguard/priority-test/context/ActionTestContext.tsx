import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createDeclarativeStores,
  type StoreSchema,
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

// Priority Test Stores 타입 정의
interface PriorityTestStores {
  priorityCounts: Record<number, number>;
  executionState: ExecutionStateData;
}

// Store 스키마 정의
const priorityTestSchema: StoreSchema<PriorityTestStores> = {
  priorityCounts: {
    initialValue: {},
    description: 'Priority execution counts',
    tags: ['priority', 'testing'],
  },
  executionState: {
    initialValue: {
      isRunning: false,
      testResults: [],
      currentTestId: null,
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      abortedTests: 0,
      averageExecutionTime: 0,
      lastExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: Number.MAX_VALUE,
      startTime: 0,
      executionTimes: [],
    },
    description: 'Test execution state and statistics',
    tags: ['execution', 'statistics', 'testing'],
  },
};

// Stores 인스턴스 생성 (컨텍스트별로 고유)
const PriorityStores = createDeclarativeStores(
  'PriorityTestManager',
  priorityTestSchema
);

// Provider 타입을 명시적으로 선언
export const PriorityTestProvider: React.FC<{
  children: React.ReactNode;
  registryId?: string;
}> = PriorityStores.Provider;

// 나머지 exports
export const usePriorityTestStore = PriorityStores.useStore;
export const PriorityTestStoreContext: React.Context<any> =
  PriorityStores.RegistryContext;
export const usePriorityTestStores = PriorityStores.useStores;
export const usePriorityTestRegistryInfo = PriorityStores.useRegistryInfo;

// Legacy exports (deprecated)
export const usePriorityTestRegistry = PriorityStores.useRegistry;
