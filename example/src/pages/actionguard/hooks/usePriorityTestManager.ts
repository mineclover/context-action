import { useState, useEffect } from 'react';
import { usePriorityActionHandlers, HandlerConfig } from './usePriorityActionHandlers';
import { usePriorityCountManagement } from './usePriorityCountManagement';
import { usePriorityExecutionState } from './usePriorityExecutionState';
import { Store } from '@context-action/react';
import { usePriorityActionRegister } from '../context/ActionTestContext';

// 성능 옵션 인터페이스
interface PerformanceOptions {
  enableToast?: boolean;
  enableConsoleLog?: boolean;
  performanceMode?: boolean;
}

// 우선순위 테스트 통합 관리자 훅
export function usePriorityTestManager(
  configs: HandlerConfig[],
  priorityCountsStore: Store<Record<number, number>>,
  performanceOptions: PerformanceOptions = {}
) {
  const {
    enableToast = true,
    enableConsoleLog = true,
    performanceMode = false
  } = performanceOptions;
  
  // Context에서 ActionRegister 가져오기
  const actionRegister = usePriorityActionRegister();

  // 우선순위 카운팅 관리
  const countManagement = usePriorityCountManagement(priorityCountsStore);

  // 실행 상태 관리
  const executionState = usePriorityExecutionState(configs);

  // 액션 핸들러 등록 및 관리
  const actionHandlers = usePriorityActionHandlers(actionRegister, configs, {
    onTestResultAdd: enableConsoleLog ? executionState.addTestResult : () => {}, // 성능 모드에서 로그 비활성화
    onPriorityCountIncrement: countManagement.incrementPriorityCount,
    startTimeRef: executionState.startTimeRef,
    priorityExecutionCountRef: countManagement.priorityExecutionCountRef,
    abortedRef: executionState.abortedRef,
    enableActionLogger: enableToast // 토스트 설정에 따라 액션 로거 활성화/비활성화
  });

  // 통합 초기화 함수
  const initializeTest = () => {
    executionState.initializeExecutionStates();
    countManagement.resetPriorityCounts();
  };

  // 테스트 실행 함수
  const executeTest = async (delay: number = 100) => {
    if (executionState.isRunning) {
      if (enableConsoleLog) {
        console.log('⚠️ [WARNING] Test already running, ignoring new execution request');
      }
      return;
    }

    initializeTest();
    const testId = executionState.startNewTest();

    try {
      // 로그 출력 조건부 처리
      if (enableConsoleLog) {
        executionState.addTestResult(`[0ms] 🚀 우선순위 테스트 시작 (총 ${configs.length}개 핸들러)`);
      }
      
      // 액션 디스패치 (순차 실행 모드) - 일반 dispatch 사용
      await actionRegister.dispatch('priorityTest', { testId, delay }, { executionMode: 'sequential' });
      
      // dispatch 완료 후 처리 (로그 출력 조건부)
      if (enableConsoleLog) {
        const dispatchCompleteTimestamp = Date.now() - executionState.startTimeRef.current;
        executionState.addTestResult(`[${dispatchCompleteTimestamp}ms] 🏁 디스패치 완료`);
        executionState.addTestResult(`[${dispatchCompleteTimestamp}ms] ✅ 모든 핸들러 실행 완료`);
      }
      
    } catch (error) {
      // 에러는 성능 모드에서도 기록 (중요한 정보)
      const errorTimestamp = Date.now() - executionState.startTimeRef.current;
      executionState.addTestResult(`[${errorTimestamp}ms] ❌ 테스트 실행 실패: ${error}`);
    } finally {
      executionState.completeTest();
    }
  };

  // 테스트 중단 함수
  const abortTest = () => {
    executionState.abortExecution();
    countManagement.resetPriorityCounts();
  };

  // 컴포넌트 마운트 시 자동 초기화
  useEffect(() => {
    initializeTest();
  }, []); // 한 번만 실행

  return {
    // ActionRegister 인스턴스
    actionRegister,
    
    // 실행 상태
    ...executionState,
    
    // 카운팅 관리
    ...countManagement,
    
    // 통합 함수들
    initializeTest,
    executeTest,
    abortTest
  };
}