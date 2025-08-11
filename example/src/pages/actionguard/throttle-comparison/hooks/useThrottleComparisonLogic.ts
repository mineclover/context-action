/**
 * @fileoverview Throttle Comparison Logic Hook - Hook Layer
 * 
 * Data/Action과 View 사이의 브리지 역할을 하는 Hook입니다.
 * 양방향 데이터 흐름을 관리합니다.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useStoreValue } from '@context-action/react';
import { useActionLoggerWithToast } from '../../../../components/LogMonitor';
import {
  useThrottleComparisonActionDispatch,
  useThrottleComparisonActionRegister,
  useThrottleComparisonStore,
  type ThrottleMetrics,
} from '../context/ThrottleComparisonContext';

/**
 * 수동 스로틀 훅 (비교용)
 */
function useThrottle<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: T) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  );
}

/**
 * 평균 간격 계산 헬퍼 함수
 */
function calculateAverageInterval(executionTimes: number[]): number {
  if (executionTimes.length < 2) return 0;
  
  const intervals = [];
  for (let i = 1; i < executionTimes.length; i++) {
    intervals.push(executionTimes[i] - executionTimes[i - 1]);
  }
  
  return Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
}

/**
 * 스로틀 비교 로직 Hook
 * 
 * View Layer에 필요한 데이터와 액션을 제공합니다.
 */
export function useThrottleComparisonLogic() {
  const dispatch = useThrottleComparisonActionDispatch();
  const register = useThrottleComparisonActionRegister();
  const throttleStore = useThrottleComparisonStore('throttleState');
  const throttleState = useStoreValue(throttleStore);
  const { logAction, logSystem } = useActionLoggerWithToast();
  
  // 자동 테스트 타이머 ref
  const autoTestInterval = useRef<NodeJS.Timeout>();

  // 수동 스로틀 핸들러
  const manualThrottledHandler = useThrottle(
    (value: string, timestamp: number) => {
      const now = Date.now();
      const currentState = throttleStore.getValue();
      const newExecutionTimes = [...currentState.manualExecutionTimes, now];
      const averageInterval = calculateAverageInterval(newExecutionTimes);

      dispatch('updateManualMetrics', {
        metrics: {
          actualExecutions: currentState.manualMetrics.actualExecutions + 1,
          lastExecutionTime: now,
          averageInterval,
        },
        executionTime: now,
      });

      logAction('manualThrottle', { value, timestamp }, {
        context: 'Manual Throttle',
        toast: { type: 'info', message: `수동 스로틀: ${value}` },
      });
    },
    1000
  );

  // 액션 핸들러 등록
  useEffect(() => {
    if (!register) return;

    // 수동 스로틀 액션 핸들러
    const unregisterManual = register.register(
      'manualThrottle',
      ({ value, timestamp }, controller) => {
        manualThrottledHandler(value, timestamp);
        controller.next();
      }
    );

    // 내장 스로틀 액션 핸들러
    const unregisterInternal = register.register(
      'internalThrottle',
      ({ value, timestamp }, controller) => {
        const now = Date.now();
        const currentState = throttleStore.getValue();
        const newExecutionTimes = [...currentState.internalExecutionTimes, now];
        const averageInterval = calculateAverageInterval(newExecutionTimes);

        dispatch('updateInternalMetrics', {
          metrics: {
            actualExecutions: currentState.internalMetrics.actualExecutions + 1,
            lastExecutionTime: now,
            averageInterval,
          },
          executionTime: now,
        });

        logAction('internalThrottle', { value, timestamp }, {
          context: 'Internal Throttle',
          toast: { type: 'success', message: `내장 스로틀: ${value}` },
        });

        controller.next();
      },
      { throttle: 1000 } // 1초 내장 스로틀
    );

    // 입력값 변경 핸들러
    const unregisterInputUpdate = register.register(
      'updateInputValue',
      ({ value }, controller) => {
        throttleStore.update((state) => ({
          ...state,
          inputValue: value,
        }));
        controller.next();
      }
    );

    // 테스트 설정 업데이트 핸들러
    const unregisterSettingsUpdate = register.register(
      'updateTestSettings',
      ({ testDuration, testInterval }, controller) => {
        throttleStore.update((state) => ({
          ...state,
          ...(testDuration !== undefined && { testDuration }),
          ...(testInterval !== undefined && { testInterval }),
        }));
        controller.next();
      }
    );

    // 자동 테스트 토글 핸들러
    const unregisterAutoTestToggle = register.register(
      'toggleAutoTest',
      ({ isRunning }, controller) => {
        throttleStore.update((state) => ({
          ...state,
          isAutoTesting: isRunning,
        }));
        controller.next();
      }
    );

    // 수동 메트릭 업데이트 핸들러
    const unregisterManualMetricsUpdate = register.register(
      'updateManualMetrics',
      ({ metrics, executionTime }, controller) => {
        throttleStore.update((state) => ({
          ...state,
          manualMetrics: {
            ...state.manualMetrics,
            ...metrics,
          },
          ...(executionTime && {
            manualExecutionTimes: [...state.manualExecutionTimes, executionTime].slice(-50), // 최근 50개만 유지
          }),
        }));
        controller.next();
      }
    );

    // 내장 메트릭 업데이트 핸들러
    const unregisterInternalMetricsUpdate = register.register(
      'updateInternalMetrics',
      ({ metrics, executionTime }, controller) => {
        throttleStore.update((state) => ({
          ...state,
          internalMetrics: {
            ...state.internalMetrics,
            ...metrics,
          },
          ...(executionTime && {
            internalExecutionTimes: [...state.internalExecutionTimes, executionTime].slice(-50), // 최근 50개만 유지
          }),
        }));
        controller.next();
      }
    );

    // 메트릭 초기화 핸들러
    const unregisterReset = register.register(
      'resetMetrics',
      (_, controller) => {
        const initialMetrics: ThrottleMetrics = {
          totalCalls: 0,
          throttledCalls: 0,
          actualExecutions: 0,
          lastExecutionTime: 0,
          averageInterval: 0,
        };

        throttleStore.update((state) => ({
          ...state,
          manualMetrics: initialMetrics,
          internalMetrics: initialMetrics,
          manualExecutionTimes: [],
          internalExecutionTimes: [],
        }));

        logSystem('메트릭 초기화', { context: 'Throttle Comparison' });
        controller.next();
      }
    );

    return () => {
      unregisterManual();
      unregisterInternal();
      unregisterInputUpdate();
      unregisterSettingsUpdate();
      unregisterAutoTestToggle();
      unregisterManualMetricsUpdate();
      unregisterInternalMetricsUpdate();
      unregisterReset();
    };
  }, [
    register,
    throttleStore,
    dispatch,
    manualThrottledHandler,
    logAction,
    logSystem,
  ]);

  // 자동 테스트 로직
  const startAutoTest = useCallback(() => {
    if (throttleState.isAutoTesting || !register) return;

    dispatch('toggleAutoTest', { isRunning: true });
    logSystem(
      `자동 테스트 시작: ${throttleState.testDuration}ms 동안 ${throttleState.testInterval}ms 간격으로 호출`,
      { context: 'Throttle Comparison' }
    );

    let callCount = 0;
    const maxCalls = Math.floor(throttleState.testDuration / throttleState.testInterval);

    autoTestInterval.current = setInterval(() => {
      if (!register) {
        stopAutoTest();
        return;
      }

      callCount++;
      const timestamp = Date.now();

      try {
        // 호출 카운트 증가
        dispatch('updateManualMetrics', {
          metrics: {
            totalCalls: throttleState.manualMetrics.totalCalls + 1,
          },
        });
        dispatch('updateInternalMetrics', {
          metrics: {
            totalCalls: throttleState.internalMetrics.totalCalls + 1,
          },
        });

        // 두 방식 모두 호출
        register.dispatch('manualThrottle', {
          value: `auto-manual-${callCount}`,
          timestamp,
        });
        register.dispatch('internalThrottle', {
          value: `auto-internal-${callCount}`,
          timestamp,
        });
      } catch (error) {
        console.error('자동 테스트 중 오류 발생:', error);
        logSystem(
          `자동 테스트 오류: ${error instanceof Error ? error.message : String(error)}`,
          { context: 'Throttle Comparison' }
        );
        stopAutoTest();
        return;
      }

      if (callCount >= maxCalls) {
        stopAutoTest();
      }
    }, throttleState.testInterval);

    // 테스트 종료 타이머
    setTimeout(() => {
      if (throttleState.isAutoTesting) {
        stopAutoTest();
      }
    }, throttleState.testDuration + 100);
  }, [
    dispatch,
    register,
    throttleState.isAutoTesting,
    throttleState.testDuration,
    throttleState.testInterval,
    throttleState.manualMetrics.totalCalls,
    throttleState.internalMetrics.totalCalls,
    logSystem,
  ]);

  const stopAutoTest = useCallback(() => {
    dispatch('toggleAutoTest', { isRunning: false });
    if (autoTestInterval.current) {
      clearInterval(autoTestInterval.current);
    }

    logSystem('자동 테스트 완료', {
      context: 'Throttle Comparison',
      toast: { type: 'success', message: '자동 테스트 완료!' },
    });
  }, [dispatch, logSystem]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (autoTestInterval.current) {
        clearInterval(autoTestInterval.current);
      }
    };
  }, []);

  // View에 제공할 인터페이스
  return {
    // Data
    throttleState,
    
    // Actions
    updateInputValue: (value: string) => {
      dispatch('updateInputValue', { value });
    },
    
    updateTestDuration: (duration: number) => {
      dispatch('updateTestSettings', { testDuration: duration });
    },
    
    updateTestInterval: (interval: number) => {
      dispatch('updateTestSettings', { testInterval: interval });
    },
    
    handleManualCall: () => {
      const timestamp = Date.now();
      const value = throttleState.inputValue || `manual-${timestamp}`;

      dispatch('updateManualMetrics', {
        metrics: {
          totalCalls: throttleState.manualMetrics.totalCalls + 1,
        },
      });

      dispatch('manualThrottle', { value, timestamp });
    },
    
    handleInternalCall: () => {
      const timestamp = Date.now();
      const value = throttleState.inputValue || `internal-${timestamp}`;

      dispatch('updateInternalMetrics', {
        metrics: {
          totalCalls: throttleState.internalMetrics.totalCalls + 1,
        },
      });

      dispatch('internalThrottle', { value, timestamp });
    },
    
    startAutoTest,
    stopAutoTest,
    
    resetMetrics: () => {
      dispatch('resetMetrics');
    },
    
    // Computed values
    canOperate: !!register && !!dispatch,
    manualExecutionRate: throttleState.manualMetrics.totalCalls > 0 
      ? ((throttleState.manualMetrics.actualExecutions / throttleState.manualMetrics.totalCalls) * 100).toFixed(1)
      : '0',
    internalExecutionRate: throttleState.internalMetrics.totalCalls > 0
      ? ((throttleState.internalMetrics.actualExecutions / throttleState.internalMetrics.totalCalls) * 100).toFixed(1)
      : '0',
  };
}