/**
 * @fileoverview Priority Test Handlers
 *
 * Context-Driven Architecture의 Handler Layer
 * 우선순위 테스트 실행 및 관리 비즈니스 로직
 */

import type { Store } from '@context-action/react';
import { type ReactNode, useCallback, useRef } from 'react';
import {
  type ExecutionStateData,
  type HandlerConfig,
  usePriorityTestActionHandler,
} from '../contexts/PriorityContexts';

interface PriorityTestHandlersProps {
  priorityCountsStore: Store<Record<number, number>>;
  executionStateStore: Store<ExecutionStateData>;
  handlerConfigs: HandlerConfig[];
}

/**
 * 우선순위 테스트 핸들러 컴포넌트
 *
 * Props-based DI 패턴을 사용하여 테스트 실행 로직을 처리합니다.
 */
export function PriorityTestHandlers({
  priorityCountsStore,
  executionStateStore,
  handlerConfigs,
  children,
}: PriorityTestHandlersProps & { children: ReactNode }) {
  const abortControllerRef = useRef<AbortController | null>(null);

  // 초기화 핸들러 등록 (우선순위 200 - 가장 먼저 실행)
  usePriorityTestActionHandler(
    'priorityTest',
    useCallback(
      async (payload, controller) => {
        console.log(
          '🚀 Priority Test Started - Initializing execution state...'
        );

        // Execution State Store 완전 초기화 (Priority Counts는 유지)
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
          executionTimes: [] as number[],
        });

        console.log(
          '✅ Execution state initialized (priority counts preserved)'
        );
      },
      [executionStateStore]
    ),
    { priority: 200, id: 'initializer', blocking: true }
  );

  // 통합된 핸들러로 모든 설정을 처리
  const createConfigHandler = useCallback(
    (configIndex: number) => async (payload: any, controller: any) => {
      const config = handlerConfigs[configIndex];
      if (!config) return;

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
        await new Promise<void>((resolve, reject) => {
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
      if (
        config.jumpToPriority !== null &&
        config.jumpToPriority !== undefined
      ) {
        const currentCount = (currentCounts[config.priority] || 0) + 1;
        if (currentCount <= 3) {
          console.log(
            `🦘 ${config.label} → P${config.jumpToPriority} (count: ${currentCount})`
          );
          controller.jumpToPriority(config.jumpToPriority);
        }
      }
    },
    [handlerConfigs, priorityCountsStore, executionStateStore]
  );

  // 각 핸들러 설정에 대해 정적으로 핸들러 등록 (최대 9개 지원)
  const handler0 = useCallback(createConfigHandler(0), [createConfigHandler]);
  const handler1 = useCallback(createConfigHandler(1), [createConfigHandler]);
  const handler2 = useCallback(createConfigHandler(2), [createConfigHandler]);
  const handler3 = useCallback(createConfigHandler(3), [createConfigHandler]);
  const handler4 = useCallback(createConfigHandler(4), [createConfigHandler]);
  const handler5 = useCallback(createConfigHandler(5), [createConfigHandler]);
  const handler6 = useCallback(createConfigHandler(6), [createConfigHandler]);
  const handler7 = useCallback(createConfigHandler(7), [createConfigHandler]);
  const handler8 = useCallback(createConfigHandler(8), [createConfigHandler]);

  const handlers = [
    handler0,
    handler1,
    handler2,
    handler3,
    handler4,
    handler5,
    handler6,
    handler7,
    handler8,
  ];

  // 각 핸들러 등록 (항상 9개 등록, 설정이 없으면 기본값 사용)
  usePriorityTestActionHandler('priorityTest', handlers[0]!, {
    priority: handlerConfigs[0]?.priority ?? 999,
    id: handlerConfigs[0]?.id ?? 'disabled-0',
    blocking: true,
  });
  usePriorityTestActionHandler('priorityTest', handlers[1]!, {
    priority: handlerConfigs[1]?.priority ?? 998,
    id: handlerConfigs[1]?.id ?? 'disabled-1',
    blocking: true,
  });
  usePriorityTestActionHandler('priorityTest', handlers[2]!, {
    priority: handlerConfigs[2]?.priority ?? 997,
    id: handlerConfigs[2]?.id ?? 'disabled-2',
    blocking: true,
  });
  usePriorityTestActionHandler('priorityTest', handlers[3]!, {
    priority: handlerConfigs[3]?.priority ?? 996,
    id: handlerConfigs[3]?.id ?? 'disabled-3',
    blocking: true,
  });
  usePriorityTestActionHandler('priorityTest', handlers[4]!, {
    priority: handlerConfigs[4]?.priority ?? 995,
    id: handlerConfigs[4]?.id ?? 'disabled-4',
    blocking: true,
  });
  usePriorityTestActionHandler('priorityTest', handlers[5]!, {
    priority: handlerConfigs[5]?.priority ?? 994,
    id: handlerConfigs[5]?.id ?? 'disabled-5',
    blocking: true,
  });
  usePriorityTestActionHandler('priorityTest', handlers[6]!, {
    priority: handlerConfigs[6]?.priority ?? 993,
    id: handlerConfigs[6]?.id ?? 'disabled-6',
    blocking: true,
  });
  usePriorityTestActionHandler('priorityTest', handlers[7]!, {
    priority: handlerConfigs[7]?.priority ?? 992,
    id: handlerConfigs[7]?.id ?? 'disabled-7',
    blocking: true,
  });
  usePriorityTestActionHandler('priorityTest', handlers[8]!, {
    priority: handlerConfigs[8]?.priority ?? 991,
    id: handlerConfigs[8]?.id ?? 'disabled-8',
    blocking: true,
  });

  // 완료 핸들러 등록 (우선순위 0 - 가장 마지막 실행)
  usePriorityTestActionHandler(
    'priorityTest',
    useCallback(
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
      [executionStateStore]
    ),
    { priority: 0, id: 'finalizer', blocking: true }
  );

  return <>{children}</>;
}
