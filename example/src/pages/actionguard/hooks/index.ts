/**
 * 우선순위 테스트 시스템 - 최적화된 MVVM 아키텍처
 */

// 메인 훅 (권장)
export { usePriorityTestManager, PriorityTestProvider } from './usePriorityTestManagerMVVM';

// 하위 레벨 훅들 (고급 사용자용)
export { usePriorityTestViewModel } from './usePriorityTestViewModel';
export { usePriorityCountManagement } from './usePriorityCountManagement';
export { usePriorityExecutionState } from './usePriorityExecutionState';

// 타입 정의들 (중앙화)
export type { 
  HandlerConfig, 
  PerformanceOptions,
  PriorityTestState,
  PriorityTestActions,
  PriorityTestViewModel,
  ViewModelDependencies
} from './types';