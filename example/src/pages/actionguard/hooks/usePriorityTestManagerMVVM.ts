import { Store } from '@context-action/react';
import { usePriorityActionRegister, usePriorityActionDispatch } from '../context/ActionTestContext';
import { usePriorityCountManagement } from './usePriorityCountManagement';
import { usePriorityExecutionState } from './usePriorityExecutionState';
import { usePriorityTestViewModel } from './viewmodels/usePriorityTestViewModel';
import { PerformanceOptions } from './viewmodels/PriorityTestState';
import { HandlerConfig } from './usePriorityActionHandlers';

/**
 * View Layer: MVVM 패턴으로 리팩토링된 우선순위 테스트 관리자 훅
 * 
 * 🏗️ 아키텍처:
 * - Model: PriorityHandlerManager, TestExecutionEngine (순수 비즈니스 로직)
 * - ViewModel: usePriorityTestViewModel (상태 관리 + UI 바인딩)
 * - View: usePriorityTestManagerMVVM (UI 인터페이스)
 */
export function usePriorityTestManagerMVVM(
  configs: HandlerConfig[],
  priorityCountsStore: Store<Record<number, number>>,
  performanceOptions: PerformanceOptions = {}
) {
  // Context 의존성
  const actionRegister = usePriorityActionRegister();
  const dispatch = usePriorityActionDispatch();

  // 기존 훅들 (점진적 마이그레이션을 위해 재사용)
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

  // View Layer에서는 단순히 ViewModel을 그대로 노출
  // 필요한 경우 View 특화 로직이나 변환 로직을 추가할 수 있음
  return {
    ...viewModel,
    
    // 기존 인터페이스와의 호환성을 위해 추가 속성들 노출
    ...executionState,
    ...countManagement
  };
}

// 기존 훅과의 호환성을 위한 별칭 (점진적 마이그레이션)
export { usePriorityTestManagerMVVM as usePriorityTestManager };