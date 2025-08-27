/**
 * MockStore 클래스 테스트
 * 새로운 테스트 인프라의 핵심 기능 검증
 */

import { MockStore, createMockStore, createMockStores, MockStoreBatch } from '../mock-store';
import { Store } from '../../stores/core/Store';

describe('MockStore', () => {
  describe('기본 기능', () => {
    test('MockStore 생성과 초기값 설정', () => {
      const mockStore = createMockStore({
        initialValue: { count: 0, name: 'test' },
        name: 'test-store'
      });

      expect(mockStore.getValue()).toEqual({ count: 0, name: 'test' });
      expect(mockStore.name).toBe('test-store');
    });

    test('setValue 통계 추적', () => {
      const mockStore = createMockStore({
        initialValue: 0,
        enableLogging: false
      });

      // 초기 통계 확인
      const initialStats = mockStore.getStats();
      expect(initialStats.setValueCalls).toBe(0);

      // setValue 호출
      mockStore.setValue(1);
      mockStore.setValue(2);

      const stats = mockStore.getStats();
      expect(stats.setValueCalls).toBe(2);
      expect(stats.valueHistory).toHaveLength(3); // 초기값 + 2번 변경
    });

    test('update 통계 추적', () => {
      const mockStore = createMockStore({
        initialValue: 10,
        enableLogging: false
      });

      mockStore.update(prev => prev + 5);
      mockStore.update(prev => prev * 2);

      const stats = mockStore.getStats();
      expect(stats.updateCalls).toBe(2);
      expect(mockStore.getValue()).toBe(30); // (10 + 5) * 2
    });

    test('구독자 수 추적', () => {
      const mockStore = createMockStore({
        initialValue: 'test',
        enableLogging: false
      });

      const stats1 = mockStore.getStats();
      expect(stats1.listenerCount).toBe(0);

      // 구독 추가
      const unsubscribe1 = mockStore.subscribe(() => {});
      const unsubscribe2 = mockStore.subscribe(() => {});

      const stats2 = mockStore.getStats();
      expect(stats2.listenerCount).toBe(2);

      // 구독 해제
      unsubscribe1();
      
      const stats3 = mockStore.getStats();
      expect(stats3.listenerCount).toBe(1);

      unsubscribe2();
      
      const stats4 = mockStore.getStats();
      expect(stats4.listenerCount).toBe(0);
    });
  });

  describe('고급 기능', () => {
    test('수동 모드와 triggerNotification', () => {
      const mockStore = createMockStore({
        initialValue: 0,
        autoNotify: true,
        enableLogging: false
      });

      let notificationCount = 0;
      mockStore.subscribe(() => {
        notificationCount++;
      });

      // 자동 모드에서 알림 테스트
      mockStore.setValue(1);
      expect(notificationCount).toBe(1);

      // 수동 모드 활성화
      mockStore.setManualMode(true);
      mockStore.setValue(2);
      expect(notificationCount).toBe(1); // 자동 알림 없음

      // 수동 알림 트리거
      mockStore.triggerNotification();
      expect(notificationCount).toBe(2);
    });

    test('값 변경 기록 추적', () => {
      const mockStore = createMockStore({
        initialValue: { data: 'start' },
        enableLogging: false
      });

      mockStore.setValue({ data: 'middle' });
      mockStore.setValue({ data: 'end' });

      const history = mockStore.getValueHistory();
      expect(history).toHaveLength(3);
      expect(history[0].value).toEqual({ data: 'start' });
      expect(history[1].value).toEqual({ data: 'middle' });
      expect(history[2].value).toEqual({ data: 'end' });

      // 타임스탬프 검증
      expect(history[0].timestamp).toBeLessThanOrEqual(history[1].timestamp);
      expect(history[1].timestamp).toBeLessThanOrEqual(history[2].timestamp);
    });

    test('특정 값으로 변경된 횟수 추적', () => {
      const mockStore = createMockStore({
        initialValue: 'a',
        enableLogging: false
      });

      mockStore.setValue('b');
      mockStore.setValue('a'); // 다시 'a'로
      mockStore.setValue('c');
      mockStore.setValue('a'); // 또 다시 'a'로

      const countA = mockStore.getValueChangeCount('a');
      const countB = mockStore.getValueChangeCount('b');
      const countC = mockStore.getValueChangeCount('c');

      expect(countA).toBe(3); // 초기값 + 2번 변경
      expect(countB).toBe(1);
      expect(countC).toBe(1);
    });

    test('setValueSilent - 알림 없는 값 설정', () => {
      const mockStore = createMockStore({
        initialValue: 0,
        enableLogging: false
      });

      let notificationCount = 0;
      mockStore.subscribe(() => {
        notificationCount++;
      });

      // 일반 setValue는 알림 발생
      mockStore.setValue(1);
      expect(notificationCount).toBe(1);

      // setValueSilent는 알림 없음
      mockStore.setValueSilent(2);
      expect(notificationCount).toBe(1);
      expect(mockStore.getValue()).toBe(2);
    });

    test('resetToInitial - 초기 상태로 복원', () => {
      const initialValue = { count: 10, name: 'initial' };
      const mockStore = createMockStore({
        initialValue,
        enableLogging: false
      });

      // 값 변경
      mockStore.setValue({ count: 20, name: 'changed' });
      mockStore.setValue({ count: 30, name: 'changed-again' });

      const statsBeforeReset = mockStore.getStats();
      expect(statsBeforeReset.setValueCalls).toBe(2);

      // 초기 상태로 복원
      mockStore.resetToInitial();

      expect(mockStore.getValue()).toEqual(initialValue);
      
      const statsAfterReset = mockStore.getStats();
      expect(statsAfterReset.setValueCalls).toBe(0);
      expect(statsAfterReset.valueHistory).toHaveLength(1);
    });
  });

  describe('Jest 통합', () => {
    test('createSpies - Jest spy 생성', () => {
      const mockStore = createMockStore({
        initialValue: 0,
        enableLogging: false
      });

      const spies = mockStore.createSpies();

      expect(jest.isMockFunction(spies.setValue)).toBe(true);
      expect(jest.isMockFunction(spies.update)).toBe(true);

      // spy 호출 테스트
      mockStore.setValue(5);
      mockStore.update(prev => prev + 1);

      expect(spies.setValue).toHaveBeenCalledWith(5);
      expect(spies.update).toHaveBeenCalledWith(expect.any(Function));
      expect(spies.setValue).toHaveBeenCalledTimes(1);
      expect(spies.update).toHaveBeenCalledTimes(1);
    });

    test('spy 복원', () => {
      const mockStore = createMockStore({
        initialValue: 0,
        enableLogging: false
      });

      const originalSetValue = mockStore.setValue;
      const spies = mockStore.createSpies();

      expect(mockStore.setValue).toBe(spies.setValue);

      mockStore.restoreSpies();

      // spy가 아닌 원본 메서드로 복원되었는지 확인
      expect(jest.isMockFunction(mockStore.setValue)).toBe(false);
    });
  });
});

describe('createMockStores - 다중 Store 생성', () => {
  test('여러 MockStore 동시 생성', () => {
    const stores = createMockStores({
      user: {
        initialValue: { id: 1, name: 'John' },
        name: 'user-store'
      },
      counter: {
        initialValue: 0,
        name: 'counter-store'
      },
      settings: {
        initialValue: { theme: 'dark', language: 'en' },
        name: 'settings-store'
      }
    });

    expect(stores.user.getValue()).toEqual({ id: 1, name: 'John' });
    expect(stores.counter.getValue()).toBe(0);
    expect(stores.settings.getValue()).toEqual({ theme: 'dark', language: 'en' });

    // 각각 독립적인 MockStore 인스턴스인지 확인
    expect(stores.user instanceof MockStore).toBe(true);
    expect(stores.counter instanceof MockStore).toBe(true);
    expect(stores.settings instanceof MockStore).toBe(true);
  });
});

describe('MockStoreBatch - 배치 작업', () => {
  test('여러 Store 배치 관리', () => {
    const store1 = createMockStore({ initialValue: 0, enableLogging: false });
    const store2 = createMockStore({ initialValue: 10, enableLogging: false });
    const store3 = createMockStore({ initialValue: 20, enableLogging: false });

    const batch = new MockStoreBatch<number>()
      .add(store1)
      .add(store2)
      .add(store3);

    // 배치 수동 모드 설정
    batch.setManualMode(true);

    store1.setValue(1);
    store2.setValue(11);
    store3.setValue(21);

    // 수동 모드이므로 알림이 발생하지 않았는지 확인
    const stats1 = store1.getStats();
    const stats2 = store2.getStats();
    const stats3 = store3.getStats();

    expect(stats1.notificationCount).toBe(0);
    expect(stats2.notificationCount).toBe(0);
    expect(stats3.notificationCount).toBe(0);

    // 배치 알림 트리거
    batch.triggerNotifications();

    const statsAfter1 = store1.getStats();
    const statsAfter2 = store2.getStats();
    const statsAfter3 = store3.getStats();

    expect(statsAfter1.notificationCount).toBe(1);
    expect(statsAfter2.notificationCount).toBe(1);
    expect(statsAfter3.notificationCount).toBe(1);
  });

  test('배치 통계 집계', () => {
    const store1 = createMockStore({ initialValue: 0, enableLogging: false });
    const store2 = createMockStore({ initialValue: 0, enableLogging: false });

    const batch = new MockStoreBatch<number>()
      .add(store1)
      .add(store2);

    // 각 Store에서 작업 수행
    store1.setValue(1);
    store1.setValue(2);
    store1.update(prev => prev + 1);

    store2.setValue(10);
    store2.update(prev => prev + 5);
    store2.update(prev => prev + 5);

    const totalStats = batch.getTotalStats();

    expect(totalStats.totalSetValueCalls).toBe(3); // store1: 2, store2: 1
    expect(totalStats.totalUpdateCalls).toBe(3); // store1: 1, store2: 2
  });

  test('배치 초기화', () => {
    const store1 = createMockStore({ initialValue: 0, enableLogging: false });
    const store2 = createMockStore({ initialValue: 0, enableLogging: false });

    const batch = new MockStoreBatch<number>()
      .add(store1)
      .add(store2);

    // 작업 수행
    store1.setValue(5);
    store2.setValue(10);

    let totalStats = batch.getTotalStats();
    expect(totalStats.totalSetValueCalls).toBe(2);

    // 배치 초기화
    batch.resetToInitial();

    // Store들이 초기값으로 복원되었는지 확인
    expect(store1.getValue()).toBe(0);
    expect(store2.getValue()).toBe(0);

    totalStats = batch.getTotalStats();
    expect(totalStats.totalSetValueCalls).toBe(0);
  });
});

describe('실제 Store와의 호환성', () => {
  test('MockStore를 실제 Store처럼 사용', () => {
    const mockStore = createMockStore({
      initialValue: { data: 'test' },
      enableLogging: false
    });

    // Store 인터페이스 호환성 확인
    const store: Store<{ data: string }> = mockStore as any;

    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount++;
    });

    store.setValue({ data: 'updated' });
    expect(store.getValue()).toEqual({ data: 'updated' });
    expect(notificationCount).toBe(1);

    store.update(prev => ({ ...prev, data: prev.data + '-modified' }));
    expect(store.getValue()).toEqual({ data: 'updated-modified' });
    expect(notificationCount).toBe(2);

    unsubscribe();

    // MockStore의 추가 기능도 사용 가능
    const stats = (store as MockStore<{ data: string }>).getStats();
    expect(stats.setValueCalls).toBe(1);
    expect(stats.updateCalls).toBe(1);
  });
});