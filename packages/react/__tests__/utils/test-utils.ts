/**
 * @fileoverview Test Utilities
 * 
 * Context-Action 프레임워크를 위한 테스트 유틸리티들
 * 단위 테스트와 통합 테스트를 위한 헬퍼 함수들과 모킹 도구들
 */

import { Store } from '../../src/stores/core/Store';
import { StoreRegistry } from '../../src/stores/core/StoreRegistry';
import type { ActionPayloadMap } from '@context-action/core';

/**
 * 테스트용 Mock Store 생성 함수
 * 
 * @template T Store가 관리할 데이터의 타입
 * @param name Store 이름
 * @param initialValue 초기값
 * @param options 추가 옵션
 * @returns 테스트용으로 설정된 Store 인스턴스
 */
export function createMockStore<T>(
  name: string, 
  initialValue: T,
  options: {
    enableSpying?: boolean;
    mockMethods?: (keyof Store<T>)[];
  } = {}
): Store<T> & { 
  // 테스트용 추가 메서드
  __testUtils: {
    getCallHistory: () => Array<{ method: string; args: any[]; timestamp: number }>;
    clearCallHistory: () => void;
    triggerListener: () => void;
    getInternalState: () => any;
  }
} {
  const store = new Store(name, initialValue);
  const callHistory: Array<{ method: string; args: any[]; timestamp: number }> = [];
  
  // 스파이 기능이 활성화된 경우
  if (options.enableSpying) {
    const originalMethods = new Map();
    const methodsToMock = options.mockMethods || ['setValue', 'update', 'subscribe'];
    
    methodsToMock.forEach(methodName => {
      const originalMethod = (store as any)[methodName];
      if (typeof originalMethod === 'function') {
        originalMethods.set(methodName, originalMethod);
        
        (store as any)[methodName] = function(...args: any[]) {
          callHistory.push({
            method: String(methodName),
            args: [...args],
            timestamp: Date.now()
          });
          
          return originalMethod.apply(this, args);
        };
      }
    });
  }
  
  // 테스트 유틸리티 메서드 추가
  (store as any).__testUtils = {
    getCallHistory: () => [...callHistory],
    clearCallHistory: () => callHistory.length = 0,
    triggerListener: () => (store as any)._notifyListeners(),
    getInternalState: () => ({
      listeners: (store as any).listeners,
      value: (store as any)._value,
      snapshot: (store as any)._snapshot,
      isUpdating: (store as any).isUpdating,
      updateQueue: (store as any).updateQueue
    })
  };
  
  return store as any;
}

/**
 * 테스트용 Store Registry 생성
 */
export function createTestStoreRegistry(): StoreRegistry {
  return new StoreRegistry();
}

/**
 * Store 상태 변경을 기다리는 헬퍼
 */
export function waitForStoreChange<T>(
  store: Store<T>,
  predicate: (value: T) => boolean,
  timeout: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      unsubscribe();
      reject(new Error(`Timeout waiting for store change after ${timeout}ms`));
    }, timeout);
    
    const unsubscribe = store.subscribe(() => {
      const currentValue = store.getValue();
      if (predicate(currentValue)) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(currentValue);
      }
    });
    
    // 현재 값도 즉시 확인
    const currentValue = store.getValue();
    if (predicate(currentValue)) {
      clearTimeout(timeoutId);
      unsubscribe();
      resolve(currentValue);
    }
  });
}

/**
 * 여러 Store의 동기화된 상태 변경을 기다리는 헬퍼
 */
export function waitForMultipleStoreChanges<T extends Record<string, any>>(
  stores: { [K in keyof T]: Store<T[K]> },
  predicate: (values: T) => boolean,
  timeout: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const storeNames = Object.keys(stores) as (keyof T)[];
    const unsubscribes: (() => void)[] = [];
    
    const timeoutId = setTimeout(() => {
      unsubscribes.forEach(unsub => unsub());
      reject(new Error(`Timeout waiting for multiple store changes after ${timeout}ms`));
    }, timeout);
    
    const checkPredicate = () => {
      const values = {} as T;
      storeNames.forEach(name => {
        values[name] = stores[name].getValue();
      });
      
      if (predicate(values)) {
        clearTimeout(timeoutId);
        unsubscribes.forEach(unsub => unsub());
        resolve(values);
      }
    };
    
    // 각 Store 구독
    storeNames.forEach(name => {
      const unsubscribe = stores[name].subscribe(checkPredicate);
      unsubscribes.push(unsubscribe);
    });
    
    // 현재 값도 즉시 확인
    checkPredicate();
  });
}

/**
 * Store의 성능 메트릭을 측정하는 헬퍼
 */
export class StorePerformanceMeter<T> {
  private store: Store<T>;
  private metrics: {
    subscriptionTime: number[];
    updateTime: number[];
    notificationTime: number[];
  } = {
    subscriptionTime: [],
    updateTime: [],
    notificationTime: []
  };
  
  constructor(store: Store<T>) {
    this.store = store;
    this.instrumentStore();
  }
  
  private instrumentStore(): void {
    const originalSubscribe = this.store.subscribe.bind(this.store);
    const originalSetValue = (this.store as any).setValue.bind(this.store);
    const originalNotifyListeners = (this.store as any)._notifyListeners.bind(this.store);
    
    // Subscribe 성능 측정
    this.store.subscribe = (listener) => {
      const start = performance.now();
      const result = originalSubscribe(listener);
      const end = performance.now();
      this.metrics.subscriptionTime.push(end - start);
      return result;
    };
    
    // setValue 성능 측정
    (this.store as any).setValue = (value: T) => {
      const start = performance.now();
      const result = originalSetValue(value);
      const end = performance.now();
      this.metrics.updateTime.push(end - start);
      return result;
    };
    
    // _notifyListeners 성능 측정
    (this.store as any)._notifyListeners = () => {
      const start = performance.now();
      const result = originalNotifyListeners();
      const end = performance.now();
      this.metrics.notificationTime.push(end - start);
      return result;
    };
  }
  
  getMetrics() {
    const calculateStats = (times: number[]) => {
      if (times.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };
      
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      return { avg, min, max, count: times.length };
    };
    
    return {
      subscription: calculateStats(this.metrics.subscriptionTime),
      update: calculateStats(this.metrics.updateTime),
      notification: calculateStats(this.metrics.notificationTime)
    };
  }
  
  reset(): void {
    this.metrics.subscriptionTime = [];
    this.metrics.updateTime = [];
    this.metrics.notificationTime = [];
  }
}

/**
 * React 컴포넌트 테스트를 위한 테스트 래퍼
 */
export function createTestWrapper<TStores extends Record<string, Store<any>>, TActions extends ActionPayloadMap>(
  stores: TStores,
  actions?: TActions
) {
  return {
    stores,
    actions,
    cleanup: () => {
      Object.values(stores).forEach(store => {
        if ('dispose' in store && typeof store.dispose === 'function') {
          store.dispose();
        }
      });
    }
  };
}

/**
 * 비동기 작업 완료를 기다리는 헬퍼
 */
export function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * 특정 시간만큼 기다리는 헬퍼
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Store 값의 변경 이력을 추적하는 클래스
 */
export class StoreValueTracker<T> {
  private history: Array<{ value: T; timestamp: number }> = [];
  private unsubscribe?: () => void;
  
  constructor(store: Store<T>) {
    // 초기값 기록
    this.history.push({
      value: store.getValue(),
      timestamp: Date.now()
    });
    
    // 변경 사항 구독
    this.unsubscribe = store.subscribe(() => {
      this.history.push({
        value: store.getValue(),
        timestamp: Date.now()
      });
    });
  }
  
  getHistory(): Array<{ value: T; timestamp: number }> {
    return [...this.history];
  }
  
  getLatestValue(): T | undefined {
    return this.history[this.history.length - 1]?.value;
  }
  
  getChangeCount(): number {
    return this.history.length - 1; // 초기값 제외
  }
  
  hasChangedSince(timestamp: number): boolean {
    return this.history.some(entry => entry.timestamp > timestamp);
  }
  
  clear(): void {
    this.history = [];
  }
  
  dispose(): void {
    this.unsubscribe?.();
    this.clear();
  }
}

/**
 * 테스트 헬퍼 함수들을 모은 객체
 */
export const TestUtils = {
  createMockStore,
  createTestStoreRegistry,
  waitForStoreChange,
  waitForMultipleStoreChanges,
  createTestWrapper,
  flushPromises,
  sleep,
  StorePerformanceMeter,
  StoreValueTracker
} as const;