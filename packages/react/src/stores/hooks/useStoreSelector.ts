/**
 * Store Selector Hook - Performance optimization through selective subscription
 * 
 * Advanced store subscription hooks that prevent unnecessary re-renders by subscribing
 * to specific parts of store data using selector functions and intelligent equality comparison.
 * Essential for building high-performance React applications with complex state management.
 * 
 * @module stores/hooks/useStoreSelector
 */

import type { StateReader, StateSnapshot } from '@context-action/store-core';
import { useCallback, useDebugValue, useRef, useSyncExternalStore } from 'react';
import { equalityFunctions } from '../utils/sync-external-store-utils';

function formatStoreSelectorDebugValue([storeName, value]: readonly [string, unknown]): string {
  return `${storeName}: ${typeof value === 'object' && value !== null ? 'object' : String(value)}`;
}

// Re-export equality functions from utils
export const defaultEqualityFn = equalityFunctions.smart; // 똑똑한 자동 동등성 함수
export const shallowEqual = equalityFunctions.shallow;
export const deepEqual = equalityFunctions.deep;

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
  store: StateReader<T, StateSnapshot<T>>,
  selector: (value: T) => R,
  equalityFn: (a: R, b: R) => boolean = defaultEqualityFn
): R {
  "use memo";
  // 동등성 비교를 위한 이전 값 추적
  const previousValueRef = useRef<
    { store: StateReader<T, StateSnapshot<T>>; value: R } | undefined
  >(undefined);
  
  // useSyncExternalStore를 사용한 구독
  const subscribe = useCallback((callback: () => void) => {
    return store.subscribe(callback);
  }, [store]);
  
  const getSnapshot = useCallback((): R => {
    try {
      const storeValue = store.getSnapshot().value;
      const selectedValue = selector(storeValue);
      
      // 동등성 비교를 위한 최적화
      const previous = previousValueRef.current;
      if (previous?.store === store && equalityFn(previous.value, selectedValue)) {
        return previous.value;
      }
      
      previousValueRef.current = { store, value: selectedValue };
      return selectedValue;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('useStoreSelector: Error in selector function:', error);
      }
      throw error;
    }
  }, [store, selector, equalityFn]);
  
  const selected = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useDebugValue([store.name, selected] as const, formatStoreSelectorDebugValue);
  return selected;
}
