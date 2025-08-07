import { useState, useCallback, useRef } from 'react';

// 간소화된 실행 상태 관리 훅
export function usePriorityExecutionState() {
  // 핵심 상태만 관리
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  // 성능을 위한 ref들
  const startTimeRef = useRef<number>(0);
  const abortedRef = useRef<boolean>(false);

  // 간소화된 초기화
  const initializeExecutionStates = useCallback(() => {
    // 필요시 추가 초기화 로직
  }, []);

  // 테스트 결과 관리
  const addTestResult = useCallback((result: string) => {
    setTestResults(prev => [...prev, result]);
  }, []);

  const clearTestResults = useCallback(() => {
    setTestResults([]);
  }, []);

  // 실행 제어
  const abortExecution = useCallback(() => {
    setIsRunning(false);
    abortedRef.current = true;
  }, []);

  const startNewTest = useCallback(() => {
    const testId = `test-${Date.now()}`;
    startTimeRef.current = Date.now();
    setIsRunning(true);
    abortedRef.current = false;
    clearTestResults();
    return testId;
  }, [clearTestResults]);

  const completeTest = useCallback(() => {
    setIsRunning(false);
  }, []);

  return {
    // 핵심 상태
    isRunning,
    testResults,
    
    // 성능 ref들
    startTimeRef,
    abortedRef,
    
    // 필수 함수들
    initializeExecutionStates,
    addTestResult,
    clearTestResults,
    abortExecution,
    startNewTest,
    completeTest
  };
}