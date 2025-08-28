// 성능 측정을 위한 유틸리티 함수들

export interface PerformanceData {
  timestamp: number
  renderCount: number
  renderTime: number
  memoryUsage?: number
}

export class PerformanceTracker {
  private data: PerformanceData[] = []
  private startTime: number = 0

  start(): void {
    this.startTime = performance.now()
  }

  end(renderCount: number): PerformanceData {
    const endTime = performance.now()
    const renderTime = endTime - this.startTime
    
    const performanceData: PerformanceData = {
      timestamp: Date.now(),
      renderCount,
      renderTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024
    }

    this.data.push(performanceData)
    return performanceData
  }

  getAverageRenderTime(): number {
    if (this.data.length === 0) return 0
    const totalTime = this.data.reduce((sum, data) => sum + data.renderTime, 0)
    return totalTime / this.data.length
  }

  getTotalRenderCount(): number {
    return this.data.reduce((sum, data) => sum + data.renderCount, 0)
  }

  getMemoryUsage(): number | undefined {
    const lastData = this.data[this.data.length - 1]
    return lastData?.memoryUsage
  }

  reset(): void {
    this.data = []
    this.startTime = 0
  }

  getData(): PerformanceData[] {
    return [...this.data]
  }
}

// 데이터 생성 유틸리티
export const generateTestData = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    value: Math.random() * 1000,
    name: `Item ${index}`,
    category: `Category ${Math.floor(index / 10)}`
  }))
}

// 성능 비교 함수
export const comparePerformance = (
  memoizedMetrics: PerformanceData[],
  nonMemoizedMetrics: PerformanceData[]
) => {
  const memoizedAvg = memoizedMetrics.reduce((sum, data) => sum + data.renderTime, 0) / memoizedMetrics.length
  const nonMemoizedAvg = nonMemoizedMetrics.reduce((sum, data) => sum + data.renderTime, 0) / nonMemoizedMetrics.length

  const improvement = ((nonMemoizedAvg - memoizedAvg) / nonMemoizedAvg) * 100

  return {
    memoizedAverage: memoizedAvg,
    nonMemoizedAverage: nonMemoizedAvg,
    improvement: improvement,
    isBetter: memoizedAvg < nonMemoizedAvg
  }
}
