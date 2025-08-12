/**
 * @fileoverview 테스트 핸들러 등록 전용 훅
 * 
 * PriorityTestInstance에서 추출한 핸들러 등록 로직
 * 복잡한 ActionRegistry 패턴을 캡슐화하여 재사용성 향상
 */

import { useCallback, useRef } from 'react';
import { usePriorityActionRegister, usePriorityTestStore } from '../context/ActionTestContext';
import type { HandlerConfig } from './types';

interface TestHandlerRegistrationOptions {
  /**
   * 핸들러 등록 완료 콜백
   */
  onRegistered?: (handlerCount: number) => void;
  
  /**
   * 핸들러 등록 실패 콜백
   */
  onRegistrationError?: (error: Error) => void;
}

/**
 * 테스트 핸들러 등록 및 관리 훅
 * 
 * ActionRegistry 패턴을 사용하여 우선순위별 핸들러를 등록하고 관리합니다.
 * 초기화 핸들러와 개별 테스트 핸들러를 모두 처리합니다.
 * 
 * @param configs 핸들러 설정 배열
 * @param options 등록 옵션
 * @returns 핸들러 등록 API
 */
export function useTestHandlerRegistration(
  configs: HandlerConfig[],
  options: TestHandlerRegistrationOptions = {}
) {
  const { onRegistered, onRegistrationError } = options;
  
  const actionRegister = usePriorityActionRegister();
  const priorityCountsStore = usePriorityTestStore('priorityCounts');
  const executionStateStore = usePriorityTestStore('executionState');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  /**
   * 모든 핸들러를 등록합니다
   */
  const registerHandlers = useCallback(async () => {
    if (!actionRegister) {
      const error = new Error('ActionRegister not available');
      onRegistrationError?.(error);
      return;
    }

    try {
      // 기존 핸들러 모두 해제
      actionRegister.clearAction('priorityTest');

      // 초기화 핸들러 등록 (우선순위 200 - 가장 먼저 실행)
      actionRegister.register(
        'priorityTest',
        async (payload, controller) => {
          console.log(
            '🚀 Priority Test Started - Initializing all stores and metrics...'
          );

          // Priority Counts Store 초기화
          priorityCountsStore.setValue({});

          // Execution State Store 완전 초기화
          executionStateStore.setValue({
            isRunning: true,
            testResults: [],
            currentTestId: payload.testId,
            totalTests: 0,
            successfulTests: 0,
            failedTests: 0,
            abortedTests: 0,
            averageExecutionTime: 0,
            lastExecutionTime: 0,
            maxExecutionTime: 0,
            minExecutionTime: Number.MAX_VALUE,
            startTime: Date.now(),
            executionTimes: [],
          });

          console.log('✅ All stores initialized');
        },
        {
          priority: 200,
          id: 'initializer',
          tags: ['priority-test', 'initializer'],
          blocking: true,
        }
      );

      // 설정된 핸들러들을 ActionRegistry에 등록
      configs.forEach((config) => {
        actionRegister.register(
          'priorityTest',
          async (payload, controller) => {
            const handlerStartTime = Date.now();

            // abortSignal 체크
            if (abortControllerRef.current?.signal?.aborted) {
              throw new Error('Operation aborted');
            }

            // 카운트 증가
            const currentCounts = priorityCountsStore.getValue();
            priorityCountsStore.setValue({
              ...currentCounts,
              [config.priority]: (currentCounts[config.priority] || 0) + 1,
            });

            // 딜레이 적용 (abort 가능하도록 처리)
            if (config.delay > 0) {
              await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(resolve, config.delay);

                // abortSignal이 있으면 abort 이벤트 리스너 등록
                if (abortControllerRef.current?.signal) {
                  abortControllerRef.current.signal.addEventListener(
                    'abort',
                    () => {
                      clearTimeout(timeoutId);
                      reject(new Error('Operation aborted'));
                    },
                    { once: true }
                  );
                }
              });
            }

            const handlerEndTime = Date.now();
            const handlerExecutionTime = handlerEndTime - handlerStartTime;

            console.log(
              `Executed: ${config.label} (P${config.priority}) - ${handlerExecutionTime}ms`
            );

            // 핸들러 실행 시간을 executionTimes 배열에 추가
            const currentState = executionStateStore.getValue();
            const newExecutionTimes = [
              ...currentState.executionTimes,
              handlerExecutionTime,
            ];
            const newAverageTime = Math.round(
              newExecutionTimes.reduce((a, b) => a + b, 0) / newExecutionTimes.length
            );
            const newMaxTime = Math.max(...newExecutionTimes);
            const newMinTime = Math.min(...newExecutionTimes);

            executionStateStore.setValue({
              ...currentState,
              executionTimes: newExecutionTimes,
              averageExecutionTime: newAverageTime,
              lastExecutionTime: handlerExecutionTime,
              maxExecutionTime: newMaxTime,
              minExecutionTime: newMinTime,
              successfulTests: currentState.successfulTests + 1,
              totalTests: currentState.totalTests + 1,
            });

            // Jump 로직
            if (config.jumpToPriority !== null && config.jumpToPriority !== undefined) {
              const currentCount = (currentCounts[config.priority] || 0) + 1;
              if (currentCount <= 3) {
                console.log(
                  `🦘 ${config.label} → P${config.jumpToPriority} (count: ${currentCount})`
                );
                controller.jumpToPriority(config.jumpToPriority);
              } else {
                controller.next();
              }
            } else {
              controller.next();
            }
          },
          {
            priority: config.priority,
            id: config.id,
            tags: ['priority-test', config.label],
            blocking: true,
          }
        );
      });

      // 완료 핸들러 등록 (우선순위 0 - 가장 마지막 실행)
      actionRegister.register(
        'priorityTest',
        async (payload, controller) => {
          console.log('🏁 Priority Test Completed - Finalizing...');
          
          const currentState = executionStateStore.getValue();
          executionStateStore.setValue({
            ...currentState,
            isRunning: false,
            currentTestId: null,
          });
          
          console.log('✅ Test completed successfully');
        },
        {
          priority: 0,
          id: 'finalizer',
          tags: ['priority-test', 'finalizer'],
          blocking: true,
        }
      );

      onRegistered?.(configs.length + 2); // configs + initializer + finalizer
      
    } catch (error) {
      onRegistrationError?.(error as Error);
    }
  }, [actionRegister, configs, priorityCountsStore, executionStateStore, onRegistered, onRegistrationError]);

  /**
   * 모든 핸들러를 해제합니다
   */
  const unregisterHandlers = useCallback(() => {
    if (!actionRegister) return;
    actionRegister.clearAction('priorityTest');
  }, [actionRegister]);

  return {
    registerHandlers,
    unregisterHandlers,
  };
}