import type { IStore, Listener, Snapshot, Unsubscribe } from './types';
import { createLogger } from '@context-action/logger';
import { safeGet, safeSet, getGlobalImmutabilityOptions, performantSafeGet } from './immutable';

/**
 * Store 클래스 - 중앙화된 상태 관리의 핵심
 * 
 * 핵심 기능:
 * 1. 상태 저장 (_value) - 실제 데이터 보관
 * 2. 구독 관리 (listeners) - React 컴포넌트들의 구독 추적
 * 3. 스냅샷 관리 (_snapshot) - 불변성과 최적화를 위한 스냅샷
 * 4. 변경 알림 (_notifyListeners) - 상태 변경 시 구독자들에게 알림
 * 
 * @implements store-integration-pattern
 * @implements model-layer
 * @memberof core-concepts
 */
export class Store<T = any> implements IStore<T> {
  // 구독자 목록 - Set을 사용하여 중복 방지와 O(1) 삭제 보장
  private listeners = new Set<Listener>();
  // 실제 상태 값 - 단일 진실 공급원(Single Source of Truth)
  private _value: T;
  // 불변 스냅샷 - React의 useSyncExternalStore와 호환
  private _snapshot: Snapshot<T>;
  public readonly name: string;
  protected logger = createLogger();

  constructor(name: string, initialValue: T) {
    this.name = name;
    this._value = initialValue;
    // 초기 스냅샷 생성 - 즉시 구독 가능한 상태로 만듦
    this._snapshot = this._createSnapshot();
    this.logger.debug(`Store created: ${name}`, { initialValue });
  }

  /**
   * Store 변경사항 구독
   * 핵심 로직: React 컴포넌트가 Store 변경을 감지할 수 있도록 리스너 등록
   * 
   * @implements store-hooks
   * @memberof api-terms
   * @param listener - 상태 변경 시 호출될 콜백 함수
   * @returns unsubscribe 함수 - 구독 해제용
   */
  subscribe = (listener: Listener): Unsubscribe => {
    // Set에 리스너 추가 - 자동 중복 제거
    this.listeners.add(listener);
    this.logger.trace(`Subscriber added to store: ${this.name}`, { 
      listenerCount: this.listeners.size 
    });
    
    // 구독 해제 함수 반환 - 클로저로 listener 참조 유지
    return () => {
      this.listeners.delete(listener);
      this.logger.trace(`Subscriber removed from store: ${this.name}`, { 
        listenerCount: this.listeners.size 
      });
    };
  };

  /**
   * 현재 Store 스냅샷 가져오기
   * 핵심 로직: React의 useSyncExternalStore가 사용하는 불변 스냅샷 제공
   */
  getSnapshot = (): Snapshot<T> => {
    return this._snapshot;
  };

  /**
   * 현재 값 직접 가져오기 (액션 핸들러용)
   * 핵심 로직: 불변성을 보장하는 깊은 복사본 반환
   * 
   * @implements lazy-evaluation
   * @implements store-immutability
   * @memberof architecture-terms
   * 
   * 사용 시나리오: Action handler에서 최신 상태 읽기
   * 보안 강화: 외부에서 반환된 값을 수정해도 Store 내부 상태는 보호됨
   */
  getValue(): T {
    const options = getGlobalImmutabilityOptions();
    const clonedValue = performantSafeGet(this._value, options.enableCloning);
    
    this.logger.trace(`Store getValue: ${this.name}`, { 
      type: typeof this._value,
      cloned: options.enableCloning 
    });
    
    return clonedValue;
  }

  /**
   * Store 값 설정 및 구독자 알림
   * 핵심 로직: 
   * 1. 입력값의 불변성 보장을 위한 깊은 복사
   * 2. Object.is()로 참조 동등성 검사 (불필요한 리렌더링 방지)
   * 3. 값 변경 시에만 스냅샷 재생성 및 알림
   * 
   * @implements unidirectional-data-flow
   * @implements store-immutability
   * @memberof architecture-terms
   * 
   * 보안 강화: 입력값을 복사하여 Store 내부 상태가 외부 참조에 의해 변경되지 않도록 보호
   */
  setValue(value: T): void {
    const options = getGlobalImmutabilityOptions();
    const safeValue = safeSet(value, options.enableCloning);
    const oldValue = this._value;
    
    // 참조 동등성 검사 - 성능 최적화의 핵심
    if (!Object.is(this._value, safeValue)) {
      this._value = safeValue;
      // 새 스냅샷 생성 - 불변성 보장
      this._snapshot = this._createSnapshot();
      this.logger.debug(`Store value updated: ${this.name}`, { 
        oldValue, 
        newValue: safeValue,
        cloned: options.enableCloning,
        listenerCount: this.listeners.size 
      });
      // 모든 구독자에게 변경 알림
      this._notifyListeners();
    } else {
      this.logger.trace(`Store value unchanged: ${this.name}`, { value: safeValue });
    }
  }

  /**
   * Update value using updater function
   * 핵심 로직: 
   * 1. 현재 값의 안전한 복사본을 updater에 전달
   * 2. updater 결과를 setValue로 안전하게 설정
   * 
   * @implements store-immutability
   * 보안 강화: updater 함수가 내부 상태를 직접 수정할 수 없도록 복사본 전달
   */
  update(updater: (current: T) => T): void {
    const options = getGlobalImmutabilityOptions();
    const safeCurrentValue = performantSafeGet(this._value, options.enableCloning);
    
    this.logger.trace(`Store update called: ${this.name}`, { 
      currentValue: this._value,
      cloned: options.enableCloning 
    });
    
    const updatedValue = updater(safeCurrentValue);
    this.setValue(updatedValue);
  }

  /**
   * Get number of active listeners
   */
  getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Clear all listeners
   */
  clearListeners(): void {
    const count = this.listeners.size;
    this.listeners.clear();
    this.logger.debug(`Cleared all listeners from store: ${this.name}`, { clearedCount: count });
  }

  private _createSnapshot(): Snapshot<T> {
    const options = getGlobalImmutabilityOptions();
    const clonedValue = safeGet(this._value, options.enableCloning);
    
    this.logger.trace(`Creating snapshot for store: ${this.name}`, { 
      type: typeof this._value,
      cloned: options.enableCloning 
    });
    
    return {
      value: clonedValue,
      name: this.name,
      lastUpdate: Date.now()
    };
  }

  private _notifyListeners(): void {
    this.logger.trace(`Notifying listeners for store: ${this.name}`, { 
      listenerCount: this.listeners.size 
    });
    
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        this.logger.error(`Error in store listener for "${this.name}"`, error);
      }
    });
  }
}

/**
 * Store 팩토리 함수 - 간편한 Store 인스턴스 생성
 * 핵심 기능: 타입 안전한 Store 인스턴스 생성을 위한 팩토리 함수
 * 
 * @template T - Store 값 타입
 * @param name - Store 식별자 이름
 * @param initialValue - Store 초기값
 * @returns Store 인스턴스
 * 
 * @example
 * ```typescript
 * // 객체 Store 생성
 * const userStore = createStore('user', { id: '', name: '', email: '' });
 * 
 * // 원시값 Store 생성
 * const countStore = createStore('count', 0);
 * const themeStore = createStore('theme', 'light');
 * 
 * // Store 사용
 * userStore.setValue({ id: '1', name: 'John', email: 'john@example.com' });
 * countStore.setValue(42);
 * ```
 */
export function createStore<T>(name: string, initialValue: T): Store<T> {
  return new Store<T>(name, initialValue);
}

/**
 * Store configuration options for HOC patterns
 */
export interface StoreConfig<T = any> {
  name: string;
  initialValue: T;
  registry?: import('./StoreRegistry').StoreRegistry;
  autoRegister?: boolean;
}

/**
 * Enhanced store with auto-registration capability
 */
export class ManagedStore<T> extends Store<T> {
  private registry?: import('./StoreRegistry').StoreRegistry;
  private autoRegister: boolean;

  constructor(config: StoreConfig<T>) {
    super(config.name, config.initialValue);
    this.registry = config.registry;
    this.autoRegister = config.autoRegister ?? true;
    
    if (this.autoRegister && this.registry) {
      this.registry.register(this.name, this);
    }
  }

  /**
   * Dispose store and unregister from registry
   */
  dispose(): void {
    if (this.registry) {
      this.registry.unregister(this.name);
    }
    this.clearListeners();
  }
}

/**
 * Create a managed store with auto-registration
 * @template T - The store value type
 * @param config - Store configuration
 * @returns ManagedStore instance
 * 
 * @example
 * ```typescript
 * const registry = new StoreRegistry();
 * 
 * // Auto-registered store
 * const userStore = createManagedStore({
 *   name: 'user',
 *   initialValue: { id: '', name: '' },
 *   registry,
 *   autoRegister: true
 * });
 * 
 * // The store is automatically available via registry.getStore('user')
 * ```
 */
export function createManagedStore<T>(config: StoreConfig<T>): ManagedStore<T> {
  return new ManagedStore<T>(config);
}
