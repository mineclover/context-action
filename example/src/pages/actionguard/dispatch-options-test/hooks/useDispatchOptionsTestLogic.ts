/**
 * @fileoverview Dispatch Options Test Logic Hook - Hook Layer
 *
 * Data/Action과 View 사이의 브리지 역할을 하는 Hook입니다.
 * 양방향 데이터 흐름을 관리합니다.
 */

import { useStoreValue } from '@context-action/react';
import { useCallback, useEffect, useRef } from 'react';
import { useActionLoggerWithToast } from '../../../../components/LogMonitor';
import {
  type FormData,
  type PerformanceMetrics,
  type TestResult,
  useDispatchOptionsTestActionDispatch,
  useDispatchOptionsTestActionRegister,
  useDispatchOptionsTestStore,
} from '../context/DispatchOptionsTestContext';

/**
 * 디스패치 옵션 테스트 로직 Hook
 *
 * View Layer에 필요한 데이터와 액션을 제공합니다.
 */
export function useDispatchOptionsTestLogic() {
  const dispatch = useDispatchOptionsTestActionDispatch();
  const register = useDispatchOptionsTestActionRegister();
  const testStore = useDispatchOptionsTestStore('testState');
  const testState = useStoreValue(testStore);
  const { logAction } = useActionLoggerWithToast();

  // 자동 스크롤 타이머 ref
  const autoScrollInterval = useRef<NodeJS.Timeout>();

  // 성능 메트릭 업데이트 함수
  const updateMetrics = useCallback(
    (executionTime: number, type: 'throttled' | 'debounced' | 'normal') => {
      const currentState = testStore.getValue();
      const newExecutionTimes = [...currentState.executionTimes, executionTime];
      if (newExecutionTimes.length > 100) {
        newExecutionTimes.shift(); // 최근 100개만 유지
      }

      const avgTime =
        newExecutionTimes.reduce((a, b) => a + b, 0) / newExecutionTimes.length;

      const metricsUpdate: Partial<PerformanceMetrics> = {
        totalDispatches: currentState.metrics.totalDispatches + 1,
        averageExecutionTime: Math.round(avgTime * 100) / 100,
        lastExecutionTime: executionTime,
      };

      if (type === 'throttled') {
        metricsUpdate.throttledCount = currentState.metrics.throttledCount + 1;
      } else if (type === 'debounced') {
        metricsUpdate.debouncedCount = currentState.metrics.debouncedCount + 1;
      }

      dispatch('updateMetrics', {
        metrics: metricsUpdate,
        executionTime,
        type,
      });
    },
    [dispatch, testStore]
  );

  // 테스트 결과 추가 함수
  const addTestResult = useCallback(
    (
      testName: string,
      status: 'success' | 'failed',
      message: string,
      executionTime?: number
    ) => {
      const result: TestResult = {
        id: Date.now().toString(),
        testName,
        status,
        message,
        timestamp: new Date(),
        executionTime: executionTime || 0,
      };

      dispatch('addTestResult', result);
    },
    [dispatch]
  );

  // 액션 핸들러 등록
  useEffect(() => {
    if (!register) return;

    // 검색 액션 (debounce 테스트용)
    const unregisterSearch = register.register(
      'searchUser',
      ({ query }, controller) => {
        const actionStartTime = performance.now();

        logAction(
          'searchUser',
          { query },
          {
            context: 'ActionGuard Test',
            toast: { type: 'info', message: `검색: "${query}"` },
          }
        );

        const execTime = performance.now() - actionStartTime;
        updateMetrics(execTime, 'debounced');
        addTestResult(
          'Debounce Search',
          'success',
          `검색어: "${query}"`,
          execTime
        );

        
      },
      { debounce: 300 }
    );

    // 저장 액션 (throttle 테스트용)
    const unregisterSave = register.register(
      'saveData',
      ({ data }, controller) => {
        const actionStartTime = performance.now();

        logAction(
          'saveData',
          { data },
          {
            context: 'ActionGuard Test',
            toast: { type: 'success', message: '데이터 저장됨' },
          }
        );

        const execTime = performance.now() - actionStartTime;
        updateMetrics(execTime, 'throttled');
        addTestResult(
          'Throttled Save',
          'success',
          `데이터: "${data}"`,
          execTime
        );

        
      },
      { throttle: 1000 }
    );

    // 스크롤 액션 (throttle 테스트용)
    const unregisterScroll = register.register(
      'scrollEvent',
      ({ position }, controller) => {
        const actionStartTime = performance.now();

        logAction(
          'scrollEvent',
          { position },
          {
            context: 'ActionGuard Test',
          }
        );

        const execTime = performance.now() - actionStartTime;
        updateMetrics(execTime, 'throttled');

        
      },
      { throttle: 100 }
    );

    // 버튼 클릭 액션
    const unregisterButton = register.register(
      'buttonClick',
      ({ buttonId }, controller) => {
        const actionStartTime = performance.now();

        logAction(
          'buttonClick',
          { buttonId },
          {
            context: 'ActionGuard Test',
            toast: { type: 'info', message: `버튼 클릭: ${buttonId}` },
          }
        );

        const execTime = performance.now() - actionStartTime;
        updateMetrics(execTime, 'normal');
        addTestResult(
          'Button Click',
          'success',
          `버튼 ID: ${buttonId}`,
          execTime
        );

        
      }
    );

    // 폼 검증 액션
    const unregisterValidation = register.register(
      'validateForm',
      ({ formData }, controller) => {
        const actionStartTime = performance.now();

        const isValid = formData.name && formData.email && formData.age;
        const status = isValid ? 'success' : 'failed';
        const message = isValid ? '폼 검증 성공' : '필수 필드가 누락됨';

        logAction(
          'validateForm',
          { formData },
          {
            context: 'ActionGuard Test',
            toast: {
              type: status === 'success' ? 'success' : 'error',
              message,
            },
          }
        );

        const execTime = performance.now() - actionStartTime;
        updateMetrics(execTime, 'normal');
        addTestResult('Form Validation', status, message, execTime);

        
      },
      { debounce: 500 }
    );

    // 비동기 작업 액션
    const unregisterAsync = register.register(
      'asyncOperation',
      async ({ operationType, delay }, controller) => {
        const actionStartTime = performance.now();

        logAction(
          'asyncOperation',
          { operationType, delay },
          {
            context: 'ActionGuard Test',
            toast: {
              type: 'info',
              message: `비동기 작업 시작: ${operationType}`,
            },
          }
        );

        try {
          await new Promise((resolve) => setTimeout(resolve, delay));

          const execTime = performance.now() - actionStartTime;
          updateMetrics(execTime, 'normal');
          addTestResult(
            'Async Operation',
            'success',
            `작업 유형: ${operationType} (${delay}ms)`,
            execTime
          );

          logAction(
            'asyncOperation',
            { result: 'completed' },
            {
              context: 'ActionGuard Test',
              toast: { type: 'success', message: '비동기 작업 완료' },
            }
          );
        } catch (error) {
          const execTime = performance.now() - actionStartTime;
          addTestResult(
            'Async Operation',
            'failed',
            `에러: ${error}`,
            execTime
          );
        }

        
      }
    );

    // 에러 테스트 액션
    const unregisterError = register.register(
      'errorTest',
      ({ shouldFail }, controller) => {
        const actionStartTime = performance.now();

        if (shouldFail) {
          logAction(
            'errorTest',
            { shouldFail },
            {
              context: 'ActionGuard Test',
              toast: { type: 'error', message: '의도적 에러 발생' },
            }
          );

          const execTime = performance.now() - actionStartTime;
          addTestResult(
            'Error Test',
            'failed',
            '의도적으로 실패시킨 테스트',
            execTime
          );
          controller.abort('테스트 에러');
        } else {
          logAction(
            'errorTest',
            { shouldFail },
            {
              context: 'ActionGuard Test',
              toast: { type: 'success', message: '에러 없이 성공' },
            }
          );

          const execTime = performance.now() - actionStartTime;
          updateMetrics(execTime, 'normal');
          addTestResult('Error Test', 'success', '에러 없이 성공', execTime);
          
        }
      }
    );

    // 조건부 액션
    const unregisterConditional = register.register(
      'conditionalAction',
      ({ condition, data }, controller) => {
        const actionStartTime = performance.now();

        if (condition) {
          logAction(
            'conditionalAction',
            { condition, data },
            {
              context: 'ActionGuard Test',
              toast: { type: 'success', message: '조건 충족, 액션 실행' },
            }
          );

          const execTime = performance.now() - actionStartTime;
          updateMetrics(execTime, 'normal');
          addTestResult(
            'Conditional Action',
            'success',
            `조건 충족: ${data}`,
            execTime
          );
          
        } else {
          logAction(
            'conditionalAction',
            { condition, data },
            {
              context: 'ActionGuard Test',
              toast: { type: 'info', message: '조건 불충족, 액션 스킵' },
            }
          );

          const execTime = performance.now() - actionStartTime;
          addTestResult(
            'Conditional Action',
            'failed',
            '조건 불충족',
            execTime
          );
          controller.abort('조건 불충족');
        }
      }
    );

    // 우선순위 테스트 액션
    const unregisterPriority = register.register(
      'priorityTest',
      ({ priority, message }, controller) => {
        const actionStartTime = performance.now();

        logAction(
          'priorityTest',
          { priority, message },
          {
            context: 'ActionGuard Test',
            toast: {
              type: 'info',
              message: `우선순위 ${priority}: ${message}`,
            },
          }
        );

        const execTime = performance.now() - actionStartTime;
        updateMetrics(execTime, 'normal');
        addTestResult(
          'Priority Test',
          'success',
          `우선순위 ${priority}: ${message}`,
          execTime
        );

        
      },
      { priority: 50 }
    );

    // 상태 업데이트 핸들러들
    const unregisterUpdateSearch = register.register(
      'updateSearchQuery',
      ({ query }, controller) => {
        testStore.update((state) => ({ ...state, searchQuery: query }));
        
      }
    );

    const unregisterUpdateSaveData = register.register(
      'updateSaveData',
      ({ data }, controller) => {
        testStore.update((state) => ({ ...state, saveData: data }));
        
      }
    );

    const unregisterUpdateScroll = register.register(
      'updateScrollPosition',
      ({ position }, controller) => {
        testStore.update((state) => ({ ...state, scrollPosition: position }));
        
      }
    );

    const unregisterUpdateForm = register.register(
      'updateFormData',
      ({ formData }, controller) => {
        testStore.update((state) => ({
          ...state,
          formData: { ...state.formData, ...formData },
        }));
        
      }
    );

    const unregisterUpdateMetrics = register.register(
      'updateMetrics',
      ({ metrics, executionTime }, controller) => {
        testStore.update((state) => {
          const newExecutionTimes = executionTime
            ? [...state.executionTimes, executionTime].slice(-100)
            : state.executionTimes;

          return {
            ...state,
            metrics: { ...state.metrics, ...metrics },
            executionTimes: newExecutionTimes,
          };
        });
        
      }
    );

    const unregisterToggleAutoScroll = register.register(
      'toggleAutoScrolling',
      ({ isRunning }, controller) => {
        testStore.update((state) => ({ ...state, isAutoScrolling: isRunning }));
        
      }
    );

    const unregisterTogglePause = register.register(
      'togglePause',
      ({ isPaused }, controller) => {
        testStore.update((state) => ({ ...state, isPaused }));
        
      }
    );

    const unregisterAddResult = register.register(
      'addTestResult',
      (result, controller) => {
        testStore.update((state) => ({
          ...state,
          testResults: [result, ...state.testResults.slice(0, 19)], // 최근 20개만 유지
        }));
        
      }
    );

    const unregisterReset = register.register(
      'resetMetrics',
      (_, controller) => {
        const initialMetrics: PerformanceMetrics = {
          totalDispatches: 0,
          throttledCount: 0,
          debouncedCount: 0,
          averageExecutionTime: 0,
          lastExecutionTime: 0,
        };

        testStore.update((state) => ({
          ...state,
          metrics: initialMetrics,
          testResults: [] as TestResult[],
          executionTimes: [] as number[],
        }));

        
      }
    );

    const unregisterToggleBulk = register.register(
      'toggleBulkTest',
      ({ isRunning }, controller) => {
        testStore.update((state) => ({ ...state, bulkTestRunning: isRunning }));
        
      }
    );

    return () => {
      unregisterSearch();
      unregisterSave();
      unregisterScroll();
      unregisterButton();
      unregisterValidation();
      unregisterAsync();
      unregisterError();
      unregisterConditional();
      unregisterPriority();
      unregisterUpdateSearch();
      unregisterUpdateSaveData();
      unregisterUpdateScroll();
      unregisterUpdateForm();
      unregisterUpdateMetrics();
      unregisterToggleAutoScroll();
      unregisterTogglePause();
      unregisterAddResult();
      unregisterReset();
      unregisterToggleBulk();
    };
  }, [register, testStore, dispatch, logAction, updateMetrics, addTestResult]);

  // 자동 스크롤 로직
  const startAutoScrolling = useCallback(() => {
    if (testState.isAutoScrolling) return;

    dispatch('toggleAutoScrolling', { isRunning: true });

    let position = 0;
    autoScrollInterval.current = setInterval(() => {
      if (testStore.getValue().isPaused) return;

      position += 10;
      if (position > 1000) position = 0;

      dispatch('updateScrollPosition', { position });
      dispatch('scrollEvent', { position });
    }, 50);
  }, [dispatch, testState.isAutoScrolling, testStore]);

  const stopAutoScrolling = useCallback(() => {
    dispatch('toggleAutoScrolling', { isRunning: false });
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
  }, [dispatch]);

  // 벌크 테스트 실행
  const runBulkTest = useCallback(async () => {
    if (testState.bulkTestRunning || !register) return;

    dispatch('toggleBulkTest', { isRunning: true });

    const tests = [
      () => dispatch('searchUser', { query: 'bulk test search' }),
      () => dispatch('saveData', { data: 'bulk test data' }),
      () => dispatch('buttonClick', { buttonId: 'bulk-test-button' }),
      () => dispatch('validateForm', { formData: testState.formData }),
      () => dispatch('asyncOperation', { operationType: 'bulk', delay: 100 }),
      () => dispatch('errorTest', { shouldFail: false }),
      () =>
        dispatch('conditionalAction', { condition: true, data: 'bulk test' }),
      () =>
        dispatch('priorityTest', {
          priority: 100,
          message: 'bulk test priority',
        }),
    ];

    for (const test of tests) {
      if (!testStore.getValue().bulkTestRunning) break;

      test();
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    dispatch('toggleBulkTest', { isRunning: false });
  }, [
    dispatch,
    register,
    testState.bulkTestRunning,
    testState.formData,
    testStore,
  ]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, []);

  // View에 제공할 인터페이스
  return {
    // Data
    testState,

    // Actions - 기본 액션들
    searchUser: (query: string) => dispatch('searchUser', { query }),
    saveData: (data: string) => dispatch('saveData', { data }),
    scrollEvent: (position: number) => dispatch('scrollEvent', { position }),
    buttonClick: (buttonId: string) => dispatch('buttonClick', { buttonId }),
    validateForm: (formData: FormData) =>
      dispatch('validateForm', { formData }),
    asyncOperation: (operationType: string, delay: number) =>
      dispatch('asyncOperation', { operationType, delay }),
    errorTest: (shouldFail: boolean) => dispatch('errorTest', { shouldFail }),
    conditionalAction: (condition: boolean, data: string) =>
      dispatch('conditionalAction', { condition, data }),
    priorityTest: (priority: number, message: string) =>
      dispatch('priorityTest', { priority, message }),

    // State update actions
    updateSearchQuery: (query: string) =>
      dispatch('updateSearchQuery', { query }),
    updateSaveData: (data: string) => dispatch('updateSaveData', { data }),
    updateScrollPosition: (position: number) =>
      dispatch('updateScrollPosition', { position }),
    updateFormData: (formData: Partial<FormData>) =>
      dispatch('updateFormData', { formData }),

    // Control actions
    startAutoScrolling,
    stopAutoScrolling,
    togglePause: () =>
      dispatch('togglePause', { isPaused: !testState.isPaused }),
    resetMetrics: () => dispatch('resetMetrics'),
    runBulkTest,
    stopBulkTest: () => dispatch('toggleBulkTest', { isRunning: false }),

    // Computed values
    canOperate: !!register && !!dispatch,
    recentResults: testState.testResults.slice(0, 5),
    successRate:
      testState.testResults.length > 0
        ? (
            (testState.testResults.filter((r) => r.status === 'success')
              .length /
              testState.testResults.length) *
            100
          ).toFixed(1)
        : '0',
  };
}
