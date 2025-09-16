/**
 * @fileoverview 테스트 실행 전용 훅
 *
 * PriorityTestInstance에서 추출한 테스트 실행 로직
 * 테스트 시작, 중단, 상태 관리를 담당
 */

import { useCallback, useRef, useState } from 'react';
import {
  usePriorityActionRegister,
  usePriorityTestStore,
} from '../test-context/ActionTestContext';

interface TestExecutionOptions {
  /**
   * 테스트 시작 콜백
   */
  onTestStart?: () => void;

  /**
   * 테스트 완료 콜백
   */
  onTestComplete?: (result: TestExecutionResult) => void;

  /**
   * 테스트 실패 콜백
   */
  onTestError?: (error: Error) => void;
}

interface TestExecutionResult {
  success: boolean;
  totalTime: number;
  handlerCount: number;
  errorMessage?: string;
}

/**
 * 테스트 실행 및 제어 훅
 *
 * 테스트 시작, 중단, 상태 추적을 담당합니다.
 * AbortController를 통한 중단 기능을 제공합니다.
 *
 * @param options 실행 옵션
 * @returns 테스트 실행 API
 */
export function useTestExecution(options: TestExecutionOptions = {}) {
  const { onTestStart, onTestComplete, onTestError } = options;

  const actionRegister = usePriorityActionRegister();
  const executionStateStore = usePriorityTestStore('executionState');
  const priorityCountsStore = usePriorityTestStore('priorityCounts');

  const [isRunning, setIsRunning] = useState(false);
  const currentAbortControllerRef = useRef<AbortController | null>(null);

  /**
   * 테스트를 실행합니다
   */
  const executeTest = useCallback(async () => {
    if (!actionRegister) {
      const error = new Error('ActionRegister not available');
      onTestError?.(error);
      return;
    }

    if (isRunning) {
      console.log('⚠️ Test already running');
      return;
    }

    try {
      setIsRunning(true);

      onTestStart?.();

      const testStartTime = Date.now();
      console.log('🚀 Starting priority test...');

      // 테스트 실행 - autoAbort 사용
      const result = await actionRegister.dispatchWithResult(
        'priorityTest',
        { testId: `test-${testStartTime}`, delay: 0 },
        {
          executionMode: 'sequential',
          autoAbort: {
            enabled: true,
            onControllerCreated: (controller) => {
              currentAbortControllerRef.current = controller;
            },
            allowHandlerAbort: true,
          },
        }
      );

      const testEndTime = Date.now();
      const totalTime = testEndTime - testStartTime;

      console.log(`✅ Test completed in ${totalTime}ms`);

      const executionResult: TestExecutionResult = {
        success: true,
        totalTime,
        handlerCount: 0, // 핸들러 개수는 별도 추적
      };

      onTestComplete?.(executionResult);
    } catch (error) {
      const testError = error as Error;
      console.error('❌ Test failed:', testError.message);

      if (testError.message.includes('aborted')) {
        console.log('⛔ Test was aborted by user');
      }

      const executionResult: TestExecutionResult = {
        success: false,
        totalTime: 0,
        handlerCount: 0,
        errorMessage: testError.message,
      };

      onTestComplete?.(executionResult);
      onTestError?.(testError);
    } finally {
      setIsRunning(false);
      currentAbortControllerRef.current = null;
    }
  }, [actionRegister, isRunning, onTestStart, onTestComplete, onTestError]);

  /**
   * 실행 중인 테스트를 중단합니다
   */
  const abortTest = useCallback(() => {
    if (
      currentAbortControllerRef.current &&
      !currentAbortControllerRef.current.signal.aborted
    ) {
      console.log('🛑 Aborting test...');
      currentAbortControllerRef.current.abort('User requested abort');

      // executionState 업데이트
      const currentState = executionStateStore.getValue();
      executionStateStore.setValue({
        ...currentState,
        isRunning: false,
        abortedTests: currentState.abortedTests + 1,
      });
    }
  }, [executionStateStore]);

  /**
   * 테스트 상태를 초기화합니다
   */
  const resetTest = useCallback(() => {
    if (isRunning) {
      abortTest();
    }

    // 상태 완전 초기화
    executionStateStore.setValue({
      isRunning: false,
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
      startTime: Date.now(),
      executionTimes: [] as number[],
    });

    // 우선순위 카운트도 초기화
    priorityCountsStore.setValue({});

    console.log('🔄 Test state reset');
  }, [isRunning, abortTest, executionStateStore, priorityCountsStore]);

  /**
   * 현재 실행 중인 AbortController를 반환합니다
   */
  const getCurrentAbortController = useCallback(() => {
    return currentAbortControllerRef.current;
  }, []);

  return {
    isRunning,
    executeTest,
    abortTest,
    resetTest,
    getCurrentAbortController,
  };
}
