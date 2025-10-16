import { useEffect, useRef } from 'react';

interface RerenderMetrics {
  renderCount: number;
  renderRate: number; // renders per second
  lastRenderTime: number;
  totalTime: number;
  averageRenderTime: number;
}

/**
 * Hook to monitor component re-renders and calculate performance metrics
 *
 * @param componentName - Name for identifying the component in logs
 * @param logToConsole - Whether to log metrics to console
 * @returns Metrics object with render statistics
 */
export function useRerenderMonitor(
  componentName: string,
  logToConsole = false
): RerenderMetrics {
  const renderCountRef = useRef(0);
  const firstRenderTimeRef = useRef(Date.now());
  const lastRenderTimeRef = useRef(Date.now());
  const renderTimesRef = useRef<number[]>([]);
  const renderRateRef = useRef(0);

  // Increment render count on each render
  renderCountRef.current++;

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;

    // Store render time for averaging
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current.shift(); // Keep only last 100 renders
    }
    renderTimesRef.current.push(timeSinceLastRender);

    // Calculate render rate (renders per second over last second)
    const oneSecondAgo = now - 1000;
    const recentRenders = renderTimesRef.current.filter((_, index) => {
      const renderTime =
        now -
        renderTimesRef.current
          .slice(index)
          .reduce((sum, time) => sum + time, 0);
      return renderTime >= oneSecondAgo;
    }).length;

    renderRateRef.current = recentRenders;
    lastRenderTimeRef.current = now;

    if (logToConsole) {
      console.log(
        `📊 [${componentName}] Render #${renderCountRef.current}`,
        `| Rate: ${renderRateRef.current}/sec`,
        `| Time since last: ${timeSinceLastRender}ms`
      );
    }
  });

  // Calculate metrics
  const totalTime = Date.now() - firstRenderTimeRef.current;
  const averageRenderTime =
    renderTimesRef.current.length > 0
      ? renderTimesRef.current.reduce((sum, time) => sum + time, 0) /
        renderTimesRef.current.length
      : 0;

  return {
    renderCount: renderCountRef.current,
    renderRate: renderRateRef.current,
    lastRenderTime: lastRenderTimeRef.current,
    totalTime,
    averageRenderTime,
  };
}

/**
 * Hook to detect potential performance issues from excessive re-renders
 *
 * @param threshold - Maximum allowed renders per second
 * @param warningCallback - Function to call when threshold is exceeded
 * @returns Boolean indicating if performance is within acceptable range
 */
export function usePerformanceWarning(
  threshold = 10,
  warningCallback?: (metrics: RerenderMetrics) => void
): boolean {
  const metrics = useRerenderMonitor('PerformanceCheck', false);
  const hasWarned = useRef(false);

  useEffect(() => {
    if (metrics.renderRate > threshold) {
      if (!hasWarned.current) {
        console.warn(
          `⚠️ Performance Warning: Excessive re-renders detected!`,
          `\n  Current rate: ${metrics.renderRate}/sec`,
          `\n  Threshold: ${threshold}/sec`,
          `\n  Total renders: ${metrics.renderCount}`
        );

        if (warningCallback) {
          warningCallback(metrics);
        }

        hasWarned.current = true;
      }
    } else {
      hasWarned.current = false;
    }
  }, [metrics, threshold, warningCallback]);

  return metrics.renderRate <= threshold;
}

/**
 * Hook for comparative performance monitoring between two components
 */
export function useComparativeMonitor() {
  const metricsMap = useRef<Map<string, RerenderMetrics>>(new Map());

  const updateMetrics = (componentName: string, metrics: RerenderMetrics) => {
    metricsMap.current.set(componentName, metrics);
  };

  const getComparison = () => {
    const entries = Array.from(metricsMap.current.entries());
    if (entries.length < 2) return null;

    const [name1, metrics1] = entries[0]!;
    const [name2, metrics2] = entries[1]!;

    return {
      [name1]: metrics1,
      [name2]: metrics2,
      difference: {
        renderCount: Math.abs(metrics1.renderCount - metrics2.renderCount),
        renderRate: Math.abs(metrics1.renderRate - metrics2.renderRate),
        averageTime: Math.abs(
          metrics1.averageRenderTime - metrics2.averageRenderTime
        ),
      },
      winner: metrics1.renderCount < metrics2.renderCount ? name1 : name2,
    };
  };

  return {
    updateMetrics,
    getComparison,
  };
}

export default useRerenderMonitor;
