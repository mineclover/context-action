/**
 * Context-Action 프레임워크용 커스텀 Jest Matchers
 */

import { Store } from '../stores/core/Store';
import { MockStore } from './mock-store';

/**
 * Store 관련 검증 헬퍼들
 */
export const StoreAssertions = {
  /**
   * Store가 특정 값을 가지고 있는지 확인
   */
  toHaveValue<T>(store: Store<T> | MockStore<T>, expectedValue: T): void {
    const actualValue = store.getValue();
    expect(actualValue).toEqual(expectedValue);
  },

  /**
   * Store 값이 조건을 만족하는지 확인
   */
  toSatisfyCondition<T>(store: Store<T> | MockStore<T>, predicate: (value: T) => boolean): void {
    const value = store.getValue();
    expect(predicate(value)).toBe(true);
  },

  /**
   * MockStore가 특정 횟수만큼 setValue가 호출되었는지 확인
   */
  toHaveSetValueCalls(mockStore: MockStore<any>, expectedCount: number): void {
    if (!('getStats' in mockStore)) {
      throw new Error('toHaveSetValueCalls can only be used with MockStore');
    }
    const stats = mockStore.getStats();
    expect(stats.setValueCalls).toBe(expectedCount);
  },

  /**
   * MockStore가 특정 횟수만큼 update가 호출되었는지 확인
   */
  toHaveUpdateCalls(mockStore: MockStore<any>, expectedCount: number): void {
    if (!('getStats' in mockStore)) {
      throw new Error('toHaveUpdateCalls can only be used with MockStore');
    }
    const stats = mockStore.getStats();
    expect(stats.updateCalls).toBe(expectedCount);
  },

  /**
   * Store에 구독자가 있는지 확인
   */
  toHaveListeners(store: Store<any> | MockStore<any>, expectedCount?: number): void {
    const actualCount = store.getListenerCount();
    if (expectedCount !== undefined) {
      expect(actualCount).toBe(expectedCount);
    } else {
      expect(actualCount).toBeGreaterThan(0);
    }
  }
};

/**
 * Action 관련 검증 헬퍼들
 */
export const ActionAssertions = {
  /**
   * Mock 함수가 특정 인자와 함께 호출되었는지 확인
   */
  toHaveBeenCalledWithPayload(mockFn: jest.MockedFunction<any>, expectedPayload: any): void {
    expect(mockFn).toHaveBeenCalledWith(expectedPayload, expect.any(Object));
  },

  /**
   * Mock 함수가 특정 횟수만큼 호출되었는지 확인
   */
  toHaveBeenCalledTimes(mockFn: jest.MockedFunction<any>, expectedTimes: number): void {
    expect(mockFn).toHaveBeenCalledTimes(expectedTimes);
  },

  /**
   * Action 핸들러가 성공적으로 완료되었는지 확인
   */
  async toCompleteSuccessfully(actionPromise: Promise<any>): Promise<void> {
    await expect(actionPromise).resolves.not.toThrow();
  },

  /**
   * Action 핸들러가 특정 에러와 함께 실패했는지 확인
   */
  async toFailWith(actionPromise: Promise<any>, expectedError: string | RegExp): Promise<void> {
    await expect(actionPromise).rejects.toThrow(expectedError);
  }
};

/**
 * Jest 커스텀 매처 정의
 */
export const TestMatchers = {
  /**
   * Store 값 매처
   */
  toHaveStoreValue<T>(received: Store<T> | MockStore<T>, expectedValue: T) {
    const actualValue = received.getValue();
    const pass = JSON.stringify(actualValue) === JSON.stringify(expectedValue);
    
    if (pass) {
      return {
        message: () => `Expected store not to have value ${JSON.stringify(expectedValue)}`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected store to have value ${JSON.stringify(expectedValue)}, but got ${JSON.stringify(actualValue)}`,
        pass: false
      };
    }
  },

  /**
   * MockStore 호출 횟수 매처
   */
  toHaveBeenCalledTimes(received: MockStore<any>, expectedSetValue: number, expectedUpdate?: number) {
    if (!('getStats' in received)) {
      return {
        message: () => 'toHaveBeenCalledTimes can only be used with MockStore',
        pass: false
      };
    }

    const stats = received.getStats();
    const setValuePass = stats.setValueCalls === expectedSetValue;
    const updatePass = expectedUpdate === undefined || stats.updateCalls === expectedUpdate;
    const pass = setValuePass && updatePass;

    if (pass) {
      return {
        message: () => `Expected MockStore not to have setValue: ${expectedSetValue}, update: ${expectedUpdate || 'any'}`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected MockStore to have setValue: ${expectedSetValue}, update: ${expectedUpdate || 'any'}, but got setValue: ${stats.setValueCalls}, update: ${stats.updateCalls}`,
        pass: false
      };
    }
  },

  /**
   * Store 리스너 수 매처
   */
  toHaveListeners(received: Store<any> | MockStore<any>, expectedCount?: number) {
    const actualCount = received.getListenerCount();
    const pass = expectedCount === undefined 
      ? actualCount > 0 
      : actualCount === expectedCount;

    if (pass) {
      return {
        message: () => expectedCount === undefined
          ? `Expected store not to have listeners`
          : `Expected store not to have ${expectedCount} listeners`,
        pass: true
      };
    } else {
      return {
        message: () => expectedCount === undefined
          ? `Expected store to have listeners, but got ${actualCount}`
          : `Expected store to have ${expectedCount} listeners, but got ${actualCount}`,
        pass: false
      };
    }
  }
};

// Jest 매처 타입 확장
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveStoreValue<T>(expectedValue: T): R;
      toHaveBeenCalledTimes(expectedSetValue: number, expectedUpdate?: number): R;
      toHaveListeners(expectedCount?: number): R;
    }
  }
}

/**
 * Jest 매처 등록 함수
 */
export function setupTestMatchers(): void {
  if (typeof expect !== 'undefined' && expect.extend) {
    expect.extend(TestMatchers);
  }
}