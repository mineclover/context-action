/**
 * React 18+ 최적화 훅들
 * useDeferredValue, useTransition, useSyncExternalStore 등 최신 React 기능 활용
 */

import { 
  useDeferredValue, 
  useTransition, 
  useCallback, 
  useState, 
  useMemo,
  startTransition,
  useSyncExternalStore
} from 'react';
import type { IStore } from '../stores/core/types';

/**
 * React 18+ 최적화 옵션
 */
export interface React18Options {
  /** 지연 업데이트 사용 여부 */
  enableDeferred?: boolean;
  /** Transition 사용 여부 */
  enableTransition?: boolean;
  /** 우선순위 업데이트 임계값 */
  priorityThreshold?: number;
  /** Concurrent 렌더링 활성화 */
  enableConcurrent?: boolean;
}

/**
 * React 18+ 최적화가 적용된 Store 값 구독
 * 
 * @param store Store 인스턴스
 * @param options React 18+ 최적화 옵션
 * @returns 현재 store 값 (지연 업데이트 적용 가능)
 */
export function useStoreValueOptimized<T>(
  store: IStore<T>,
  options: React18Options = {}
): T {
  const {
    enableDeferred = true
  } = options;

  // 기본 store 값 구독
  const storeValue = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot // SSR을 위한 getServerSnapshot
  );

  // 값 추출
  const currentValue = storeValue.value;

  // Deferred value로 성능 최적화
  const deferredValue = useDeferredValue(currentValue);

  // 우선순위 업데이트 결정 (성능 최적화)
  const shouldUseDeferred = useMemo(() => {
    if (!enableDeferred) return false;
    
    // 복잡한 객체나 대용량 데이터는 지연 업데이트 사용
    if (typeof currentValue === 'object' && currentValue !== null) {
      // JSON.stringify 대신 더 효율적인 크기 추정
      try {
        // 간단한 객체 크기 추정 (속성 개수 기반)
        const keys = Object.keys(currentValue);
        const estimatedSize = keys.length * 50; // 대략적인 크기 추정
        
        // 배열인 경우 길이 기반 추정
        if (Array.isArray(currentValue)) {
          return currentValue.length > 100; // 100개 이상 배열은 지연 처리
        }
        
        // 속성이 많거나 추정 크기가 큰 경우만 JSON 직렬화 시도
        if (keys.length > 10 || estimatedSize > 1000) {
          const objectSize = JSON.stringify(currentValue).length;
          return objectSize > 1000; // 1KB 이상 객체는 지연 처리
        }
        
        return false;
      } catch {
        // JSON 직렬화 실패 시 복잡한 객체로 간주하여 지연 처리
        return true;
      }
    }
    
    return false;
  }, [currentValue, enableDeferred]);

  return shouldUseDeferred ? deferredValue : currentValue;
}

/**
 * Transition을 사용한 Store 업데이트 훅
 * 
 * @param store Store 인스턴스
 * @returns [업데이트 함수, pending 상태]
 */
export function useStoreTransition<T>(
  store: IStore<T>
): [
  (newValue: T | ((prev: T) => T)) => void,
  boolean
] {
  const [isPending, startTransition] = useTransition();

  const updateWithTransition = useCallback((
    newValue: T | ((prev: T) => T)
  ) => {
    startTransition(() => {
      if (typeof newValue === 'function') {
        const updater = newValue as (prev: T) => T;
        store.update(updater);
      } else {
        store.setValue(newValue);
      }
    });
  }, [store]);

  return [updateWithTransition, isPending];
}

/**
 * 스마트 Store 업데이트 훅
 * 업데이트 크기와 복잡도에 따라 자동으로 transition 적용 여부 결정
 * 
 * @param store Store 인스턴스
 * @param options React 18+ 옵션
 * @returns [업데이트 함수, pending 상태, 강제 즉시 업데이트 함수]
 */
export function useStoreUpdateSmart<T>(
  store: IStore<T>,
  options: React18Options = {}
): [
  (newValue: T | ((prev: T) => T)) => void,
  boolean,
  (newValue: T | ((prev: T) => T)) => void
] {
  const {
    enableTransition = true,
    priorityThreshold = 1000
  } = options;

  const [isPending, startTransition] = useTransition();

  const smartUpdate = useCallback((
    newValue: T | ((prev: T) => T)
  ) => {
    // 업데이트 복잡도 계산 (성능 최적화)
    let isComplex = false;
    if (typeof newValue === 'function') {
      isComplex = true; // 함수 업데이트는 복잡하다고 가정
    } else if (typeof newValue === 'object' && newValue !== null) {
      try {
        // 효율적인 복잡도 추정
        if (Array.isArray(newValue)) {
          isComplex = newValue.length > (priorityThreshold / 10); // 배열 길이 기반
        } else {
          const keys = Object.keys(newValue);
          if (keys.length > 10) {
            // 속성이 많은 경우에만 JSON 직렬화 시도
            const size = JSON.stringify(newValue).length;
            isComplex = size > priorityThreshold;
          } else {
            // 속성이 적은 경우 간단한 객체로 간주
            isComplex = false;
          }
        }
      } catch {
        // JSON 직렬화 실패 시 복잡한 업데이트로 간주
        isComplex = true;
      }
    }

    // 복잡한 업데이트는 transition 사용
    if (enableTransition && isComplex) {
      startTransition(() => {
        if (typeof newValue === 'function') {
          const updater = newValue as (prev: T) => T;
          store.update(updater);
        } else {
          store.setValue(newValue);
        }
      });
    } else {
      // 간단한 업데이트는 즉시 실행
      if (typeof newValue === 'function') {
        const updater = newValue as (prev: T) => T;
        store.update(updater);
      } else {
        store.setValue(newValue);
      }
    }
  }, [store, enableTransition, priorityThreshold]);

  // 강제 즉시 업데이트 (transition 무시)
  const immediateUpdate = useCallback((
    newValue: T | ((prev: T) => T)
  ) => {
    if (typeof newValue === 'function') {
      const updater = newValue as (prev: T) => T;
      store.update(updater);
    } else {
      store.setValue(newValue);
    }
  }, [store]);

  return [smartUpdate, isPending, immediateUpdate];
}

/**
 * Concurrent 렌더링 최적화된 Store 셀렉터
 * 
 * @param store Store 인스턴스
 * @param selector 값 선택 함수
 * @param options React 18+ 옵션
 * @returns 선택된 값 (지연 처리 적용 가능)
 */
export function useStoreSelector<T, K>(
  store: IStore<T>,
  selector: (value: T) => K,
  options: React18Options = {}
): K {
  const {
    enableDeferred = true
  } = options;

  // Store 값 구독
  const storeValue = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );

  // 선택된 값 계산 (메모이제이션 적용)
  const selectedValue = useMemo(() => {
    return selector(storeValue.value);
  }, [selector, storeValue.value]);

  // Deferred value 적용
  const deferredValue = useDeferredValue(selectedValue);

  // 복잡도에 따른 지연 처리 결정
  const shouldUseDeferred = useMemo(() => {
    if (!enableDeferred) return false;
    
    // 선택된 값이 복잡한 객체인 경우 지연 처리
    if (typeof selectedValue === 'object' && selectedValue !== null) {
      return true;
    }
    
    return false;
  }, [selectedValue, enableDeferred]);

  return shouldUseDeferred ? deferredValue : selectedValue;
}

/**
 * 배치 업데이트를 위한 훅
 * 여러 Store 업데이트를 하나의 transition으로 묶어서 처리
 */
export function useBatchUpdate() {
  const [isPending, startTransition] = useTransition();

  const batchUpdate = useCallback((updates: (() => void)[]) => {
    startTransition(() => {
      updates.forEach(update => {
        try {
          update();
        } catch (error) {
          console.error('Error in batch update:', error);
        }
      });
    });
  }, []);

  return [batchUpdate, isPending] as const;
}

/**
 * React 18+ 성능 통계
 */
export interface React18Stats {
  transitionCount: number;
  deferredUpdates: number;
  averageTransitionTime: number;
  pendingOperations: number;
}

/**
 * React 18+ 기능 사용 통계 추적 훅
 */
export function useReact18Stats(): React18Stats {
  const [stats] = useState<React18Stats>({
    transitionCount: 0,
    deferredUpdates: 0,
    averageTransitionTime: 0,
    pendingOperations: 0
  });

  // 실제 구현에서는 성능 측정 로직 추가
  // 현재는 기본값 반환
  return stats;
}

/**
 * React 18+ 최적화 유틸리티
 */
export const React18Utils = {
  /**
   * 글로벌 startTransition 래퍼
   */
  startTransition: (callback: () => void) => {
    startTransition(callback);
  },

  /**
   * 조건부 transition 시작
   */
  conditionalTransition: (
    condition: boolean, 
    callback: () => void
  ) => {
    if (condition) {
      startTransition(callback);
    } else {
      callback();
    }
  },

  /**
   * 업데이트 복잡도 계산
   */
  calculateUpdateComplexity: <T>(value: T): number => {
    if (typeof value === 'object' && value !== null) {
      try {
        const size = JSON.stringify(value).length;
        return Math.min(size / 100, 10); // 0-10 스케일
      } catch {
        return 5; // 기본값
      }
    }
    return 1; // 단순 값
  },

  /**
   * 성능 임계값 추천
   */
  getRecommendedThreshold: (deviceType: 'mobile' | 'desktop' = 'desktop'): number => {
    return deviceType === 'mobile' ? 500 : 1000;
  }
};

/**
 * React 18+ 호환성 체크
 */
export function useReact18Compatibility() {
  const hasUseDeferredValue = typeof useDeferredValue === 'function';
  const hasUseTransition = typeof useTransition === 'function';
  const hasUseSyncExternalStore = typeof useSyncExternalStore === 'function';

  return {
    isReact18Compatible: hasUseDeferredValue && hasUseTransition,
    features: {
      deferredValue: hasUseDeferredValue,
      transition: hasUseTransition,
      syncExternalStore: hasUseSyncExternalStore
    }
  };
}