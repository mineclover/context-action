// 성능 측정을 위한 유틸리티 함수들

export interface PerformanceData {
  timestamp: number;
  renderCount: number;
  renderTime: number;
  memoryUsage?: number;
}

export class PerformanceTracker {
  private data: PerformanceData[] = [];
  private startTime: number = 0;

  start(): void {
    this.startTime = performance.now();
  }

  end(renderCount: number): PerformanceData {
    const endTime = performance.now();
    const renderTime = endTime - this.startTime;

    const performanceData: PerformanceData = {
      timestamp: Date.now(),
      renderCount,
      renderTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024,
    };

    this.data.push(performanceData);
    return performanceData;
  }

  getAverageRenderTime(): number {
    if (this.data.length === 0) return 0;
    const totalTime = this.data.reduce((sum, data) => sum + data.renderTime, 0);
    return totalTime / this.data.length;
  }

  /**
   * Returns the latest cumulative render count.
   *
   * `PerformanceData.renderCount` is a snapshot from the monitor, so adding
   * snapshots together counts the same renders repeatedly.
   */
  getTotalRenderCount(): number {
    return this.data[this.data.length - 1]?.renderCount ?? 0;
  }

  getMemoryUsage(): number | undefined {
    const lastData = this.data[this.data.length - 1];
    return lastData?.memoryUsage;
  }

  reset(): void {
    this.data = [];
    this.startTime = 0;
  }

  getData(): PerformanceData[] {
    return [...this.data];
  }
}

// 성능 비교 함수
export interface PerformanceComparison {
  memoizedAverage: number | null;
  nonMemoizedAverage: number | null;
  improvement: number | null;
  isBetter: boolean | null;
  available: boolean;
  reason?: 'no-samples' | 'zero-baseline';
}

export const comparePerformance = (
  memoizedMetrics: PerformanceData[],
  nonMemoizedMetrics: PerformanceData[]
): PerformanceComparison => {
  const memoizedAvg =
    memoizedMetrics.length > 0
      ? memoizedMetrics.reduce((sum, data) => sum + data.renderTime, 0) /
        memoizedMetrics.length
      : null;
  const nonMemoizedAvg =
    nonMemoizedMetrics.length > 0
      ? nonMemoizedMetrics.reduce((sum, data) => sum + data.renderTime, 0) /
        nonMemoizedMetrics.length
      : null;

  if (memoizedAvg === null || nonMemoizedAvg === null) {
    return {
      memoizedAverage: memoizedAvg,
      nonMemoizedAverage: nonMemoizedAvg,
      improvement: null,
      isBetter: null,
      available: false,
      reason: 'no-samples',
    };
  }

  if (nonMemoizedAvg <= 0) {
    return {
      memoizedAverage: memoizedAvg,
      nonMemoizedAverage: nonMemoizedAvg,
      improvement: null,
      isBetter: null,
      available: false,
      reason: 'zero-baseline',
    };
  }

  return {
    memoizedAverage: memoizedAvg,
    nonMemoizedAverage: nonMemoizedAvg,
    improvement: ((nonMemoizedAvg - memoizedAvg) / nonMemoizedAvg) * 100,
    isBetter: memoizedAvg < nonMemoizedAvg,
    available: true,
  };
};
