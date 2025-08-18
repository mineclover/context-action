/**
 * @fileoverview Universal Reference Operation Queue
 * 
 * DOM 요소, Three.js 객체 등에 대한 동시성 안전한 작업 큐 시스템
 * 순차 실행, 우선순위 처리, 취소 지원을 포함
 */

import type { 
  RefTarget, 
  RefOperation, 
  RefOperationOptions, 
  RefOperationResult 
} from './types';

/**
 * 큐에 저장되는 작업 아이템
 */
interface QueuedOperation<T extends RefTarget, R = any> {
  id: string;
  refName: string;
  operation: RefOperation<T, R>;
  options: RefOperationOptions;
  resolve: (result: RefOperationResult<R>) => void;
  reject: (error: Error) => void;
  abortController: AbortController;
  createdAt: number;
  priority: number;
}

/**
 * 큐 통계 정보
 */
export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
}

/**
 * 참조별 작업 큐 관리자
 * 
 * 핵심 기능:
 * 1. 참조별 독립적인 큐 관리
 * 2. 우선순위 기반 작업 정렬
 * 3. 동시성 제어 및 순차 실행
 * 4. 취소 가능한 작업 지원
 * 5. 에러 처리 및 재시도 로직
 */
export class OperationQueue {
  private queues = new Map<string, QueuedOperation<any, any>[]>();
  private processing = new Set<string>();
  private stats = new Map<string, QueueStats>();
  private globalAbortController?: AbortController;
  private operationMetadata = new WeakMap<QueuedOperation<any, any>, { startTime: number; retryCount: number }>();

  constructor() {
    this.globalAbortController = new AbortController();
  }

  /**
   * 작업을 큐에 추가하고 실행 대기
   * 
   * @param refName - 참조 이름
   * @param target - 작업 대상 객체
   * @param operation - 수행할 작업
   * @param options - 작업 옵션
   * @returns 작업 결과 Promise
   */
  async enqueue<T extends RefTarget, R = any>(
    refName: string,
    target: T,
    operation: RefOperation<T, R>,
    options: RefOperationOptions = {}
  ): Promise<RefOperationResult<R>> {
    const operationId = options.operationId || this.generateOperationId();
    const priority = options.priority || 0;
    
    return new Promise<RefOperationResult<R>>((resolve, reject) => {
      // AbortController 설정
      const abortController = new AbortController();
      
      // 외부 signal이나 글로벌 signal과 연결
      if (options.signal) {
        if (options.signal.aborted) {
          reject(new Error('Operation aborted before queuing'));
          return;
        }
        options.signal.addEventListener('abort', () => {
          abortController.abort();
        });
      }
      
      if (this.globalAbortController?.signal.aborted) {
        reject(new Error('Queue is shutting down'));
        return;
      }
      
      this.globalAbortController?.signal.addEventListener('abort', () => {
        abortController.abort();
      });

      const queuedOperation: QueuedOperation<T, R> = {
        id: operationId,
        refName,
        operation: (target: T, opts?: RefOperationOptions) => 
          operation(target, { ...options, ...opts, signal: abortController.signal }),
        options: { ...options, signal: abortController.signal },
        resolve,
        reject,
        abortController,
        createdAt: Date.now(),
        priority
      };

      // 메타데이터 추가 (WeakMap 사용으로 메모리 안전)
      this.operationMetadata.set(queuedOperation, {
        startTime: Date.now(),
        retryCount: 0
      });

      // 큐에 추가 (우선순위 순으로 정렬)
      this.addToQueue(refName, queuedOperation);
      
      // 통계 업데이트
      this.updateStats(refName, 'pending', 1);
      
      // 큐 처리 시작 (이미 처리 중이 아니라면)
      this.processQueue(refName, target);
    });
  }

  /**
   * 특정 참조의 모든 대기 중인 작업 취소
   */
  cancelOperations(refName: string): void {
    const queue = this.queues.get(refName);
    if (!queue) return;

    queue.forEach(op => {
      if (!op.abortController.signal.aborted) {
        op.abortController.abort();
        op.reject(new Error(`Operation ${op.id} cancelled`));
      }
    });

    // 큐 비우기
    this.queues.set(refName, []);
    this.updateStats(refName, 'failed', queue.length);
  }

  /**
   * 모든 작업 취소 및 큐 종료
   */
  shutdown(): void {
    if (this.globalAbortController) {
      this.globalAbortController.abort();
    }

    // 모든 큐의 작업 취소
    for (const refName of this.queues.keys()) {
      this.cancelOperations(refName);
    }

    this.queues.clear();
    this.processing.clear();
    this.stats.clear();
  }

  /**
   * 큐 상태 조회
   */
  getStats(refName?: string): QueueStats | Record<string, QueueStats> {
    if (refName) {
      return this.stats.get(refName) || this.createEmptyStats();
    }
    
    // 모든 큐의 통계 반환
    const allStats: Record<string, QueueStats> = {};
    for (const [name, stats] of this.stats.entries()) {
      allStats[name] = { ...stats };
    }
    return allStats;
  }

  /**
   * 특정 참조의 대기 중인 작업 수 확인
   */
  getPendingOperationCount(refName: string): number {
    const queue = this.queues.get(refName);
    return queue ? queue.length : 0;
  }

  /**
   * 특정 참조가 현재 처리 중인지 확인
   */
  isProcessing(refName: string): boolean {
    return this.processing.has(refName);
  }

  /**
   * 큐에 작업 추가 (우선순위 순으로 정렬)
   */
  private addToQueue<T extends RefTarget, R>(
    refName: string, 
    operation: QueuedOperation<T, R>
  ): void {
    if (!this.queues.has(refName)) {
      this.queues.set(refName, []);
    }
    
    const queue = this.queues.get(refName)!;
    queue.push(operation);
    
    // 우선순위 순으로 정렬 (높은 우선순위가 먼저)
    queue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 큐 처리 (순차 실행)
   */
  private async processQueue<T extends RefTarget>(
    refName: string, 
    target: T
  ): Promise<void> {
    // 이미 처리 중이면 리턴
    if (this.processing.has(refName)) {
      return;
    }

    const queue = this.queues.get(refName);
    if (!queue || queue.length === 0) {
      return;
    }

    this.processing.add(refName);

    try {
      while (queue.length > 0) {
        const operation = queue.shift();
        if (!operation) break;

        // 취소된 작업 스킵
        if (operation.abortController.signal.aborted) {
          continue;
        }

        this.updateStats(refName, 'pending', -1);
        this.updateStats(refName, 'processing', 1);

        try {
          const startTime = Date.now();
          
          // 타임아웃 설정
          const timeoutPromise = operation.options.timeout 
            ? new Promise<never>((_, reject) => {
                setTimeout(() => {
                  operation.abortController.abort();
                  reject(new Error(`Operation ${operation.id} timed out`));
                }, operation.options.timeout);
              })
            : null;

          // 작업 실행
          const operationPromise = this.executeOperation(target, operation);
          
          const result = timeoutPromise 
            ? await Promise.race([operationPromise, timeoutPromise])
            : await operationPromise;

          const duration = Date.now() - startTime;
          
          const successResult: RefOperationResult = {
            success: true,
            result,
            duration,
            timestamp: Date.now()
          };

          operation.resolve(successResult);
          
          this.updateStats(refName, 'processing', -1);
          this.updateStats(refName, 'completed', 1);
          this.updateProcessingTime(refName, duration);

        } catch (error) {
          const metadata = this.operationMetadata.get(operation);
          
          // 재시도 로직
          if (operation.options.retries && operation.options.retries > 0) {
            operation.options.retries--;
            
            // 재시도 카운트 업데이트
            if (metadata) {
              metadata.retryCount++;
            }
            
            this.addToQueue(refName, operation);
            this.updateStats(refName, 'processing', -1);
            this.updateStats(refName, 'pending', 1);
            continue;
          }

          // Error result 생성은 필요 시 주석 해제
          // const errorResult: RefOperationResult = {
          //   success: false,
          //   error: error as Error,
          //   duration,
          //   timestamp: Date.now()
          // };

          operation.reject(error as Error);
          
          this.updateStats(refName, 'processing', -1);
          this.updateStats(refName, 'failed', 1);
        }
      }
    } finally {
      this.processing.delete(refName);
    }
  }

  /**
   * 실제 작업 실행
   */
  private async executeOperation<T extends RefTarget, R>(
    target: T,
    operation: QueuedOperation<T, R>
  ): Promise<R> {
    // AbortSignal 체크
    if (operation.abortController.signal.aborted) {
      throw new Error(`Operation ${operation.id} was aborted`);
    }

    try {
      const result = await operation.operation(target, operation.options);
      return result;
    } catch (error) {
      // 에러에 추가 컨텍스트 정보 포함
      const enhancedError = error as Error;
      enhancedError.message = `[${operation.refName}:${operation.id}] ${enhancedError.message}`;
      throw enhancedError;
    }
  }

  /**
   * 통계 업데이트
   */
  private updateStats(refName: string, field: keyof QueueStats, delta: number): void {
    if (!this.stats.has(refName)) {
      this.stats.set(refName, this.createEmptyStats());
    }
    
    const stats = this.stats.get(refName)!;
    (stats[field] as number) += delta;
  }

  /**
   * 처리 시간 통계 업데이트
   */
  private updateProcessingTime(refName: string, duration: number): void {
    const stats = this.stats.get(refName)!;
    stats.totalProcessingTime += duration;
    stats.averageProcessingTime = stats.totalProcessingTime / Math.max(1, stats.completed);
  }

  /**
   * 빈 통계 객체 생성
   */
  private createEmptyStats(): QueueStats {
    return {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0
    };
  }

  /**
   * 고유한 작업 ID 생성
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 전역 OperationQueue 인스턴스
 * 여러 RefContext에서 공유 사용 가능
 */
export const globalOperationQueue = new OperationQueue();

/**
 * 참조별로 독립적인 OperationQueue 관리자
 */
export class RefQueueManager {
  private queues = new Map<string, OperationQueue>();

  /**
   * 특정 참조를 위한 전용 큐 생성 또는 반환
   */
  getQueue(refName: string): OperationQueue {
    if (!this.queues.has(refName)) {
      this.queues.set(refName, new OperationQueue());
    }
    return this.queues.get(refName)!;
  }

  /**
   * 모든 큐 종료
   */
  shutdown(): void {
    for (const queue of this.queues.values()) {
      queue.shutdown();
    }
    this.queues.clear();
  }

  /**
   * 특정 큐 제거
   */
  removeQueue(refName: string): void {
    const queue = this.queues.get(refName);
    if (queue) {
      queue.shutdown();
      this.queues.delete(refName);
    }
  }

  /**
   * 모든 큐의 통계 조회
   */
  getAllStats(): Record<string, Record<string, QueueStats>> {
    const allStats: Record<string, Record<string, QueueStats>> = {};
    
    for (const [refName, queue] of this.queues.entries()) {
      allStats[refName] = queue.getStats() as Record<string, QueueStats>;
    }
    
    return allStats;
  }
}