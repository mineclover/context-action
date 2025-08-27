/**
 * 비동기 테스트 헬퍼 함수들 테스트
 * Promise, timeout, Store 업데이트 대기 등의 유틸리티 검증
 */

import {
  flushPromises,
  delay,
  waitForStoreUpdate,
  waitForStoreValue,
  waitForStoreChange,
  waitForMultipleStores,
  waitForActionComplete,
  expectWithinTime,
  pollUntil,
  TestTimers,
  BatchAsyncManager,
  createBatchAsyncManager,
  DEFAULT_TIMEOUTS
} from '../async-helpers';
import { createMockStore } from '../mock-store';
import { Store } from '../../stores/core/Store';

describe('비동기 테스트 헬퍼', () => {
  describe('기본 비동기 유틸리티', () => {
    test('flushPromises - Promise 대기', async () => {
      let resolved = false;
      
      Promise.resolve().then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);
      
      await flushPromises();
      
      expect(resolved).toBe(true);
    });

    test('delay - 시간 지연', async () => {
      const startTime = Date.now();
      
      await delay(100);
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(90); // 약간의 여유
      expect(elapsed).toBeLessThan(150);
    });
  });

  describe('Store 업데이트 대기', () => {
    test('waitForStoreUpdate - 조건 만족까지 대기', async () => {
      const mockStore = createMockStore({
        initialValue: 0,
        enableLogging: false
      });

      // 100ms 후에 값 변경
      setTimeout(() => {
        mockStore.setValue(5);
      }, 100);

      const result = await waitForStoreUpdate(
        mockStore,
        (value) => value === 5,
        1000
      );

      expect(result).toBe(5);
    });

    test('waitForStoreUpdate - 타임아웃', async () => {
      const mockStore = createMockStore({
        initialValue: 0,
        enableLogging: false
      });

      await expect(
        waitForStoreUpdate(
          mockStore,
          (value) => value === 999, // 절대 만족되지 않는 조건
          100 // 짧은 타임아웃
        )
      ).rejects.toThrow('waitForStoreUpdate timed out after 100ms');
    });

    test('waitForStoreUpdate - 초기값이 이미 조건 만족', async () => {
      const mockStore = createMockStore({
        initialValue: 42,
        enableLogging: false
      });

      const result = await waitForStoreUpdate(
        mockStore,
        (value) => value === 42
      );

      expect(result).toBe(42);
    });

    test('waitForStoreValue - 특정 값까지 대기', async () => {
      const mockStore = createMockStore({
        initialValue: { status: 'loading' },
        enableLogging: false
      });

      setTimeout(() => {
        mockStore.setValue({ status: 'success' });
      }, 50);

      const result = await waitForStoreValue(
        mockStore,
        { status: 'success' }
      );

      expect(result).toEqual({ status: 'success' });
    });

    test('waitForStoreChange - 구독 기반 변경 대기', async () => {
      const mockStore = createMockStore({
        initialValue: 'initial',
        enableLogging: false
      });

      setTimeout(() => {
        mockStore.setValue('changed');
      }, 50);

      const result = await waitForStoreChange(mockStore, 500);

      expect(result).toBe('changed');
    });
  });

  describe('다중 Store 대기', () => {
    test('waitForMultipleStores - 여러 Store 조건 만족 대기', async () => {
      const userStore = createMockStore({
        initialValue: { loaded: false },
        enableLogging: false
      });

      const dataStore = createMockStore({
        initialValue: { ready: false },
        enableLogging: false
      });

      // 각각 다른 시간에 조건 만족
      setTimeout(() => {
        userStore.setValue({ loaded: true });
      }, 50);

      setTimeout(() => {
        dataStore.setValue({ ready: true });
      }, 100);

      const results = await waitForMultipleStores([
        {
          store: userStore,
          predicate: (value) => value.loaded === true,
          name: 'userStore'
        },
        {
          store: dataStore,
          predicate: (value) => value.ready === true,
          name: 'dataStore'
        }
      ]);

      expect(results).toEqual([
        { loaded: true },
        { ready: true }
      ]);
    });

    test('waitForMultipleStores - 하나 실패시 에러', async () => {
      const store1 = createMockStore({
        initialValue: 0,
        enableLogging: false
      });

      const store2 = createMockStore({
        initialValue: 0,
        enableLogging: false
      });

      // store1만 조건 만족
      setTimeout(() => {
        store1.setValue(1);
      }, 50);

      await expect(
        waitForMultipleStores([
          {
            store: store1,
            predicate: (value) => value === 1,
            name: 'store1'
          },
          {
            store: store2,
            predicate: (value) => value === 999, // 만족되지 않음
            name: 'store2'
          }
        ], 200)
      ).rejects.toThrow('Store store2 failed');
    });
  });

  describe('Action 완료 대기', () => {
    test('waitForActionComplete - MockStore 통계 기반 대기', async () => {
      const mockStore = createMockStore({
        initialValue: 0,
        enableLogging: false
      });

      // 비동기적으로 여러 작업 수행
      setTimeout(() => {
        mockStore.setValue(1);
        mockStore.setValue(2);
        mockStore.update(prev => prev + 1);
      }, 50);

      await waitForActionComplete(
        mockStore,
        { setValue: 2, update: 1 }
      );

      const stats = mockStore.getStats();
      expect(stats.setValueCalls).toBe(2);
      expect(stats.updateCalls).toBe(1);
    });

    test('waitForActionComplete - 타임아웃', async () => {
      const mockStore = createMockStore({
        initialValue: 0,
        enableLogging: false
      });

      await expect(
        waitForActionComplete(
          mockStore,
          { setValue: 10 }, // 달성되지 않는 목표
          100
        )
      ).rejects.toThrow(/waitForActionComplete timed out/);
    });
  });

  describe('고급 비동기 유틸리티', () => {
    test('expectWithinTime - 시간 제한 내 작업 완료', async () => {
      const quickOperation = () => Promise.resolve('success');

      const result = await expectWithinTime(
        quickOperation,
        1000
      );

      expect(result).toBe('success');
    });

    test('expectWithinTime - 타임아웃 에러', async () => {
      const slowOperation = () => new Promise(resolve => 
        setTimeout(() => resolve('too-late'), 200)
      );

      await expect(
        expectWithinTime(slowOperation, 100)
      ).rejects.toThrow('Operation timed out after 100ms');
    });

    test('pollUntil - 폴링으로 조건 만족 대기', async () => {
      let counter = 0;
      const condition = () => ++counter;
      const predicate = (result: number) => result >= 5;

      const result = await pollUntil(condition, predicate, {
        timeout: 1000,
        interval: 10
      });

      expect(result).toBe(5);
    });

    test('pollUntil - 최대 시도 횟수 초과', async () => {
      let counter = 0;
      const condition = () => ++counter;
      const predicate = (result: number) => result >= 100; // 달성 불가능

      await expect(
        pollUntil(condition, predicate, {
          timeout: 1000,
          interval: 50,
          maxAttempts: 5
        })
      ).rejects.toThrow('pollUntil exceeded max attempts (5)');
    });

    test('pollUntil - 비동기 조건 함수', async () => {
      let asyncCounter = 0;
      const asyncCondition = async () => {
        await delay(10);
        return ++asyncCounter;
      };

      const result = await pollUntil(
        asyncCondition,
        (result) => result >= 3,
        { timeout: 1000, interval: 20 }
      );

      expect(result).toBe(3);
    });
  });
});

describe('TestTimers - 타이머 모킹', () => {
  beforeEach(() => {
    TestTimers.useRealTimers();
  });

  afterEach(() => {
    TestTimers.useRealTimers();
  });

  test('가짜 타이머 활성화/비활성화', () => {
    expect(TestTimers.isFakeTimers()).toBe(false);

    TestTimers.useFakeTimers();
    expect(TestTimers.isFakeTimers()).toBe(true);

    TestTimers.useRealTimers();
    expect(TestTimers.isFakeTimers()).toBe(false);
  });

  test('가짜 타이머로 시간 제어', () => {
    TestTimers.useFakeTimers();

    let completed = false;
    setTimeout(() => {
      completed = true;
    }, 1000);

    expect(completed).toBe(false);

    TestTimers.advanceTimersByTime(1000);
    expect(completed).toBe(true);
  });
});

describe('BatchAsyncManager - 배치 비동기 관리', () => {
  test('여러 Promise 배치 관리', async () => {
    const manager = createBatchAsyncManager();

    const promise1 = delay(50).then(() => 'result1');
    const promise2 = delay(100).then(() => 'result2');
    const promise3 = delay(75).then(() => 'result3');

    manager
      .add(promise1, 'task1')
      .add(promise2, 'task2')
      .add(promise3, 'task3');

    expect(manager.getPendingCount()).toBe(3);

    const results = await manager.waitAll();
    
    expect(results).toEqual(['result1', 'result2', 'result3']);
    expect(manager.getPendingCount()).toBe(0);
  });

  test('Store 업데이트 배치 관리', async () => {
    const manager = createBatchAsyncManager();
    
    const store1 = createMockStore({ initialValue: 0, enableLogging: false });
    const store2 = createMockStore({ initialValue: 'waiting', enableLogging: false });

    // Store 업데이트를 배치에 추가
    manager.addStoreUpdate(
      store1,
      (value) => value === 10,
      'store1-update'
    );

    manager.addStoreUpdate(
      store2,
      (value) => value === 'ready',
      'store2-update'
    );

    // 비동기적으로 Store 업데이트
    setTimeout(() => {
      store1.setValue(10);
    }, 50);

    setTimeout(() => {
      store2.setValue('ready');
    }, 100);

    const results = await manager.waitAll();

    expect(results).toEqual([10, 'ready']);
  });

  test('가장 먼저 완료되는 작업 대기', async () => {
    const manager = createBatchAsyncManager();

    const slowPromise = delay(200).then(() => 'slow');
    const fastPromise = delay(50).then(() => 'fast');
    const mediumPromise = delay(100).then(() => 'medium');

    manager
      .add(slowPromise, 'slow')
      .add(fastPromise, 'fast')
      .add(mediumPromise, 'medium');

    const result = await manager.waitAny();

    expect(result).toBe('fast');
  });

  test('타임아웃 처리', async () => {
    const manager = createBatchAsyncManager();

    const neverResolve = new Promise(() => {}); // 영원히 대기

    manager.add(neverResolve, 'never', 100); // 100ms 타임아웃

    await expect(manager.waitAll()).rejects.toThrow('never timed out');
  });

  test('배치 초기화', () => {
    const manager = createBatchAsyncManager();

    manager.add(Promise.resolve('test'), 'test');
    expect(manager.getPendingCount()).toBe(1);

    manager.clear();
    expect(manager.getPendingCount()).toBe(0);
  });
});

describe('기본 설정값', () => {
  test('DEFAULT_TIMEOUTS 값 확인', () => {
    expect(DEFAULT_TIMEOUTS.default).toBe(1000);
    expect(DEFAULT_TIMEOUTS.fast).toBe(100);
    expect(DEFAULT_TIMEOUTS.slow).toBe(5000);
    expect(DEFAULT_TIMEOUTS.extended).toBe(10000);
  });
});

describe('실제 사용 시나리오', () => {
  test('복잡한 비동기 워크플로우 테스트', async () => {
    const userStore = createMockStore({
      initialValue: { status: 'loading', data: null },
      enableLogging: false
    });

    const uiStore = createMockStore({
      initialValue: { loading: true, error: null },
      enableLogging: false
    });

    // 비동기 데이터 로딩 시뮬레이션
    setTimeout(() => {
      userStore.setValue({ status: 'loaded', data: { id: 1, name: 'John' } });
    }, 100);

    setTimeout(() => {
      uiStore.setValue({ loading: false, error: null });
    }, 150);

    // 배치 매니저로 모든 작업 완료 대기
    const manager = createBatchAsyncManager();

    manager.addStoreUpdate(
      userStore,
      (value) => value.status === 'loaded',
      'user-data-loaded'
    );

    manager.addStoreUpdate(
      uiStore,
      (value) => !value.loading,
      'ui-loading-complete'
    );

    const results = await manager.waitAll();

    expect(results[0]).toEqual({ 
      status: 'loaded', 
      data: { id: 1, name: 'John' } 
    });

    expect(results[1]).toEqual({ 
      loading: false, 
      error: null 
    });

    // 최종 상태 검증
    expect(userStore.getValue().status).toBe('loaded');
    expect(uiStore.getValue().loading).toBe(false);
  });
});