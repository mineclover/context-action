/**
 * Parallel Processing System
 * 
 * 고성능 병렬 처리 및 워커 관리
 */

export interface TaskResult<T> {
  readonly success: boolean;
  readonly result?: T;
  readonly error?: Error;
  readonly executionTime: number;
  readonly workerId?: string;
}

export interface ProcessingStats {
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly failedTasks: number;
  readonly averageExecutionTime: number;
  readonly throughput: number; // tasks per second
  readonly activeWorkers: number;
  readonly queueSize: number;
}

export interface ParallelConfig {
  readonly maxWorkers: number;
  readonly queueTimeout: number;
  readonly retryCount: number;
  readonly retryDelay: number;
  readonly batchSize: number;
}

/**
 * Task 인터페이스
 */
export interface Task<T, R> {
  readonly id: string;
  readonly data: T;
  readonly processor: (data: T) => Promise<R> | R;
  readonly priority?: number;
  readonly timeout?: number;
  readonly retries?: number;
}

/**
 * ParallelProcessor
 * 
 * 효율적인 병렬 작업 처리
 */
export class ParallelProcessor<T = any, R = any> {
  private readonly workers: Set<string> = new Set();
  private readonly taskQueue: Task<T, R>[] = [];
  private readonly activeTasks = new Map<string, Promise<TaskResult<R>>>();
  private readonly config: ParallelConfig;
  private readonly stats = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    totalExecutionTime: 0,
    startTime: Date.now()
  };

  constructor(config: Partial<ParallelConfig> = {}) {
    this.config = {
      maxWorkers: Math.max(1, Math.min(16, require('os').cpus().length)),
      queueTimeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
      batchSize: 10,
      ...config
    };

    // Initialize worker pool
    for (let i = 0; i < this.config.maxWorkers; i++) {
      this.workers.add(`worker-${i}`);
    }
  }

  /**
   * 단일 작업 처리
   */
  async process(task: Task<T, R>): Promise<TaskResult<R>> {
    this.stats.totalTasks++;
    const startTime = Date.now();

    try {
      const result = await this.executeTask(task);
      const executionTime = Date.now() - startTime;
      
      this.stats.completedTasks++;
      this.stats.totalExecutionTime += executionTime;

      return {
        success: true,
        result,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.stats.failedTasks++;
      this.stats.totalExecutionTime += executionTime;

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime
      };
    }
  }

  /**
   * 배치 작업 처리
   */
  async processBatch(tasks: Task<T, R>[]): Promise<TaskResult<R>[]> {
    const batches = this.createBatches(tasks, this.config.batchSize);
    const results: TaskResult<R>[] = [];

    for (const batch of batches) {
      const batchPromises = batch.map(task => this.process(task));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 병렬 작업 처리 (제한된 동시성)
   */
  async processParallel(tasks: Task<T, R>[]): Promise<TaskResult<R>[]> {
    const results: TaskResult<R>[] = new Array(tasks.length);
    const promises: Promise<void>[] = [];
    let index = 0;

    const processNext = async (): Promise<void> => {
      while (index < tasks.length) {
        const currentIndex = index++;
        const task = tasks[currentIndex];
        const result = await this.process(task);
        results[currentIndex] = result;
      }
    };

    // 최대 워커 수만큼 병렬 처리
    for (let i = 0; i < this.config.maxWorkers && i < tasks.length; i++) {
      promises.push(processNext());
    }

    await Promise.all(promises);
    return results;
  }

  /**
   * 우선순위 큐를 이용한 작업 처리
   */
  async processWithPriority(tasks: Task<T, R>[]): Promise<TaskResult<R>[]> {
    // 우선순위로 정렬 (높은 숫자가 높은 우선순위)
    const sortedTasks = [...tasks].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return this.processParallel(sortedTasks);
  }

  /**
   * 스트림 처리 (결과를 하나씩 반환)
   */
  async* processStream(tasks: Task<T, R>[]): AsyncGenerator<TaskResult<R>, void, unknown> {
    const taskQueue = [...tasks];
    const activePromises = new Map<string, Promise<TaskResult<R>>>();

    while (taskQueue.length > 0 || activePromises.size > 0) {
      // 새 작업 시작
      while (activePromises.size < this.config.maxWorkers && taskQueue.length > 0) {
        const task = taskQueue.shift()!;
        const promise = this.process(task);
        activePromises.set(task.id, promise);
      }

      if (activePromises.size > 0) {
        // 가장 빨리 완료되는 작업 기다리기
        const result = await Promise.race(activePromises.values());
        
        // 완료된 작업 제거
        for (const [taskId, promise] of activePromises.entries()) {
          if (await promise === result) {
            activePromises.delete(taskId);
            break;
          }
        }

        yield result;
      }
    }
  }

  /**
   * 조건부 처리 (필터링 + 처리)
   */
  async processConditional(
    tasks: Task<T, R>[], 
    condition: (task: Task<T, R>) => boolean
  ): Promise<TaskResult<R>[]> {
    const filteredTasks = tasks.filter(condition);
    return this.processParallel(filteredTasks);
  }

  /**
   * 재시도 로직이 있는 작업 처리
   */
  private async executeTask(task: Task<T, R>): Promise<R> {
    const maxRetries = task.retries ?? this.config.retryCount;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (task.timeout) {
          return await this.executeWithTimeout(task.processor, task.data, task.timeout);
        } else {
          return await task.processor(task.data);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  /**
   * 타임아웃이 있는 실행
   */
  private executeWithTimeout<TData, TResult>(
    processor: (data: TData) => Promise<TResult> | TResult,
    data: TData,
    timeoutMs: number
  ): Promise<TResult> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Task timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      Promise.resolve(processor(data))
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 배치 생성
   */
  private createBatches<TItem>(items: TItem[], batchSize: number): TItem[][] {
    const batches: TItem[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * 처리 통계
   */
  getStats(): ProcessingStats {
    const runtime = (Date.now() - this.stats.startTime) / 1000;
    const throughput = this.stats.completedTasks / runtime;
    const averageExecutionTime = this.stats.completedTasks > 0 
      ? this.stats.totalExecutionTime / this.stats.completedTasks 
      : 0;

    return {
      totalTasks: this.stats.totalTasks,
      completedTasks: this.stats.completedTasks,
      failedTasks: this.stats.failedTasks,
      averageExecutionTime,
      throughput,
      activeWorkers: this.config.maxWorkers,
      queueSize: this.taskQueue.length
    };
  }

  /**
   * 성능 최적화 권장사항
   */
  getOptimizationRecommendations(): string[] {
    const stats = this.getStats();
    const recommendations: string[] = [];

    const failureRate = stats.failedTasks / stats.totalTasks;
    if (failureRate > 0.1) {
      recommendations.push(`높은 실패율 (${(failureRate * 100).toFixed(1)}%) - 재시도 설정을 검토하세요.`);
    }

    if (stats.averageExecutionTime > 5000) {
      recommendations.push(`긴 평균 실행 시간 (${stats.averageExecutionTime.toFixed(0)}ms) - 작업 분할을 고려하세요.`);
    }

    if (stats.throughput < 1) {
      recommendations.push(`낮은 처리량 (${stats.throughput.toFixed(2)} tasks/sec) - 워커 수 증가를 고려하세요.`);
    }

    const cpuCount = require('os').cpus().length;
    if (this.config.maxWorkers < cpuCount && stats.throughput > this.config.maxWorkers * 0.8) {
      recommendations.push(`워커 수를 ${cpuCount}개로 증가시키면 성능이 개선될 수 있습니다.`);
    }

    return recommendations;
  }

  /**
   * 리소스 정리
   */
  cleanup(): void {
    this.taskQueue.length = 0;
    this.activeasks.clear();
    this.workers.clear();
  }
}

/**
 * 문서 처리 특화 병렬 프로세서
 */
export class DocumentParallelProcessor extends ParallelProcessor<any, any> {
  constructor() {
    super({
      maxWorkers: Math.min(8, require('os').cpus().length),
      batchSize: 5,
      retryCount: 2,
      queueTimeout: 15000
    });
  }

  /**
   * 문서 선택 작업 병렬 처리
   */
  async processDocumentSelection(
    documents: any[],
    selectionStrategy: (document: any) => Promise<any>
  ): Promise<TaskResult<any>[]> {
    const tasks = documents.map((doc, index) => ({
      id: `doc-selection-${index}`,
      data: doc,
      processor: selectionStrategy,
      priority: doc.priority?.score || 0
    }));

    return this.processWithPriority(tasks);
  }

  /**
   * 품질 평가 작업 병렬 처리
   */
  async processQualityEvaluation(
    selections: any[],
    evaluationStrategy: (selection: any) => Promise<any>
  ): Promise<TaskResult<any>[]> {
    const tasks = selections.map((selection, index) => ({
      id: `quality-eval-${index}`,
      data: selection,
      processor: evaluationStrategy,
      timeout: 10000 // 10초 타임아웃
    }));

    return this.processBatch(tasks);
  }
}

/**
 * 전역 병렬 프로세서 인스턴스
 */
export const globalParallelProcessor = new DocumentParallelProcessor();