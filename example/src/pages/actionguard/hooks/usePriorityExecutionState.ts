import { useCallback, useRef } from 'react';
import { Store, useStoreValue } from '@context-action/react';

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
}

export interface ExecutionActionPayloads {
  startTest: { testId: string };
  completeTest: { testId: string; executionTime: number; success: boolean };
  addResult: { message: string; type: 'info' | 'success' | 'warning' | 'error'; timestamp?: number };
  clearResults: {};
  resetStats: {};
  updateStats: { executionTime: number };
}

// Store 기반 풍부한 실행 상태 관리 훅
export function usePriorityExecutionState(
  executionStateStore: Store<ExecutionStateData>,
  executionActionRegister?: any
) {
  // Store 기반 상태 사용 (필수)
  const executionState = useStoreValue(executionStateStore);
  
  // 성능을 위한 ref들
  const startTimeRef = useRef<number>(0);
  const abortedRef = useRef<boolean>(false);
  const executionTimes = useRef<number[]>([]);

  // Store 업데이트 헬퍼
  const updateStore = useCallback((updates: Partial<ExecutionStateData>) => {
    const currentState = executionStateStore.getValue();
    executionStateStore.setValue({ ...currentState, ...updates });
  }, [executionStateStore]);

  // Action 디스패치 헬퍼
  const dispatchAction = useCallback((actionType: keyof ExecutionActionPayloads, payload: any) => {
    if (executionActionRegister) {
      executionActionRegister.dispatch(actionType, payload);
    }
  }, [executionActionRegister]);

  // 통계 계산 헬퍼
  const calculateStats = useCallback((newExecutionTime: number) => {
    executionTimes.current.push(newExecutionTime);
    
    const times = executionTimes.current;
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);

    return {
      averageExecutionTime: Math.round(average),
      maxExecutionTime: max,
      minExecutionTime: min,
      lastExecutionTime: newExecutionTime
    };
  }, []);

  // 간소화된 초기화
  const initializeExecutionStates = useCallback(() => {
    executionTimes.current = [];
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
      minExecutionTime: Number.MAX_VALUE
    });
    dispatchAction('resetStats', {});
  }, [updateStore, dispatchAction]);

  // 풍부한 테스트 결과 관리
  const addTestResult = useCallback((
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) => {
    const timestamp = Date.now();
    const timestampedMessage = `[${timestamp - startTimeRef.current}ms] ${message}`;
    
    updateStore({
      testResults: [...executionState.testResults, timestampedMessage]
    });
    
    dispatchAction('addResult', { message: timestampedMessage, type, timestamp });
  }, [executionState.testResults, updateStore, dispatchAction]);

  const clearTestResults = useCallback(() => {
    updateStore({ testResults: [] });
    dispatchAction('clearResults', {});
  }, [updateStore, dispatchAction]);

  // 고급 실행 제어 (executionActionRegister의 내장 abort 사용)
  const abortExecution = useCallback((reason: string = '사용자 요청') => {
    const currentTestId = executionState.currentTestId;
    
    updateStore({
      isRunning: false,
      abortedTests: executionState.abortedTests + 1,
      currentTestId: null
    });
    
    abortedRef.current = true;
    
    // executionActionRegister의 내장 abort 기능 사용
    if (executionActionRegister) {
      executionActionRegister.abort(reason);
    }
    
    addTestResult(`⛔ 테스트 중단: ${reason}`, 'warning');
  }, [executionState.currentTestId, executionState.abortedTests, updateStore, executionActionRegister, addTestResult]);

  const startNewTest = useCallback(() => {
    const testId = `test-${Date.now()}`;
    startTimeRef.current = Date.now();
    
    updateStore({
      isRunning: true,
      currentTestId: testId,
      totalTests: executionState.totalTests + 1
    });
    
    abortedRef.current = false;
    clearTestResults();
    
    dispatchAction('startTest', { testId });
    addTestResult(`🚀 새 테스트 시작 (ID: ${testId})`, 'info');
    
    return testId;
  }, [executionState.totalTests, updateStore, dispatchAction, clearTestResults, addTestResult]);

  const completeTest = useCallback((success: boolean = true, executionTime?: number) => {
    const currentTestId = executionState.currentTestId;
    const actualExecutionTime = executionTime || (Date.now() - startTimeRef.current);
    
    // 통계 계산
    const stats = calculateStats(actualExecutionTime);
    
    updateStore({
      isRunning: false,
      currentTestId: null,
      successfulTests: success ? executionState.successfulTests + 1 : executionState.successfulTests,
      failedTests: success ? executionState.failedTests : executionState.failedTests + 1,
      ...stats
    });
    
    if (currentTestId) {
      dispatchAction('completeTest', { 
        testId: currentTestId, 
        executionTime: actualExecutionTime, 
        success 
      });
    }
    
    dispatchAction('updateStats', { executionTime: actualExecutionTime });
    
    const statusIcon = success ? '✅' : '❌';
    const statusText = success ? '성공' : '실패';
    addTestResult(`${statusIcon} 테스트 ${statusText} (소요시간: ${actualExecutionTime}ms)`, success ? 'success' : 'error');
  }, [executionState.currentTestId, executionState.successfulTests, executionState.failedTests, calculateStats, updateStore, dispatchAction, addTestResult]);

  // 고급 조회 함수들
  const getExecutionStats = useCallback(() => {
    return {
      totalTests: executionState.totalTests,
      successfulTests: executionState.successfulTests,
      failedTests: executionState.failedTests,
      abortedTests: executionState.abortedTests,
      successRate: executionState.totalTests > 0 ? (executionState.successfulTests / executionState.totalTests * 100).toFixed(1) : '0.0',
      averageExecutionTime: executionState.averageExecutionTime,
      maxExecutionTime: executionState.maxExecutionTime,
      minExecutionTime: executionState.minExecutionTime === Number.MAX_VALUE ? 0 : executionState.minExecutionTime
    };
  }, [executionState]);

  const getRecentResults = useCallback((count: number = 10) => {
    return executionState.testResults.slice(-count);
  }, [executionState.testResults]);

  const filterResultsByType = useCallback((type: string) => {
    return executionState.testResults.filter(result => result.includes(type));
  }, [executionState.testResults]);

  return {
    // 풍부한 상태
    ...executionState,
    
    // 성능 ref들
    startTimeRef,
    abortedRef,
    
    // 기본 함수들 (호환성)
    initializeExecutionStates,
    addTestResult,
    clearTestResults,
    abortExecution,
    startNewTest,
    completeTest,
    
    // 고급 함수들
    getExecutionStats,
    getRecentResults,
    filterResultsByType,
    
    // Store 및 Action 접근
    updateStore,
    dispatchAction
  };
}