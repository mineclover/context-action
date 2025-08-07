import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { HandlerConfig } from './usePriorityActionHandlers';
import { usePriorityCountManagement } from './usePriorityCountManagement';
import { usePriorityExecutionState } from './usePriorityExecutionState';
import { Store } from '@context-action/react';
import { usePriorityActionRegister, usePriorityActionDispatch } from '../context/ActionTestContext';
import { UnregisterFunction } from '@context-action/core';

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
  
  // Context에서 ActionRegister와 dispatch 가져오기
  const actionRegister = usePriorityActionRegister();
  const dispatch = usePriorityActionDispatch();

  // unregister 함수들을 저장할 ref
  const unregisterFunctionsRef = useRef<Map<string, UnregisterFunction>>(new Map());
  
  // 등록된 핸들러 상태 관리
  const [registeredHandlers, setRegisteredHandlers] = useState<Set<string>>(new Set());

  // 우선순위 카운팅 관리
  const countManagement = usePriorityCountManagement(priorityCountsStore);

  // 실행 상태 관리
  const executionState = usePriorityExecutionState(configs);



  // 수동 핸들러 등록 함수 (UI에서 사용)
  const registerHandlers = useCallback(() => {
    if (!actionRegister) {
      console.warn('ActionRegister가 아직 준비되지 않았습니다.');
      return;
    }

    // 기존 핸들러 해제
    unregisterFunctionsRef.current.forEach((unregister) => {
      unregister();
    });
    unregisterFunctionsRef.current.clear();

    const registeredPriorities = new Set<number>();
    
    configs.forEach((config) => {
      // 같은 우선순위가 이미 등록되었으면 건너뛰기
      if (registeredPriorities.has(config.priority)) {
        return;
      }
      registeredPriorities.add(config.priority);
      
      const uniqueHandlerId = `priority-${config.priority}`;
      
      // 핸들러 함수를 인라인으로 생성하여 의존성 문제 해결
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

          // 지연 시뮬레이션 (중간에 중단 확인)
          await new Promise(resolve => {
            const checkAbort = () => {
              if (executionState.abortedRef.current) {
                const abortTimestamp = Date.now() - executionState.startTimeRef.current;
                if (enableConsoleLog) {
                  executionState.addTestResult(`[${abortTimestamp}ms] ⛔ ${config.label} 지연 중 중단됨`);
                }
                resolve(undefined);
                return;
              }
              setTimeout(checkAbort, Math.min(config.delay, 50)); // 50ms마다 중단 확인
            };
            
            setTimeout(() => {
              if (!executionState.abortedRef.current) {
                resolve(undefined);
              }
            }, config.delay);
            
            checkAbort();
          });
          
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
          
          // Jump 처리 - 카운트가 3 이하일 때만 점프
          if (config.jumpToPriority !== null && config.jumpToPriority !== undefined) {
            const currentCount = countManagement.priorityExecutionCountRef.current[config.priority] || 0;
            const jumpTimestamp = Date.now() - executionState.startTimeRef.current;
            
            if (currentCount <= 3) {
              if (enableConsoleLog) {
                executionState.addTestResult(`[${jumpTimestamp}ms] 🦘 ${config.label} → P${config.jumpToPriority} 점프 (카운트: ${currentCount})`);
              }
              controller.jumpToPriority(config.jumpToPriority);
            } else {
              if (enableConsoleLog) {
                executionState.addTestResult(`[${jumpTimestamp}ms] 🚫 ${config.label} 점프 건너뜀 (카운트: ${currentCount} > 3)`);
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
      
      const unregister = actionRegister.register('priorityTest', handlerFunction, { 
        id: uniqueHandlerId,
        priority: config.priority,
        blocking: true  // 순차 실행에서 개별 지연을 위해 필수
      });
      
      // unregister 함수 저장
      unregisterFunctionsRef.current.set(uniqueHandlerId, unregister);
    });
    
    // 등록된 핸들러 상태 업데이트
    setRegisteredHandlers(new Set(unregisterFunctionsRef.current.keys()));
    
    if (enableConsoleLog) {
      console.log(`✅ ${unregisterFunctionsRef.current.size}개 핸들러 등록 완료`);
    }
  }, [actionRegister, configs, enableConsoleLog, countManagement, executionState]);

  // 특정 핸들러 해제 함수
  const unregisterHandler = useCallback((handlerId: string) => {
    const unregister = unregisterFunctionsRef.current.get(handlerId);
    if (unregister) {
      unregister();
      unregisterFunctionsRef.current.delete(handlerId);
      
      // 등록된 핸들러 상태 업데이트
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

  // 모든 핸들러 해제 함수
  const unregisterAllHandlers = useCallback(() => {
    unregisterFunctionsRef.current.forEach((unregister, handlerId) => {
      unregister();
      if (enableConsoleLog) {
        console.log(`🗑️ 핸들러 해제: ${handlerId}`);
      }
    });
    
    unregisterFunctionsRef.current.clear();
    setRegisteredHandlers(new Set());
    
    if (enableConsoleLog) {
      console.log('🧹 모든 핸들러 해제 완료');
    }
  }, [enableConsoleLog]);

  // 통합 초기화 함수
  const initializeTest = () => {
    executionState.initializeExecutionStates();
    countManagement.resetPriorityCounts();
  };

  // 최적화된 테스트 실행 함수 (메모이제이션)
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
      // 로그 출력 조건부 처리
      if (enableConsoleLog) {
        executionState.addTestResult(`[0ms] 🚀 우선순위 테스트 시작 (총 ${configs.length}개 핸들러)`);
      }
      
      // 액션 디스패치 (순차 실행 모드) - Context hook의 dispatch 사용
      await dispatch('priorityTest', { testId, delay }, { executionMode: 'sequential' });
      
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
  }, [executionState, enableConsoleLog, configs.length, dispatch]);

  // 최적화된 테스트 중단 함수 (메모이제이션)
  const abortTest = useCallback(() => {
    executionState.abortExecution();
    countManagement.resetPriorityCounts();
  }, [executionState, countManagement]);

  // 메모이제이션을 위한 configs 해시값 계산
  const configsHash = useMemo(() => {
    return JSON.stringify(configs.map(c => ({ 
      priority: c.priority, 
      id: c.id,
      label: c.label,
      delay: c.delay,
      jumpToPriority: c.jumpToPriority 
    })));
  }, [configs]);

  // 안전한 cleanup을 위한 ref
  const cleanupRef = useRef<() => void>();

  // 최적화된 핸들러 관리 useEffect (의존성 순환 문제 해결)
  useEffect(() => {
    if (!actionRegister) return;
    
    // 기존 핸들러 정리 (setState 없이)
    if (cleanupRef.current) {
      unregisterFunctionsRef.current.forEach((unregister) => {
        unregister();
      });
      unregisterFunctionsRef.current.clear();
    }
    
    initializeTest();
    
    // 새로운 핸들러 등록 (직접 호출하여 의존성 순환 방지)
    if (!actionRegister) {
      console.warn('ActionRegister가 아직 준비되지 않았습니다.');
      return;
    }

    const registeredPriorities = new Set<number>();
    
    configs.forEach((config) => {
      // 같은 우선순위가 이미 등록되었으면 건너뛰기
      if (registeredPriorities.has(config.priority)) {
        return;
      }
      registeredPriorities.add(config.priority);
      
      const uniqueHandlerId = `priority-${config.priority}`;
      
      // 이미 등록된 핸들러면 건너뛰기
      if (unregisterFunctionsRef.current.has(uniqueHandlerId)) {
        return;
      }
      
      // 핸들러 함수를 인라인으로 생성
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

          // 지연 시뮬레이션 (중간에 중단 확인)
          await new Promise(resolve => {
            const checkAbort = () => {
              if (executionState.abortedRef.current) {
                const abortTimestamp = Date.now() - executionState.startTimeRef.current;
                if (enableConsoleLog) {
                  executionState.addTestResult(`[${abortTimestamp}ms] ⛔ ${config.label} 지연 중 중단됨`);
                }
                resolve(undefined);
                return;
              }
              setTimeout(checkAbort, Math.min(config.delay, 50)); // 50ms마다 중단 확인
            };
            
            setTimeout(() => {
              if (!executionState.abortedRef.current) {
                resolve(undefined);
              }
            }, config.delay);
            
            checkAbort();
          });
          
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
          
          // Jump 처리 - 카운트가 3 이하일 때만 점프
          if (config.jumpToPriority !== null && config.jumpToPriority !== undefined) {
            const currentCount = countManagement.priorityExecutionCountRef.current[config.priority] || 0;
            const jumpTimestamp = Date.now() - executionState.startTimeRef.current;
            
            if (currentCount <= 3) {
              if (enableConsoleLog) {
                executionState.addTestResult(`[${jumpTimestamp}ms] 🦘 ${config.label} → P${config.jumpToPriority} 점프 (카운트: ${currentCount})`);
              }
              controller.jumpToPriority(config.jumpToPriority);
            } else {
              if (enableConsoleLog) {
                executionState.addTestResult(`[${jumpTimestamp}ms] 🚫 ${config.label} 점프 건너뜀 (카운트: ${currentCount} > 3)`);
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
      const unregister = actionRegister.register('priorityTest', handlerFunction, { 
        id: uniqueHandlerId,
        priority: config.priority,
        blocking: true  // 순차 실행에서 개별 지연을 위해 필수
      });
      
      // unregister 함수 저장
      unregisterFunctionsRef.current.set(uniqueHandlerId, unregister);
    });
    
    // 등록된 핸들러 상태 업데이트
    setRegisteredHandlers(new Set(unregisterFunctionsRef.current.keys()));
    
    if (enableConsoleLog) {
      console.log(`✅ ${unregisterFunctionsRef.current.size}개 핸들러 등록 완료`);
    }
    
    // cleanup 함수 저장 (setState 제거)
    cleanupRef.current = () => {
      unregisterFunctionsRef.current.forEach((unregister) => {
        unregister();
      });
      unregisterFunctionsRef.current.clear();
    };
    
    // 컴포넌트 언마운트 시 cleanup
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      // 언마운트 시에만 상태 초기화
      setRegisteredHandlers(new Set());
    };
  }, [actionRegister, configsHash, enableConsoleLog]); // 객체 의존성 제거로 무한루프 방지

  return {
    // ActionRegister 인스턴스
    actionRegister,
    
    // 실행 상태
    ...executionState,
    
    // 카운팅 관리
    ...countManagement,
    
    // 핸들러 관리 상태 및 함수
    registeredHandlers,
    registerHandlers,
    unregisterHandler,
    unregisterAllHandlers,
    
    // 통합 함수들
    initializeTest,
    executeTest,
    abortTest
  };
}