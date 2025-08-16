/**
 * Performance Monitoring System
 * 
 * 성능 지표 수집, 분석 및 최적화 권장사항 제공
 */

export interface PerformanceMetric {
  readonly name: string;
  readonly value: number;
  readonly unit: string;
  readonly timestamp: Date;
  readonly category: 'execution' | 'memory' | 'io' | 'computation';
  readonly context?: Record<string, any>;
}

export interface PerformanceReport {
  readonly sessionId: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly metrics: ReadonlyArray<PerformanceMetric>;
  readonly summary: {
    readonly totalExecutionTime: number;
    readonly peakMemoryUsage: number;
    readonly averageResponseTime: number;
    readonly operationCount: number;
  };
  readonly recommendations: string[];
  readonly bottlenecks: string[];
}

export interface PerformanceThresholds {
  readonly executionTime: {
    readonly warning: number;
    readonly critical: number;
  };
  readonly memoryUsage: {
    readonly warning: number;
    readonly critical: number;
  };
  readonly responseTime: {
    readonly warning: number;
    readonly critical: number;
  };
}

/**
 * PerformanceMonitor
 * 
 * 실시간 성능 모니터링 및 분석
 */
export class PerformanceMonitor {
  private readonly metrics: PerformanceMetric[] = [];
  private readonly sessionId: string;
  private readonly startTime: Date;
  private readonly thresholds: PerformanceThresholds;
  private operationCount = 0;

  constructor(
    sessionId: string = `session_${Date.now()}`,
    thresholds: PerformanceThresholds = {
      executionTime: { warning: 5000, critical: 10000 },
      memoryUsage: { warning: 100, critical: 200 },
      responseTime: { warning: 1000, critical: 3000 }
    }
  ) {
    this.sessionId = sessionId;
    this.startTime = new Date();
    this.thresholds = thresholds;
  }

  /**
   * 실행 시간 측정 시작
   */
  startTiming(operationName: string): () => void {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();
    this.operationCount++;

    return () => {
      const endTime = process.hrtime.bigint();
      const endMemory = process.memoryUsage();
      const executionTime = Number(endTime - startTime) / 1_000_000; // nanoseconds to milliseconds

      this.recordMetric({
        name: `${operationName}_execution_time`,
        value: executionTime,
        unit: 'ms',
        timestamp: new Date(),
        category: 'execution',
        context: { operation: operationName }
      });

      const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
      this.recordMetric({
        name: `${operationName}_memory_usage`,
        value: memoryDelta / 1024 / 1024, // bytes to MB
        unit: 'MB',
        timestamp: new Date(),
        category: 'memory',
        context: { operation: operationName }
      });
    };
  }

  /**
   * 메트릭 기록
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    this.checkThresholds(metric);
  }

  /**
   * 임계값 확인 및 경고
   */
  private checkThresholds(metric: PerformanceMetric): void {
    let threshold: { warning: number; critical: number } | undefined;

    switch (metric.category) {
      case 'execution':
        threshold = this.thresholds.executionTime;
        break;
      case 'memory':
        threshold = this.thresholds.memoryUsage;
        break;
    }

    if (threshold) {
      if (metric.value >= threshold.critical) {
        console.warn(`🚨 Critical threshold exceeded: ${metric.name} = ${metric.value}${metric.unit}`);
      } else if (metric.value >= threshold.warning) {
        console.warn(`⚠️ Warning threshold exceeded: ${metric.name} = ${metric.value}${metric.unit}`);
      }
    }
  }

  /**
   * 성능 리포트 생성
   */
  generateReport(): PerformanceReport {
    const endTime = new Date();
    const executionMetrics = this.metrics.filter(m => m.category === 'execution');
    const memoryMetrics = this.metrics.filter(m => m.category === 'memory');

    const totalExecutionTime = endTime.getTime() - this.startTime.getTime();
    const peakMemoryUsage = Math.max(...memoryMetrics.map(m => m.value), 0);
    const averageResponseTime = executionMetrics.length > 0 
      ? executionMetrics.reduce((sum, m) => sum + m.value, 0) / executionMetrics.length 
      : 0;

    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime,
      metrics: [...this.metrics],
      summary: {
        totalExecutionTime,
        peakMemoryUsage,
        averageResponseTime,
        operationCount: this.operationCount
      },
      recommendations: this.generateRecommendations(),
      bottlenecks: this.identifyBottlenecks()
    };
  }

  /**
   * 성능 최적화 권장사항 생성
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const executionMetrics = this.metrics.filter(m => m.category === 'execution');
    const memoryMetrics = this.metrics.filter(m => m.category === 'memory');

    // 실행 시간 분석
    const slowOperations = executionMetrics.filter(m => m.value > this.thresholds.executionTime.warning);
    if (slowOperations.length > 0) {
      recommendations.push(`${slowOperations.length}개의 느린 작업이 감지되었습니다. 병렬 처리 또는 캐싱을 고려하세요.`);
    }

    // 메모리 사용량 분석
    const highMemoryOperations = memoryMetrics.filter(m => m.value > this.thresholds.memoryUsage.warning);
    if (highMemoryOperations.length > 0) {
      recommendations.push(`높은 메모리 사용량이 감지되었습니다. 메모리 할당 최적화를 고려하세요.`);
    }

    // 반복 작업 최적화
    const operationCounts = new Map<string, number>();
    this.metrics.forEach(m => {
      const operation = m.context?.operation;
      if (operation) {
        operationCounts.set(operation, (operationCounts.get(operation) || 0) + 1);
      }
    });

    const frequentOperations = Array.from(operationCounts.entries())
      .filter(([_, count]) => count > 10)
      .map(([operation, _]) => operation);

    if (frequentOperations.length > 0) {
      recommendations.push(`빈번한 작업들 (${frequentOperations.join(', ')})에 대한 캐싱을 고려하세요.`);
    }

    return recommendations;
  }

  /**
   * 성능 병목 지점 식별
   */
  private identifyBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    const operationTimes = new Map<string, number[]>();

    // 작업별 실행 시간 수집
    this.metrics
      .filter(m => m.category === 'execution')
      .forEach(m => {
        const operation = m.context?.operation;
        if (operation) {
          if (!operationTimes.has(operation)) {
            operationTimes.set(operation, []);
          }
          operationTimes.get(operation)!.push(m.value);
        }
      });

    // 평균 실행 시간이 긴 작업 식별
    for (const [operation, times] of operationTimes.entries()) {
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      if (averageTime > this.thresholds.executionTime.warning) {
        bottlenecks.push(`${operation}: 평균 ${averageTime.toFixed(2)}ms (${times.length}회 실행)`);
      }
    }

    return bottlenecks;
  }

  /**
   * 실시간 성능 통계
   */
  getRealTimeStats(): {
    currentMemoryUsage: number;
    activeOperations: number;
    averageExecutionTime: number;
    totalMetrics: number;
  } {
    const currentMemory = process.memoryUsage();
    const recentExecutionMetrics = this.metrics
      .filter(m => m.category === 'execution')
      .slice(-10); // 최근 10개 작업

    const averageExecutionTime = recentExecutionMetrics.length > 0
      ? recentExecutionMetrics.reduce((sum, m) => sum + m.value, 0) / recentExecutionMetrics.length
      : 0;

    return {
      currentMemoryUsage: currentMemory.heapUsed / 1024 / 1024, // MB
      activeOperations: this.operationCount,
      averageExecutionTime,
      totalMetrics: this.metrics.length
    };
  }

  /**
   * 메트릭 데이터 내보내기 (JSON)
   */
  exportMetrics(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      metrics: this.metrics,
      summary: this.generateReport().summary,
      exportTime: new Date().toISOString()
    }, null, 2);
  }

  /**
   * 성능 비교 분석
   */
  compareWithBaseline(baseline: PerformanceReport): {
    improvements: string[];
    regressions: string[];
    overallChange: number;
  } {
    const current = this.generateReport();
    const improvements: string[] = [];
    const regressions: string[] = [];

    // 실행 시간 비교
    const executionChange = (current.summary.averageResponseTime - baseline.summary.averageResponseTime) / baseline.summary.averageResponseTime;
    if (executionChange < -0.1) {
      improvements.push(`평균 응답 시간 ${Math.abs(executionChange * 100).toFixed(1)}% 개선`);
    } else if (executionChange > 0.1) {
      regressions.push(`평균 응답 시간 ${(executionChange * 100).toFixed(1)}% 악화`);
    }

    // 메모리 사용량 비교
    const memoryChange = (current.summary.peakMemoryUsage - baseline.summary.peakMemoryUsage) / baseline.summary.peakMemoryUsage;
    if (memoryChange < -0.1) {
      improvements.push(`최대 메모리 사용량 ${Math.abs(memoryChange * 100).toFixed(1)}% 감소`);
    } else if (memoryChange > 0.1) {
      regressions.push(`최대 메모리 사용량 ${(memoryChange * 100).toFixed(1)}% 증가`);
    }

    const overallChange = (executionChange + memoryChange) / 2;

    return {
      improvements,
      regressions,
      overallChange
    };
  }
}

/**
 * 전역 성능 모니터 인스턴스
 */
export const globalPerformanceMonitor = new PerformanceMonitor();

/**
 * 성능 모니터링 데코레이터
 */
export function monitor(target: any, propertyName: string, descriptor?: PropertyDescriptor) {
  if (!descriptor) {
    // Property descriptor가 없는 경우 메서드 처리
    const originalMethod = target[propertyName];
    if (typeof originalMethod === 'function') {
      target[propertyName] = function (...args: any[]) {
        const stopTiming = globalPerformanceMonitor.startTiming(`${target.constructor.name}.${propertyName}`);
        
        try {
          const result = originalMethod.apply(this, args);
          
          if (result instanceof Promise) {
            return result.finally(() => stopTiming());
          } else {
            stopTiming();
            return result;
          }
        } catch (error) {
          stopTiming();
          throw error;
        }
      };
    }
    return;
  }

  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const stopTiming = globalPerformanceMonitor.startTiming(`${target.constructor.name}.${propertyName}`);
    
    try {
      const result = method.apply(this, args);
      
      if (result instanceof Promise) {
        return result.finally(() => stopTiming());
      } else {
        stopTiming();
        return result;
      }
    } catch (error) {
      stopTiming();
      throw error;
    }
  };

  return descriptor;
}