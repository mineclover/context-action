/**
 * @fileoverview Priority Test Actions
 *
 * Context-Driven Architecture의 Action Layer
 * 우선순위 테스트 액션 디스패치 및 실행 제어
 */

import { useCallback, useRef, useState } from 'react';
import {
  usePriorityTestAction,
  usePriorityTestActionRegister,
} from '../contexts/PriorityContexts';

/**
 * 우선순위 테스트 액션 훅
 *
 * 테스트 실행, 중단, 리셋 등의 액션을 관리합니다.
 */
export function usePriorityTestActions() {
  const _dispatch = usePriorityTestAction();
  const actionRegister = usePriorityTestActionRegister();

  const [isRunning, setIsRunning] = useState(false);
  const currentAbortControllerRef = useRef<AbortController | null>(null);

  const executeTest = useCallback(
    async (instanceId?: string) => {
      if (!actionRegister) {
        throw new Error('ActionRegister not available');
      }

      if (isRunning) {
        console.log('⚠️ Test already running');
        return;
      }

      try {
        setIsRunning(true);

        const testStartTime = Date.now();
        console.log(
          `🚀 Starting priority test for instance: ${instanceId || 'default'}...`
        );

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
        return result;
      } catch (error) {
        const testError = error as Error;
        console.error('❌ Test failed:', testError.message);

        if (testError.message.includes('aborted')) {
          console.log('⛔ Test was aborted by user');
        }

        throw testError;
      } finally {
        setIsRunning(false);
        currentAbortControllerRef.current = null;
      }
    },
    [actionRegister, isRunning]
  );

  const abortTest = useCallback(() => {
    if (
      currentAbortControllerRef.current &&
      !currentAbortControllerRef.current.signal.aborted
    ) {
      console.log('🛑 Aborting test...');
      currentAbortControllerRef.current.abort('User requested abort');
    }
  }, []);

  const getCurrentAbortController = useCallback(() => {
    return currentAbortControllerRef.current;
  }, []);

  return {
    isRunning,
    executeTest,
    abortTest,
    getCurrentAbortController,
  };
}
