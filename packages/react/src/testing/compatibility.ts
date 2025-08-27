/**
 * 기존 test-utils.ts와의 호환성을 보장하는 브리지 모듈
 * 기존 테스트 코드를 깨뜨리지 않으면서 새로운 기능을 제공
 */

import { MockStore, createMockStore as newCreateMockStore } from './mock-store';
import { waitForStoreUpdate, flushPromises as newFlushPromises } from './async-helpers';
import { Store } from '../stores/core/Store';
import { StoreRegistry } from '../stores/core/StoreRegistry';
import type { ActionPayloadMap } from '@context-action/core';

/**
 * 기존 test-utils.ts의 createMockStore와 호환되는 인터페이스
 * 새로운 MockStore를 사용하면서 기존 API 유지
 */
export function createMockStore<T>(
  name: string, 
  initialValue: T,
  options: {
    enableSpying?: boolean;
    mockMethods?: (keyof Store<T>)[];
  } = {}
): Store<T> & { 
  __testUtils: {
    getCallHistory: () => Array<{ method: string; args: any[]; timestamp: number }>;
    clearCallHistory: () => void;
    triggerListener: () => void;
    getInternalState: () => any;
  }
} {
  // 새로운 MockStore 인스턴스 생성
  const mockStore = newCreateMockStore({
    initialValue,
    name,
    enableLogging: options.enableSpying || false
  });

  // 기존 API와 호환되는 __testUtils 인터페이스 추가
  const store = mockStore as any;
  store.__testUtils = {
    getCallHistory: () => {
      const stats = mockStore.getStats();
      return [
        ...Array(stats.setValueCalls).fill(0).map((_, i) => ({
          method: 'setValue',
          args: [],
          timestamp: Date.now() - (stats.setValueCalls - i) * 100
        })),
        ...Array(stats.updateCalls).fill(0).map((_, i) => ({
          method: 'update', 
          args: [],
          timestamp: Date.now() - (stats.updateCalls - i) * 100
        }))
      ];
    },
    clearCallHistory: () => {
      mockStore.resetStats();
    },
    triggerListener: () => {
      mockStore.triggerNotification();
    },
    getInternalState: () => {
      const stats = mockStore.getStats();
      return {
        listeners: { size: stats.listenerCount },
        value: mockStore.getValue(),
        snapshot: mockStore.getSnapshot(),
        isUpdating: false,
        updateQueue: []
      };
    }
  };

  return store;
}

/**
 * 기존 waitForStoreChange와 호환되는 함수
 */
export function waitForStoreChange<T>(
  store: Store<T>,
  predicate: (value: T) => boolean,
  timeout: number = 1000
): Promise<T> {
  return waitForStoreUpdate(store, predicate, timeout);
}

/**
 * 기존 flushPromises와 동일한 함수
 */
export const flushPromises = newFlushPromises;

/**
 * 기존 createTestStoreRegistry와 동일한 함수
 */
export function createTestStoreRegistry(): StoreRegistry {
  return new StoreRegistry('test-registry');
}

/**
 * 기존 waitForMultipleStoreChanges와 호환되는 함수
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
    
    storeNames.forEach(name => {
      const unsubscribe = stores[name].subscribe(checkPredicate);
      unsubscribes.push(unsubscribe);
    });
    
    checkPredicate();
  });
}

/**
 * 기존 createTestWrapper와 동일한 함수
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
 * 기존 sleep과 동일한 함수 (delay로 이름 변경됨)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 기존 StorePerformanceMeter와 호환되는 클래스
 */
export class StorePerformanceMeter<T> {
  private store: Store<T> | MockStore<T>;
  private startTime: number;
  private mockStore?: MockStore<T>;
  
  constructor(store: Store<T>) {
    this.store = store;
    this.startTime = performance.now();
    
    // MockStore인지 확인
    if (store instanceof MockStore) {
      this.mockStore = store;
    }
  }
  
  getMetrics() {
    if (this.mockStore) {
      const stats = this.mockStore.getStats();
      const elapsedTime = performance.now() - this.startTime;
      
      return {
        subscription: {
          avg: elapsedTime / Math.max(stats.listenerCount, 1),
          min: 0,
          max: elapsedTime,
          count: stats.listenerCount
        },
        update: {
          avg: elapsedTime / Math.max(stats.setValueCalls + stats.updateCalls, 1),
          min: 0,
          max: elapsedTime,
          count: stats.setValueCalls + stats.updateCalls
        },
        notification: {
          avg: elapsedTime / Math.max(stats.notificationCount, 1),
          min: 0,
          max: elapsedTime,
          count: stats.notificationCount
        }
      };
    }
    
    // 일반 Store인 경우 기본값 반환
    return {
      subscription: { avg: 0, min: 0, max: 0, count: 0 },
      update: { avg: 0, min: 0, max: 0, count: 0 },
      notification: { avg: 0, min: 0, max: 0, count: 0 }
    };
  }
  
  reset(): void {
    this.startTime = performance.now();
    if (this.mockStore) {
      this.mockStore.resetStats();
    }
  }
}

/**
 * 기존 StoreValueTracker와 호환되는 클래스
 */
export class StoreValueTracker<T> {
  private history: Array<{ value: T; timestamp: number }> = [];
  private unsubscribe?: () => void;
  
  constructor(store: Store<T>) {
    this.history.push({
      value: store.getValue(),
      timestamp: Date.now()
    });
    
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
    return this.history.length - 1;
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
 * 기존 TestUtils 객체와 호환되는 export
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