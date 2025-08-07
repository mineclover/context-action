import { HandlerConfig } from '../usePriorityActionHandlers';

/**
 * Model Layer: 테스트 실행 비즈니스 로직
 * 순수한 실행 로직만 담당, React 의존성 없음
 */
export class TestExecutionEngine {
  private isRunning = false;
  private aborted = false;
  private startTime = 0;

  /**
   * 핸들러 함수 팩토리
   * 각 config에 대해 실행 가능한 핸들러 함수를 생성
   */
  createHandlerFunction(
    config: HandlerConfig,
    handlerId: string,
    dependencies: {
      incrementPriorityCount: (priority: number, id: string) => void;
      addTestResult: (result: string) => void;
      getAbortedState: () => boolean;
      getStartTime: () => number;
      getCurrentCount: (priority: number) => number;
      enableConsoleLog: boolean;
    }
  ) {
    return async ({ testId, delay }: { testId: string; delay: number }, controller: any) => {
      const { 
        incrementPriorityCount, 
        addTestResult, 
        getAbortedState, 
        getStartTime, 
        getCurrentCount,
        enableConsoleLog 
      } = dependencies;

      // 우선순위 카운트 증가
      incrementPriorityCount(config.priority, config.id);
      
      const timestamp = Date.now() - getStartTime();
      const currentCount = getCurrentCount(config.priority);
      
      if (enableConsoleLog) {
        addTestResult(`[${timestamp}ms] 🟡 ${config.label} 시작 (지연: ${config.delay}ms, 파라미터: ${delay}ms, 핸들러ID: ${handlerId}, 현재카운트: ${currentCount})`);
      }

      try {
        // 중단 상태 확인
        if (getAbortedState()) {
          const abortTimestamp = Date.now() - getStartTime();
          if (enableConsoleLog) {
            addTestResult(`[${abortTimestamp}ms] ⛔ ${config.label} 중단됨`);
          }
          controller.abort('테스트가 사용자에 의해 중단되었습니다');
          return;
        }

        // 지연 시뮬레이션 (중간에 중단 확인)
        await this.executeDelayWithAbortCheck(config.delay, getAbortedState, addTestResult, getStartTime, config.label, enableConsoleLog);
        
        // 지연 후 다시 중단 상태 확인
        if (getAbortedState()) {
          const abortTimestamp = Date.now() - getStartTime();
          if (enableConsoleLog) {
            addTestResult(`[${abortTimestamp}ms] ⛔ ${config.label} 완료 전 중단됨`);
          }
          controller.abort('테스트가 사용자에 의해 중단되었습니다');
          return;
        }
        
        const completionTimestamp = Date.now() - getStartTime();
        const actualDelay = completionTimestamp - timestamp;
        
        if (enableConsoleLog) {
          addTestResult(`[${completionTimestamp}ms] 🟢 ${config.label} 완료 (실제 소요: ${actualDelay}ms)`);
        }
        
        // Jump 처리
        this.handleJumpLogic(config, getCurrentCount, addTestResult, getStartTime, enableConsoleLog, controller);
        
      } catch (error) {
        const errorTimestamp = Date.now() - getStartTime();
        if (enableConsoleLog) {
          addTestResult(`[${errorTimestamp}ms] ❌ ${config.label} 실패: ${error}`);
        }
        controller.abort(`Handler ${config.id} failed: ${error}`);
      }
    };
  }

  /**
   * 지연 실행 (중단 체크 포함)
   */
  private async executeDelayWithAbortCheck(
    delay: number,
    getAbortedState: () => boolean,
    addTestResult: (result: string) => void,
    getStartTime: () => number,
    label: string,
    enableConsoleLog: boolean
  ): Promise<void> {
    return new Promise(resolve => {
      const checkAbort = () => {
        if (getAbortedState()) {
          const abortTimestamp = Date.now() - getStartTime();
          if (enableConsoleLog) {
            addTestResult(`[${abortTimestamp}ms] ⛔ ${label} 지연 중 중단됨`);
          }
          resolve(undefined);
          return;
        }
        setTimeout(checkAbort, Math.min(delay, 50)); // 50ms마다 중단 확인
      };
      
      setTimeout(() => {
        if (!getAbortedState()) {
          resolve(undefined);
        }
      }, delay);
      
      checkAbort();
    });
  }

  /**
   * Jump 로직 처리
   */
  private handleJumpLogic(
    config: HandlerConfig,
    getCurrentCount: (priority: number) => number,
    addTestResult: (result: string) => void,
    getStartTime: () => number,
    enableConsoleLog: boolean,
    controller: any
  ): void {
    if (config.jumpToPriority !== null && config.jumpToPriority !== undefined) {
      const currentCount = getCurrentCount(config.priority);
      const jumpTimestamp = Date.now() - getStartTime();
      
      if (currentCount <= 3) {
        if (enableConsoleLog) {
          addTestResult(`[${jumpTimestamp}ms] 🦘 ${config.label} → P${config.jumpToPriority} 점프 (카운트: ${currentCount})`);
        }
        controller.jumpToPriority(config.jumpToPriority);
      } else {
        if (enableConsoleLog) {
          addTestResult(`[${jumpTimestamp}ms] 🚫 ${config.label} 점프 건너뜀 (카운트: ${currentCount} > 3)`);
        }
        controller.next();
      }
    } else {
      controller.next();
    }
  }

  /**
   * 테스트 시작
   */
  startTest(): void {
    this.isRunning = true;
    this.aborted = false;
    this.startTime = Date.now();
  }

  /**
   * 테스트 완료
   */
  completeTest(): void {
    this.isRunning = false;
    this.aborted = false;
  }

  /**
   * 테스트 중단
   */
  abortTest(): void {
    this.aborted = true;
    this.isRunning = false;
  }

  /**
   * 실행 중 여부
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 중단 여부
   */
  getIsAborted(): boolean {
    return this.aborted;
  }

  /**
   * 시작 시간
   */
  getStartTime(): number {
    return this.startTime;
  }
}