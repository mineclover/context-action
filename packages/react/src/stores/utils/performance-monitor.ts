/**
 * @fileoverview Performance Monitoring System
 * 
 * Centralized performance monitoring for Context-Action framework operations.
 * Tracks store operations, subscription performance, and React rendering metrics.
 */

/**
 * Performance metrics for store operations
 */
export interface StorePerformanceMetrics {
  operationType: 'setValue' | 'update' | 'subscribe' | 'getSnapshot';
  storeName: string;
  duration: number;
  timestamp: number;
  payload?: {
    valueSize?: number;
    listenerCount?: number;
    batchSize?: number;
    hasError?: boolean;
  };
}

/**
 * Performance statistics aggregation
 */
export interface PerformanceStats {
  totalOperations: number;
  averageDuration: number;
  slowestOperation: StorePerformanceMetrics | null;
  operationsByType: Record<string, number>;
  operationsByStore: Record<string, number>;
  recentOperations: StorePerformanceMetrics[];
}

/**
 * Performance threshold configuration
 */
export interface PerformanceThresholds {
  setValue: number;
  update: number;
  subscribe: number;
  getSnapshot: number;
  batchUpdate: number;
}

/**
 * Default performance thresholds (in milliseconds)
 */
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  setValue: 10,
  update: 15,
  subscribe: 5,
  getSnapshot: 2,
  batchUpdate: 20
};

/**
 * Centralized performance monitoring system
 */
class PerformanceMonitor {
  private metrics: StorePerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds = { ...DEFAULT_THRESHOLDS };
  private maxMetrics = 1000;
  private isEnabled = process.env.NODE_ENV === 'development';

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * Update performance thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Record a performance metric
   */
  record(metric: StorePerformanceMetrics): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);
    
    // Limit metrics array size
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Check for performance issues
    const threshold = this.thresholds[metric.operationType];
    if (metric.duration > threshold) {
      console.warn(
        `[Context-Action] Performance warning: ${metric.operationType} on "${metric.storeName}" took ${metric.duration}ms (threshold: ${threshold}ms)`,
        metric
      );
    }
  }

  /**
   * Measure and record a store operation
   */
  measure<T>(
    operationType: StorePerformanceMetrics['operationType'],
    storeName: string,
    operation: () => T,
    payload?: StorePerformanceMetrics['payload']
  ): T {
    if (!this.isEnabled) {
      return operation();
    }

    const startTime = performance.now();
    
    try {
      const result = operation();
      
      const duration = performance.now() - startTime;
      const metrics = {
        operationType,
        storeName,
        duration,
        timestamp: Date.now(),
        ...(payload && { payload })
      };
      
      this.record(metrics);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.record({
        operationType,
        storeName,
        duration,
        timestamp: Date.now(),
        payload: { ...payload, hasError: true }
      });
      
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    const recentOperations = this.metrics.slice(-50); // Recent 50 operations
    
    const operationsByType: Record<string, number> = {};
    const operationsByStore: Record<string, number> = {};
    let totalDuration = 0;
    let slowestOperation: StorePerformanceMetrics | null = null;

    this.metrics.forEach(metric => {
      // Count by type
      operationsByType[metric.operationType] = (operationsByType[metric.operationType] || 0) + 1;
      
      // Count by store
      operationsByStore[metric.storeName] = (operationsByStore[metric.storeName] || 0) + 1;
      
      // Duration calculations
      totalDuration += metric.duration;
      
      // Find slowest operation
      if (!slowestOperation || metric.duration > slowestOperation.duration) {
        slowestOperation = metric;
      }
    });

    return {
      totalOperations: this.metrics.length,
      averageDuration: this.metrics.length > 0 ? totalDuration / this.metrics.length : 0,
      slowestOperation,
      operationsByType,
      operationsByStore,
      recentOperations
    };
  }

  /**
   * Get performance warnings
   */
  getWarnings(): string[] {
    const warnings: string[] = [];
    const stats = this.getStats();
    
    // Check average duration
    if (stats.averageDuration > 5) {
      warnings.push(`Average operation duration is high: ${stats.averageDuration.toFixed(2)}ms`);
    }
    
    // Check for slow stores
    for (const [storeName] of Object.entries(stats.operationsByStore)) {
      const storeMetrics = this.metrics.filter(m => m.storeName === storeName);
      const averageDuration = storeMetrics.reduce((sum, m) => sum + m.duration, 0) / storeMetrics.length;
      
      if (averageDuration > 10) {
        warnings.push(`Store "${storeName}" has slow operations: ${averageDuration.toFixed(2)}ms average`);
      }
    }
    
    return warnings;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): StorePerformanceMetrics[] {
    return [...this.metrics];
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance measurement decorator
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  operationType: StorePerformanceMetrics['operationType'],
  storeName: string
) {
  return function (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<T>) {
    const method = descriptor.value!;
    
    descriptor.value = function (this: any, ...args: any[]) {
      return performanceMonitor.measure(
        operationType,
        storeName,
        () => method.apply(this, args),
        {
          listenerCount: this.getListenerCount?.(),
        }
      );
    } as T;
  };
}

// Development-only global access
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__contextActionPerformance = performanceMonitor;
}