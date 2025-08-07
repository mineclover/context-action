import { useState, useCallback, useRef } from 'react';
import { ExecutionState, HandlerConfig } from './types';

// 우선순위 실행 상태 관리 훅
export function usePriorityExecutionState(configs: HandlerConfig[]) {
  const [executionStates, setExecutionStates] = useState<ExecutionState[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  
  const startTimeRef = useRef<number>(0);

  // 실행 상태 초기화
  const initializeExecutionStates = useCallback((configsToUse?: HandlerConfig[]) => {
    const configsArray = configsToUse || configs;
    const states: ExecutionState[] = configsArray.map(config => ({
      handlerId: config.id,
      priority: config.priority,
      status: 'pending' as const,
      executionOrder: 0
    }));
    setExecutionStates(states);
    setCompletedCount(0);
  }, [configs]);

  // 실행 상태 업데이트 - React 재렌더링 최소화
  const updateExecutionState = useCallback((handlerId: string, status: ExecutionState['status']) => {
    
    setExecutionStates(prev => prev.map(state => {
      if (state.handlerId === handlerId) {
        const updatedState = { ...state, status };
        
        if (status === 'running' && state.status !== 'running') {
          updatedState.startTime = Date.now();
          updatedState.executionOrder = 0;
        } else if (status === 'completed') {
          updatedState.endTime = Date.now();
          setCompletedCount(prev => prev + 1);
        }
        
        return updatedState;
      }
      return state;
    }));
  }, []);

  // 테스트 결과 추가
  const addTestResult = useCallback((result: string) => {
    setTestResults(prev => [...prev, result]);
  }, []);

  // 테스트 결과 초기화
  const clearTestResults = useCallback(() => {
    setTestResults([]);
  }, []);

  // 실행 중단 플래그
  const abortedRef = useRef<boolean>(false);

  // 실행 중단
  const abortExecution = useCallback(() => {
    setIsRunning(false);
    abortedRef.current = true;
  }, []);

  // 새 테스트 시작
  const startNewTest = useCallback(() => {
    const testId = `test-${Date.now()}`;
    startTimeRef.current = Date.now();
    setIsRunning(true);
    abortedRef.current = false; // 중단 플래그 초기화
    clearTestResults();
    return testId;
  }, [clearTestResults]);

  // 테스트 완료
  const completeTest = useCallback(() => {
    setIsRunning(false);
  }, []);

  return {
    // States
    executionStates,
    isRunning,
    testResults,
    completedCount,
    
    // Refs
    startTimeRef,
    abortedRef,
    
    // Functions
    initializeExecutionStates,
    updateExecutionState,
    addTestResult,
    clearTestResults,
    abortExecution,
    startNewTest,
    completeTest,
    
    // Setters (for direct access if needed)
    setExecutionStates,
    setIsRunning,
    setTestResults,
    setCompletedCount
  };
}