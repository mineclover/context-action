// biome-ignore-all lint/suspicious/noExplicitAny: generic store implementation boundary.

import { useMemo } from 'react';
import { shallowEqual, defaultEqualityFn } from './useStoreSelector';
import type { IStore } from '../core/types';
import { useSafeStoreSubscription } from '../utils/sync-external-store-utils';

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
 * comparison strategies, timing controls, debugging features, and concurrent-rendering optimizations.
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

  /** Subscription condition - pause subscription when false */
  condition?: () => boolean;

  /** Debounce delay in milliseconds - groups rapid changes together */
  debounce?: number;

  /** Throttle interval in milliseconds - limits update frequency */
  throttle?: number;

  /** Initial value to use before first subscription */
  initialValue?: R;

  /** Enable debug logging for subscription behavior */
  debug?: boolean;

  /** Hook name for debugging purposes */
  name?: string;
}

type StoreValueOf<S extends IStore<any>> = ReturnType<S['getValue']>;

// Store가 확정된 경우 - 기본 구독
export function useStoreValue<S extends IStore<any>>(
  store: S,
  options?: StoreValueOptions<StoreValueOf<S>>
): StoreValueOf<S>;

// Store가 undefined일 수 있는 경우 - 안전한 구독
export function useStoreValue<S extends IStore<any>>(
  store: S | undefined | null,
  options?: StoreValueOptions<StoreValueOf<S>>
): StoreValueOf<S> | undefined;

// Store가 확정된 경우 + selector - 선택적 구독
export function useStoreValue<S extends IStore<any>, R>(
  store: S,
  selector: (value: StoreValueOf<S>) => R,
  options?: StoreValueOptions<R>
): R;

// Store가 undefined일 수 있는 경우 + selector - 안전한 선택적 구독
export function useStoreValue<S extends IStore<any>, R>(
  store: S | undefined | null,
  selector: (value: StoreValueOf<S>) => R,
  options?: StoreValueOptions<R>
): R | undefined;

export function useStoreValue<T, R>(
  store: IStore<T> | undefined | null,
  selectorOrOptions?: ((value: T) => R) | StoreValueOptions<T>,
  options?: StoreValueOptions<R>
): T | R | undefined {
  "use memo";
  // 파라미터 정규화
  const selector = typeof selectorOrOptions === 'function' ? selectorOrOptions : undefined;
  const finalOptions = (typeof selectorOrOptions === 'function' ? options : selectorOrOptions) || {};

  const {
    equalityFn = defaultEqualityFn,
    condition,
    debounce,
    throttle,
    initialValue,
    debug = false,
    name = store?.name || 'unknown'
  } = finalOptions;

  // useSyncExternalStore 기반 구독
  const subscriptionOptions = {
    debug,
    name,
    equalityFn: equalityFn as (a: R, b: R) => boolean,
    initialValue: initialValue as R,
    ...(debounce !== undefined && { debounce }),
    ...(throttle !== undefined && { throttle }),
    ...(condition && { condition })
  };

  const value = useSafeStoreSubscription(
    store,
    selector,
    subscriptionOptions
  );

  return value;
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
  store: IStore<T> | undefined | null,
  selectors: S
): { [K in keyof S]: ReturnType<S[K]> } | undefined {
  "use memo";
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
