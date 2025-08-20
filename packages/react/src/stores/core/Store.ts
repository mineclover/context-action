import type { IStore, Listener, Snapshot, Unsubscribe } from './types';
import { safeGet, safeSet, getGlobalImmutabilityOptions, performantSafeGet } from '../utils/immutable';
import { 
  compareValues, 
  fastCompare, 
  ComparisonOptions
} from '../utils/comparison';

/**
 * Core Store class for centralized state management
 * 
 * Provides reactive state management with subscription capabilities, optimized for
 * React integration through useSyncExternalStore. Supports batched updates, custom
 * comparison functions, and immutable snapshots for performance optimization.
 * 
 * @template T - The type of value stored in this store
 * 
 * @example Basic Store Usage
 * ```typescript
 * // Create a store with initial value
 * const counterStore = createStore('counter', 0)
 * 
 * // Get current value
 * const currentCount = counterStore.getValue()
 * 
 * // Set new value
 * counterStore.setValue(5)
 * 
 * // Update with function
 * counterStore.update(count => count + 1)
 * ```
 * 
 * @example React Integration
 * ```typescript
 * const userStore = createStore('user', { name: '', email: '' })
 * 
 * function UserComponent() {
 *   // Subscribe to store changes
 *   const user = useStoreValue(userStore)
 *   
 *   const handleUpdate = () => {
 *     userStore.update(current => ({
 *       ...current,
 *       name: 'John Doe'
 *     }))
 *   }
 *   
 *   return <div>User: {user.name}</div>
 * }
 * ```
 * 
 * @example Custom Comparison
 * ```typescript
 * const store = createStore('items', [])
 * 
 * // Set custom comparator for array length-based updates
 * store.setComparator((oldItems, newItems) => 
 *   oldItems.length === newItems.length
 * )
 * ```
 * 
 * @public
 */
export class Store<T = any> implements IStore<T> {
  // Subscriber list - Set for duplicate prevention and O(1) deletion
  private listeners = new Set<Listener>();
  // Actual state value - Single Source of Truth
  protected _value: T;
  // Immutable snapshot - Compatible with React's useSyncExternalStore
  protected _snapshot: Snapshot<T>;

  // State for concurrency protection
  private isUpdating = false;
  private updateQueue: Array<() => void> = [];
  
  // Notification mode settings
  private notificationMode: 'batched' | 'immediate' = 'batched';
  private pendingNotification = false;

  public readonly name: string;
  // Custom comparator function per store
  private customComparator?: (oldValue: T, newValue: T) => boolean;
  // Comparison options per store
  private comparisonOptions?: Partial<ComparisonOptions<T>>;

  constructor(name: string, initialValue: T) {
    this.name = name;
    this._value = initialValue;
    // Create initial snapshot - make immediately subscribable
    this._snapshot = this._createSnapshot();
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
    
    // 구독 해제 함수 반환 - 클로저로 listener 참조 유지
    return () => {
      this.listeners.delete(listener);
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
    
    
    return clonedValue;
  }

  /**
   * Store 값 설정 및 구독자 알림
   * 핵심 로직: 
   * 1. 입력값의 불변성 보장을 위한 깊은 복사
   * 2. 강화된 값 비교 시스템으로 불필요한 리렌더링 방지
   * 3. 값 변경 시에만 스냅샷 재생성 및 알림
   * 
   * @implements unidirectional-data-flow
   * @implements store-immutability
   * @memberof architecture-terms
   * 
   * 보안 강화: 입력값을 복사하여 Store 내부 상태가 외부 참조에 의해 변경되지 않도록 보호
   * 성능 강화: 다층 비교 시스템으로 정확한 변경 감지 및 렌더링 최적화
   */
  setValue(value: T): void {
    // Debug logging to identify event objects being stored (but exclude RefState objects)
    if (value && typeof value === 'object' && value !== null) {
      // Check if this is a RefState object (which legitimately has target property for DOM elements)
      const isRefState = (
        (value as any).target !== undefined &&
        (value as any).isReady !== undefined &&
        (value as any).isMounted !== undefined &&
        (value as any).mountPromise !== undefined
      );
      
      if (!isRefState) {
        const hasEventTarget = (value as any).target !== undefined;
        const hasPreventDefault = typeof (value as any).preventDefault === 'function';
        const isEvent = value instanceof Event;
        
        if (hasEventTarget || hasPreventDefault || isEvent) {
          console.error(
            '[Context-Action] ⚠️ Event object detected in Store.setValue!',
            '\nStore name:', this.name,
            '\nValue type:', typeof value,
            '\nConstructor:', value?.constructor?.name,
            '\nIs Event:', isEvent,
            '\nHas target property:', hasEventTarget,
            '\nHas preventDefault:', hasPreventDefault,
            '\nStack trace:', new Error().stack?.split('\n').slice(1, 10).join('\n')
          );
          
          // Log problematic properties
          if (value && typeof value === 'object') {
            const problematicKeys = [];
            for (const key in value) {
              if (Object.prototype.hasOwnProperty.call(value, key)) {
                const prop = (value as any)[key];
                if (prop instanceof Element || prop instanceof Event || (prop && typeof prop === 'object' && prop.target)) {
                  problematicKeys.push(key);
                }
              }
            }
            if (problematicKeys.length > 0) {
              console.error('[Context-Action] Event object properties:', problematicKeys);
            }
          }
        }
      }
    }
    
    const options = getGlobalImmutabilityOptions();
    const safeValue = safeSet(value, options.enableCloning);
    
    // 강화된 값 비교 시스템
    const hasChanged = this._compareValues(this._value, safeValue);
    
    if (hasChanged) {
      this._value = safeValue;
      // 새 스냅샷 생성 - 불변성 보장
      this._snapshot = this._createSnapshot();
      
      // 듀얼 모드 알림 시스템
      this._scheduleNotification();
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
    // 동시성 보호: update 진행 중이면 큐에 추가
    if (this.isUpdating) {
      this.updateQueue.push(() => this.update(updater));
      return;
    }

    try {
      this.isUpdating = true;
      const options = getGlobalImmutabilityOptions();
      const safeCurrentValue = performantSafeGet(this._value, options.enableCloning);
      
      const updatedValue = updater(safeCurrentValue);
      
      // Debug logging for event objects in update method (but exclude RefState objects)
      if (updatedValue && typeof updatedValue === 'object' && updatedValue !== null) {
        // Check if this is a RefState object (which legitimately has target property for DOM elements)
        const isRefState = (
          (updatedValue as any).target !== undefined &&
          (updatedValue as any).isReady !== undefined &&
          (updatedValue as any).isMounted !== undefined &&
          (updatedValue as any).mountPromise !== undefined
        );
        
        if (!isRefState) {
          const hasEventTarget = (updatedValue as any).target !== undefined;
          const hasPreventDefault = typeof (updatedValue as any).preventDefault === 'function';
          const isEvent = updatedValue instanceof Event;
          
          if (hasEventTarget || hasPreventDefault || isEvent) {
            console.error(
              '[Context-Action] ⚠️ Event object detected in Store.update result!',
              '\nStore name:', this.name,
              '\nUpdated value type:', typeof updatedValue,
              '\nConstructor:', updatedValue?.constructor?.name,
              '\nIs Event:', isEvent,
              '\nHas target property:', hasEventTarget,
              '\nHas preventDefault:', hasPreventDefault,
              '\nStack trace:', new Error().stack?.split('\n').slice(1, 10).join('\n')
            );
          }
        }
      }
      
      this.setValue(updatedValue);
    } finally {
      this.isUpdating = false;
      
      // 큐에 대기 중인 업데이트 처리
      if (this.updateQueue.length > 0) {
        const nextUpdate = this.updateQueue.shift();
        if (nextUpdate) {
          // 다음 마이크로태스크에서 실행하여 스택 오버플로우 방지
          Promise.resolve().then(nextUpdate);
        }
      }
    }
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
    this.listeners.clear();
  }

  /**
   * Store별 커스텀 비교 함수 설정
   * 이 Store에만 적용되는 특별한 비교 로직 설정
   * 
   * @param comparator - 커스텀 비교 함수 (oldValue, newValue) => boolean
   * @example
   * ```typescript
   * userStore.setCustomComparator((oldUser, newUser) => 
   *   oldUser.id === newUser.id && oldUser.lastModified === newUser.lastModified
   * );
   * ```
   */
  setCustomComparator(comparator: (oldValue: T, newValue: T) => boolean): void {
    this.customComparator = comparator;
  }

  /**
   * Store별 비교 옵션 설정
   * 이 Store에만 적용되는 비교 전략 설정
   * 
   * @param options - 비교 옵션
   * @example
   * ```typescript
   * // 깊은 비교 사용
   * userStore.setComparisonOptions({ strategy: 'deep', maxDepth: 3 });
   * 
   * // 얕은 비교 사용하되 특정 키 무시
   * stateStore.setComparisonOptions({ 
   *   strategy: 'shallow', 
   *   ignoreKeys: ['timestamp', 'lastAccess'] 
   * });
   * ```
   */
  setComparisonOptions(options: Partial<ComparisonOptions<T>>): void {
    this.comparisonOptions = options;
  }

  /**
   * 현재 비교 설정 조회
   */
  getComparisonOptions(): Partial<ComparisonOptions<T>> | undefined {
    return this.comparisonOptions ? { ...this.comparisonOptions } : undefined;
  }

  /**
   * 커스텀 비교 함수 해제
   */
  clearCustomComparator(): void {
    this.customComparator = undefined;
  }

  /**
   * 비교 옵션 해제 (전역 설정 사용)
   */
  clearComparisonOptions(): void {
    this.comparisonOptions = undefined;
  }

  /**
   * 강화된 값 비교 시스템
   * 1. 커스텀 비교 함수 우선 사용
   * 2. Store별 비교 옵션 적용
   * 3. 성능 최적화된 빠른 비교 fallback
   * 4. 전역 비교 설정 사용
   * 
   * @param oldValue - 이전 값
   * @param newValue - 새로운 값
   * @returns true if values are different (change detected), false if same
   * @protected
   */
  protected _compareValues(oldValue: T, newValue: T): boolean {
    let result: boolean;

    try {
      // 1. 커스텀 비교 함수가 설정된 경우 우선 사용
      if (this.customComparator) {
        const areEqual = this.customComparator(oldValue, newValue);
        result = !areEqual; // 같으면 false (변경 없음), 다르면 true (변경 있음)
        
      }
      // 2. Store별 비교 옵션이 설정된 경우
      else if (this.comparisonOptions) {
        const areEqual = compareValues(oldValue, newValue, this.comparisonOptions);
        result = !areEqual;
        
      }
      // 3. 성능 최적화된 빠른 비교 (대부분의 일반적인 케이스)
      else {
        const areEqual = fastCompare(oldValue, newValue);
        result = !areEqual;
        
      }
    } catch {
      // 비교 중 에러 발생 시 안전한 fallback (참조 비교)
      result = !Object.is(oldValue, newValue);
    }


    return result;
  }

  protected _createSnapshot(): Snapshot<T> {
    const options = getGlobalImmutabilityOptions();
    const clonedValue = safeGet(this._value, options.enableCloning);
    
    
    return {
      value: clonedValue,
      name: this.name,
      lastUpdate: Date.now()
    };
  }

  /**
   * 알림 모드 설정 - 테스트/디버그용
   */
  setNotificationMode(mode: 'batched' | 'immediate'): void {
    this.notificationMode = mode;
  }

  /**
   * 현재 알림 모드 조회
   */
  getNotificationMode(): 'batched' | 'immediate' {
    return this.notificationMode;
  }

  /**
   * 듀얼 모드 알림 스케줄링
   */
  protected _scheduleNotification(): void {
    if (this.notificationMode === 'immediate') {
      // 즉시 모드: 동기적으로 모든 리스너에게 알림
      this._notifyListeners();
    } else {
      // 배치 모드: requestAnimationFrame으로 최적화된 알림
      if (!this.pendingNotification) {
        this.pendingNotification = true;
        requestAnimationFrame(() => {
          this.pendingNotification = false;
          this._notifyListeners();
        });
      }
    }
  }

  private _notifyListeners(): void {
    
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch {
        // Silent catch for listener errors
      }
    });
  }
}

/**
 * Factory function for creating type-safe Store instances
 * 
 * Creates a new Store instance with the specified name and initial value.
 * Provides type safety and integrates seamlessly with React hooks and
 * the Context-Action framework patterns.
 * 
 * @template T - The type of values stored in this store
 * 
 * @param name - Unique identifier for the store (used for debugging)
 * @param initialValue - Initial value to store
 * 
 * @returns Configured Store instance ready for use
 * 
 * @example Basic Store Creation
 * ```typescript
 * // Object store
 * const userStore = createStore('user', {
 *   id: '',
 *   name: '',
 *   email: ''
 * })
 * 
 * // Primitive value stores
 * const countStore = createStore('count', 0)
 * const themeStore = createStore('theme', 'light' as 'light' | 'dark')
 * const itemsStore = createStore('items', [] as string[])
 * ```
 * 
 * @example Integration with React
 * ```typescript
 * // Create store
 * const userStore = createStore('user', { name: 'Guest' })
 * 
 * // Use in React component
 * function UserProfile() {
 *   const user = useStoreValue(userStore)
 *   
 *   const updateName = (name: string) => {
 *     userStore.update(current => ({ ...current, name }))
 *   }
 *   
 *   return <div>Hello, {user.name}!</div>
 * }
 * ```
 * 
 * @example Store Operations
 * ```typescript
 * const todoStore = createStore('todos', [] as Todo[])
 * 
 * // Set entire value
 * todoStore.setValue([{ id: 1, text: 'Learn TypeScript', done: false }])
 * 
 * // Update with function
 * todoStore.update(todos => [
 *   ...todos,
 *   { id: 2, text: 'Build app', done: false }
 * ])
 * 
 * // Get current value
 * const currentTodos = todoStore.getValue()
 * ```
 * 
 * @public
 */
export function createStore<T>(name: string, initialValue: T): Store<T> {
  const store = new Store<T>(name, initialValue);
  
  return store;
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
 * @template T The store value type
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
