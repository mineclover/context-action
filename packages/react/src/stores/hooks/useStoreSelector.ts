/**
 * Store Selector Hook - Performance optimization through selective subscription
 * 
 * Advanced store subscription hooks that prevent unnecessary re-renders by subscribing
 * to specific parts of store data using selector functions and intelligent equality comparison.
 * Essential for building high-performance React applications with complex state management.
 * 
 * @module stores/hooks/useStoreSelector
 */

import { useSyncExternalStore, useCallback, useRef } from 'react';
import type { Store } from '../core/Store';
import { equalityFunctions } from '../utils/sync-external-store-utils';

// Re-export equality functions from utils
export const defaultEqualityFn = equalityFunctions.smart; // 똑똑한 자동 동등성 함수
export const shallowEqual = equalityFunctions.shallow;
export const deepEqual = equalityFunctions.deep;
export const smartEqual = equalityFunctions.smart;

/**
 * Hook for selective store subscription with performance optimization
 * 
 * Subscribes to specific parts of store data using a selector function,
 * triggering re-renders only when the selected value actually changes.
 * Essential for preventing unnecessary re-renders in complex applications.
 * 
 * @template T - Type of the store value
 * @template R - Type of the value returned by the selector
 * 
 * @param store - Store instance to subscribe to
 * @param selector - Function to extract needed data from store value
 * @param equalityFn - Function to compare previous and new values (default: Object.is)
 * 
 * @returns The value returned by the selector function
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#usestoreselector-advanced-usage
 * 
 * @public
 */
export function useStoreSelector<T, R>(
  store: Store<T>,
  selector: (value: T) => R,
  equalityFn: (a: R, b: R) => boolean = defaultEqualityFn
): R {
  "use memo";
  // Selector를 안정적으로 유지
  const stableSelector = useCallback(selector, [selector]);
  
  // EqualityFn을 안정적으로 유지
  const stableEqualityFn = useCallback(equalityFn, [equalityFn]);
  
  // 개발 모드에서 selector 변경 경고
  const selectorWarningShownRef = useRef(false);
  
  if (process.env.NODE_ENV === 'development') {
    if (selector !== stableSelector && !selectorWarningShownRef.current) {
      console.warn(
        'useStoreSelector: selector function changed. ' +
        'Consider wrapping it with useCallback to avoid unnecessary recalculations.',
        'Store:', store.name
      );
      selectorWarningShownRef.current = true;
    }
  }
  
  // 동등성 비교를 위한 이전 값 추적
  const previousValueRef = useRef<R | undefined>(undefined);
  
  // useSyncExternalStore를 사용한 구독
  const subscribe = useCallback((callback: () => void) => {
    return store.subscribe(callback);
  }, [store]);
  
  const getSnapshot = useCallback((): R => {
    try {
      const storeValue = store.getValue();
      const selectedValue = stableSelector(storeValue);
      
      // 동등성 비교를 위한 최적화
      if (previousValueRef.current !== undefined && stableEqualityFn(previousValueRef.current, selectedValue)) {
        return previousValueRef.current;
      }
      
      previousValueRef.current = selectedValue;
      return selectedValue;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('useStoreSelector: Error in selector function:', error);
      }
      throw error;
    }
  }, [store, stableSelector, stableEqualityFn]);
  
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}


