import { createDeclarativeStores, type StorePayloadMap, type StoreSchema } from '@context-action/react';
import { usePriorityActionRegister, usePriorityActionDispatch } from '../context/ActionTestContext';
import { usePriorityCountManagement } from './usePriorityCountManagement';
import { usePriorityExecutionState, ExecutionStateData } from './usePriorityExecutionState';
import { usePriorityTestViewModel } from './usePriorityTestViewModel';
import { HandlerConfig, PerformanceOptions } from './types';

// Priority Test Stores 타입 정의
interface PriorityTestStores extends StorePayloadMap {
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

/**
 * View Layer: 간소화된 우선순위 테스트 관리자 훅
 * 
 * 🏗️ 최적화된 아키텍처:
 * - 내부에서 Store를 직접 관리 (파라미터 제거)
 * - Context에서 필요한 의존성을 자동으로 가져옴
 * - 단순한 View Layer wrapper
 */
export function usePriorityTestManagerMVVM(
  configs: HandlerConfig[],
  performanceOptions?: PerformanceOptions & {
    executionActionRegister?: any;
  }
) {
  // Store 의존성 (내부에서 직접 관리)
  const priorityCountsStore = PriorityStores.useStore('priorityCounts');
  const executionStateStore = PriorityStores.useStore('executionState');

  // Context 의존성
  const actionRegister = usePriorityActionRegister();
  const dispatch = usePriorityActionDispatch();

  // 하위 의존성들 (ViewModel에서 사용)
  const countManagement = usePriorityCountManagement(priorityCountsStore);
  const executionState = usePriorityExecutionState(
    executionStateStore,
    performanceOptions?.executionActionRegister
  );

  // ViewModel 사용
  const viewModel = usePriorityTestViewModel({
    configs,
    priorityCountsStore,
    performanceOptions: performanceOptions || {
      enableToast: true,
      enableConsoleLog: true
    },
    actionRegister,
    dispatch,
    countManagement,
    executionState
  });

  // 기존 인터페이스 호환성을 위한 속성 합성
  return {
    ...viewModel,
    ...executionState,
    ...countManagement
  };
}

// 기존 훅과의 호환성을 위한 별칭 (점진적 마이그레이션)
export { usePriorityTestManagerMVVM as usePriorityTestManager };

// Provider도 export (필요한 곳에서 사용)
export const PriorityTestProvider = PriorityStores.Provider;