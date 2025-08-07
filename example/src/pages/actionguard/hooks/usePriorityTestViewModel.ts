import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { UnregisterFunction } from '@context-action/core';
import { PriorityTestViewModel, ViewModelDependencies } from './types';

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
  
  // AbortController 관리
  const abortControllerRef = useRef<AbortController | null>(null);

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

      configs.forEach((config) => {
        const uniqueHandlerId = config.id; // config의 고유 ID 사용
        
        // 각 config마다 개별 핸들러 등록
        const unregister = actionRegister.register('priorityTest', async ({ testId, delay }: { testId: string; delay: number }, controller: any) => {
          // 우선순위 카운트 증가
          countManagement.incrementPriorityCount(config.priority, config.id);
          
          const timestamp = Date.now() - executionState.startTime;
          const currentCount = countManagement.getPriorityCount(config.priority);
          
          if (enableConsoleLog) {
            executionState.addTestResult(`[${timestamp}ms] 🟡 ${config.label} 시작 (지연: ${config.delay}ms, 파라미터: ${delay}ms, 핸들러ID: ${uniqueHandlerId}, 현재카운트: ${currentCount})`);
          }

          try {
            // 액션핸들러 내장 abort 기능이 자동으로 처리

            // 지연 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, config.delay));
            
            // 액션핸들러가 abort를 자동으로 처리함
            
            const completionTimestamp = Date.now() - executionState.startTime;
            const actualDelay = completionTimestamp - timestamp;
            
            // 개별 핸들러 실행 시간을 executionState에 기록
            executionState.addHandlerExecutionTime(uniqueHandlerId, actualDelay);
            
            if (enableConsoleLog) {
              executionState.addTestResult(`[${completionTimestamp}ms] 🟢 ${config.label} 완료 (실제 소요: ${actualDelay}ms)`);
            }
            
            // Jump 처리 (최대 4번까지만 점프 허용)
            if (config.jumpToPriority !== null && config.jumpToPriority !== undefined) {
              const finalCount = countManagement.getPriorityCount(config.priority);
              const jumpTimestamp = Date.now() - executionState.startTime;
              
              if (finalCount <= 4) {
                if (enableConsoleLog) {
                  executionState.addTestResult(`[${jumpTimestamp}ms] 🦘 ${config.label} → P${config.jumpToPriority} 점프 (실행횟수: ${finalCount}/4)`);
                }
                controller.jumpToPriority(config.jumpToPriority);
              } else {
                if (enableConsoleLog) {
                  executionState.addTestResult(`[${jumpTimestamp}ms] 🚫 ${config.label} 점프 제한 (실행횟수: ${finalCount}/4 초과)`);
                }
                controller.next();
              }
            } else {
              controller.next();
            }
            
          } catch (error) {
            const errorTimestamp = Date.now() - executionState.startTime;
            if (enableConsoleLog) {
              executionState.addTestResult(`[${errorTimestamp}ms] ❌ ${config.label} 실패: ${error}`);
            }
            controller.abort(`Handler ${config.id} failed: ${error}`);
          }
        }, {
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
  const executeTest = useCallback(async (controllerContainer?: { controller?: AbortController }) => {
    if (executionState.isRunning) {
      if (enableConsoleLog) {
        console.log('⚠️ [WARNING] Test already running, ignoring new execution request');
      }
      return;
    }

    initializeTest();
    
    try {
      // 로그 출력
      if (enableConsoleLog) {
        executionState.addTestResult(`[0ms] 🚀 우선순위 테스트 시작 (총 ${configs.length}개 핸들러)`);
      }

      // 액션 디스패치 (core의 autoAbort 기능 사용)
      await dispatch('priorityTest', { testId: `test-${Date.now()}`, delay: 0 }, { 
        executionMode: 'sequential',
        autoAbort: {
          enabled: true,
          onControllerCreated: (controller: AbortController) => {
            // 🎯 외부에서 제공한 컨테이너 객체에 controller 저장 (선택적)
            if (controllerContainer) {
              controllerContainer.controller = controller;
            }
            // AbortController를 내부 ref에 저장
            abortControllerRef.current = controller;
          },
          allowHandlerAbort: true
        }
      });
      
      // 💡 이제 외부에서 controllerContainer.controller로 직접 접근 가능!

      // 완료 로그
      if (enableConsoleLog) {
        const dispatchCompleteTimestamp = Date.now() - executionState.startTime;
        executionState.addTestResult(`[${dispatchCompleteTimestamp}ms] 🏁 디스패치 완료`);
        executionState.addTestResult(`[${dispatchCompleteTimestamp}ms] ✅ 모든 핸들러 실행 완료`);
      }

    } catch (error) {
      const errorTimestamp = Date.now() - executionState.startTime;
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

    configs.forEach((config) => {
      const uniqueHandlerId = config.id; // config의 고유 ID 사용
      
      // 각 config마다 개별 핸들러 등록
      const unregister = actionRegister.register('priorityTest', async ({ testId, delay }: { testId: string; delay: number }, controller: any) => {
        // 우선순위 카운트 증가 후 최신 카운트 받기
        const currentCount = countManagement.incrementPriorityCount(config.priority, config.id);
        
        const timestamp = Date.now() - executionState.startTime;
        
        if (enableConsoleLog) {
          executionState.addTestResult(`[${timestamp}ms] 🟡 ${config.label} 시작 (지연: ${config.delay}ms, 핸들러ID: ${uniqueHandlerId}, 현재카운트: ${currentCount})`);
        }

        // 📘 고급 사용법: 핸들러에서 전체 파이프라인 abort 트리거 가능
        // 예시: Ultra High(300) 핸들러에서 조건부 abort 데모
        if (config.priority === 300 && currentCount > 1) {
          // Ultra High 핸들러가 2번째 실행될 때 전체 파이프라인 중단
          executionState.triggerPipelineAbort(`${config.label}에서 조건부 중단 (카운트: ${currentCount})`);
          return;
        }
        
        // 또 다른 예시: 특정 핸들러에서 4번째 실행 시 abort
        if (config.label.includes('Lowest') && currentCount >= 4) {
          executionState.triggerPipelineAbort(`${config.label}에서 최대 실행 횟수 초과 중단`);
          return;
        }

        try {
          // Abort 신호 체크 (시작 시점)
          if (controller.aborted) {
            const abortTimestamp = Date.now() - executionState.startTime;
            if (enableConsoleLog) {
              executionState.addTestResult(`[${abortTimestamp}ms] ⛔ ${config.label} 중단됨 (abort 신호)`);
            }
            return;
          }

          // 성능 최적화: 0ms는 바로 실행, 그 외에만 setTimeout 사용
          if (config.delay > 0) {
            await new Promise((resolve, reject) => {
              const timeoutId = setTimeout(resolve, config.delay);
              
              // Abort 신호 리스너 추가
              const onAbort = () => {
                clearTimeout(timeoutId);
                reject(new Error('Aborted during delay'));
              };
              
              if (controller.signal) {
                controller.signal.addEventListener('abort', onAbort, { once: true });
              }
            });
          }
          
          // Abort 신호 체크 (지연 후)
          if (controller.aborted) {
            const abortTimestamp = Date.now() - executionState.startTime;
            if (enableConsoleLog) {
              executionState.addTestResult(`[${abortTimestamp}ms] ⛔ ${config.label} 중단됨 (지연 후)`);
            }
            return;
          }
          
          const completionTimestamp = Date.now() - executionState.startTime;
          const actualDelay = completionTimestamp - timestamp;
          
          // 개별 핸들러 실행 시간을 executionState에 기록
          executionState.addHandlerExecutionTime(uniqueHandlerId, actualDelay);
          
          if (enableConsoleLog) {
            executionState.addTestResult(`[${completionTimestamp}ms] 🟢 ${config.label} 완료 (실제 소요: ${actualDelay}ms)`);
          }
          
          // Jump 처리
          if (config.jumpToPriority !== null && config.jumpToPriority !== undefined) {
            const finalCount = countManagement.getPriorityCount(config.priority);
            const jumpTimestamp = Date.now() - executionState.startTime;
            
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
          const errorTimestamp = Date.now() - executionState.startTime;
          
          // Abort 에러와 일반 에러 구분
          if (error instanceof Error && error.message.includes('Aborted')) {
            if (enableConsoleLog) {
              executionState.addTestResult(`[${errorTimestamp}ms] ⛔ ${config.label} 중단됨`);
            }
            return; // abort는 정상적인 중단이므로 error로 처리하지 않음
          } else {
            if (enableConsoleLog) {
              executionState.addTestResult(`[${errorTimestamp}ms] ❌ ${config.label} 실패: ${error}`);
            }
            controller.abort(`Handler ${config.id} failed: ${error}`);
          }
        }
      }, {
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
    aborted: !executionState.isRunning && executionState.currentTestId === null,
    testResults: executionState.testResults,
    priorityCounts: countManagement.priorityCounts,

    // 액션
    registerHandlers,
    unregisterHandler,
    unregisterAllHandlers,
    executeTest,
    abortTest,
    initializeTest,
    getRegisteredCount,
    isHandlerRegistered,

    // 고급 abort 제어 (핸들러/외부에서 파이프라인 abort 가능)
    getCurrentAbortController: () => abortControllerRef.current,
    triggerPipelineAbort: executionState.triggerPipelineAbort,

    // 호환성을 위한 ActionRegister
    actionRegister
  };
}