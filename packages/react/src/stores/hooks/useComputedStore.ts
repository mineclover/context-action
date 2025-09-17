/**
 * Computed Store Pattern - Automated derived state management
 * 
 * Manages automatically computed derived state based on one or more stores.
 * Optimizes performance by recalculating only when dependencies change.
 * Essential for complex applications with derived data relationships.
 * 
 * @module stores/hooks/useComputedStore
 */

import { useMemo, useRef, useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { createStore } from '../core/Store';
import type { Store } from '../core/Store';
import { defaultEqualityFn } from './useStoreSelector';
import { useSafeStoreSubscription, useMultiStoreSubscription } from '../utils/sync-external-store-utils';

/**
 * Configuration options for computed store hooks
 * 
 * Comprehensive configuration interface for controlling computed store behavior,
 * including performance optimizations, debugging, error handling, and caching strategies.
 * 
 * @template R - Type of the computed value
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#performance-optimized-with-caching
 * 
 * @public
 */
export interface ComputedStoreConfig<R> {
  /** Equality comparison function for computed values */
  equalityFn?: (a: R, b: R) => boolean;
  
  /** Enable debug logging for computation tracking */
  debug?: boolean;
  
  /** Name identifier for the computed store (used in debugging) */
  name?: string;
  
  /** Initial value used before first computation */
  initialValue?: R;
  
  /** Error handler for computation failures */
  onError?: (error: Error) => void;
  
  /** Debounce delay for computation in milliseconds */
  debounceMs?: number;
  
  /** Enable result caching for performance optimization */
  enableCache?: boolean;
  
  /** Maximum number of cached results to maintain */
  cacheSize?: number;
}

/**
 * Hook for computed store based on a single source store
 * 
 * Creates a derived value that automatically recalculates when the source store changes.
 * Includes performance optimizations like caching, debouncing, and intelligent re-computation
 * to prevent unnecessary work. Perfect for derived state patterns.
 * 
 * @template T - Type of the source store value
 * @template R - Type of the computed result
 * 
 * @param store - Source store to derive from
 * @param compute - Function to compute derived value from store value
 * @param config - Optional configuration for performance and debugging
 * 
 * @returns The computed value that updates when source store changes
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#usecomputedstore-patterns
 * 
 * @public
 */
export function useComputedStore<T, R>(
  store: Store<T>,
  compute: (value: T) => R,
  config: ComputedStoreConfig<R> = {}
): R {
  const {
    equalityFn = defaultEqualityFn,
    debug = false,
    name = 'computed',
    onError,
    debounceMs,
    enableCache = false,
    cacheSize = 10,
    initialValue
  } = config;

  // Refs for stable references
  const computeRef = useRef(compute);
  const cacheRef = useRef<Map<T, R>>(new Map());
  const lastComputedRef = useRef<R>();
  const lastInputRef = useRef<T>();

  // Update compute function ref on every render
  computeRef.current = compute;

  // Cache management functions
  const getCachedValue = useCallback((input: T): R | undefined => {
    if (!enableCache) return undefined;

    // Check if we have exact same input reference
    if (lastInputRef.current === input && lastComputedRef.current !== undefined) {
      return lastComputedRef.current;
    }

    // Check cache map
    for (const [cachedInput, cachedOutput] of cacheRef.current) {
      if (defaultEqualityFn(cachedInput, input)) {
        if (debug) {
          console.debug(`useComputedStore [${name}]: Using cached value`);
        }
        return cachedOutput;
      }
    }

    return undefined;
  }, [enableCache, debug, name]);

  const setCachedValue = useCallback((input: T, output: R) => {
    if (!enableCache) return;

    // Update last computed values
    lastInputRef.current = input;
    lastComputedRef.current = output;

    // Update cache map
    cacheRef.current.set(input, output);

    // Limit cache size
    if (cacheRef.current.size > cacheSize) {
      const firstKey = cacheRef.current.keys().next().value;
      if (firstKey !== undefined) {
        cacheRef.current.delete(firstKey);
      }
    }

    if (debug) {
      console.debug(`useComputedStore [${name}]: Cache updated`, {
        cacheSize: cacheRef.current.size,
        input,
        output
      });
    }
  }, [enableCache, cacheSize, debug, name]);

  // Computation selector function for useSyncExternalStore
  const computeSelector = useCallback((value: T): R => {
    try {
      // Check cache first
      const cached = getCachedValue(value);
      if (cached !== undefined) {
        return cached;
      }

      // Perform computation
      const startTime = debug ? performance.now() : 0;
      const result = computeRef.current(value);

      if (debug) {
        const duration = performance.now() - startTime;
        console.debug(`useComputedStore [${name}]: Computed in ${duration.toFixed(2)}ms`, {
          input: value,
          result
        });
      }

      // Cache the result and update last computed
      setCachedValue(value, result);
      lastComputedRef.current = result;

      return result;
    } catch (error) {
      if (onError) {
        onError(error as Error);
        // Return last valid value or initial value on error
        const fallbackValue = lastComputedRef.current !== undefined
          ? lastComputedRef.current
          : initialValue as R;
        return fallbackValue;
      }

      if (debug) {
        console.error(`useComputedStore [${name}]: Error in computation:`, error);
      }

      // Re-throw if no error handler
      throw error;
    }
  }, [getCachedValue, setCachedValue, debug, name, onError, initialValue]);

  // Use optimized subscription with selector
  const computedValue = useSafeStoreSubscription(
    store,
    computeSelector,
    {
      equalityFn,
      debounce: debounceMs,
      debug,
      name: `computed-${name}`,
      initialValue
    }
  );

  return computedValue as R;
}

/**
 * 여러 Store 기반 Computed Hook
 * 
 * @template T1, T2, R Store 타입들과 결과 타입
 * @param stores 의존성 Store들
 * @param compute 계산 함수
 * @param config 설정 옵션
 * @returns 계산된 값
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#usecomputedstore-patterns
 */
export function useMultiComputedStore<R>(
  stores: Store<any>[],
  compute: (values: any[]) => R,
  config?: ComputedStoreConfig<R>
): R {
  const finalConfig = config || {};
  const {
    equalityFn = defaultEqualityFn,
    debug = false,
    name = 'multiComputed',
    onError,
    enableCache = false,
    cacheSize = 10,
    initialValue
  } = finalConfig;

  // Refs for stable references
  const computeRef = useRef(compute);
  const cacheRef = useRef<Map<string, R>>(new Map());
  const lastComputedRef = useRef<R>();
  const lastInputsRef = useRef<any[]>();

  // Update compute function ref
  computeRef.current = compute;

  // Create cache key from inputs
  const getCacheKey = useCallback((inputs: any[]): string => {
    try {
      return JSON.stringify(inputs);
    } catch {
      // Fallback for non-serializable inputs
      return inputs.map((v, i) => `${i}:${typeof v}`).join(',');
    }
  }, []);

  // Cache management
  const getCachedValue = useCallback((inputs: any[]): R | undefined => {
    if (!enableCache) return undefined;

    // Check if inputs are exactly the same reference
    if (lastInputsRef.current === inputs && lastComputedRef.current !== undefined) {
      return lastComputedRef.current;
    }

    // Check if inputs are equal to last inputs
    if (lastInputsRef.current &&
        lastInputsRef.current.length === inputs.length &&
        lastInputsRef.current.every((v, i) => defaultEqualityFn(v, inputs[i]))) {
      return lastComputedRef.current;
    }

    // Check cache map
    const key = getCacheKey(inputs);
    const cached = cacheRef.current.get(key);

    if (cached !== undefined && debug) {
      console.debug(`useMultiComputedStore [${name}]: Using cached value`);
    }

    return cached;
  }, [enableCache, debug, name, getCacheKey]);

  const setCachedValue = useCallback((inputs: any[], output: R) => {
    if (!enableCache) return;

    // Update last computed values
    lastInputsRef.current = inputs;
    lastComputedRef.current = output;

    // Update cache map
    const key = getCacheKey(inputs);
    cacheRef.current.set(key, output);

    // Limit cache size
    if (cacheRef.current.size > cacheSize) {
      const firstKey = cacheRef.current.keys().next().value;
      if (firstKey !== undefined) {
        cacheRef.current.delete(firstKey);
      }
    }

    if (debug) {
      console.debug(`useMultiComputedStore [${name}]: Cache updated`, {
        cacheSize: cacheRef.current.size,
        inputs,
        output
      });
    }
  }, [enableCache, cacheSize, debug, name, getCacheKey]);

  // Computation selector for multi-store subscription
  const computeSelector = useCallback((values: any[]): R => {
    try {
      // Check cache first
      const cached = getCachedValue(values);
      if (cached !== undefined) {
        return cached;
      }

      // Perform computation
      const startTime = debug ? performance.now() : 0;
      const result = computeRef.current(values);

      if (debug) {
        const duration = performance.now() - startTime;
        console.debug(`useMultiComputedStore [${name}]: Computed in ${duration.toFixed(2)}ms`, {
          inputs: values,
          result
        });
      }

      // Cache the result and update last computed
      setCachedValue(values, result);
      lastComputedRef.current = result;

      return result;
    } catch (error) {
      if (onError) {
        onError(error as Error);
        // Return last valid value or initial value on error
        const fallbackValue = lastComputedRef.current !== undefined
          ? lastComputedRef.current
          : initialValue as R;
        return fallbackValue;
      }

      if (debug) {
        console.error(`useMultiComputedStore [${name}]: Error in computation:`, error);
      }

      throw error;
    }
  }, [getCachedValue, setCachedValue, debug, name, onError, initialValue]);

  // Use optimized multi-store subscription
  const computedValue = useMultiStoreSubscription(
    stores as any,
    computeSelector,
    equalityFn
  );

  return computedValue;
}

/**
 * Computed Store 인스턴스를 생성하는 Hook
 * 
 * 계산된 값을 실제 Store 인스턴스로 반환하여 다른 곳에서 구독할 수 있게 합니다.
 * 
 * @template T1, T2, R Store 타입들과 결과 타입
 * @param dependencies 의존성 Store들
 * @param compute 계산 함수
 * @param config 설정 옵션
 * @returns 계산된 값을 가진 Store 인스턴스
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#computed-store-instances
 */
export function useComputedStoreInstance<R>(
  dependencies: Store<any>[],
  compute: (values: any[]) => R,
  config?: ComputedStoreConfig<R>
): Store<R> {
  const finalConfig = config || {};
  const computedValue = useMultiComputedStore(dependencies, compute, config);
  
  // Computed Store 인스턴스를 메모이제이션
  const computedStore = useMemo(() => {
    const storeName = finalConfig.name || `computed-${Date.now()}`;
    const store = createStore(storeName, computedValue);
    
    if (finalConfig.debug) {
      console.log(`useComputedStoreInstance: Created store [${storeName}]`);
    }
    
    return store;
  }, [finalConfig.name, finalConfig.debug, computedValue]);
  
  // 계산된 값이 변경될 때마다 Store 업데이트
  useEffect(() => {
    computedStore.setValue(computedValue);
  }, [computedValue, computedStore]);
  
  return computedStore;
}

/**
 * 비동기 계산을 지원하는 Computed Store Hook
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#async-computed-patterns
 */
export function useAsyncComputedStore<R>(
  dependencies: Store<any>[],
  compute: (values: any[]) => Promise<R>,
  config: ComputedStoreConfig<R> & { 
    loadingValue?: R;
    errorValue?: R;
  } = {}
): { 
  value: R; 
  loading: boolean; 
  error: Error | null; 
  reload: () => void;
} {
  const {
    initialValue,
    loadingValue,
    errorValue,
    name = 'asyncComputed',
    debug = false,
    onError
  } = config;
  
  // Dependencies 값 구독 - Hook 규칙을 지키기 위해 수정
  const currentValues = useMemo(() => {
    return dependencies.map(store => store.getValue());
  }, [dependencies]);
  const [state, setState] = useState<{
    value: R;
    loading: boolean;
    error: Error | null;
  }>(() => ({
    value: initialValue || loadingValue as R,
    loading: false,
    error: null
  }));
  
  const computeRef = useRef(compute);
  computeRef.current = compute;
  
  const reload = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await computeRef.current(currentValues);
      setState({ value: result, loading: false, error: null });
      
      if (debug) {
        console.debug(`useAsyncComputedStore [${name}]: Async computation completed`, result);
      }
    } catch (error) {
      const err = error as Error;
      setState({ 
        value: errorValue !== undefined ? errorValue : state.value, 
        loading: false, 
        error: err 
      });
      
      if (onError) {
        onError(err);
      } else if (debug) {
        console.error(`useAsyncComputedStore [${name}]: Async computation failed:`, err);
      }
    }
  }, [currentValues, errorValue, state.value, name, debug, onError]);
  
  // 의존성 변경 시 재계산
  useEffect(() => {
    reload();
  }, [reload]);
  
  return {
    value: state.value,
    loading: state.loading,
    error: state.error,
    reload
  };
}