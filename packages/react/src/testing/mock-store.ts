/**
 * Mock Store 유틸리티
 * 테스트에서 사용할 수 있는 완전 제어 가능한 Store 구현
 */

import { Store } from '../stores/core/Store';
import type { Listener, Unsubscribe } from '../stores/core/types';

export interface MockStoreConfig<T> {
  /** 초기 값 */
  initialValue: T;
  /** Store 이름 (디버깅용) */
  name?: string;
  /** 자동 알림 활성화 여부 */
  autoNotify?: boolean;
  /** Mock 동작 로깅 여부 */
  enableLogging?: boolean;
}

export interface MockStoreStats {
  /** setValue 호출 횟수 */
  setValueCalls: number;
  /** update 호출 횟수 */
  updateCalls: number;
  /** 현재 구독자 수 */
  listenerCount: number;
  /** 총 알림 횟수 */
  notificationCount: number;
  /** 값 변경 기록 */
  valueHistory: { value: any; timestamp: number }[];
}

/**
 * 테스트용 Mock Store 클래스
 * 실제 Store의 모든 기능을 구현하면서 추가 테스트 기능 제공
 */
export class MockStore<T> extends Store<T> {
  private stats: MockStoreStats;
  private config: Required<MockStoreConfig<T>>;
  private manualMode = false;

  constructor(config: MockStoreConfig<T>) {
    const finalConfig: Required<MockStoreConfig<T>> = {
      name: 'MockStore',
      autoNotify: true,
      enableLogging: process.env.NODE_ENV === 'test',
      ...config
    };

    super(finalConfig.name, config.initialValue);
    this.config = finalConfig;
    this.stats = this.createInitialStats(config.initialValue);
  }

  private createInitialStats(initialValue: T): MockStoreStats {
    return {
      setValueCalls: 0,
      updateCalls: 0,
      listenerCount: 0,
      notificationCount: 0,
      valueHistory: [{ value: initialValue, timestamp: Date.now() }]
    };
  }

  /**
   * setValue 메서드 오버라이드 (통계 수집 포함)
   */
  setValue(value: T, options?: { skipClone?: boolean; skipComparison?: boolean }): void {
    this.stats.setValueCalls++;
    this.stats.valueHistory.push({ value, timestamp: Date.now() });
    
    if (this.config.enableLogging) {
      console.log(`MockStore [${this.name}]: setValue called`, { value, options });
    }

    super.setValue(value, options);
    
    if (!this.manualMode && this.config.autoNotify) {
      this.stats.notificationCount++;
    }
  }

  /**
   * update 메서드 오버라이드 (통계 수집 포함)
   */
  update(updater: (current: T) => T): void {
    this.stats.updateCalls++;
    
    if (this.config.enableLogging) {
      console.log(`MockStore [${this.name}]: update called`);
    }

    super.update(updater);
    
    if (!this.manualMode && this.config.autoNotify) {
      this.stats.notificationCount++;
    }
  }

  /**
   * 구독 메서드 오버라이드 (통계 수집 포함)
   */
  subscribe = (listener: Listener): Unsubscribe => {
    // Store의 원본 subscribe 메서드 호출  
    const originalSubscribe = Object.getPrototypeOf(Object.getPrototypeOf(this)).subscribe;
    const originalUnsubscribe = originalSubscribe.call(this, listener);
    this.stats.listenerCount++;
    
    if (this.config.enableLogging) {
      console.log(`MockStore [${this.name}]: subscription added. Total: ${this.stats.listenerCount}`);
    }

    return () => {
      originalUnsubscribe();
      this.stats.listenerCount--;
      
      if (this.config.enableLogging) {
        console.log(`MockStore [${this.name}]: subscription removed. Total: ${this.stats.listenerCount}`);
      }
    };
  };

  // === 테스트 전용 메서드들 ===

  /**
   * 수동 모드 활성화/비활성화
   * 수동 모드에서는 triggerNotification()을 명시적으로 호출해야 함
   */
  setManualMode(enabled: boolean): void {
    this.manualMode = enabled;
    if (this.config.enableLogging) {
      console.log(`MockStore [${this.name}]: Manual mode ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * 수동으로 리스너 알림 트리거
   */
  triggerNotification(): void {
    this.stats.notificationCount++;
    this._scheduleNotification();
    
    if (this.config.enableLogging) {
      console.log(`MockStore [${this.name}]: Manual notification triggered`);
    }
  }

  /**
   * 통계 정보 조회
   */
  getStats(): MockStoreStats {
    return { ...this.stats };
  }

  /**
   * 통계 초기화
   */
  resetStats(): void {
    const currentValue = this.getValue();
    this.stats = this.createInitialStats(currentValue);
    
    if (this.config.enableLogging) {
      console.log(`MockStore [${this.name}]: Stats reset`);
    }
  }

  /**
   * 값 변경 기록 조회
   */
  getValueHistory(): Array<{ value: T; timestamp: number }> {
    return [...this.stats.valueHistory];
  }

  /**
   * 마지막 N개의 값 변경 기록
   */
  getRecentValueHistory(count: number): Array<{ value: T; timestamp: number }> {
    return this.stats.valueHistory.slice(-count);
  }

  /**
   * 특정 값으로 변경된 횟수
   */
  getValueChangeCount(value: T): number {
    return this.stats.valueHistory.filter(entry => 
      JSON.stringify(entry.value) === JSON.stringify(value)
    ).length;
  }

  /**
   * 테스트 모드에서 상태 직접 설정 (알림 없이)
   */
  setValueSilent(value: T): void {
    this._value = value;
    this._snapshot = this._createSnapshot();
    this.stats.valueHistory.push({ value, timestamp: Date.now() });
    
    if (this.config.enableLogging) {
      console.log(`MockStore [${this.name}]: Silent value set`, { value });
    }
  }

  /**
   * 모든 리스너 제거 (테스트 정리용)
   */
  clearAllListeners(): void {
    super.clearListeners();
    this.stats.listenerCount = 0;
    
    if (this.config.enableLogging) {
      console.log(`MockStore [${this.name}]: All listeners cleared`);
    }
  }

  /**
   * Store를 초기 상태로 재설정
   */
  resetToInitial(): void {
    const initialValue = this.config.initialValue;
    this.setValueSilent(initialValue);
    this.resetStats();
    
    if (this.config.enableLogging) {
      console.log(`MockStore [${this.name}]: Reset to initial value`, { initialValue });
    }
  }

  /**
   * Jest spy와 호환되는 spy 객체 생성
   */
  createSpies() {
    const originalSetValue = this.setValue.bind(this);
    const originalUpdate = this.update.bind(this);

    const spies = {
      setValue: jest.fn().mockImplementation(originalSetValue),
      update: jest.fn().mockImplementation(originalUpdate)
    };

    // 실제 메서드를 spy로 교체
    this.setValue = spies.setValue;
    this.update = spies.update;

    return spies;
  }

  /**
   * Spy 복원 (원래 메서드로 되돌림)
   */
  restoreSpies(): void {
    // 원본 메서드로 복원
    this.setValue = super.setValue.bind(this);
    this.update = super.update.bind(this);
  }
}

/**
 * Mock Store 생성 헬퍼 함수
 */
export function createMockStore<T>(config: MockStoreConfig<T>): MockStore<T> {
  return new MockStore<T>(config);
}

/**
 * 여러 Mock Store들을 생성하는 헬퍼
 */
export function createMockStores<T extends Record<string, any>>(
  configs: { [K in keyof T]: MockStoreConfig<T[K]> }
): { [K in keyof T]: MockStore<T[K]> } {
  const stores = {} as { [K in keyof T]: MockStore<T[K]> };
  
  for (const [key, config] of Object.entries(configs)) {
    stores[key as keyof T] = createMockStore(config as MockStoreConfig<T[keyof T]>);
  }
  
  return stores;
}

/**
 * Mock Store를 실제 Store처럼 타입 캐스팅하는 헬퍼
 * 테스트에서 실제 컴포넌트에 주입할 때 사용
 */
export function asMockStore<T>(store: MockStore<T>): Store<T> {
  return store as unknown as Store<T>;
}

/**
 * Mock Store 배치 테스트 유틸리티
 */
export class MockStoreBatch<T> {
  private stores: MockStore<T>[] = [];

  add(store: MockStore<T>): MockStoreBatch<T> {
    this.stores.push(store);
    return this;
  }

  setManualMode(enabled: boolean): MockStoreBatch<T> {
    this.stores.forEach(store => store.setManualMode(enabled));
    return this;
  }

  triggerNotifications(): MockStoreBatch<T> {
    this.stores.forEach(store => store.triggerNotification());
    return this;
  }

  resetStats(): MockStoreBatch<T> {
    this.stores.forEach(store => store.resetStats());
    return this;
  }

  resetToInitial(): MockStoreBatch<T> {
    this.stores.forEach(store => store.resetToInitial());
    return this;
  }

  getTotalStats(): { totalSetValueCalls: number; totalUpdateCalls: number; totalListeners: number } {
    return this.stores.reduce(
      (acc, store) => {
        const stats = store.getStats();
        return {
          totalSetValueCalls: acc.totalSetValueCalls + stats.setValueCalls,
          totalUpdateCalls: acc.totalUpdateCalls + stats.updateCalls,
          totalListeners: acc.totalListeners + stats.listenerCount
        };
      },
      { totalSetValueCalls: 0, totalUpdateCalls: 0, totalListeners: 0 }
    );
  }
}

/**
 * Mock Store 배치 생성 헬퍼
 */
export function createMockStoreBatch<T>(): MockStoreBatch<T> {
  return new MockStoreBatch<T>();
}