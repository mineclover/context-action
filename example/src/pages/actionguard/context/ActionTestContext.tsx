import { createActionContext, createDeclarativeStores } from '@context-action/react';
import { ActionPayloadMap } from '@context-action/core';
import { type StoreSchema } from '@context-action/react';
import { ExecutionStateData } from '../hooks/usePriorityExecutionState';

// 테스트용 액션 타입 정의
export interface TestActions extends ActionPayloadMap {
  priorityTest: { 
    testId: string; 
    delay: number; // 미사용 (각 핸들러는 개별 config.delay만 사용)
  };
}

// Priority Test용 Action Context
export const PriorityTestAction = createActionContext<TestActions>({
  name: 'PriorityTest'
});

// 사용 중인 hooks만 export
export const {
  Provider: ActionTestProvider,
  useActionDispatch: usePriorityActionDispatch,
  useActionRegister: usePriorityActionRegister,
  useActionContext: usePriorityActionContext,
  context: PriorityTestActionContext,
} = PriorityTestAction;



// Priority Test Stores 타입 정의
interface PriorityTestStores  {
  priorityCounts: Record<number, number>;
  executionState: ExecutionStateData;
}

// Store 스키마 정의
const priorityTestSchema: StoreSchema<PriorityTestStores> = {
  priorityCounts: {
    initialValue: {},
    description: 'Priority execution counts',
    tags: ['priority', 'testing']
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
      executionTimes: []
    },
    description: 'Test execution state and statistics',
    tags: ['execution', 'statistics', 'testing']
  }
};


// Stores 인스턴스 생성 (컨텍스트별로 고유)
const PriorityStores = createDeclarativeStores('PriorityTestManager', priorityTestSchema);

export const { Provider: PriorityTestProvider, useStore: usePriorityTestStore, RegistryContext: PriorityTestStoreContext, useRegistry: usePriorityTestRegistry, useRegistryInfo: usePriorityTestRegistryInfo } = PriorityStores;

