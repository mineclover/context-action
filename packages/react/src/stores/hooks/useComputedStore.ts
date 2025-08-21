/**
 * Computed Store Pattern - Automated derived state management
 * 
 * Manages automatically computed derived state based on one or more stores.
 * Optimizes performance by recalculating only when dependencies change.
 * Essential for complex applications with derived data relationships.
 * 
 * @module stores/hooks/useComputedStore
 */

import { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { createStore } from '../core/Store';
import type { Store } from '../core/Store';
import { useStoreValue } from './useStoreValue';
import { defaultEqualityFn } from './useStoreSelector';

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
    cacheSize = 10
  } = config;
  
  const computeRef = useRef(compute);
  const equalityFnRef = useRef(equalityFn);
  const cacheRef = useRef<Array<{ input: T; output: R }>>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  computeRef.current = compute;
  equalityFnRef.current = equalityFn;
  
  // 현재 Store 값 구독
  const currentValue = useStoreValue(store);
  
  // 계산된 값 상태
  const [computedValue, setComputedValue] = useState<R>(() => {
    try {
      return config.initialValue !== undefined 
        ? config.initialValue 
        : compute(currentValue);
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else if (debug) {
        console.error(`useComputedStore [${name}]: Error in initial computation:`, error);
      }
      throw error;
    }
  });
  
  // 캐시에서 값 찾기
  const findCachedValue = useCallback((input: T): R | undefined => {
    if (!enableCache) return undefined;
    
    const cached = cacheRef.current.find(entry => 
      defaultEqualityFn(entry.input, input)
    );
    
    return cached?.output;
  }, [enableCache]);
  
  // 캐시에 값 저장
  const setCachedValue = useCallback((input: T, output: R) => {
    if (!enableCache) return;
    
    // 동일한 입력이 이미 있다면 업데이트
    const existingIndex = cacheRef.current.findIndex(entry => 
      defaultEqualityFn(entry.input, input)
    );
    
    if (existingIndex !== -1) {
      cacheRef.current[existingIndex] = { input, output };
    } else {
      // 새 엔트리 추가
      cacheRef.current.push({ input, output });
      
      // 캐시 크기 제한
      if (cacheRef.current.length > cacheSize) {
        cacheRef.current.shift(); // 가장 오래된 것 제거
      }
    }
    
    if (debug) {
      console.debug(`useComputedStore [${name}]: Cache updated`, {
        cacheSize: cacheRef.current.length,
        input,
        output
      });
    }
  }, [enableCache, cacheSize, debug, name]);
  
  // 실제 계산 수행
  const performComputation = useCallback((input: T) => {
    try {
      // 캐시 확인
      const cachedValue = findCachedValue(input);
      if (cachedValue !== undefined) {
        if (debug) {
          console.debug(`useComputedStore [${name}]: Using cached value`);
        }
        return cachedValue;
      }
      
      // 계산 수행
      const startTime = debug ? Date.now() : 0;
      const result = computeRef.current(input);
      
      if (debug) {
        const duration = Date.now() - startTime;
        console.debug(`useComputedStore [${name}]: Computed in ${duration}ms`, {
          input,
          result
        });
      }
      
      // 캐시 저장
      setCachedValue(input, result);
      
      return result;
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else if (debug) {
        console.error(`useComputedStore [${name}]: Error in computation:`, error);
      }
      throw error;
    }
  }, [findCachedValue, setCachedValue, debug, name, onError]);
  
  // 디바운스된 계산 업데이트
  const updateComputedValue = useCallback((newInput: T) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    const doUpdate = () => {
      const newComputedValue = performComputation(newInput);
      
      if (!equalityFnRef.current(computedValue, newComputedValue)) {
        setComputedValue(newComputedValue);
      }
    };
    
    if (debounceMs && debounceMs > 0) {
      debounceTimerRef.current = setTimeout(doUpdate, debounceMs);
    } else {
      doUpdate();
    }
  }, [computedValue, performComputation, debounceMs]);
  
  // Store 값 변경 시 재계산
  useEffect(() => {
    updateComputedValue(currentValue);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentValue, updateComputedValue]);
  
  return computedValue;
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
    debounceMs,
    enableCache = false,
    cacheSize = 10
  } = finalConfig;
  
  const computeRef = useRef(compute);
  const equalityFnRef = useRef(equalityFn);
  const cacheRef = useRef<Array<{ inputs: any[]; output: R }>>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  computeRef.current = compute;
  equalityFnRef.current = equalityFn;
  
  // 모든 Store 값 구독 - Hook 규칙을 지키기 위해 개별적으로 호출
  const currentValues = useMemo(() => {
    return stores.map(store => store.getValue());
  }, [stores]);
  
  // 각 store 변경을 감지하기 위한 effect
  useEffect(() => {
    const unsubscribeFunctions: Array<() => void> = [];
    
    stores.forEach(store => {
      const unsubscribe = store.subscribe(() => {
        // Store가 변경되면 강제 리렌더링을 위해 forceUpdate 트리거
        setComputedValue(prev => {
          const newValues = stores.map(s => s.getValue());
          try {
            const newComputed = computeRef.current(newValues);
            return equalityFnRef.current(prev, newComputed) ? prev : newComputed;
          } catch (error) {
            if (onError) {
              onError(error as Error);
            } else if (debug) {
              console.error(`useMultiComputedStore [${name}]: Error in computation:`, error);
            }
            return prev;
          }
        });
      });
      unsubscribeFunctions.push(unsubscribe);
    });
    
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [stores, name, debug, onError]);
  
  // 계산된 값 상태
  const [computedValue, setComputedValue] = useState<R>(() => {
    try {
      return finalConfig.initialValue !== undefined 
        ? finalConfig.initialValue 
        : compute(currentValues);
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else if (debug) {
        console.error(`useMultiComputedStore [${name}]: Error in initial computation:`, error);
      }
      throw error;
    }
  });
  
  // 캐시에서 값 찾기
  const findCachedValue = useCallback((inputs: any[]): R | undefined => {
    if (!enableCache) return undefined;
    
    const cached = cacheRef.current.find(entry => 
      entry.inputs.length === inputs.length &&
      entry.inputs.every((input, index) => defaultEqualityFn(input, inputs[index]))
    );
    
    return cached?.output;
  }, [enableCache]);
  
  // 캐시에 값 저장
  const setCachedValue = useCallback((inputs: any[], output: R) => {
    if (!enableCache) return;
    
    // 새 엔트리 추가
    cacheRef.current.push({ inputs: [...inputs], output });
    
    // 캐시 크기 제한
    if (cacheRef.current.length > cacheSize) {
      cacheRef.current.shift(); // 가장 오래된 것 제거
    }
    
    if (debug) {
      console.debug(`useMultiComputedStore [${name}]: Cache updated`, {
        cacheSize: cacheRef.current.length,
        inputs,
        output
      });
    }
  }, [enableCache, cacheSize, debug, name]);
  
  // 실제 계산 수행
  const performComputation = useCallback((inputs: any[]) => {
    try {
      // 캐시 확인
      const cachedValue = findCachedValue(inputs);
      if (cachedValue !== undefined) {
        if (debug) {
          console.debug(`useMultiComputedStore [${name}]: Using cached value`);
        }
        return cachedValue;
      }
      
      // 계산 수행
      const startTime = debug ? Date.now() : 0;
      const result = computeRef.current(inputs);
      
      if (debug) {
        const duration = Date.now() - startTime;
        console.debug(`useMultiComputedStore [${name}]: Computed in ${duration}ms`, {
          inputs,
          result
        });
      }
      
      // 캐시 저장
      setCachedValue(inputs, result);
      
      return result;
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else if (debug) {
        console.error(`useMultiComputedStore [${name}]: Error in computation:`, error);
      }
      throw error;
    }
  }, [findCachedValue, setCachedValue, debug, name, onError]);
  
  // 디바운스된 계산 업데이트
  const updateComputedValue = useCallback((newInputs: any[]) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    const doUpdate = () => {
      const newComputedValue = performComputation(newInputs);
      
      if (!equalityFnRef.current(computedValue, newComputedValue)) {
        setComputedValue(newComputedValue);
      }
    };
    
    if (debounceMs && debounceMs > 0) {
      debounceTimerRef.current = setTimeout(doUpdate, debounceMs);
    } else {
      doUpdate();
    }
  }, [computedValue, performComputation, debounceMs]);
  
  // Store 값들 변경 시 재계산
  useEffect(() => {
    updateComputedValue(currentValues);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentValues, updateComputedValue]);
  
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