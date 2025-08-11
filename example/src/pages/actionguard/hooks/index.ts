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

// 기존 훅들도 더 이상 사용되지 않습니다.
// 모든 상태 관리는 직접 Store 접근 패턴을 사용하세요.

// 레거시 훅들이 완전히 제거되었습니다.
// 새로운 패턴: 직접 Store 접근 방식을 사용하세요.
// 
// 예시:
// const executionStateStore = usePriorityTestStore('executionState');
// const executionState = useStoreValue(executionStateStore);

// 새로운 분리된 훅들 (권장)
export { useTestHandlerRegistration } from './useTestHandlerRegistration';
export { useTestExecution } from './useTestExecution';
