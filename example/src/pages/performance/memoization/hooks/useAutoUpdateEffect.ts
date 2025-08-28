import { useEffect, useRef } from 'react';
import { usePerformanceControlState } from './usePerformanceControl';
import { useMemoizedActions, useNonMemoizedActions } from './useComparisonActions';

/**
 * Auto Update Effect Hook for Memoized Context
 */
export function useMemoizedAutoUpdateEffect() {
  const { autoUpdate, updateInterval } = usePerformanceControlState();
  const actions = useMemoizedActions();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoUpdate) {
      intervalRef.current = setInterval(() => {
        const random = Math.random();
        if (random < 0.25) {
          actions.increment();
        } else if (random < 0.5) {
          actions.decrement();
        } else if (random < 0.75) {
          actions.calculate(Math.floor(Math.random() * 20));
        } else if (random < 0.9) {
          actions.performHeavyOperation(Math.floor(Math.random() * 30) + 10);
        }
        // No memory task for memoized (to show difference)
      }, updateInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoUpdate, updateInterval, actions]);

  return null; // This hook only handles side effects
}

/**
 * Auto Update Effect Hook for NonMemoized Context
 */
export function useNonMemoizedAutoUpdateEffect() {
  const { autoUpdate, updateInterval } = usePerformanceControlState();
  const actions = useNonMemoizedActions();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoUpdate) {
      intervalRef.current = setInterval(() => {
        const random = Math.random();
        if (random < 0.25) {
          actions.increment();
        } else if (random < 0.5) {
          actions.decrement();
        } else if (random < 0.75) {
          actions.calculate(Math.floor(Math.random() * 20));
        } else if (random < 0.9) {
          actions.performHeavyOperation(Math.floor(Math.random() * 30) + 10);
        } else {
          actions.performMemoryTask(); // Only non-memoized gets memory task
        }
      }, updateInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoUpdate, updateInterval, actions]);

  return null; // This hook only handles side effects
}