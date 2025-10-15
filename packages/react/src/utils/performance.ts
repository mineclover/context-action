/**
 * @fileoverview Performance Monitoring Utilities
 * 
 * 성능 모니터링 및 최적화를 위한 유틸리티 함수들
 */

interface PerformanceMetrics {
  dispatchCount: number;
  lastDispatchTime: number;
  averageDispatchTime: number;
  slowDispatchCount: number;
  memoryUsage: number;
  renderCount: number;
  lastRenderTime: number;
}

interface PerformanceThresholds {
  slowDispatchThreshold: number; // ms
  memoryWarningThreshold: number; // MB
  renderWarningThreshold: number; // ms
}

/**
 * 성능 모니터링 클래스
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    dispatchCount: 0,
    lastDispatchTime: 0,
    averageDispatchTime: 0,
    slowDispatchCount: 0,
    memoryUsage: 0,
    renderCount: 0,
    lastRenderTime: 0,
  };

  private thresholds: PerformanceThresholds = {
    slowDispatchThreshold: 16, // 60fps 기준
    memoryWarningThreshold: 100, // 100MB
    renderWarningThreshold: 16, // 60fps 기준
  };

  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();

  private constructor() {
    this.startMemoryMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Store 업데이트 성능 측정
   */
  measureStoreUpdate(storeName: string, duration: number): void {
    this.metrics.dispatchCount++;
    this.metrics.lastDispatchTime = duration;
    
    // 평균 계산
    this.metrics.averageDispatchTime = 
      (this.metrics.averageDispatchTime * (this.metrics.dispatchCount - 1) + duration) / 
      this.metrics.dispatchCount;

    // 느린 업데이트 카운트
    if (duration > this.thresholds.slowDispatchThreshold) {
      this.metrics.slowDispatchCount++;
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🐌 Slow store update: ${storeName} took ${duration}ms (threshold: ${this.thresholds.slowDispatchThreshold}ms)`);
      }
    }

    this.notifyListeners();
  }

  /**
   * 렌더링 성능 측정
   */
  measureRender(componentName: string, duration: number): void {
    this.metrics.renderCount++;
    this.metrics.lastRenderTime = duration;

    if (duration > this.thresholds.renderWarningThreshold) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🐌 Slow render: ${componentName} took ${duration}ms (threshold: ${this.thresholds.renderWarningThreshold}ms)`);
      }
    }

    this.notifyListeners();
  }

  /**
   * 메모리 사용량 모니터링 시작
   */
  private startMemoryMonitoring(): void {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        if (memory) {
          this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB

          if (this.metrics.memoryUsage > this.thresholds.memoryWarningThreshold) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`🧠 High memory usage: ${this.metrics.memoryUsage.toFixed(2)}MB (threshold: ${this.thresholds.memoryWarningThreshold}MB)`);
            }
          }
        }
      };

      // 5초마다 메모리 체크
      setInterval(checkMemory, 5000);
    }
  }

  /**
   * 성능 지표 구독
   */
  subscribe(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 리스너들에게 지표 알림
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.metrics);
      } catch (error) {
        console.error('Performance monitor listener error:', error);
      }
    });
  }

  /**
   * 현재 성능 지표 가져오기
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 임계값 설정
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * 성능 지표 리셋
   */
  resetMetrics(): void {
    this.metrics = {
      dispatchCount: 0,
      lastDispatchTime: 0,
      averageDispatchTime: 0,
      slowDispatchCount: 0,
      memoryUsage: 0,
      renderCount: 0,
      lastRenderTime: 0,
    };
    this.notifyListeners();
  }

  /**
   * 성능 리포트 생성
   */
  generateReport(): string {
    const { metrics, thresholds } = this;
    
    return `
🚀 Performance Report
====================
📊 Store Updates:
  - Total: ${metrics.dispatchCount}
  - Average: ${metrics.averageDispatchTime.toFixed(2)}ms
  - Slow (>${thresholds.slowDispatchThreshold}ms): ${metrics.slowDispatchCount}
  - Last: ${metrics.lastDispatchTime}ms

🎨 Renders:
  - Total: ${metrics.renderCount}
  - Last: ${metrics.lastRenderTime}ms
  - Slow (>${thresholds.renderWarningThreshold}ms): ${metrics.renderCount > 0 && metrics.lastRenderTime > thresholds.renderWarningThreshold ? 1 : 0}

🧠 Memory:
  - Usage: ${metrics.memoryUsage.toFixed(2)}MB
  - Warning threshold: ${thresholds.memoryWarningThreshold}MB
  - Status: ${metrics.memoryUsage > thresholds.memoryWarningThreshold ? '⚠️ HIGH' : '✅ OK'}
    `.trim();
  }
}

/**
 * 성능 측정을 위한 HOC
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const displayName = componentName || Component.displayName || Component.name || 'Component';
  
  const WrappedComponent = (props: P) => {
    const startTime = React.useRef<number>(0);
    const monitor = PerformanceMonitor.getInstance();

    React.useLayoutEffect(() => {
      startTime.current = performance.now();
    });

    React.useEffect(() => {
      const duration = performance.now() - startTime.current;
      monitor.measureRender(displayName, duration);
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  return WrappedComponent;
}

/**
 * Store 성능 측정을 위한 래퍼
 */
export function measureStorePerformance<T>(
  storeName: string,
  operation: () => T
): T {
  const startTime = performance.now();
  const result = operation();
  const duration = performance.now() - startTime;
  
  PerformanceMonitor.getInstance().measureStoreUpdate(storeName, duration);
  
  return result;
}

/**
 * 비동기 Store 성능 측정을 위한 래퍼
 */
export async function measureAsyncStorePerformance<T>(
  storeName: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  const result = await operation();
  const duration = performance.now() - startTime;
  
  PerformanceMonitor.getInstance().measureStoreUpdate(storeName, duration);
  
  return result;
}

// React import 추가
import React from 'react';
