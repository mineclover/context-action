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

export interface QueuedOperationHandle<T> {
  promise: Promise<T>;
  /** Cancels only while the operation is still waiting in the queue. */
  cancel(reason?: unknown): boolean;
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
 * 6. 🆕 비동기 지원 - Promise.all() 완벽 지원
 * 7. 🆕 이벤트 기반 처리 - 효율적인 큐 처리 시스템
 */
export class OperationQueue {
  private queue: QueuedOperation[] = [];
  private processingPromise: Promise<void> | null = null;
  private operationCounter = 0;
  
  // 🆕 Concurrency control
  private activeOperations = 0;
  private readonly maxConcurrency: number;
  
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
    return this.enqueueWithHandle(operation, priority).promise;
  }

  /** Enqueue an operation and retain a handle for pre-start cancellation. */
  enqueueWithHandle<T>(
    operation: () => T | Promise<T>,
    priority: number = 0
  ): QueuedOperationHandle<T> {
    let queuedOperation!: QueuedOperation<T>;
    const promise = new Promise<T>((resolve, reject) => {
      queuedOperation = {
        id: `${this.name}-${++this.operationCounter}`,
        operation,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      };


      // 우선순위에 따라 삽입 위치 결정 (높은 우선순위가 앞쪽)
      let insertIndex = this.queue.length;
      for (let i = 0; i < this.queue.length; i++) {
        const item = this.queue[i];
        // 현재 아이템의 우선순위가 새 아이템보다 낮으면, 새 아이템을 앞에 삽입
        if (item && (item.priority || 0) < priority) {
          insertIndex = i;
          break;
        }
      }

      this.queue.splice(insertIndex, 0, queuedOperation);

      // 큐 처리 시작 (이미 처리 중이면 무시됨)
      if (this.processingPromise) {
        // 이미 처리 중이라면, 대기 중인 프로세스에게 새로운 작업이 추가되었음을 알림
        this.notifyNewOperation();
      }
      this.processQueue();
    });

    return {
      promise,
      cancel: (reason = new Error('Queue operation cancelled')) => {
        const index = this.queue.indexOf(queuedOperation);
        if (index === -1) return false;

        this.queue.splice(index, 1);
        queuedOperation.reject(reason);
        this.notifyNewOperation();
        return true;
      },
    };
  }

  /**
   * 🆕 큐 처리 메인 로직 - 동시성 제어 및 비동기 지원
   *
   * 주요 특징:
   * - maxConcurrency에 따라 동시 실행 작업 수를 제한하여 동시성 문제 방지
   * - Promise.all() 시나리오에서 완벽한 순차적 실행 보장
   * - 이벤트 기반 알림 시스템으로 효율적인 비동기 처리
   * - 작업 완료 시 대기 중인 프로세스에게 자동 알림
   */
  private async processQueue(): Promise<void> {
    if (this.processingPromise) {
      // Wait for current processing to complete, then check if we need to process more
      await this.processingPromise;
      // After waiting, check if there are new items to process
      if (this.queue.length > 0 && !this.processingPromise) {
        return this.processQueue();
      }
      return;
    }

    this.processingPromise = this._doProcess();
    try {
      await this.processingPromise;
    } finally {
      this.processingPromise = null;
    }
  }
  
  private async _doProcess(): Promise<void> {
    while (this.queue.length > 0 || this.activeOperations > 0) {
      // 🆕 동시성 제어: maxConcurrency 만큼만 동시 실행
      while (this.queue.length > 0 && this.activeOperations < this.maxConcurrency) {
        const operation = this.queue.shift()!;

        // 🆕 비동기 작업 실행 (await를 사용하지 않음 - 병렬 실행을 위해)
        this.startOperation(operation);
      }

      // 🆕 실행 중인 작업이 있으면 하나가 완료될 때까지 대기
      if (this.activeOperations > 0) {
        await this.waitForAnyOperation();
      }
    }
  }

  /**
   * 🆕 개별 작업을 시작하고 완료를 추적
   */
  private startOperation<T>(operation: QueuedOperation<T>): void {
    this.activeOperations++;

    // 비동기로 작업 실행
    this.executeOperation(operation)
      .finally(() => {
        this.activeOperations--;

        // 대기 중인 프로세스에게 신호 보내기
        this.notifyOperationComplete();
      });
  }

  private pendingResolvers: Array<() => void> = [];

  /**
   * 🆕 하나의 작업이 완료될 때까지 대기하거나 새로운 작업이 추가될 때까지 대기
   */
  private waitForAnyOperation(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.pendingResolvers.push(resolve);
    });
  }

  /**
   * 🆕 작업 완료 신호 - 대기 중인 프로세스들에게 알림
   */
  private notifyOperationComplete(): void {
    // 대기 중인 모든 리졸버를 깨우기
    const resolvers = this.pendingResolvers.splice(0);
    resolvers.forEach(resolve => resolve());
  }

  /**
   * 🆕 새로운 작업 추가 신호 - processQueue에서 호출
   */
  private notifyNewOperation(): void {
    // 새로운 작업이 추가되었으므로 대기 중인 프로세스를 깨워서 다시 확인하도록 함
    this.notifyOperationComplete();
  }
  
  /**
   * 🆕 개별 작업 실행 로직
   */
  private async executeOperation<T>(operation: QueuedOperation<T>): Promise<void> {
    try {
      // 작업 실행 (동기/비동기 모두 지원)
      const result = await Promise.resolve(operation.operation());
      operation.resolve(result);
    } catch (error) {
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
  clear(options: { rejectPending?: boolean; reason?: unknown } = {}): void {
    const rejectPending = options.rejectPending ?? true;
    const reason = options.reason ?? new Error('Queue cleared');

    // Settle queued operations so callers are never left with pending promises.
    this.queue.forEach(operation => {
      if (rejectPending) {
        operation.reject(reason);
      } else {
        operation.resolve(undefined as never);
      }
    });

    this.queue = [];

    // 대기 중인 리졸버들도 정리
    const resolvers = this.pendingResolvers.splice(0);
    resolvers.forEach(resolve => resolve());
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
