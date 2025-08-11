import { useEffect, useRef, useState, useMemo } from 'react';
import { useStoreSelector, shallowEqual, defaultEqualityFn } from './useStoreSelector';
import type { Store } from '../core/Store';

/**
 * 성능 최적화된 Store Value Hook
 * 
 * 기존 useStoreValue를 성능 최적화하여 불필요한 리렌더링을 방지합니다.
 * 
 * @implements store-hooks
 * @implements fresh-state-access  
 * @implements type-safety
 * @implements performance-optimized
 * @memberof api-terms
 * @since 2.1.0
 * @example
 * ```typescript
 * // 기본 구독 - 성능 최적화됨
 * const counterStore = createStore('counter', 0);
 * const count = useStoreValue(counterStore); // 값이 실제 변경될 때만 리렌더
 * 
 * // 선택적 구독 - 특정 필드만 구독
 * const userStore = createStore('user', { id: '1', name: 'John', email: 'john@example.com' });
 * const userName = useStoreValue(userStore, user => user.name); // name 변경시만 리렌더
 * 
 * // 얕은 비교로 객체 구독
 * const profileStore = createStore('profile', { name: 'John', settings: { theme: 'dark' } });
 * const profile = useStoreValue(profileStore, user => user, shallowEqual);
 * 
 * // 지연 구독 - 조건에 따라 구독 시작
 * const dataStore = createStore('data', { items: [] });
 * const items = useStoreValue(dataStore, data => data.items, {
 *   lazy: true,
 *   condition: () => shouldSubscribe
 * });
 * 
 * // 디바운스된 구독 - 빠른 변경을 그룹화
 * const searchStore = createStore('search', { query: '', results: [] });
 * const debouncedQuery = useStoreValue(searchStore, search => search.query, {
 *   debounce: 300
 * });
 * ```
 */

/**
 * 성능 최적화 옵션
 */
export interface StoreValueOptions<R> {
  /** 동등성 비교 함수 */
  equalityFn?: (a: R, b: R) => boolean;
  
  /** 지연 구독 - 조건이 만족될 때만 구독 시작 */
  lazy?: boolean;
  
  /** 구독 조건 - false일 때 구독 중지 */
  condition?: () => boolean;
  
  /** 디바운스 지연 시간 (ms) */
  debounce?: number;
  
  /** 스로틀 간격 (ms) */
  throttle?: number;
  
  /** 초기값 (첫 구독 전까지 사용) */
  initialValue?: R;
  
  /** 구독 중지 시 기본값 */
  suspendedValue?: R;
  
  /** 디버그 정보 출력 */
  debug?: boolean;
  
  /** Hook 이름 (디버깅용) */
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
  
  // Store가 null/undefined인 경우 처리
  if (!store) {
    if (debug || process.env.NODE_ENV === 'development') {
      console.warn(
        `useStoreValue [${name}]: Store is null or undefined. ` +
        'Component might not be wrapped in proper Provider.'
      );
    }
    return initialValue !== undefined ? initialValue : undefined;
  }
  
  // 조건부 구독 상태 관리
  const [isActive, setIsActive] = useState(() => !lazy && (!condition || condition()));
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
  
  // 실제 Store 구독 (조건부)
  // Hook 규칙 준수: 조건부로 Hook을 호출할 수 없음
  const selectorFunction = useMemo(() => {
    if (selector) {
      return selector;
    }
    return (value: T) => value as unknown as R;
  }, [selector]);
  
  const rawStoreValue = useStoreSelector(store, selectorFunction, equalityFn as (a: R, b: R) => boolean);
  
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
 * Hook to get multiple values from a store using selectors
 * @implements selective-subscription
 * @memberof api-terms
 * 
 * Optimizes re-renders by only updating when selected values change
 * 
 * @template T Type of the store value
 * @template S Type of the selectors object
 * @param store - The store to subscribe to
 * @param selectors - Object with selector functions
 * @returns Object with selected values
 * 
 * @example
 * ```typescript
 * const userStore = createStore({ 
 *   id: '1', 
 *   name: 'John', 
 *   email: 'john@example.com',
 *   settings: { theme: 'dark', notifications: true }
 * });
 * 
 * const { name, theme } = useStoreValues(userStore, {
 *   name: user => user.name,
 *   theme: user => user.settings.theme
 * });
 * // Only re-renders when name or theme changes
 * ```
 */
export function useStoreValues<T, S extends Record<string, (value: T) => any>>(
  store: Store<T> | undefined | null,
  selectors: S
): { [K in keyof S]: ReturnType<S[K]> } | undefined {
  if (!store) return undefined;
  
  return useStoreSelector(store, (value: T) => {
    const result = {} as { [K in keyof S]: ReturnType<S[K]> };
    for (const [key, selector] of Object.entries(selectors)) {
      result[key as keyof S] = selector(value);
    }
    return result;
  }, shallowEqual);
}