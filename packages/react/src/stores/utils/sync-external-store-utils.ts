/**
 * @fileoverview useSyncExternalStore 기반 공통 유틸리티
 * 
 * Store 구독 관련 공통 기능을 useSyncExternalStore 기반으로 구현
 * 모든 Store 훅들이 공유하는 핵심 로직을 제공
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { IStore, Snapshot } from '../core/types';
import { deepEquals, referenceEquals, shallowEquals } from './comparison';

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

interface SelectedServerSnapshotCache<T, R> {
  store: IStore<T>;
  sourceSnapshot: Snapshot<T>;
  selector: ((value: T) => R) | undefined;
  equalityFn: ((a: R, b: R) => boolean) | undefined;
  value: R | T;
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

  // `useSyncExternalStore` must receive every store notification immediately.
  // Timing and conditions are applied to the rendered value below instead of
  // delaying the external-store callback itself.
  const subscribe = useCallback((callback: () => void) => {
    if (!store) return () => {};
    return store.subscribe(callback);
  }, [store]);

  // 스냅샷 가져오기 함수 - 안정적인 참조 유지
  const getSnapshot = useCallback((): R | T | undefined => {
    if (!store) return initialValue;
    
    const snapshot = store.getSnapshot();
    const value = selector ? selector(snapshot.value) : snapshot.value;
    
    return value as R | T;
  }, [store, selector, initialValue]);

  // Cached snapshots keep external-store reads referentially stable.
  const cachedSnapshotRef = useRef<R | T | undefined>(undefined);
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

  // Server snapshots must be referentially stable while the underlying store
  // snapshot is unchanged. React calls getServerSnapshot more than once during
  // hydration and warns when selectors allocate a new object or array each time.
  // Keep this cache separate from the client cache so hydration reads do not
  // change the client snapshot semantics.
  const serverSnapshotCacheRef = useRef<SelectedServerSnapshotCache<T, R> | undefined>(undefined);
  const getServerSnapshot = useCallback((): R | T | undefined => {
    if (!store) return initialValue;

    const sourceSnapshot = store.getSnapshot();
    const cached = serverSnapshotCacheRef.current;

    if (
      cached &&
      cached.store === store &&
      cached.sourceSnapshot === sourceSnapshot &&
      cached.selector === selector &&
      cached.equalityFn === equalityFn
    ) {
      return cached.value;
    }

    const selectedValue = selector
      ? selector(sourceSnapshot.value)
      : sourceSnapshot.value;
    const value =
      cached &&
      cached.store === store &&
      cached.selector === selector &&
      cached.equalityFn === equalityFn &&
      equalityFn?.(cached.value as R, selectedValue as R)
        ? cached.value
        : selectedValue;

    serverSnapshotCacheRef.current = {
      store,
      sourceSnapshot,
      selector,
      equalityFn,
      value,
    };

    return value;
  }, [store, selector, initialValue, equalityFn]);

  // React의 useSyncExternalStore 사용 - 캐시된 스냅샷 함수 사용
  const currentValue = useSyncExternalStore(
    subscribe,
    equalityFn ? stableGetSnapshot : getSnapshot,
    getServerSnapshot
  );

  // getServerSnapshot is only used while rendering/hydrating. Once the client
  // commit completes, release its store/snapshot/value graph; otherwise the
  // hydration cache can pin an obsolete full snapshot (or a replaced store)
  // for the remaining component lifetime. Clearing after every client commit
  // also prevents a later store/selector/equality render from retaining the
  // previous cache keys or selected value.
  useEffect(() => {
    serverSnapshotCacheRef.current = undefined;
  });

  const [visibleValue, setVisibleValue] = useState(currentValue);
  const lastVisibleAtRef = useRef(0);

  useEffect(() => {
    const delay = Math.max(debounce ?? 0, throttle ?? 0);
    if (!condition && delay <= 0) return;

    if (condition && !condition()) return;

    if (delay <= 0) {
      lastVisibleAtRef.current = Date.now();
      setVisibleValue(currentValue);
      return;
    }

    const elapsed = Date.now() - lastVisibleAtRef.current;
    const wait = throttle && elapsed < throttle
      ? throttle - elapsed
      : debounce ?? 0;
    const timer = setTimeout(() => {
      lastVisibleAtRef.current = Date.now();
      setVisibleValue(currentValue);
      if (debug && name) {
        console.debug(`[${name}] Delayed store value committed after ${wait}ms`);
      }
    }, Math.max(0, wait));

    return () => clearTimeout(timer);
  }, [condition, currentValue, debounce, debug, name, throttle]);

  return debounce || throttle || condition ? visibleValue : currentValue;
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
