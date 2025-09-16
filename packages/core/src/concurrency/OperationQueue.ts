/**
 * 동시성 문제 해결을 위한 작업 큐 시스템
 * 
 * 모든 상태 변경 작업을 직렬화하여 race condition을 방지합니다.
 */

export interface QueuedOperation<T = any> {
  id: string;
  operation: () => T | Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  priority?: number;
  timestamp: number;
}

/**
 * 작업 큐 관리자
 * 
 * 핵심 기능:
 * 1. 작업 직렬화 - 모든 작업을 순서대로 실행
 * 2. 우선순위 지원 - 중요한 작업 우선 처리
 * 3. 에러 처리 - 개별 작업 실패가 전체에 영향 주지 않음
 * 4. 메모리 관리 - 완료된 작업 자동 정리
 * 5. 🆕 동시성 제어 - maxConcurrency로 동시 실행 제한
 */
export class OperationQueue {
  private queue: QueuedOperation[] = [];
  private processingPromise: Promise<void> | null = null;
  private operationCounter = 0;
  
  // 🆕 Concurrency control
  private activeOperations = 0;
  private readonly maxConcurrency: number;
  private readonly runningOperations = new Set<Promise<any>>();
  
  constructor(
    private name: string = 'OperationQueue', 
    maxConcurrency: number = 1
  ) {
    this.maxConcurrency = Math.max(1, maxConcurrency);
  }

  /**
   * 작업을 큐에 추가하고 실행 결과를 반환
   * 
   * @param operation 실행할 작업
   * @param priority 우선순위 (높을수록 먼저 실행)
   * @returns Promise로 래핑된 작업 결과
   */
  enqueue<T>(operation: () => T | Promise<T>, priority: number = 0): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const queuedOperation: QueuedOperation<T> = {
        id: `${this.name}-${++this.operationCounter}`,
        operation,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      };

      // 우선순위에 따라 삽입 위치 결정
      let insertIndex = this.queue.length;
      for (let i = 0; i < this.queue.length; i++) {
        const item = this.queue[i];
        if (item && (item.priority || 0) < priority) {
          insertIndex = i;
          break;
        }
      }

      this.queue.splice(insertIndex, 0, queuedOperation);
      
      // 큐 처리 시작 (이미 처리 중이면 무시됨)
      this.processQueue();
    });
  }

  /**
   * 🆕 큐 처리 메인 로직 - 동시성 제어 지원
   * 
   * maxConcurrency에 따라 동시 실행 작업 수를 제한하여 동시성 문제 방지
   */
  private async processQueue(): Promise<void> {
    if (this.processingPromise) {
      return this.processingPromise;
    }
    
    this.processingPromise = this._doProcess();
    try {
      await this.processingPromise;
    } finally {
      this.processingPromise = null;
    }
  }
  
  private async _doProcess(): Promise<void> {
    while (this.queue.length > 0 || this.runningOperations.size > 0) {
      // 🆕 동시성 제어: maxConcurrency 만큼만 동시 실행
      while (this.queue.length > 0 && this.activeOperations < this.maxConcurrency) {
        const operation = this.queue.shift()!;
        this.activeOperations++;
        
        // 🆕 비동기 작업 실행 및 추적
        const operationPromise = this.executeOperation(operation);
        this.runningOperations.add(operationPromise);
        
        // 🆕 작업 완료 시 정리
        operationPromise.finally(() => {
          this.activeOperations--;
          this.runningOperations.delete(operationPromise);
        });
      }
      
      // 🆕 실행 중인 작업이 있으면 하나가 완료될 때까지 대기
      if (this.runningOperations.size > 0) {
        await Promise.race(this.runningOperations);
      }
    }
  }
  
  /**
   * 🆕 개별 작업 실행 로직
   */
  private async executeOperation<T>(operation: QueuedOperation<T>): Promise<void> {
    const startTime = Date.now();

    try {
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${this.name}] Starting operation ${operation.id}`);
      }

      // 작업 실행 (동기/비동기 모두 지원)
      const result = await Promise.resolve(operation.operation());

      if (process.env.NODE_ENV === 'development') {
        console.log(`[${this.name}] Completed operation ${operation.id} in ${Date.now() - startTime}ms`);
      }

      operation.resolve(result);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${this.name}] Failed operation ${operation.id} in ${Date.now() - startTime}ms:`, error);
      }

      // 개별 작업 실패는 전체 큐에 영향 주지 않음
      operation.reject(error);
    }
  }

  /**
   * 🆕 현재 큐 상태 조회 (디버깅용) - 동시성 정보 포함
   */
  getQueueInfo() {
    return {
      name: this.name,
      queueLength: this.queue.length,
      isProcessing: Boolean(this.processingPromise),
      activeOperations: this.activeOperations,
      maxConcurrency: this.maxConcurrency,
      runningOperationsCount: this.runningOperations.size,
      operations: this.queue.map(op => ({
        id: op.id,
        priority: op.priority,
        timestamp: op.timestamp
      }))
    };
  }
  
  /**
   * 🆕 동시성 설정 조회
   */
  getConcurrencyInfo() {
    return {
      maxConcurrency: this.maxConcurrency,
      activeOperations: this.activeOperations,
      availableSlots: this.maxConcurrency - this.activeOperations,
      queuedOperations: this.queue.length,
      efficiency: this.activeOperations / this.maxConcurrency
    };
  }

  /**
   * 큐 비우기 (테스트용)
   */
  clear(): void {
    // 대기 중인 작업들에게 취소 알림
    this.queue.forEach(operation => {
      operation.reject(new Error('Queue cleared'));
    });
    
    this.queue = [];
    this.processingPromise = null;
  }

  /**
   * 큐 크기 조회
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * 처리 중 여부 조회  
   */
  get processing(): boolean {
    return Boolean(this.processingPromise);
  }
}