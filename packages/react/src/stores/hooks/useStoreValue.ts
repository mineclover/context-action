import { useEffect, useRef, useState, useMemo } from 'react';
import { useStoreSelector, shallowEqual, defaultEqualityFn } from './useStoreSelector';
import type { Store } from '../core/Store';

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
 * @example Basic Store Subscription
 * ```typescript
 * const counterStore = createStore('counter', 0)
 * const count = useStoreValue(counterStore) // Re-renders only when value actually changes
 * ```
 * 
 * @example Selective Subscription
 * ```typescript
 * const userStore = createStore('user', { 
 *   id: '1', 
 *   name: 'John', 
 *   email: 'john@example.com' 
 * })
 * 
 * // Only re-renders when name changes, ignores email/id changes
 * const userName = useStoreValue(userStore, user => user.name)
 * ```
 * 
 * @example Shallow Comparison for Objects
 * ```typescript
 * const profileStore = createStore('profile', { 
 *   name: 'John', 
 *   settings: { theme: 'dark' } 
 * })
 * 
 * // Uses shallow comparison to prevent unnecessary re-renders
 * const profile = useStoreValue(profileStore, user => user, shallowEqual)
 * ```
 * 
 * @example Conditional Subscription
 * ```typescript
 * const dataStore = createStore('data', { items: [] })
 * 
 * // Only subscribes when shouldSubscribe is true
 * const items = useStoreValue(dataStore, data => data.items, {
 *   lazy: true,
 *   condition: () => shouldSubscribe
 * })
 * ```
 * 
 * @example Debounced Subscription
 * ```typescript
 * const searchStore = createStore('search', { query: '', results: [] })
 * 
 * // Groups rapid changes together with 300ms debounce
 * const debouncedQuery = useStoreValue(searchStore, search => search.query, {
 *   debounce: 300
 * })
 * ```
 * 
 * @public
 */

/**
 * Performance optimization options for useStoreValue hook
 * 
 * Advanced configuration options for controlling subscription behavior,
 * comparison strategies, timing controls, and debugging features.
 * 
 * @template R - The type of the selected/computed value
 * 
 * @example
 * ```typescript
 * const options: StoreValueOptions<string> = {
 *   equalityFn: (a, b) => a.trim() === b.trim(),
 *   lazy: true,
 *   condition: () => isActive,
 *   debounce: 300,
 *   debug: true,
 *   name: 'searchQuery'
 * }
 * ```
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
    name = store?.name || 'unknown'
  } = finalOptions;
  
  // Hook 규칙을 지키기 위해 모든 Hook을 조건부 이전에 호출
  const [isActive, setIsActive] = useState(() => store && !lazy && (!condition || condition()));
  const conditionRef = useRef(condition);
  conditionRef.current = condition;
  
  // 조건 체크
  useEffect(() => {
    if (!condition) return;
    
    const checkCondition = () => {
      const shouldBeActive = condition();
      setIsActive(current => {
        if (current !== shouldBeActive) {
          if (debug) {
            console.debug(`useStoreValue [${name}]: Subscription ${shouldBeActive ? 'activated' : 'suspended'}`);
          }
          return shouldBeActive;
        }
        return current;
      });
    };
    
    // 즉시 체크
    checkCondition();
    
    // 주기적 체크 (최적화 필요시 조건에 따라 조정)
    const interval = setInterval(checkCondition, 100);
    return () => clearInterval(interval);
  }, [condition, debug, name]);
  
  // 지연 활성화
  useEffect(() => {
    if (lazy && !isActive && (!condition || condition())) {
      setIsActive(true);
    }
  }, [lazy, isActive, condition]);
  
  // 디바운스/스로틀 관리
  const [debouncedValue, setDebouncedValue] = useState<T | R | undefined>(initialValue);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const throttleLastExecRef = useRef<number>(0);
  const latestValueRef = useRef<T | R | undefined>(initialValue);
  
  // 실제 Store 구독 - Hook 규칙 준수: 모든 Hook을 조건부 이전에 호출
  const selectorFunction = useMemo(() => {
    if (selector) {
      return selector;
    }
    return (value: T) => value as unknown as R;
  }, [selector]);
  
  // store가 null/undefined인 경우를 처리하면서 Hook 규칙 준수
  const dummyStore = useMemo(() => {
    if (store) return store;
    // Dummy store for Hook rules compliance
    return { getValue: () => undefined, subscribe: () => () => {}, getSnapshot: () => ({ value: undefined }) } as any;
  }, [store]);
  
  const rawStoreValue = useStoreSelector(dummyStore, selectorFunction, equalityFn as (a: R, b: R) => boolean);
  
  const currentStoreValue = useMemo(() => {
    if (!isActive) {
      return suspendedValue !== undefined ? suspendedValue : initialValue;
    }
    return rawStoreValue;
  }, [rawStoreValue, isActive, suspendedValue, initialValue]);
  
  // 디바운스/스로틀 처리
  const processedValue = useMemo(() => {
    if (!isActive) {
      return suspendedValue !== undefined ? suspendedValue : initialValue;
    }
    
    latestValueRef.current = currentStoreValue as T | R | undefined;
    
    // 디바운스 처리
    if (debounce && debounce > 0) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedValue(latestValueRef.current);
        if (debug) {
          console.debug(`useStoreValue [${name}]: Debounced value updated after ${debounce}ms`);
        }
      }, debounce);
      
      return debouncedValue;
    }
    
    // 스로틀 처리  
    if (throttle && throttle > 0) {
      const now = Date.now();
      if (now - throttleLastExecRef.current >= throttle) {
        throttleLastExecRef.current = now;
        if (debug) {
          console.debug(`useStoreValue [${name}]: Throttled value updated`);
        }
        return currentStoreValue;
      }
      return debouncedValue; // 이전 값 유지
    }
    
    return currentStoreValue;
  }, [currentStoreValue, isActive, debounce, throttle, debouncedValue, suspendedValue, initialValue, debug, name]);
  
  // 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  return processedValue;
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
 * @example Basic Multi-Selection
 * ```typescript
 * const userStore = createStore('user', { 
 *   id: '1', 
 *   name: 'John', 
 *   email: 'john@example.com',
 *   settings: { theme: 'dark', notifications: true }
 * })
 * 
 * const { name, theme } = useStoreValues(userStore, {
 *   name: user => user.name,
 *   theme: user => user.settings.theme
 * })
 * 
 * // Component only re-renders when name or theme changes
 * // Changes to email or settings.notifications are ignored
 * ```
 * 
 * @example Complex Selections
 * ```typescript
 * const appStore = createStore('app', {
 *   user: { name: 'John', role: 'admin' },
 *   ui: { sidebar: true, theme: 'dark' },
 *   data: { items: [], loading: false }
 * })
 * 
 * const { userName, isAdmin, itemCount, isDark } = useStoreValues(appStore, {
 *   userName: app => app.user.name,
 *   isAdmin: app => app.user.role === 'admin',
 *   itemCount: app => app.data.items.length,
 *   isDark: app => app.ui.theme === 'dark'
 * })
 * ```
 * 
 * @example Conditional Usage
 * ```typescript\n * // Safe to use with potentially undefined stores
 * const result = useStoreValues(maybeUndefinedStore, {\n *   value1: data => data.field1,\n *   value2: data => data.field2\n * })\n * \n * if (result) {\n *   const { value1, value2 } = result\n *   // Use selected values\n * }\n * ```\n * \n * @public\n */
export function useStoreValues<T, S extends Record<string, (value: T) => any>>(
  store: Store<T> | undefined | null,
  selectors: S
): { [K in keyof S]: ReturnType<S[K]> } | undefined {
  // Hook 규칙 준수: 조건부 이전에 모든 Hook 호출
  const selectorFunction = useMemo(() => {
    return (value: T) => {
      const result = {} as { [K in keyof S]: ReturnType<S[K]> };
      for (const [key, selector] of Object.entries(selectors)) {
        result[key as keyof S] = selector(value);
      }
      return result;
    };
  }, [selectors]);
  
  // store가 null/undefined인 경우를 처리하면서 Hook 규칙 준수
  const dummyStoreForValues = useMemo(() => {
    if (store) return store;
    // Dummy store for Hook rules compliance
    return { getValue: () => undefined as any, subscribe: () => () => {}, getSnapshot: () => ({ value: undefined }) } as any;
  }, [store]);
  
  const storeValue = useStoreSelector(dummyStoreForValues, selectorFunction, shallowEqual);
  
  return store ? storeValue : undefined;
}