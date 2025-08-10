import type { Store } from '@context-action/react';
import { useCallback, useRef } from 'react';

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

export interface ExecutionActionPayloads {
  startTest: { testId: string };
  completeTest: { testId: string; executionTime: number; success: boolean };
  addResult: {
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp?: number;
  };
  clearResults: {};
  resetStats: {};
  updateStats: { executionTime: number };
  abortAllTests: { reason: string };
  addHandlerExecutionTime: { handlerId: string; executionTime: number };
}

// Store 기반 풍부한 실행 상태 관리 훅 - 지연 평가 패턴
export function usePriorityExecutionState(
  executionStateStore: Store<ExecutionStateData>,
  executionActionRegister?: any
) {
  // AbortController 관리 (실행 중 중단용)
  const abortControllerRef = useRef<AbortController | null>(null);
  // Store 값을 지연 평가로 사용 (구독 없음)
  const getExecutionState = useCallback(
    () => executionStateStore.getValue(),
    [executionStateStore]
  );

  // Store 업데이트 헬퍼
  const updateStore = useCallback(
    (updates: Partial<ExecutionStateData>) => {
      const currentState = executionStateStore.getValue();
      executionStateStore.setValue({ ...currentState, ...updates });
    },
    [executionStateStore]
  );

  // Action 디스패치 헬퍼
  const dispatchAction = useCallback(
    (actionType: keyof ExecutionActionPayloads, payload: any) => {
      if (executionActionRegister) {
        executionActionRegister.dispatch(actionType, payload);
      }
    },
    [executionActionRegister]
  );

  // 통계 계산 헬퍼 (Store 기반) - 성능 최적화
  const calculateStats = useCallback(
    (newExecutionTime: number) => {
      const currentState = executionStateStore.getValue();
      const updatedTimes = [...currentState.executionTimes, newExecutionTime];

      // 성능 최적화: 점진적 계산
      const totalTimes = updatedTimes.length;
      const prevSum = currentState.executionTimes.reduce(
        (sum, time) => sum + time,
        0
      );
      const newSum = prevSum + newExecutionTime;
      const average = newSum / totalTimes;

      // 최대/최소값 점진적 계산
      const max = Math.max(
        currentState.maxExecutionTime || 0,
        newExecutionTime
      );
      const min = Math.min(
        currentState.minExecutionTime === Number.MAX_VALUE
          ? newExecutionTime
          : currentState.minExecutionTime,
        newExecutionTime
      );

      return {
        executionTimes: updatedTimes,
        averageExecutionTime: Math.round(average * 100) / 100, // 소수점 2자리까지 표시
        maxExecutionTime: max,
        minExecutionTime: min,
        lastExecutionTime: newExecutionTime,
      };
    },
    [executionStateStore]
  );

  // Store 기반 초기화
  const initializeExecutionStates = useCallback(() => {
    updateStore({
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
    });
    dispatchAction('resetStats', {});
  }, [updateStore, dispatchAction]);

  // 풍부한 테스트 결과 관리
  const addTestResult = useCallback(
    (
      message: string,
      type: 'info' | 'success' | 'warning' | 'error' = 'info'
    ) => {
      const currentState = executionStateStore.getValue();
      const timestamp = Date.now();
      const timestampedMessage = `[${timestamp - currentState.startTime}ms] ${message}`;

      updateStore({
        testResults: [...currentState.testResults, timestampedMessage],
      });

      dispatchAction('addResult', {
        message: timestampedMessage,
        type,
        timestamp,
      });
    },
    [executionStateStore, updateStore, dispatchAction]
  );

  const clearTestResults = useCallback(() => {
    updateStore({ testResults: [] });
    dispatchAction('clearResults', {});
  }, [updateStore, dispatchAction]);

  // 개별 핸들러 실행 시간 추가
  const addHandlerExecutionTime = useCallback(
    (handlerId: string, executionTime: number) => {
      // 개별 핸들러 시간을 executionTimes에 추가하고 통계 재계산
      const stats = calculateStats(executionTime);

      updateStore({
        ...stats,
      });

      dispatchAction('addHandlerExecutionTime', { handlerId, executionTime });
      addTestResult(
        `📊 핸들러 ${handlerId} 실행시간: ${executionTime}ms 기록`,
        'info'
      );
    },
    [calculateStats, updateStore, dispatchAction, addTestResult]
  );

  // AbortController 기반 abort 기능 사용
  const abortExecution = useCallback(
    (reason: string = '사용자 요청') => {
      const currentState = executionStateStore.getValue();

      // AbortController가 있으면 abort 신호 전송
      if (
        abortControllerRef.current &&
        !abortControllerRef.current.signal.aborted
      ) {
        abortControllerRef.current.abort();
      }

      updateStore({
        isRunning: false,
        abortedTests: currentState.abortedTests + 1,
        currentTestId: null,
      });

      dispatchAction('abortAllTests', { reason });
      addTestResult(`⛔ 테스트 중단: ${reason}`, 'warning');
    },
    [executionStateStore, updateStore, dispatchAction, addTestResult]
  );

  const completeTest = useCallback(
    (success: boolean = true, executionTime?: number) => {
      const currentState = executionStateStore.getValue();
      const actualExecutionTime =
        executionTime || Date.now() - currentState.startTime;

      // 전체 테스트 완료 시에는 개별 핸들러 시간 통계가 아닌 전체 테스트 상태만 업데이트
      updateStore({
        isRunning: false,
        currentTestId: null,
        successfulTests: success
          ? currentState.successfulTests + 1
          : currentState.successfulTests,
        failedTests: success
          ? currentState.failedTests
          : currentState.failedTests + 1,
        lastExecutionTime: actualExecutionTime,
      });

      if (currentState.currentTestId) {
        dispatchAction('completeTest', {
          testId: currentState.currentTestId,
          executionTime: actualExecutionTime,
          success,
        });
      }

      const statusIcon = success ? '✅' : '❌';
      const statusText = success ? '성공' : '실패';
      addTestResult(
        `${statusIcon} 테스트 ${statusText} (전체 소요시간: ${actualExecutionTime}ms)`,
        success ? 'success' : 'error'
      );
    },
    [executionStateStore, updateStore, dispatchAction, addTestResult]
  );

  // 고급 조회 함수들 - 지연 평가
  const getExecutionStats = useCallback(() => {
    const state = executionStateStore.getValue();
    return {
      totalTests: state.totalTests,
      successfulTests: state.successfulTests,
      failedTests: state.failedTests,
      abortedTests: state.abortedTests,
      successRate:
        state.totalTests > 0
          ? ((state.successfulTests / state.totalTests) * 100).toFixed(1)
          : '0.0',
      averageExecutionTime: state.averageExecutionTime,
      maxExecutionTime: state.maxExecutionTime,
      minExecutionTime:
        state.minExecutionTime === Number.MAX_VALUE
          ? 0
          : state.minExecutionTime,
    };
  }, [executionStateStore]);

  const getRecentResults = useCallback(
    (count: number = 10) => {
      const state = executionStateStore.getValue();
      return state.testResults.slice(-count);
    },
    [executionStateStore]
  );

  const filterResultsByType = useCallback(
    (type: string) => {
      const state = executionStateStore.getValue();
      return state.testResults.filter((result) => result.includes(type));
    },
    [executionStateStore]
  );

  return {
    // 지연 평가 상태 접근자
    getExecutionState,

    // 호환성을 위한 getter 속성 (지연 평가)
    get isRunning() {
      return executionStateStore.getValue().isRunning;
    },
    get testResults() {
      return executionStateStore.getValue().testResults;
    },
    get currentTestId() {
      return executionStateStore.getValue().currentTestId;
    },
    get totalTests() {
      return executionStateStore.getValue().totalTests;
    },
    get successfulTests() {
      return executionStateStore.getValue().successfulTests;
    },
    get failedTests() {
      return executionStateStore.getValue().failedTests;
    },
    get abortedTests() {
      return executionStateStore.getValue().abortedTests;
    },
    get averageExecutionTime() {
      return executionStateStore.getValue().averageExecutionTime;
    },
    get lastExecutionTime() {
      return executionStateStore.getValue().lastExecutionTime;
    },
    get maxExecutionTime() {
      return executionStateStore.getValue().maxExecutionTime;
    },
    get minExecutionTime() {
      return executionStateStore.getValue().minExecutionTime;
    },
    get startTime() {
      return executionStateStore.getValue().startTime;
    },
    get executionTimes() {
      return executionStateStore.getValue().executionTimes;
    },

    // 기본 함수들
    initializeExecutionStates,
    addTestResult,
    clearTestResults,
    abortExecution,
    completeTest,

    // 개별 핸들러 시간 관리
    addHandlerExecutionTime,

    // 고급 함수들
    getExecutionStats,
    getRecentResults,
    filterResultsByType,

    // Store 및 Action 접근
    updateStore,
    dispatchAction,

    // AbortController 직접 접근 (고급 사용자용)
    getCurrentAbortController: () => abortControllerRef.current,

    // 핸들러에서 전체 파이프라인 abort 트리거
    triggerPipelineAbort: useCallback(
      (reason: string = '핸들러에서 요청') => {
        if (
          abortControllerRef.current &&
          !abortControllerRef.current.signal.aborted
        ) {
          abortControllerRef.current.abort();
          addTestResult(`🔴 파이프라인 중단: ${reason}`, 'error');
        }
      },
      [addTestResult]
    ),
  };
}
