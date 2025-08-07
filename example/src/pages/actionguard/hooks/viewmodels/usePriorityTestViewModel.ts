import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { UnregisterFunction } from '@context-action/core';
import { PriorityTestViewModel, ViewModelDependencies } from './PriorityTestState';

/**
 * ViewModel Layer: 상태 관리와 UI 바인딩
 * Model과 View 사이의 중재자 역할
 */
export function usePriorityTestViewModel(dependencies: ViewModelDependencies): PriorityTestViewModel {
  const {
    configs,
    priorityCountsStore,
    performanceOptions,
    actionRegister,
    dispatch,
    countManagement,
    executionState
  } = dependencies;

  const {
    enableToast = true,
    enableConsoleLog = true,
    performanceMode = false
  } = performanceOptions;

  // 간소화된 상태 관리
  const unregisterFunctionsRef = useRef<Map<string, UnregisterFunction>>(new Map());
  const [registeredHandlers, setRegisteredHandlers] = useState<Set<string>>(new Set());

  // configs 해시값 계산 (최적화)
  const configsHash = useMemo(() => {
    return JSON.stringify(configs.map(c => ({
      priority: c.priority,
      id: c.id,
      label: c.label,
      delay: c.delay,
      jumpToPriority: c.jumpToPriority
    })));
  }, [configs]);

  // 핸들러 등록 함수 (UI용 - 간소화된 버전)
  const registerHandlers = useCallback(() => {
    if (!actionRegister) {
      console.warn('ActionRegister가 준비되지 않았습니다.');
      return;
    }

    try {
      // 기존 핸들러 해제
      unregisterFunctionsRef.current.forEach((unregister) => {
        unregister();
      });
      unregisterFunctionsRef.current.clear();

      // 새로운 핸들러 등록
      const registeredIds: string[] = [];
      const registeredPriorities = new Set<number>();

      configs.forEach((config) => {
        if (registeredPriorities.has(config.priority)) {
          return;
        }
        registeredPriorities.add(config.priority);

        const uniqueHandlerId = `priority-${config.priority}`;
        
        // 핸들러 함수 생성 (인라인)
        const handlerFunction = async ({ testId, delay }: { testId: string; delay: number }, controller: any) => {
          // 우선순위 카운트 증가
          countManagement.incrementPriorityCount(config.priority, config.id);
          
          const timestamp = Date.now() - executionState.startTimeRef.current;
          const currentCount = countManagement.priorityExecutionCountRef.current[config.priority] || 0;
          
          if (enableConsoleLog) {
            executionState.addTestResult(`[${timestamp}ms] 🟡 ${config.label} 시작 (지연: ${config.delay}ms, 파라미터: ${delay}ms, 핸들러ID: ${uniqueHandlerId}, 현재카운트: ${currentCount})`);
          }

          try {
            // 중단 상태 확인
            if (executionState.abortedRef.current) {
              const abortTimestamp = Date.now() - executionState.startTimeRef.current;
              if (enableConsoleLog) {
                executionState.addTestResult(`[${abortTimestamp}ms] ⛔ ${config.label} 중단됨`);
              }
              controller.abort('테스트가 사용자에 의해 중단되었습니다');
              return;
            }

            // 지연 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, config.delay));
            
            // 지연 후 다시 중단 상태 확인
            if (executionState.abortedRef.current) {
              const abortTimestamp = Date.now() - executionState.startTimeRef.current;
              if (enableConsoleLog) {
                executionState.addTestResult(`[${abortTimestamp}ms] ⛔ ${config.label} 완료 전 중단됨`);
              }
              controller.abort('테스트가 사용자에 의해 중단되었습니다');
              return;
            }
            
            const completionTimestamp = Date.now() - executionState.startTimeRef.current;
            const actualDelay = completionTimestamp - timestamp;
            
            if (enableConsoleLog) {
              executionState.addTestResult(`[${completionTimestamp}ms] 🟢 ${config.label} 완료 (실제 소요: ${actualDelay}ms)`);
            }
            
            // Jump 처리
            if (config.jumpToPriority !== null && config.jumpToPriority !== undefined) {
              const finalCount = countManagement.priorityExecutionCountRef.current[config.priority] || 0;
              const jumpTimestamp = Date.now() - executionState.startTimeRef.current;
              
              if (finalCount <= 3) {
                if (enableConsoleLog) {
                  executionState.addTestResult(`[${jumpTimestamp}ms] 🦘 ${config.label} → P${config.jumpToPriority} 점프 (카운트: ${finalCount})`);
                }
                controller.jumpToPriority(config.jumpToPriority);
              } else {
                if (enableConsoleLog) {
                  executionState.addTestResult(`[${jumpTimestamp}ms] 🚫 ${config.label} 점프 건너뜀 (카운트: ${finalCount} > 3)`);
                }
                controller.next();
              }
            } else {
              controller.next();
            }
            
          } catch (error) {
            const errorTimestamp = Date.now() - executionState.startTimeRef.current;
            if (enableConsoleLog) {
              executionState.addTestResult(`[${errorTimestamp}ms] ❌ ${config.label} 실패: ${error}`);
            }
            controller.abort(`Handler ${config.id} failed: ${error}`);
          }
        };

        // 핸들러 등록
        const unregister = actionRegister.register('priorityTest', handlerFunction, {
          id: uniqueHandlerId,
          priority: config.priority,
          blocking: true
        });

        // unregister 함수 저장
        unregisterFunctionsRef.current.set(uniqueHandlerId, unregister);
        registeredIds.push(uniqueHandlerId);
      });

      setRegisteredHandlers(new Set(registeredIds));

      if (enableConsoleLog) {
        console.log(`✅ ${registeredIds.length}개 핸들러 등록 완료`);
      }
    } catch (error) {
      console.error('핸들러 등록 실패:', error);
    }
  }, [configs, enableConsoleLog, actionRegister]); // 안정된 의존성만 사용

  // 특정 핸들러 해제
  const unregisterHandler = useCallback((handlerId: string) => {
    const unregister = unregisterFunctionsRef.current.get(handlerId);
    if (unregister) {
      unregister();
      unregisterFunctionsRef.current.delete(handlerId);
      
      setRegisteredHandlers(prev => {
        const newSet = new Set(prev);
        newSet.delete(handlerId);
        return newSet;
      });

      if (enableConsoleLog) {
        console.log(`🗑️ 핸들러 해제: ${handlerId}`);
      }
    }
  }, [enableConsoleLog]);

  // 모든 핸들러 해제
  const unregisterAllHandlers = useCallback(() => {
    const unregisteredIds = Array.from(unregisterFunctionsRef.current.keys());
    
    unregisterFunctionsRef.current.forEach((unregister) => {
      unregister();
    });
    unregisterFunctionsRef.current.clear();
    setRegisteredHandlers(new Set());

    if (enableConsoleLog) {
      console.log(`🧹 ${unregisteredIds.length}개 핸들러 해제 완료`);
    }
  }, [enableConsoleLog]);

  // 테스트 초기화 (의존성 제거 - useEffect 내에서 직접 호출)
  const initializeTest = useCallback(() => {
    executionState.initializeExecutionStates();
    countManagement.resetPriorityCounts();
  }, []); // 의존성 제거 - 클로저를 통해 최신 값 사용

  // 테스트 실행
  const executeTest = useCallback(async (delay: number = 100) => {
    if (executionState.isRunning) {
      if (enableConsoleLog) {
        console.log('⚠️ [WARNING] Test already running, ignoring new execution request');
      }
      return;
    }

    initializeTest();
    const testId = executionState.startNewTest();

    try {
      // 로그 출력
      if (enableConsoleLog) {
        executionState.addTestResult(`[0ms] 🚀 우선순위 테스트 시작 (총 ${configs.length}개 핸들러)`);
      }

      // 액션 디스패치
      await dispatch('priorityTest', { testId, delay }, { executionMode: 'sequential' });

      // 완료 로그
      if (enableConsoleLog) {
        const dispatchCompleteTimestamp = Date.now() - executionState.startTimeRef.current;
        executionState.addTestResult(`[${dispatchCompleteTimestamp}ms] 🏁 디스패치 완료`);
        executionState.addTestResult(`[${dispatchCompleteTimestamp}ms] ✅ 모든 핸들러 실행 완료`);
      }

    } catch (error) {
      const errorTimestamp = Date.now() - executionState.startTimeRef.current;
      executionState.addTestResult(`[${errorTimestamp}ms] ❌ 테스트 실행 실패: ${error}`);
    } finally {
      executionState.completeTest();
    }
  }, [enableConsoleLog, configs.length, dispatch, initializeTest]); // 객체 의존성 제거

  // 테스트 중단
  const abortTest = useCallback(() => {
    executionState.abortExecution();
    countManagement.resetPriorityCounts();
  }, []); // 의존성 제거 - 클로저를 통해 최신 값 사용

  // 상태 조회 함수들
  const getRegisteredCount = useCallback(() => {
    return unregisterFunctionsRef.current.size;
  }, []);

  const isHandlerRegistered = useCallback((handlerId: string) => {
    return unregisterFunctionsRef.current.has(handlerId);
  }, []);

  // 안전한 cleanup을 위한 ref (기존 패턴 적용)
  const cleanupRef = useRef<() => void>();

  // configs 변경 시 핸들러 재등록 (완전 인라인 처리)
  useEffect(() => {
    if (!actionRegister) return;
    
    // 기존 핸들러 정리 (setState 없이)
    if (cleanupRef.current) {
      unregisterFunctionsRef.current.forEach((unregister) => {
        unregister();
      });
      unregisterFunctionsRef.current.clear();
    }
    
    // 테스트 상태 초기화 (인라인)
    executionState.initializeExecutionStates();
    countManagement.resetPriorityCounts();
    
    // 새로운 핸들러 등록 (완전 인라인)
    const registeredIds: string[] = [];
    const registeredPriorities = new Set<number>();

    configs.forEach((config) => {
      if (registeredPriorities.has(config.priority)) {
        return;
      }
      registeredPriorities.add(config.priority);

      const uniqueHandlerId = `priority-${config.priority}`;
      
      // 핸들러 함수 생성 (완전 인라인)
      const handlerFunction = async ({ testId, delay }: { testId: string; delay: number }, controller: any) => {
        // 우선순위 카운트 증가
        countManagement.incrementPriorityCount(config.priority, config.id);
        
        const timestamp = Date.now() - executionState.startTimeRef.current;
        const currentCount = countManagement.priorityExecutionCountRef.current[config.priority] || 0;
        
        if (enableConsoleLog) {
          executionState.addTestResult(`[${timestamp}ms] 🟡 ${config.label} 시작 (지연: ${config.delay}ms, 파라미터: ${delay}ms, 핸들러ID: ${uniqueHandlerId}, 현재카운트: ${currentCount})`);
        }

        try {
          // 중단 상태 확인
          if (executionState.abortedRef.current) {
            const abortTimestamp = Date.now() - executionState.startTimeRef.current;
            if (enableConsoleLog) {
              executionState.addTestResult(`[${abortTimestamp}ms] ⛔ ${config.label} 중단됨`);
            }
            controller.abort('테스트가 사용자에 의해 중단되었습니다');
            return;
          }

          // 지연 시뮬레이션
          await new Promise(resolve => setTimeout(resolve, config.delay));
          
          // 지연 후 다시 중단 상태 확인
          if (executionState.abortedRef.current) {
            const abortTimestamp = Date.now() - executionState.startTimeRef.current;
            if (enableConsoleLog) {
              executionState.addTestResult(`[${abortTimestamp}ms] ⛔ ${config.label} 완료 전 중단됨`);
            }
            controller.abort('테스트가 사용자에 의해 중단되었습니다');
            return;
          }
          
          const completionTimestamp = Date.now() - executionState.startTimeRef.current;
          const actualDelay = completionTimestamp - timestamp;
          
          if (enableConsoleLog) {
            executionState.addTestResult(`[${completionTimestamp}ms] 🟢 ${config.label} 완료 (실제 소요: ${actualDelay}ms)`);
          }
          
          // Jump 처리
          if (config.jumpToPriority !== null && config.jumpToPriority !== undefined) {
            const finalCount = countManagement.priorityExecutionCountRef.current[config.priority] || 0;
            const jumpTimestamp = Date.now() - executionState.startTimeRef.current;
            
            if (finalCount <= 3) {
              if (enableConsoleLog) {
                executionState.addTestResult(`[${jumpTimestamp}ms] 🦘 ${config.label} → P${config.jumpToPriority} 점프 (카운트: ${finalCount})`);
              }
              controller.jumpToPriority(config.jumpToPriority);
            } else {
              if (enableConsoleLog) {
                executionState.addTestResult(`[${jumpTimestamp}ms] 🚫 ${config.label} 점프 건너뜀 (카운트: ${finalCount} > 3)`);
              }
              controller.next();
            }
          } else {
            controller.next();
          }
          
        } catch (error) {
          const errorTimestamp = Date.now() - executionState.startTimeRef.current;
          if (enableConsoleLog) {
            executionState.addTestResult(`[${errorTimestamp}ms] ❌ ${config.label} 실패: ${error}`);
          }
          controller.abort(`Handler ${config.id} failed: ${error}`);
        }
      };

      // 핸들러 등록
      const unregister = actionRegister.register('priorityTest', handlerFunction, {
        id: uniqueHandlerId,
        priority: config.priority,
        blocking: true
      });

      // unregister 함수 저장
      unregisterFunctionsRef.current.set(uniqueHandlerId, unregister);
      registeredIds.push(uniqueHandlerId);
    });

    setRegisteredHandlers(new Set(registeredIds));
    
    if (enableConsoleLog) {
      console.log(`✅ ${registeredIds.length}개 핸들러 등록 완료`);
    }
    
    // cleanup 함수 설정 (언마운트 시에만 상태 업데이트)
    cleanupRef.current = () => {
      unregisterFunctionsRef.current.forEach((unregister) => {
        unregister();
      });
      unregisterFunctionsRef.current.clear();
    };
    
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      setRegisteredHandlers(new Set()); // 상태 업데이트는 언마운트 시에만
    };
  }, [actionRegister, configsHash, enableConsoleLog]); // 안정된 의존성만 사용 (객체 의존성 제거)

  // ViewModel 인터페이스 반환
  return {
    // 상태
    registeredHandlers,
    isRunning: executionState.isRunning,
    aborted: executionState.abortedRef.current,
    testResults: executionState.testResults,
    completedCount: executionState.completedCount,
    priorityCounts: countManagement.priorityExecutionCountRef.current,

    // 액션
    registerHandlers,
    unregisterHandler,
    unregisterAllHandlers,
    executeTest,
    abortTest,
    initializeTest,
    getRegisteredCount,
    isHandlerRegistered,

    // 호환성을 위한 ActionRegister
    actionRegister
  };
}