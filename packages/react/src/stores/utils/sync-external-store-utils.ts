/**
 * @fileoverview useSyncExternalStore 기반 공통 유틸리티
 * 
 * Store 구독 관련 공통 기능을 useSyncExternalStore 기반으로 구현
 * 모든 Store 훅들이 공유하는 핵심 로직을 제공
 */

import { useSyncExternalStore, useCallback, useMemo, useRef } from 'react';
import type { IStore } from '../core/types';
import { referenceEquals, shallowEquals, deepEquals } from './comparison';

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
 * 향상된 구독 함수 생성 (내부 사용)
 * 디바운싱, 스로틀링, 조건부 구독 기능 제공
 */
function createEnhancedSubscriber<T>(
  store: IStore<T>,
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

      const now = performance.now();

      // 스로틀링 처리
      if (throttle && throttle > 0) {
        if (now - lastThrottleTime < throttle) {
          if (throttleTimer) clearTimeout(throttleTimer);
          throttleTimer = setTimeout(() => {
            lastThrottleTime = performance.now();
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
 * Null-safe Store 구독 훅
 * useSyncExternalStore를 기반으로 한 안전한 구독
 */
export function useSafeStoreSubscription<T, R = T>(
  store: IStore<T> | undefined | null,
  selector?: (value: T) => R,
  options: EnhancedSubscriptionOptions & {
    equalityFn?: (a: R, b: R) => boolean;
    initialValue?: R;
  } = {}
): R | T | undefined {
  const { initialValue, equalityFn, debounce, throttle, condition, debug, name } = options;

  // 🔧 Performance: Memoize subscription options to prevent unnecessary re-subscriptions
  const stableSubscriptionOptions = useMemo((): EnhancedSubscriptionOptions => ({
    debounce,
    throttle,
    condition,
    debug,
    name
  }), [debounce, throttle, condition, debug, name]);

  // 🔧 Performance: Check if enhanced subscription is needed (stable boolean)
  const needsEnhancedSubscription = Boolean(debounce || throttle || condition);

  // 구독 함수 생성
  const subscribe = useCallback((callback: () => void) => {
    if (!store) return () => {};

    // 향상된 구독이 필요한 경우
    if (needsEnhancedSubscription) {
      return createEnhancedSubscriber(store, stableSubscriptionOptions)(callback);
    }

    // 기본 구독
    return store.subscribe(callback);
  }, [store, needsEnhancedSubscription, stableSubscriptionOptions]);

  // 스냅샷 가져오기 함수 - 안정적인 참조 유지
  const getSnapshot = useCallback((): R | T | undefined => {
    if (!store) return initialValue;
    
    const snapshot = store.getSnapshot();
    const value = selector ? selector(snapshot.value) : snapshot.value;
    
    return value as R | T;
  }, [store, selector, initialValue]);

  // 캐시된 스냅샷 함수 - React 18 호환성 향상
  const cachedSnapshotRef = useRef<R | T | undefined>();
  const stableGetSnapshot = useCallback((): R | T | undefined => {
    const currentSnapshot = getSnapshot();
    
    // 이전 값과 비교하여 실제로 변경된 경우에만 새 값 반환
    if (equalityFn && cachedSnapshotRef.current !== undefined) {
      if (equalityFn(cachedSnapshotRef.current as R, currentSnapshot as R)) {
        return cachedSnapshotRef.current;
      }
    }
    
    cachedSnapshotRef.current = currentSnapshot;
    return currentSnapshot;
  }, [getSnapshot, equalityFn]);

  // 서버 사이드 스냅샷
  const getServerSnapshot = useCallback((): R | T | undefined => {
    return initialValue;
  }, [initialValue]);

  // React의 useSyncExternalStore 사용 - 캐시된 스냅샷 함수 사용
  const currentValue = useSyncExternalStore(
    subscribe,
    equalityFn ? stableGetSnapshot : getSnapshot,
    getServerSnapshot
  );

  return currentValue;
}

/**
 * 기본 동등성 비교 함수들
 * comparison.ts의 함수들을 래핑하여 hook에서 사용하기 편한 인터페이스 제공
 */
export const equalityFunctions = {
  reference: <T>(a: T, b: T): boolean => referenceEquals(a, b),

  shallow: <T>(a: T, b: T): boolean => shallowEquals(a, b),

  deep: <T>(a: T, b: T): boolean => deepEquals(a, b),

  // 똑똑한 자동 동등성 함수 - 배열의 깊은 비교 지원
  smart: <T>(a: T, b: T): boolean => {
    // 참조가 같으면 바로 true
    if (referenceEquals(a, b)) return true;

    // primitive 값들은 참조 비교로 처리
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
          return shallowEquals(item, bItem);
        }
        // primitive 값은 참조 비교
        return referenceEquals(item, bItem);
      });
    }

    // 일반 객체인 경우 shallow 비교
    return shallowEquals(a, b);
  }
};