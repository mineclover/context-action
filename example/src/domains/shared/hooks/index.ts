/**
 * Shared custom hooks across all domains
 * Following Context-Action framework patterns
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LogEntry, PerformanceMetrics } from '../types';

// Common logging hook pattern
export function useLogger(source?: string) {
  return useCallback((level: LogEntry['level'], message: string, data?: any) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      level,
      message,
      data,
      source
    };
    
    console.log(`[${source || 'App'}] ${level.toUpperCase()}: ${message}`, data || '');
    return entry;
  }, [source]);
}

// Performance monitoring hook
export function usePerformanceMonitor(operationName: string) {
  const metricsRef = useRef<PerformanceMetrics>({
    startTime: 0,
    operations: 0,
    errors: 0,
    avgResponseTime: 0
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
      avgResponseTime: (metricsRef.current.avgResponseTime + duration) / 2
    };
    
    return duration;
  }, []);

  const recordError = useCallback(() => {
    metricsRef.current.errors += 1;
  }, []);

  const getMetrics = useCallback(() => ({ ...metricsRef.current }), []);

  return { startTimer, endTimer, recordError, getMetrics };
}

// Debounced state hook
export function useDebouncedState<T>(initialValue: T, delay: number) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue, setValue] as const;
}

// Async state management hook
export function useAsyncState<T>(initialValue: T) {
  const [state, setState] = useState<{
    data: T;
    loading: boolean;
    error: Error | null;
  }>({
    data: initialValue,
    loading: false,
    error: null
  });

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, error: null }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  const execute = useCallback(async <R,>(
    asyncFn: () => Promise<R>,
    onSuccess?: (result: R) => T
  ): Promise<R | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await asyncFn();
      
      if (onSuccess) {
        setData(onSuccess(result));
      }
      
      setLoading(false);
      return result;
    } catch (error) {
      setError(error as Error);
      return null;
    }
  }, [setData, setError, setLoading]);

  return {
    ...state,
    setData,
    setLoading,
    setError,
    execute
  };
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

// Local storage hook with type safety
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(value) : value;
      setValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  }, [key]);

  return [value, setStoredValue] as const;
}