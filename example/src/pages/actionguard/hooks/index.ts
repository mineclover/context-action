/**
 * 우선순위 테스트 시스템 - 관심사별 분리된 훅들
 */

// 타입 정의들 (중앙화)
export type {
  HandlerConfig,
  PerformanceOptions,
  PriorityTestActions,
  PriorityTestState,
  PriorityTestViewModel,
} from './types';

// 기존 훅들 (호환성 유지)
export { usePriorityExecutionState } from './usePriorityExecutionState';

// 개별 관심사별 훅들 (최소 의존성)
export {
  usePriorityTestExecutionState,
  usePriorityTestTestCount,
} from './usePriorityTestViewModel';

// 새로운 분리된 훅들 (권장)
export { useTestHandlerRegistration } from './useTestHandlerRegistration';
export { useTestExecution } from './useTestExecution';
