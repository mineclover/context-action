/**
 * Store domain hooks
 * Specialized hooks for store pattern implementations
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStoreValue } from '@context-action/react';
import type { PerformanceMetrics } from '../../shared/types';
import { PerformanceService } from '../../shared/services';

// Hook for tracking store performance metrics
export function useStorePerformanceTracking(storeName: string, store: any) {
  const performanceService = PerformanceService.getInstance();
  const updateCountRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());

  // Track store updates
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      updateCountRef.current += 1;
      const now = Date.now();
      const duration = now - lastUpdateTimeRef.current;
      
      // Record performance metric
      performanceService.startMeasurement(`${storeName}-update`);
      setTimeout(() => {
        performanceService.endMeasurement(`${storeName}-update-${updateCountRef.current}`, `${storeName}-update`);
      }, 0);
      
      lastUpdateTimeRef.current = now;
    });

    return unsubscribe;
  }, [store, storeName, performanceService]);

  const getMetrics = useCallback((): PerformanceMetrics | null => {
    return performanceService.getAggregatedMetrics(`${storeName}-update`);
  }, [storeName, performanceService]);

  const resetMetrics = useCallback(() => {
    performanceService.clearMetrics(`${storeName}-update`);
    updateCountRef.current = 0;
  }, [storeName, performanceService]);

  return {
    updateCount: updateCountRef.current,
    getMetrics,
    resetMetrics
  };
}

// Hook for store value comparison strategies
export function useStoreValueComparison<T>(
  store: any,
  selector?: (value: any) => T,
  options?: {
    comparison?: 'reference' | 'shallow' | 'deep';
    customComparator?: (prev: T, next: T) => boolean;
  }
) {
  const [comparisonStats, setComparisonStats] = useState({
    comparisons: 0,
    preventedRenders: 0,
    lastComparisonTime: 0
  });

  const value = useStoreValue(store, selector || ((v: T) => v), options);

  // Track comparison statistics
  useEffect(() => {
    let comparisonCount = 0;
    let preventedCount = 0;

    const unsubscribe = store.subscribe((newValue: any, previousValue: any) => {
      comparisonCount++;
      
      if (options?.customComparator) {
        const selectedNew = selector ? selector(newValue) : newValue;
        const selectedPrev = selector ? selector(previousValue) : previousValue;
        
        if (options.customComparator(selectedPrev, selectedNew)) {
          preventedCount++;
        }
      }

      setComparisonStats({
        comparisons: comparisonCount,
        preventedRenders: preventedCount,
        lastComparisonTime: Date.now()
      });
    });

    return unsubscribe;
  }, [store, selector, options]);

  return {
    value,
    stats: comparisonStats,
    efficiency: comparisonStats.comparisons > 0 
      ? (comparisonStats.preventedRenders / comparisonStats.comparisons * 100).toFixed(1) + '%'
      : '0%'
  };
}

// Hook for conditional store subscriptions
export function useConditionalStoreSubscription<T>(
  store: any | null,
  condition: boolean,
  selector?: (value: any) => T,
  defaultValue?: T
) {
  const [subscriptionStats, setSubscriptionStats] = useState({
    isSubscribed: false,
    subscriptionTime: 0,
    updates: 0
  });

  const conditionalStore = condition ? store : null;
  const value = useStoreValue(conditionalStore, selector || ((v: any) => v));

  useEffect(() => {
    if (condition && store) {
      const startTime = Date.now();
      let updateCount = 0;
      
      setSubscriptionStats(prev => ({
        ...prev,
        isSubscribed: true,
        subscriptionTime: startTime
      }));

      const unsubscribe = store.subscribe(() => {
        updateCount++;
        setSubscriptionStats(prev => ({
          ...prev,
          updates: updateCount
        }));
      });

      return () => {
        unsubscribe();
        setSubscriptionStats(prev => ({
          ...prev,
          isSubscribed: false
        }));
      };
    } else {
      setSubscriptionStats(prev => ({
        ...prev,
        isSubscribed: false,
        updates: 0
      }));
      return () => {}; // 빈 cleanup 함수 반환
    }
  }, [condition, store]);

  return {
    value: value ?? defaultValue,
    stats: subscriptionStats
  };
}

// Hook for store value memoization patterns
export function useMemoizedStoreSelector<T, R>(
  store: any,
  selector: (value: T) => R,
  deps: React.DependencyList
) {
  const memoizedSelector = useCallback(selector, deps);
  const [selectorStats, setSelectorStats] = useState({
    creations: 0,
    calls: 0,
    lastCallTime: 0
  });

  // Track selector recreation
  useEffect(() => {
    setSelectorStats(prev => ({
      ...prev,
      creations: prev.creations + 1
    }));
  }, [memoizedSelector]);

  // Wrap selector to track calls
  const trackedSelector = useCallback((value: T) => {
    setSelectorStats(prev => ({
      ...prev,
      calls: prev.calls + 1,
      lastCallTime: Date.now()
    }));
    return memoizedSelector(value);
  }, [memoizedSelector]);

  const value = useStoreValue(store, trackedSelector);

  return {
    value,
    stats: selectorStats,
    isStable: selectorStats.creations === 1
  };
}

// Hook for store validation patterns
export function useStoreValidation<T>(
  store: any,
  validators: Array<(value: T) => string | null>,
  options?: {
    validateOnChange?: boolean;
    debounceMs?: number;
  }
) {
  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    errors: string[];
    lastValidation: number;
    validationCount: number;
  }>({
    isValid: true,
    errors: [],
    lastValidation: 0,
    validationCount: 0
  });

  const value = useStoreValue(store);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  const validate = useCallback((valueToValidate: T) => {
    const errors: string[] = [];
    
    for (const validator of validators) {
      const error = validator(valueToValidate);
      if (error) {
        errors.push(error);
      }
    }

    setValidationState(prev => ({
      isValid: errors.length === 0,
      errors,
      lastValidation: Date.now(),
      validationCount: prev.validationCount + 1
    }));

    return errors.length === 0;
  }, [validators]);

  useEffect(() => {
    if (options?.validateOnChange !== false) {
      if (options?.debounceMs) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        
        debounceTimeoutRef.current = setTimeout(() => {
          validate(value as T);
        }, options.debounceMs);
      } else {
        validate(value as T);
      }
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [value, validate, options?.validateOnChange, options?.debounceMs]);

  return {
    ...validationState,
    validate: (customValue?: T) => validate(customValue ?? (value as T))
  };
}

// Hook for store debugging and inspection
export function useStoreDebugger(storeName: string, store: any, enabled: boolean = true) {
  const [debugInfo, setDebugInfo] = useState({
    subscriptions: 0,
    updates: 0,
    currentValue: null as any,
    updateHistory: [] as Array<{ timestamp: number; value: any; previousValue: any }>,
    subscribers: [] as string[]
  });

  useEffect(() => {
    if (!enabled) return;

    let updateCount = 0;
    const history: typeof debugInfo.updateHistory = [];

    const unsubscribe = store.subscribe((newValue: any, previousValue: any) => {
      updateCount++;
      const update = {
        timestamp: Date.now(),
        value: newValue,
        previousValue
      };
      
      history.push(update);
      if (history.length > 50) { // Keep last 50 updates
        history.shift();
      }

      setDebugInfo(prev => ({
        ...prev,
        updates: updateCount,
        currentValue: newValue,
        updateHistory: [...history]
      }));

      // Console logging for debugging
      console.group(`[${storeName}] Store Update #${updateCount}`);
      console.log('Previous:', previousValue);
      console.log('Current:', newValue);
      console.log('Timestamp:', new Date(update.timestamp).toISOString());
      console.groupEnd();
    });

    // Initial state
    setDebugInfo(prev => ({
      ...prev,
      currentValue: store.getValue(),
      subscriptions: prev.subscriptions + 1
    }));

    return () => {
      unsubscribe();
      setDebugInfo(prev => ({
        ...prev,
        subscriptions: Math.max(0, prev.subscriptions - 1)
      }));
    };
  }, [enabled, store, storeName]);

  const exportDebugData = useCallback(() => {
    return {
      storeName,
      timestamp: Date.now(),
      ...debugInfo
    };
  }, [storeName, debugInfo]);

  const clearHistory = useCallback(() => {
    setDebugInfo(prev => ({
      ...prev,
      updateHistory: []
    }));
  }, []);

  return {
    debugInfo,
    exportDebugData,
    clearHistory,
    isDebugging: enabled
  };
}