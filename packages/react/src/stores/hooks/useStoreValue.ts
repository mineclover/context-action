import { useMemo, useDeferredValue } from 'react';
import { shallowEqual, defaultEqualityFn } from './useStoreSelector';
import type { Store } from '../core/Store';
import type { React18Options } from '../../hooks/react18-hooks';
import { 
  useSafeStoreSubscription
} from '../utils/sync-external-store-utils';

/**
 * Create a type assertion helper for stores created with initial values
 */
export function assertStoreValue<T>(value: T | undefined, storeName: string): T {
  if (value === undefined) {
    throw new Error(
      `Store "${storeName}" returned undefined value. ` +
      'This should not happen with properly initialized stores.'
    );
  }
  return value;
}

/**
 * Performance-optimized store value hook with advanced features
 * 
 * Enhanced version of useStoreValue that prevents unnecessary re-renders through
 * intelligent subscription management, selective updates, debouncing, throttling,
 * and conditional subscription. Follows React best practices and hooks rules.
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks
 * 
 * @public
 */

/**
 * Performance optimization options for useStoreValue hook
 * 
 * Advanced configuration options for controlling subscription behavior,
 * comparison strategies, timing controls, debugging features, and React 18+ optimizations.
 * 
 * @template R - The type of the selected/computed value
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#performance-best-practices
 * 
 * @public
 */
export interface StoreValueOptions<R> {
  /** Custom equality comparison function to determine when to trigger re-renders */
  equalityFn?: (a: R, b: R) => boolean;
  
  /** Lazy subscription - only start subscribing when condition is met */
  lazy?: boolean;
  
  /** Subscription condition - pause subscription when false */
  condition?: () => boolean;
  
  /** Debounce delay in milliseconds - groups rapid changes together */
  debounce?: number;
  
  /** Throttle interval in milliseconds - limits update frequency */
  throttle?: number;
  
  /** Initial value to use before first subscription */
  initialValue?: R;
  
  /** Default value when subscription is suspended */
  suspendedValue?: R;
  
  /** Enable debug logging for subscription behavior */
  debug?: boolean;
  
  /** Hook name for debugging purposes */
  name?: string;

  /** React 18+ optimizations */
  react18?: React18Options;
}

// Store가 확정된 경우 - 기본 구독
export function useStoreValue<T>(
  store: Store<T>, 
  options?: StoreValueOptions<T>
): T;

// Store가 undefined일 수 있는 경우 - 안전한 구독
export function useStoreValue<T>(
  store: Store<T> | undefined | null,
  options?: StoreValueOptions<T>
): T | undefined;

// Store가 확정된 경우 + selector - 선택적 구독
export function useStoreValue<T, R>(
  store: Store<T>, 
  selector: (value: T) => R,
  options?: StoreValueOptions<R>
): R;

// Store가 undefined일 수 있는 경우 + selector - 안전한 선택적 구독  
export function useStoreValue<T, R>(
  store: Store<T> | undefined | null, 
  selector: (value: T) => R,
  options?: StoreValueOptions<R>
): R | undefined;

export function useStoreValue<T, R>(
  store: Store<T> | undefined | null,
  selectorOrOptions?: ((value: T) => R) | StoreValueOptions<T>,
  options?: StoreValueOptions<R>
): T | R | undefined {
  // 파라미터 정규화
  const selector = typeof selectorOrOptions === 'function' ? selectorOrOptions : undefined;
  const finalOptions = (typeof selectorOrOptions === 'function' ? options : selectorOrOptions) || {};
  
  const {
    equalityFn = defaultEqualityFn,
    lazy = false,
    condition,
    debounce,
    throttle,
    initialValue,
    suspendedValue,
    debug = false,
    name = store?.name || 'unknown',
    react18 = {}
  } = finalOptions;
  
  
  // useSyncExternalStore 기반 구독
  const subscriptionOptions = {
    debug,
    name,
    equalityFn: equalityFn as (a: R, b: R) => boolean,
    initialValue: initialValue as R,
    ...(debounce !== undefined && { debounce }),
    ...(throttle !== undefined && { throttle }),
    ...(condition && { condition }),
    ...(lazy && !condition && { condition: () => false })
  };
  
  const rawValue = useSafeStoreSubscription(
    store,
    selector,
    subscriptionOptions
  );
  
  // 구독이 비활성화된 경우 처리
  const processedValue = useMemo(() => {
    if (lazy && condition && !condition()) {
      return suspendedValue !== undefined ? suspendedValue : initialValue;
    }
    return rawValue;
  }, [rawValue, lazy, condition, suspendedValue, initialValue]);

  // React 18+ 최적화 적용
  const {
    enableDeferred = false,
    priorityThreshold = 1000
  } = react18;

  // Deferred value 적용 (대용량 객체나 복잡한 상태에 대해)
  const deferredProcessedValue = useDeferredValue(processedValue);

  // 복잡도에 따른 지연 처리 결정
  const finalValue = useMemo(() => {
    if (!enableDeferred) return processedValue;
    
    // 복잡도 계산 - 객체 크기나 배열 길이로 판단
    const shouldDefer = (() => {
      if (typeof processedValue === 'object' && processedValue !== null) {
        try {
          const size = JSON.stringify(processedValue).length;
          return size > priorityThreshold;
        } catch {
          return true; // JSON 변환 불가능한 복잡한 객체
        }
      }
      return false;
    })();

    if (shouldDefer && debug) {
      console.debug(`useStoreValue [${name}]: Using deferred value for complex state`);
    }

    return shouldDefer ? deferredProcessedValue : processedValue;
  }, [processedValue, deferredProcessedValue, enableDeferred, priorityThreshold, debug, name]);
  
  return finalValue;
}

/**
 * Hook for selecting multiple values from a store with optimized re-renders
 * 
 * Subscribes to multiple computed values from a single store using selector functions.
 * Optimizes performance by only triggering re-renders when the selected values change,
 * using shallow comparison to detect changes in the combined result object.
 * 
 * @template T - Type of the store value
 * @template S - Type of the selectors object mapping keys to selector functions
 * 
 * @param store - The store to subscribe to (can be undefined for conditional usage)
 * @param selectors - Object mapping result keys to selector functions
 * 
 * @returns Object with selected values, or undefined if store is undefined
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#usestoreselector-advanced-usage
 *
 * @public\n */
export function useStoreValues<T, S extends Record<string, (value: T) => any>>(
  store: Store<T> | undefined | null,
  selectors: S
): { [K in keyof S]: ReturnType<S[K]> } | undefined {
  // 통합 선택자 함수 생성
  const selectorFunction = useMemo(() => {
    return (value: T) => {
      const result = {} as { [K in keyof S]: ReturnType<S[K]> };
      for (const [key, selector] of Object.entries(selectors)) {
        result[key as keyof S] = selector(value);
      }
      return result;
    };
  }, [selectors]);
  
  // useSyncExternalStore 기반 구독
  const storeValue = useSafeStoreSubscription(
    store,
    selectorFunction,
    {
      equalityFn: shallowEqual,
      name: `${store?.name || 'unknown'}-values`
    }
  ) as { [K in keyof S]: ReturnType<S[K]> } | undefined;
  
  return store ? storeValue : undefined;
}