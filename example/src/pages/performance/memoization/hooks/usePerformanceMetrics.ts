import { useState, useCallback, useRef } from 'react'

interface PerformanceMetrics {
  renderCount: number
  averageRenderTime: number
  totalRenderTime: number
  memoryUsage?: number
}

interface UsePerformanceMetricsReturn {
  metrics: PerformanceMetrics
  startMeasurement: () => void
  endMeasurement: () => void
  resetMetrics: () => void
}

export const usePerformanceMetrics = (): UsePerformanceMetricsReturn => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    totalRenderTime: 0
  })

  const startTimeRef = useRef<number>(0)
  const renderCountRef = useRef<number>(0)

  const startMeasurement = useCallback(() => {
    startTimeRef.current = performance.now()
  }, [])

  const endMeasurement = useCallback(() => {
    const endTime = performance.now()
    const renderTime = endTime - startTimeRef.current
    
    renderCountRef.current += 1
    
    setMetrics(prev => {
      const newTotalTime = prev.totalRenderTime + renderTime
      const newAverageTime = newTotalTime / renderCountRef.current
      
      return {
        renderCount: renderCountRef.current,
        averageRenderTime: newAverageTime,
        totalRenderTime: newTotalTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024
      }
    })
  }, [])

  const resetMetrics = useCallback(() => {
    renderCountRef.current = 0
    setMetrics({
      renderCount: 0,
      averageRenderTime: 0,
      totalRenderTime: 0
    })
  }, [])

  return {
    metrics,
    startMeasurement,
    endMeasurement,
    resetMetrics
  }
}
