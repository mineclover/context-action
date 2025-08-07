import { useEffect, useId } from 'react';
import { ActionRegister } from '@context-action/react';
import type { TestActions } from '../context/ActionTestContext';

// 개별 핸들러 설정 타입
export interface HandlerConfig {
  id: string;
  priority: number;
  color: string;
  label: string;
  delay: number;
  jumpToPriority?: number | null;
  jumpToIndex?: number | null;
}

// 실행 상태 타입
export interface ExecutionState {
  handlerId: string;
  priority: number;
  status: 'pending' | 'running' | 'completed';
  startTime?: number;
  endTime?: number;
  executionOrder: number;
}

// 우선순위 액션 핸들러 관리 훅
export function usePriorityActionHandlers(
  actionRegister: ActionRegister<TestActions>,
  configs: HandlerConfig[],
  options: {
    onTestResultAdd: (result: string) => void;
    onPriorityCountIncrement: (priority: number, handlerId: string) => void;
    startTimeRef: React.MutableRefObject<number>;
    priorityExecutionCountRef: React.MutableRefObject<Record<number, number>>;
    abortedRef: React.MutableRefObject<boolean>;
    enableActionLogger?: boolean; // 액션 로거 활성화 여부
  }
) {
  const componentId = useId();
  
  const {
    onTestResultAdd,
    onPriorityCountIncrement,
    startTimeRef,
    priorityExecutionCountRef,
    abortedRef,
    enableActionLogger = true
  } = options;

  // 핸들러 등록 및 정리
  useEffect(() => {
    const unregisterFunctions: (() => void)[] = [];
    const registeredPriorities = new Set<number>();

    configs.forEach((config) => {
      // 같은 우선순위가 이미 등록되었으면 건너뛰기
      if (registeredPriorities.has(config.priority)) {
        return;
      }
      registeredPriorities.add(config.priority);

      // 우선순위 기반 ID로 같은 우선순위는 하나만 등록되도록 함
      const uniqueHandlerId = `priority-${config.priority}`;
      
      const unregister = actionRegister.register('priorityTest', 
        async ({ testId, delay }, controller) => {
          // 우선순위 카운트 증가
          onPriorityCountIncrement(config.priority, config.id);
          
          const timestamp = Date.now() - startTimeRef.current;
          const currentCount = priorityExecutionCountRef.current[config.priority] || 0;
          onTestResultAdd(`[${timestamp}ms] 🟡 ${config.label} 시작 (지연: ${config.delay}ms, 파라미터: ${delay}ms, 핸들러ID: ${uniqueHandlerId}, 현재카운트: ${currentCount})`);

          try {
            // 중단 상태 확인
            if (abortedRef.current) {
              const abortTimestamp = Date.now() - startTimeRef.current;
              onTestResultAdd(`[${abortTimestamp}ms] ⛔ ${config.label} 중단됨`);
              controller.abort('테스트가 사용자에 의해 중단되었습니다');
              return;
            }

            // 지연 시뮬레이션 (중간에 중단 확인)
            await new Promise(resolve => {
              const checkAbort = () => {
                if (abortedRef.current) {
                  const abortTimestamp = Date.now() - startTimeRef.current;
                  onTestResultAdd(`[${abortTimestamp}ms] ⛔ ${config.label} 지연 중 중단됨`);
                  resolve(undefined);
                  return;
                }
                setTimeout(checkAbort, Math.min(config.delay, 50)); // 50ms마다 중단 확인
              };
              
              setTimeout(() => {
                if (!abortedRef.current) {
                  resolve(undefined);
                }
              }, config.delay);
              
              checkAbort();
            });
            
            // 지연 후 다시 중단 상태 확인
            if (abortedRef.current) {
              const abortTimestamp = Date.now() - startTimeRef.current;
              onTestResultAdd(`[${abortTimestamp}ms] ⛔ ${config.label} 완료 전 중단됨`);
              controller.abort('테스트가 사용자에 의해 중단되었습니다');
              return;
            }
            
            const completionTimestamp = Date.now() - startTimeRef.current;
            const actualDelay = completionTimestamp - timestamp;
            onTestResultAdd(`[${completionTimestamp}ms] 🟢 ${config.label} 완료 (실제 소요: ${actualDelay}ms)`);
            
            // Jump 처리 - 카운트가 10 이하일 때만 점프
            if (config.jumpToPriority !== null && config.jumpToPriority !== undefined) {
              const currentCount = priorityExecutionCountRef.current[config.priority] || 0;
              const jumpTimestamp = Date.now() - startTimeRef.current;
              
              if (currentCount <= 3) {
                onTestResultAdd(`[${jumpTimestamp}ms] 🦘 ${config.label} → P${config.jumpToPriority} 점프 (카운트: ${currentCount})`);
                controller.jumpToPriority(config.jumpToPriority);
              } else {
                onTestResultAdd(`[${jumpTimestamp}ms] 🚫 ${config.label} 점프 건너뜀 (카운트: ${currentCount} > 3)`);
                controller.next();
              }
            } else {
              controller.next();
            }
            
          } catch (error) {
            const errorTimestamp = Date.now() - startTimeRef.current;
            onTestResultAdd(`[${errorTimestamp}ms] ❌ ${config.label} 실패: ${error}`);
            controller.abort(`Handler ${config.id} failed: ${error}`);
          } finally {
            // 정리 작업 불필요
          }
        },
        { 
          id: uniqueHandlerId,
          priority: config.priority,
          blocking: true  // 순차 실행에서 개별 지연을 위해 필수
        }
      );
      
      unregisterFunctions.push(unregister);
    });

    // 정리 함수
    return () => {
      unregisterFunctions.forEach((unregister) => {
        unregister();
      });
    };
  }, [
    actionRegister, 
    configs, 
    componentId, 
    onTestResultAdd,
    onPriorityCountIncrement,
    startTimeRef,
    priorityExecutionCountRef,
    abortedRef,
    enableActionLogger
  ]);

  return {};
}