/**
 * @fileoverview useSyncExternalStore 기반 공통 유틸리티
 * 
 * Store 구독 관련 공통 기능을 useSyncExternalStore 기반으로 구현
 * 모든 Store 훅들이 공유하는 핵심 로직을 제공
 */

import { useSyncExternalStore, useCallback, useMemo, useRef } from 'react';
import type { Store } from '../core/Store';

/**
 * 향상된 구독 옵션
 */
export interface EnhancedSubscriptionOptions {
  /** 디바운스 지연시간 (ms) */
  debounce?: number;
  /** 스로틀 간격 (ms) */
  throttle?: number;
  /** 조건부 구독 여부 */
  condition?: () => boolean;
  /** 디버그 모드 */
  debug?: boolean;
  /** 훅 이름 (디버깅용) */
  name?: string;
}

/**
 * 향상된 구독 함수 생성
 * 디바운싱, 스로틀링, 조건부 구독 기능 제공
 */
export function createEnhancedSubscriber<T>(
  store: Store<T>,
  options: EnhancedSubscriptionOptions = {}
) {
  const { debounce, throttle, condition, debug, name = 'unknown' } = options;

  return (callback: () => void) => {
    if (!store) return () => {};

    let debounceTimer: NodeJS.Timeout | null = null;
    let throttleTimer: NodeJS.Timeout | null = null;
    let lastThrottleTime = 0;

    const enhancedCallback = () => {
      // 조건 체크
      if (condition && !condition()) {
        if (debug) {
          console.debug(`[${name}] Subscription suspended due to condition`);
        }
        return;
      }

      const now = Date.now();

      // 스로틀링 처리
      if (throttle && throttle > 0) {
        if (now - lastThrottleTime < throttle) {
          if (throttleTimer) clearTimeout(throttleTimer);
          throttleTimer = setTimeout(() => {
            lastThrottleTime = Date.now();
            callback();
          }, throttle - (now - lastThrottleTime));
          return;
        }
        lastThrottleTime = now;
      }

      // 디바운싱 처리
      if (debounce && debounce > 0) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          callback();
          if (debug) {
            console.debug(`[${name}] Debounced callback executed after ${debounce}ms`);
          }
        }, debounce);
        return;
      }

      // 즉시 실행
      callback();
    };

    const unsubscribe = store.subscribe(enhancedCallback);

    // 정리 함수
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (throttleTimer) clearTimeout(throttleTimer);
      unsubscribe();
    };
  };
}

/**
 * Store 스냅샷 선택자 생성
 */
export function createSnapshotSelector<T, R>(
  selector?: (value: T) => R
) {
  return (store: Store<T> | undefined | null): R | T | undefined => {
    if (!store) return undefined;
    
    const snapshot = store.getSnapshot();
    return selector ? selector(snapshot.value) : snapshot.value;
  };
}

/**
 * Null-safe Store 구독 훅
 * useSyncExternalStore를 기반으로 한 안전한 구독
 */
export function useSafeStoreSubscription<T, R = T>(
  store: Store<T> | undefined | null,
  selector?: (value: T) => R,
  options: EnhancedSubscriptionOptions & {
    equalityFn?: (a: R, b: R) => boolean;
    initialValue?: R;
  } = {}
): R | T | undefined {
  const { initialValue, equalityFn, ...subscriptionOptions } = options;

  // 구독 함수 생성
  const subscribe = useCallback((callback: () => void) => {
    if (!store) return () => {};

    // 향상된 구독이 필요한 경우
    if (subscriptionOptions.debounce || subscriptionOptions.throttle || subscriptionOptions.condition) {
      return createEnhancedSubscriber(store, subscriptionOptions)(callback);
    }

    // 기본 구독
    return store.subscribe(callback);
  }, [store, subscriptionOptions]);

  // 스냅샷 가져오기 함수
  const getSnapshot = useCallback((): R | T | undefined => {
    if (!store) return initialValue;
    
    const snapshot = store.getSnapshot();
    const value = selector ? selector(snapshot.value) : snapshot.value;
    
    return value as R | T;
  }, [store, selector, initialValue]);

  // 서버 사이드 스냅샷
  const getServerSnapshot = useCallback((): R | T | undefined => {
    return initialValue;
  }, [initialValue]);

  // React의 useSyncExternalStore 사용
  const currentValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  // 동등성 비교가 필요한 경우 추가 최적화
  const previousValueRef = useRef<R | T | undefined>(currentValue);
  const optimizedValue = useMemo(() => {
    if (equalityFn && previousValueRef.current !== undefined) {
      if (equalityFn(previousValueRef.current as R, currentValue as R)) {
        return previousValueRef.current;
      }
    }
    previousValueRef.current = currentValue;
    return currentValue;
  }, [currentValue, equalityFn]);

  return equalityFn ? optimizedValue : currentValue;
}

/**
 * 조건부 Store 구독 훅
 */
export function useConditionalStoreSubscription<T>(
  store: Store<T> | undefined | null,
  condition: boolean,
  initialValue?: T
): T | undefined {
  const subscribe = useCallback((callback: () => void) => {
    if (!store || !condition) return () => {};
    return store.subscribe(callback);
  }, [store, condition]);

  const getSnapshot = useCallback((): T | undefined => {
    if (!store || !condition) return initialValue;
    return store.getSnapshot().value;
  }, [store, condition, initialValue]);

  const getServerSnapshot = useCallback((): T | undefined => {
    return initialValue;
  }, [initialValue]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * 다중 Store 구독 훅
 */
export function useMultiStoreSubscription<T extends readonly Store<any>[], R>(
  stores: T,
  selector: (values: { [K in keyof T]: T[K] extends Store<infer U> ? U : never }) => R,
  equalityFn?: (a: R, b: R) => boolean
): R {
  const subscribe = useCallback((callback: () => void) => {
    const unsubscribes = stores.map(store => store.subscribe(callback));
    return () => unsubscribes.forEach(unsub => unsub());
  }, [stores]);

  const getSnapshot = useCallback((): R => {
    const values = stores.map(store => store.getSnapshot().value) as any;
    return selector(values);
  }, [stores, selector]);

  // 동등성 비교 최적화
  const previousValueRef = useRef<R>();
  const currentValue = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  
  return useMemo(() => {
    if (equalityFn && previousValueRef.current !== undefined) {
      if (equalityFn(previousValueRef.current, currentValue)) {
        return previousValueRef.current;
      }
    }
    previousValueRef.current = currentValue;
    return currentValue;
  }, [currentValue, equalityFn]);
}

/**
 * 기본 동등성 비교 함수들
 */
export const equalityFunctions = {
  reference: <T>(a: T, b: T): boolean => Object.is(a, b),
  
  shallow: <T>(a: T, b: T): boolean => {
    if (Object.is(a, b)) return true;
    
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return false;
    }
    
    const keysA = Object.keys(a) as Array<keyof T>;
    const keysB = Object.keys(b) as Array<keyof T>;
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key) || !Object.is(a[key], b[key])) {
        return false;
      }
    }
    
    return true;
  },
  
  deep: <T>(a: T, b: T): boolean => {
    if (Object.is(a, b)) return true;
    
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return false;
    }
    
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    const keysA = Object.keys(a) as Array<keyof T>;
    const keysB = Object.keys(b) as Array<keyof T>;
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!equalityFunctions.deep(a[key], b[key])) return false;
    }
    
    return true;
  },
  
  // 똑똑한 자동 동등성 함수 - 배열의 깊은 비교 지원
  smart: <T>(a: T, b: T): boolean => {
    // 참조가 같으면 바로 true
    if (Object.is(a, b)) return true;
    
    // primitive 값들은 Object.is로 처리
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return false;
    }
    
    // 배열인 경우 깊은 비교
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => {
        const bItem = b[index];
        // 배열 요소가 객체인 경우 shallow 비교
        if (typeof item === 'object' && item !== null && typeof bItem === 'object' && bItem !== null) {
          return equalityFunctions.shallow(item, bItem);
        }
        // primitive 값은 Object.is로 비교
        return Object.is(item, bItem);
      });
    }
    
    // 일반 객체인 경우 shallow 비교
    return equalityFunctions.shallow(a, b);
  }
};