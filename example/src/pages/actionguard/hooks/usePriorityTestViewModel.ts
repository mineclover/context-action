/**
 * @fileoverview 개별 관심사별 최소 의존성 훅들
 *
 * 기존 ViewModel 패턴에서 관심사별 분리된 훅들로 마이그레이션:
 * - useTestHandlerRegistration: 핸들러 등록/해제 (비즈니스 로직)
 * - useTestExecution: 테스트 실행/중단 (비즈니스 로직)  
 * - usePriorityTestExecutionState: 상태 조회 (데이터 접근)
 * - usePriorityTestTestCount: 카운트 조회 (데이터 접근)
 *
 * 권장 사용법: 개별 훅들을 필요에 따라 조합하여 사용
 */

// 레거시 코드의 완전한 제거로 인해 더 이상 사용하지 않음
// import { usePriorityTestStore } from '../context/ActionTestContext';

/**
 * @deprecated 기존 usePriorityTestViewModel은 더 이상 권장되지 않습니다.
 * 
 * 대신 다음 개별 훅들을 사용하세요:
 * - useTestHandlerRegistration: 핸들러 등록/관리
 * - useTestExecution: 테스트 실행/제어
 * - usePriorityTestExecutionState: 실행 상태 조회
 * - usePriorityTestTestCount: 우선순위별 카운트 조회
 * 
 * 마이그레이션 예시:
 * ```typescript
 * // 기존 방식
 * const viewModel = usePriorityTestViewModel(configs, options);
 * 
 * // 새로운 방식
 * const handlerRegistration = useTestHandlerRegistration(configs);
 * const execution = useTestExecution();
 * const getExecutionState = usePriorityTestExecutionState();
 * ```
 */

// ==========================================
// 🎯 최소 의존성으로 분리된 개별 훅들
// ==========================================

// ==========================================
// 🚨 완전 제거된 레거시 훅들
// ==========================================

/**
 * @deprecated 완전히 제거되었습니다.
 * 
 * 새로운 방법:
 * ```typescript
 * const priorityCountsStore = usePriorityTestStore('priorityCounts');
 * const counts = useStoreValue(priorityCountsStore);
 * const count = counts[priority] || 0;
 * ```
 */
export const usePriorityTestTestCount = () => {
  throw new Error('usePriorityTestTestCount has been removed. Use direct Store access instead.');
};

/**
 * @deprecated 완전히 제거되었습니다.
 * 
 * 새로운 방법:
 * ```typescript
 * const executionStateStore = usePriorityTestStore('executionState');
 * const executionState = useStoreValue(executionStateStore);
 * ```
 */
export const usePriorityTestExecutionState = () => {
  throw new Error('usePriorityTestExecutionState has been removed. Use direct Store access instead.');
};

/**
 * @deprecated 이 파일의 모든 로직이 새로운 개별 훅들로 이동되었습니다.
 * 
 * 새로운 훅들을 사용하세요:
 * - useTestHandlerRegistration (./useTestHandlerRegistration.ts)
 * - useTestExecution (./useTestExecution.ts)
 * 
 * 기존 코드는 호환성을 위해 유지되지만 권장하지 않습니다.
 */
