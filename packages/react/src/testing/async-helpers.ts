/**
 * 비동기 테스트 헬퍼들
 * Promise, timeout, Store 업데이트 대기 등을 위한 유틸리티
 */

import { Store } from '../stores/core/Store';
import { MockStore } from './mock-store';

export interface TestTimeouts {
  /** 기본 대기 시간 (ms) */
  default: number;
  /** 빠른 업데이트 대기 시간 (ms) */
  fast: number;
  /** 긴 작업 대기 시간 (ms) */
  slow: number;
  /** 매우 긴 작업 대기 시간 (ms) */
  extended: number;
}

export const DEFAULT_TIMEOUTS: TestTimeouts = {
  default: 1000,
  fast: 100,
  slow: 5000,
  extended: 10000
};

/**
 * 모든 Promise가 해결될 때까지 대기
 */
export async function flushPromises(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * 지정된 시간만큼 대기
 * 
 * @param ms 대기 시간 (밀리초)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Store 값이 특정 조건을 만족할 때까지 대기
 * 
 * @param store 감시할 Store
 * @param predicate 조건 함수
 * @param timeout 최대 대기 시간
 * @param interval 검사 간격
 * 
 * @example
 * ```typescript
 * await waitForStoreUpdate(
 *   userStore,
 *   (value) => value.isLoaded === true,
 *   2000
 * );
 * ```
 */
export function waitForStoreUpdate<T>(
  store: Store<T> | MockStore<T>,
  predicate: (value: T) => boolean,
  timeout: number = DEFAULT_TIMEOUTS.default,
  interval: number = 10
): Promise<T> {
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };

    // 타임아웃 설정
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`waitForStoreUpdate timed out after ${timeout}ms`));
    }, timeout);

    // 초기값 확인
    const currentValue = store.getValue();
    if (predicate(currentValue)) {
      cleanup();
      resolve(currentValue);
      return;
    }

    // 주기적 검사
    intervalId = setInterval(() => {
      try {
        const value = store.getValue();
        if (predicate(value)) {
          cleanup();
          resolve(value);
        }
      } catch (error) {
        cleanup();
        reject(error);
      }
    }, interval);
  });
}

/**
 * Store 값이 특정 값과 일치할 때까지 대기
 * 
 * @param store 감시할 Store
 * @param expectedValue 기대하는 값
 * @param timeout 최대 대기 시간
 * @param interval 검사 간격
 */
export function waitForStoreValue<T>(
  store: Store<T> | MockStore<T>,
  expectedValue: T,
  timeout: number = DEFAULT_TIMEOUTS.default,
  interval: number = 10
): Promise<T> {
  return waitForStoreUpdate(
    store,
    (value) => JSON.stringify(value) === JSON.stringify(expectedValue),
    timeout,
    interval
  );
}

/**
 * Store 값이 변경될 때까지 대기 (구독 기반)
 * 
 * @param store 감시할 Store
 * @param timeout 최대 대기 시간
 */
export function waitForStoreChange<T>(
  store: Store<T> | MockStore<T>,
  timeout: number = DEFAULT_TIMEOUTS.default
): Promise<T> {
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    let unsubscribe: (() => void) | null = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
    };

    // 타임아웃 설정
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`waitForStoreChange timed out after ${timeout}ms`));
    }, timeout);

    // 구독 설정
    unsubscribe = store.subscribe(() => {
      try {
        const value = store.getValue();
        cleanup();
        resolve(value);
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  });
}

/**
 * 여러 Store들이 모두 특정 조건을 만족할 때까지 대기
 * 
 * @param storePredicates Store와 조건 함수들의 배열
 * @param timeout 최대 대기 시간
 */
export async function waitForMultipleStores(
  storePredicates: Array<{
    store: Store<any> | MockStore<any>;
    predicate: (value: any) => boolean;
    name?: string;
  }>,
  timeout: number = DEFAULT_TIMEOUTS.default
): Promise<any[]> {
  const promises = storePredicates.map(({ store, predicate, name }, index) => {
    return waitForStoreUpdate(store, predicate, timeout).catch(error => {
      throw new Error(`Store ${name || index} failed: ${error.message}`);
    });
  });

  return Promise.all(promises);
}

/**
 * Action 완료를 기다리는 헬퍼
 * MockStore의 통계를 활용하여 특정 작업 완료를 대기
 * 
 * @param mockStore MockStore 인스턴스
 * @param expectedCalls 기대하는 호출 횟수
 * @param timeout 최대 대기 시간
 */
export function waitForActionComplete(
  mockStore: MockStore<any>,
  expectedCalls: { setValue?: number; update?: number },
  timeout: number = DEFAULT_TIMEOUTS.default
): Promise<void> {
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };

    timeoutId = setTimeout(() => {
      cleanup();
      const stats = mockStore.getStats();
      reject(new Error(
        `waitForActionComplete timed out. Expected: ${JSON.stringify(expectedCalls)}, ` +
        `Actual: { setValue: ${stats.setValueCalls}, update: ${stats.updateCalls} }`
      ));
    }, timeout);

    const checkCondition = () => {
      const stats = mockStore.getStats();
      const setValueMatch = expectedCalls.setValue === undefined || stats.setValueCalls >= expectedCalls.setValue;
      const updateMatch = expectedCalls.update === undefined || stats.updateCalls >= expectedCalls.update;

      if (setValueMatch && updateMatch) {
        cleanup();
        resolve();
      }
    };

    // 초기 확인
    checkCondition();

    // 주기적 검사
    intervalId = setInterval(checkCondition, 10);
  });
}

/**
 * 특정 시간 내에 조건이 만족되지 않으면 에러를 던지는 헬퍼
 */
export async function expectWithinTime<T>(
  asyncOperation: () => Promise<T>,
  timeout: number = DEFAULT_TIMEOUTS.default,
  errorMessage?: string
): Promise<T> {
  return Promise.race([
    asyncOperation(),
    delay(timeout).then(() => {
      throw new Error(errorMessage || `Operation timed out after ${timeout}ms`);
    })
  ]);
}

/**
 * 조건이 만족될 때까지 폴링하는 헬퍼
 */
export function pollUntil<T>(
  condition: () => T | Promise<T>,
  predicate: (result: T) => boolean,
  options: {
    timeout?: number;
    interval?: number;
    maxAttempts?: number;
  } = {}
): Promise<T> {
  const {
    timeout = DEFAULT_TIMEOUTS.default,
    interval = 100,
    maxAttempts = Math.floor(timeout / interval)
  } = options;

  return new Promise((resolve, reject) => {
    let attempts = 0;
    const startTime = Date.now();

    const poll = async () => {
      attempts++;

      try {
        const result = await condition();
        
        if (predicate(result)) {
          resolve(result);
          return;
        }
        
        // 시간 또는 시도 횟수 초과 확인
        if (Date.now() - startTime >= timeout) {
          reject(new Error(`pollUntil timed out after ${timeout}ms`));
          return;
        }
        
        if (attempts >= maxAttempts) {
          reject(new Error(`pollUntil exceeded max attempts (${maxAttempts})`));
          return;
        }
        
        setTimeout(poll, interval);
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
}

/**
 * 테스트용 타이머 모킹 유틸리티
 */
export class TestTimers {
  private static isUsingFakeTimers = false;

  /**
   * Jest의 가짜 타이머 활성화
   */
  static useFakeTimers(): void {
    if (typeof jest !== 'undefined') {
      jest.useFakeTimers();
      TestTimers.isUsingFakeTimers = true;
    }
  }

  /**
   * Jest의 실제 타이머로 복원
   */
  static useRealTimers(): void {
    if (typeof jest !== 'undefined') {
      jest.useRealTimers();
      TestTimers.isUsingFakeTimers = false;
    }
  }

  /**
   * 모든 타이머 실행
   */
  static runAllTimers(): void {
    if (typeof jest !== 'undefined' && TestTimers.isUsingFakeTimers) {
      jest.runAllTimers();
    }
  }

  /**
   * 대기 중인 타이머들만 실행
   */
  static runOnlyPendingTimers(): void {
    if (typeof jest !== 'undefined' && TestTimers.isUsingFakeTimers) {
      jest.runOnlyPendingTimers();
    }
  }

  /**
   * 시간 앞당기기
   */
  static advanceTimersByTime(ms: number): void {
    if (typeof jest !== 'undefined' && TestTimers.isUsingFakeTimers) {
      jest.advanceTimersByTime(ms);
    }
  }

  /**
   * 가짜 타이머 사용 중인지 확인
   */
  static isFakeTimers(): boolean {
    return TestTimers.isUsingFakeTimers;
  }
}

/**
 * 배치 비동기 작업 관리자
 */
export class BatchAsyncManager {
  private promises: Array<{
    promise: Promise<any>;
    name: string;
    timeout: number;
  }> = [];

  /**
   * Promise 추가
   */
  add<T>(promise: Promise<T>, name: string = 'unnamed', timeout: number = DEFAULT_TIMEOUTS.default): this {
    this.promises.push({
      promise: expectWithinTime(() => promise, timeout, `${name} timed out`),
      name,
      timeout
    });
    return this;
  }

  /**
   * Store 업데이트 대기 추가
   */
  addStoreUpdate<T>(
    store: Store<T> | MockStore<T>,
    predicate: (value: T) => boolean,
    name: string = 'store-update',
    timeout: number = DEFAULT_TIMEOUTS.default
  ): this {
    this.add(
      waitForStoreUpdate(store, predicate, timeout),
      name,
      timeout
    );
    return this;
  }

  /**
   * 모든 Promise 완료 대기
   */
  async waitAll(): Promise<any[]> {
    const results = await Promise.all(this.promises.map(p => p.promise));
    this.promises = []; // 초기화
    return results;
  }

  /**
   * 가장 먼저 완료되는 Promise 대기
   */
  async waitAny(): Promise<any> {
    const result = await Promise.race(this.promises.map(p => p.promise));
    this.promises = []; // 초기화
    return result;
  }

  /**
   * 대기 중인 작업 개수
   */
  getPendingCount(): number {
    return this.promises.length;
  }

  /**
   * 모든 대기 작업 취소
   */
  clear(): void {
    this.promises = [];
  }
}

/**
 * 배치 비동기 관리자 생성 헬퍼
 */
export function createBatchAsyncManager(): BatchAsyncManager {
  return new BatchAsyncManager();
}