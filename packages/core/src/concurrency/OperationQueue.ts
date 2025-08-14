/**
 * 동시성 문제 해결을 위한 작업 큐 시스템
 * 
 * 모든 상태 변경 작업을 직렬화하여 race condition을 방지합니다.
 */

export interface QueuedOperation<T = any> {
  id: string;
  operation: () => T | Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
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
 */
export class OperationQueue {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;
  private operationCounter = 0;
  
  constructor(private name: string = 'OperationQueue') {}

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
        if ((this.queue[i].priority || 0) < priority) {
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
   * 큐 처리 메인 로직
   * 
   * 한 번에 하나씩 순서대로 작업을 실행하여 동시성 문제 방지
   */
  private async processQueue(): Promise<void> {
    // 이미 처리 중이거나 큐가 비어있으면 종료
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const operation = this.queue.shift()!;
        
        try {
          // 작업 실행 (동기/비동기 모두 지원)
          const result = await Promise.resolve(operation.operation());
          operation.resolve(result);
        } catch (error) {
          // 개별 작업 실패는 전체 큐에 영향 주지 않음
          operation.reject(error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 현재 큐 상태 조회 (디버깅용)
   */
  getQueueInfo() {
    return {
      name: this.name,
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      operations: this.queue.map(op => ({
        id: op.id,
        priority: op.priority,
        timestamp: op.timestamp
      }))
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
    this.isProcessing = false;
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
    return this.isProcessing;
  }
}