import { Store } from '@context-action/react';
import { usePriorityActionRegister, usePriorityActionDispatch } from '../context/ActionTestContext';
import { usePriorityCountManagement } from './usePriorityCountManagement';
import { usePriorityExecutionState } from './usePriorityExecutionState';
import { usePriorityTestViewModel } from './usePriorityTestViewModel';
import { HandlerConfig, PerformanceOptions } from './types';

/**
 * View Layer: 간소화된 우선순위 테스트 관리자 훅
 * 
 * 🏗️ 최적화된 아키텍처:
 * - ViewModel이 dependency injection을 직접 처리
 * - 단순한 View Layer wrapper
 */
export function usePriorityTestManagerMVVM(
  configs: HandlerConfig[],
  priorityCountsStore: Store<Record<number, number>>,
  performanceOptions: PerformanceOptions = {}
) {
  // Context 의존성
  const actionRegister = usePriorityActionRegister();
  const dispatch = usePriorityActionDispatch();

  // 하위 의존성들 (ViewModel에서 사용)
  const countManagement = usePriorityCountManagement(priorityCountsStore);
  const executionState = usePriorityExecutionState(configs);

  // ViewModel 사용
  const viewModel = usePriorityTestViewModel({
    configs,
    priorityCountsStore,
    performanceOptions,
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