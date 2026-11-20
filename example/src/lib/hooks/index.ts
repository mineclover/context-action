/**
 * Shared custom hooks across all domains
 * Following Context-Action framework patterns
 */

import { useCallback, useEffect, useRef } from 'react';
import type { PerformanceMetrics } from './types';

// Performance monitoring hook
export function usePerformanceMonitor() {
  const metricsRef = useRef<PerformanceMetrics>({
    startTime: 0,
    operations: 0,
    errors: 0,
    avgResponseTime: 0,
  });

  const startTimer = useCallback(() => {
    metricsRef.current.startTime = performance.now();
  }, []);

  const endTimer = useCallback(() => {
    const endTime = performance.now();
    const duration = endTime - metricsRef.current.startTime;

    metricsRef.current = {
      ...metricsRef.current,
      endTime,
      duration,
      operations: metricsRef.current.operations + 1,
      avgResponseTime: (metricsRef.current.avgResponseTime + duration) / 2,
    };

    return duration;
  }, []);

  const recordError = useCallback(() => {
    metricsRef.current.errors += 1;
  }, []);

  const getMetrics = useCallback(() => ({ ...metricsRef.current }), []);

  return { startTimer, endTimer, recordError, getMetrics };
}

// Safe timeout hook
export function useSafeTimeout() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setSafeTimeout = useCallback((callback: () => void, delay: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(callback, delay);
  }, []);

  const clearSafeTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearSafeTimeout();
    };
  }, [clearSafeTimeout]);

  return { setSafeTimeout, clearSafeTimeout };
}
