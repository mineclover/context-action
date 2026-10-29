import { useEffect, useRef } from 'react';

interface RerenderMetrics {
  renderCount: number;
  renderRate: number; // renders per second
  lastRenderTime: number;
  totalTime: number;
  averageRenderTime: number;
}

const RENDER_RATE_WINDOW_MS = 1000;
const MAX_DURATION_SAMPLES = 100;

/**
 * Counts committed renders in a rolling time window.
 *
 * Keeping timestamps (rather than cumulative elapsed durations) makes the
 * calculation independent of the number of samples that have already been
 * discarded and gives deterministic results when the clock is advanced in
 * tests.
 */
export function calculateRollingRenderRate(
  renderTimestamps: readonly number[],
  now: number,
  windowMs = RENDER_RATE_WINDOW_MS
): number {
  const windowStart = now - windowMs;
  return renderTimestamps.filter(
    (timestamp) => timestamp > windowStart && timestamp <= now
  ).length;
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
  const renderTimestampsRef = useRef<number[]>([]);
  const renderDurationsRef = useRef<number[]>([]);
  const renderRateRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;

    // Count committed renders only. Incrementing during render includes
    // discarded work and React StrictMode's development-only render pass.
    renderCountRef.current++;

    // Keep committed render timestamps for the rolling rate calculation.
    renderTimestampsRef.current.push(now);
    const oldestTimestamp = now - RENDER_RATE_WINDOW_MS;
    renderTimestampsRef.current = renderTimestampsRef.current.filter(
      (timestamp) => timestamp > oldestTimestamp
    );

    // Store elapsed time separately for the average duration metric.
    if (renderDurationsRef.current.length >= MAX_DURATION_SAMPLES) {
      renderDurationsRef.current.shift();
    }
    renderDurationsRef.current.push(timeSinceLastRender);

    renderRateRef.current = calculateRollingRenderRate(
      renderTimestampsRef.current,
      now
    );
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
    renderDurationsRef.current.length > 0
      ? renderDurationsRef.current.reduce((sum, time) => sum + time, 0) /
        renderDurationsRef.current.length
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
  const warningCallbackRef = useRef(warningCallback);
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  useEffect(() => {
    warningCallbackRef.current = warningCallback;
  }, [warningCallback]);

  const { renderCount, renderRate } = metrics;

  useEffect(() => {
    if (renderRate > threshold) {
      if (!hasWarned.current) {
        console.warn(
          `⚠️ Performance Warning: Excessive re-renders detected!`,
          `\n  Current rate: ${renderRate}/sec`,
          `\n  Threshold: ${threshold}/sec`,
          `\n  Total renders: ${renderCount}`
        );

        if (warningCallbackRef.current) {
          warningCallbackRef.current(metricsRef.current);
        }

        hasWarned.current = true;
      }
    } else {
      hasWarned.current = false;
    }
  }, [renderCount, renderRate, threshold]);

  return renderRate <= threshold;
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
