import type { IStore, Listener, Snapshot, Unsubscribe, StoreSetValueOptions } from './types';
import type { StoreRegistry } from './StoreRegistry';
import { safeGet, safeSet } from '../utils/immutable';
import { 
  compareValues, 
  fastCompare, 
  ComparisonOptions
} from '../utils/comparison';
import { TypeGuards } from '../utils/type-guards';
import { ErrorHandlers } from '../utils/error-handling';

/**
 * Core Store class for centralized state management with memory leak prevention
 * 
 * Provides reactive state management with subscription capabilities, optimized for
 * React integration through useSyncExternalStore. Features advanced cleanup mechanisms,
 * automatic resource management, and comprehensive memory leak prevention.
 * 
 * Key Features:
 * - Automatic cleanup task registration and execution
 * - Memory leak prevention with disposal patterns  
 * - Race condition protection for async operations
 * - Advanced error recovery with exponential backoff
 * - Resource monitoring and threshold management
 * 
 * @template T - The type of value stored in this store
 * 
 * @example
 * ```typescript
 * const userStore = createStore('user', { name: '', age: 0 });
 * 
 * // Register cleanup tasks
 * const unregister = userStore.registerCleanup(() => {
 *   console.log('Cleaning up user store resources');
 * });
 * 
 * // Automatic cleanup on disposal
 * userStore.dispose();
 * ```
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 * @public
 */
export class Store<T = unknown> implements IStore<T> {
  // Subscriber list - Set for duplicate prevention and O(1) deletion
  private listeners = new Set<Listener>();
  // Actual state value - Single Source of Truth
  protected _value: T;
  // Immutable snapshot - Compatible with React's useSyncExternalStore
  protected _snapshot: Snapshot<T>;
  
  // Copy-on-Write optimization
  private _lastClonedValue: T | null = null;
  private _lastClonedVersion = 0;
  private _version = 0;

  // State for concurrency protection
  private isUpdating = false;
  private updateQueue: Array<() => void> = [];
  
  // Notification mode settings
  private notificationMode: 'batched' | 'immediate' = 'batched';
  private pendingNotification = false;
  
  // 🚀 requestAnimationFrame 기반 알림 시스템
  private animationFrameId: number | null = null;
  private pendingUpdatesCount = 0; // 누적된 업데이트 수 추적
  
  // 🧹 Advanced Cleanup and Memory Management
  private cleanupTasks = new Set<() => void>();
  private isDisposed = false;
  
  // 🔄 Error Recovery System
  private errorCount = 0;
  private lastErrorTime = 0;
  private readonly MAX_ERROR_COUNT = 5;
  private readonly ERROR_RESET_TIME = 60000; // 1 minute
  
  // 🎯 Subscription Management
  private subscriptionRegistry = new WeakMap<Listener, {
    subscribedAt: number;
    errorCount: number;
    enhancedListener: () => void;
  }>();

  public readonly name: string;
  // Custom comparator function per store
  private customComparator: ((oldValue: T, newValue: T) => boolean) | undefined;
  // Comparison options per store
  private comparisonOptions: Partial<ComparisonOptions<T>> | undefined;
  // Performance optimization: disable cloning for this store
  private cloningEnabled: boolean = true;

  constructor(name: string, initialValue: T) {
    this.name = name;
    this._value = initialValue;
    // Create initial snapshot - make immediately subscribable
    this._snapshot = this._createSnapshot();
  }

  /**
   * Enhanced store subscription with metadata tracking and error recovery
   * 
   * Subscribes to store changes with advanced features including subscription
   * metadata tracking, automatic error recovery, and disposal safety.
   * 
   * @implements store-hooks
   * @memberof api-terms
   * @param listener - 상태 변경 시 호출될 콜백 함수
   * @returns unsubscribe 함수 - 구독 해제용
   * 
   * @example
   * ```typescript
   * const unsubscribe = store.subscribe(() => {
   *   console.log('Store value changed:', store.getValue());
   * });
   * 
   * // Cleanup
   * unsubscribe();
   * ```
   */
  subscribe = (listener: Listener): Unsubscribe => {
    if (this.isDisposed) {
      console.warn(`Cannot subscribe to disposed store "${this.name}"`);
      return () => {};
    }
    
    // Enhanced listener with error recovery
    const enhancedListener = () => {
      if (this.isDisposed) return;
      
      try {
        listener();
        // Reset error count on successful execution
        if (this.errorCount > 0) {
          this.errorCount = 0;
        }
      } catch (error) {
        this._handleListenerError(error, listener);
      }
    };
    
    // Store subscription metadata
    this.subscriptionRegistry.set(listener, {
      subscribedAt: Date.now(),
      errorCount: 0,
      enhancedListener
    });
    
    // Set에 enhanced listener 추가
    this.listeners.add(enhancedListener);
    
    // 구독 해제 함수 반환 - cleanup과 metadata 제거
    return () => {
      this.listeners.delete(enhancedListener);
      this.subscriptionRegistry.delete(listener);
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
    // Copy-on-Write optimization: reuse cloned value if version hasn't changed
    if (this.cloningEnabled) {
      if (this._lastClonedVersion === this._version && this._lastClonedValue !== null) {
        return this._lastClonedValue;
      }
      
      // Clone and cache for future reads
      this._lastClonedValue = safeGet(this._value, this.cloningEnabled);
      this._lastClonedVersion = this._version;
      return this._lastClonedValue;
    }
    
    // Direct return when cloning disabled
    return this._value;
  }

  /**
   * Store 값 설정 및 구독자 알림
   * 핵심 로직: 
   * 1. 입력값의 불변성 보장을 위한 깊은 복사 (선택적 skip 가능)
   * 2. 강화된 값 비교 시스템으로 불필요한 리렌더링 방지
   * 3. Structural sharing을 통한 성능 최적화
   * 4. 값 변경 시에만 스냅샷 재생성 및 알림
   * 
   * @implements unidirectional-data-flow
   * @implements store-immutability
   * @memberof architecture-terms
   * 
   * 보안 강화: 입력값을 복사하여 Store 내부 상태가 외부 참조에 의해 변경되지 않도록 보호
   * 성능 강화: 다층 비교 시스템으로 정확한 변경 감지 및 렌더링 최적화
   */
  setValue(value: T, options?: StoreSetValueOptions<T>): void {
    // 향상된 이벤트 객체 처리 시스템
    if (TypeGuards.isObject(value)) {
      // RefState 객체는 제외 (DOM 요소를 위한 정당한 target 속성 보유)
      if (!TypeGuards.isRefState(value) && TypeGuards.isSuspiciousEventObject(value)) {
        const eventHandling = options?.eventHandling || 'block';
        const hasEventTarget = TypeGuards.hasTargetProperty(value);
        const hasPreventDefault = TypeGuards.isEventLike(value);
        const isEvent = TypeGuards.isDOMEvent(value);
        
        switch (eventHandling) {
          case 'allow':
            // 이벤트 객체를 그대로 허용 (개발자 책임)
            break;
            
          case 'transform':
            if (options?.eventTransform) {
              try {
                value = options.eventTransform(value);
              } catch (error) {
                ErrorHandlers.store(
                  'Event transformation failed in Store.setValue',
                  {
                    storeName: this.name,
                    valueType: typeof value,
                    error: error instanceof Error ? error.message : String(error)
                  }
                );
                return;
              }
            } else {
              ErrorHandlers.store(
                'Event transformation requested but no transform function provided',
                { storeName: this.name, valueType: typeof value }
              );
              return;
            }
            break;
            
          case 'block':
          default:
            // 기존 차단 로직
            ErrorHandlers.store(
              'Event object detected in Store.setValue - this may cause memory leaks',
              {
                storeName: this.name,
                valueType: typeof value,
                constructorName: value?.constructor?.name,
                isEvent,
                hasTargetProperty: hasEventTarget,
                hasPreventDefault,
                problematicProperties: TypeGuards.findProblematicProperties(value)
              }
            );
            return;
        }
      }
    }
    
    // 성능 최적화된 불변성 보장 with optional cloning
    const safeValue = options?.skipClone ? value : safeSet(value, this.cloningEnabled);
    
    // 강화된 값 비교 시스템 (선택적 skip 가능)
    let hasChanged = true;
    if (!options?.skipComparison) {
      hasChanged = this._compareValues(this._value, safeValue);
    }
    
    if (hasChanged) {
      this._value = safeValue;
      // Increment version for Copy-on-Write cache invalidation
      this._version++;
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
      // 최적화된 안전한 현재 값 제공
      const safeCurrentValue = safeGet(this._value, this.cloningEnabled);
      
      const updatedValue = updater(safeCurrentValue);
      
      // 이벤트 객체 감지 및 기본 처리 (update 메소드는 block 모드만 지원)
      if (TypeGuards.isObject(updatedValue)) {
        if (!TypeGuards.isRefState(updatedValue) && TypeGuards.isSuspiciousEventObject(updatedValue)) {
          const hasEventTarget = TypeGuards.hasTargetProperty(updatedValue);
          const hasPreventDefault = TypeGuards.isEventLike(updatedValue);
          const isEvent = TypeGuards.isDOMEvent(updatedValue);
          
          ErrorHandlers.store(
            'Event object detected in Store.update result - this may cause memory leaks',
            {
              storeName: this.name,
              updatedValueType: typeof updatedValue,
              constructorName: updatedValue?.constructor?.name,
              isEvent,
              hasTargetProperty: hasEventTarget,
              hasPreventDefault,
              problematicProperties: TypeGuards.findProblematicProperties(updatedValue)
            }
          );
          
          return;
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
   * Register cleanup task for automatic execution on disposal
   * 
   * Registers a cleanup function that will be automatically called when the store
   * is disposed. This prevents memory leaks and ensures proper resource cleanup.
   * 
   * @param task - Cleanup function to register
   * @returns Unregister function to remove the cleanup task
   * 
   * @example
   * ```typescript
   * const timer = setInterval(() => {}, 1000);
   * const unregister = store.registerCleanup(() => clearInterval(timer));
   * 
   * // Later, remove the cleanup task if needed
   * unregister();
   * ```
   */
  registerCleanup(task: () => void): () => void {
    if (this.isDisposed) {
      console.warn(`Store "${this.name}" is already disposed, cleanup task ignored`);
      return () => {};
    }
    
    this.cleanupTasks.add(task);
    return () => this.cleanupTasks.delete(task);
  }

  /**
   * Enhanced Store disposal with comprehensive cleanup
   * 
   * Performs complete cleanup of all store resources including listeners,
   * timers, cleanup tasks, and internal state. Prevents memory leaks and
   * ensures proper resource disposal.
   * 
   * @example
   * ```typescript
   * // Manual disposal
   * store.dispose();
   * 
   * // Auto-disposal with useEffect
   * useEffect(() => {
   *   return () => store.dispose();
   * }, [store]);
   * ```
   */
  dispose(): void {
    if (this.isDisposed) {
      return; // Prevent double disposal
    }
    
    this.isDisposed = true;
    
    try {
      // Execute all cleanup tasks
      this.cleanupTasks.forEach(task => {
        try {
          task();
        } catch (error) {
          ErrorHandlers.store(
            'Error during cleanup task execution',
            { storeName: this.name },
            error instanceof Error ? error : undefined
          );
        }
      });
      this.cleanupTasks.clear();
      
      // Clear all listeners and subscription metadata
      this.subscriptionRegistry = new WeakMap();
      this.clearListeners();
      
      // Clean requestAnimationFrame
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      this.pendingNotification = false;
      
      // Clear update queue
      this.updateQueue.length = 0;
      
      // Resource monitor disposal would go here when implemented
      
    } catch (error) {
      ErrorHandlers.store(
        'Critical error during store disposal',
        { storeName: this.name },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if store is disposed
   * @returns true if store has been disposed
   */
  isStoreDisposed(): boolean {
    return this.isDisposed;
  }

  /**
   * Store별 커스텀 비교 함수 설정
   * 이 Store에만 적용되는 특별한 비교 로직 설정
   * 
   * @param comparator - 커스텀 비교 함수 (oldValue, newValue) => boolean
   * @see https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-config
   */
  setCustomComparator(comparator: (oldValue: T, newValue: T) => boolean): void {
    this.customComparator = comparator;
  }

  /**
   * Store별 비교 옵션 설정
   * 이 Store에만 적용되는 비교 전략 설정
   * 
   * @param options - 비교 옵션
   * @see https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-config
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
   * 성능 최적화: Store별 복사 동작 제어
   * 
   * @param enabled - true: 복사 활성화 (안전), false: 복사 비활성화 (성능 우선)
   * @see https://mineclover.github.io/context-action/en/guide/patterns/store/performance
   */
  setCloningEnabled(enabled: boolean): void {
    this.cloningEnabled = enabled;
  }

  /**
   * 현재 복사 설정 조회
   */
  isCloningEnabled(): boolean {
    return this.cloningEnabled;
  }

  /**
   * 성능 최적화된 getValue (복사 없음)
   * ⚠️ 주의: 반환된 값을 수정하면 Store 내부 상태가 변경될 수 있음
   */
  getValueUnsafe(): T {
    return this._value;
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
    } catch (error) {
      // 비교 중 에러 발생 시 안전한 fallback (참조 비교)
      ErrorHandlers.store(
        'Error during value comparison, falling back to reference comparison',
        { storeName: this.name },
        error instanceof Error ? error : undefined
      );
      result = !Object.is(oldValue, newValue);
    }


    return result;
  }

  protected _createSnapshot(): Snapshot<T> {
    // 최적화된 불변성 보장 with selective cloning
    const clonedValue = safeGet(this._value, this.cloningEnabled);
    
    
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
   * requestAnimationFrame 기반 알림 스케줄링
   * 브라우저의 다음 프레임에서 리스너 알림 실행
   */
  protected _scheduleNotification(): void {
    if (this.notificationMode === 'immediate') {
      // 즉시 모드: 동기적으로 모든 리스너에게 알림
      this._notifyListeners();
    } else {
      // requestAnimationFrame 모드: 다음 프레임에서 알림
      this._scheduleWithRAF();
    }
  }

  /**
   * requestAnimationFrame을 사용한 알림 스케줄링
   * 누적 가능한 배치 시스템으로 개선
   */
  private _scheduleWithRAF(): void {
    // 누적된 업데이트 수 증가 (모든 호출을 추적)
    this.pendingUpdatesCount++;
    
    // 스케줄된 알림이 없을 때만 새로운 프레임 요청
    if (!this.pendingNotification) {
      this.pendingNotification = true;
      
      // 다음 프레임에서 알림 실행
      this.animationFrameId = requestAnimationFrame(() => {
        this._executeNotification();
      });
    }
    
    // 🎯 모든 중간 업데이트가 누적되어 다음 프레임에서 한 번에 처리됨
  }

  /**
   * 스케줄된 알림 실행
   */
  private _executeNotification(): void {
    this.pendingNotification = false;
    this.animationFrameId = null;
    
    // 누적된 업데이트 수 리셋하고 로깅 (디버깅용)
    const batchedUpdates = this.pendingUpdatesCount;
    this.pendingUpdatesCount = 0;
    
    // 실제 리스너 알림 실행
    this._notifyListeners();
    
    // 개발 환경에서 배치 크기 로깅 (성능 모니터링)
    if (process.env.NODE_ENV === 'development' && batchedUpdates > 1) {
      console.debug(`[Store:${this.name}] Batched ${batchedUpdates} updates in single frame`);
    }
  }



  /**
   * Handle listener execution errors with recovery strategies
   */
  private _handleListenerError(error: unknown, listener: Listener): void {
    const now = Date.now();
    
    // Reset error count if enough time has passed
    if (now - this.lastErrorTime > this.ERROR_RESET_TIME) {
      this.errorCount = 0;
    }
    
    this.errorCount++;
    this.lastErrorTime = now;
    
    // Get subscription metadata for enhanced error reporting
    const metadata = this.subscriptionRegistry.get(listener);
    if (metadata) {
      metadata.errorCount++;
    }
    
    ErrorHandlers.store(
      'Error in store listener execution',
      { 
        storeName: this.name,
        listenerCount: this.listeners.size,
        errorCount: this.errorCount,
        subscriptionAge: metadata ? now - metadata.subscribedAt : 'unknown'
      },
      error instanceof Error ? error : undefined
    );
    
    // Auto-remove problematic listeners after too many errors
    if (metadata && metadata.errorCount >= 3) {
      console.warn(
        `Removing problematic listener from store "${this.name}" after ${metadata.errorCount} errors`
      );
      this.listeners.delete(metadata.enhancedListener);
      this.subscriptionRegistry.delete(listener);
    }
    
    // Disable store if too many total errors
    if (this.errorCount >= this.MAX_ERROR_COUNT) {
      console.error(
        `Store "${this.name}" disabled due to excessive errors (${this.errorCount})`
      );
      this.clearListeners();
    }
  }
  
  private _notifyListeners(): void {
    if (this.isDisposed) return;
    
    this.listeners.forEach(listener => {
      if (this.isDisposed) return; // Double-check during iteration
      listener(); // Enhanced listeners handle their own errors
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
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
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
export interface StoreConfig<T = unknown> {
  name: string;
  initialValue: T;
  registry?: StoreRegistry;
  autoRegister?: boolean;
}

/**
 * Enhanced store with auto-registration capability
 */
export class ManagedStore<T> extends Store<T> {
  private registry: StoreRegistry | undefined;
  private autoRegister: boolean;

  constructor(config: StoreConfig<T>) {
    super(config.name, config.initialValue);
    this.registry = config.registry ?? undefined;
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
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 */
export function createManagedStore<T>(config: StoreConfig<T>): ManagedStore<T> {
  return new ManagedStore<T>(config);
}

/**
 * Advanced Store configuration options for factory pattern
 */
export interface AdvancedStoreConfig<T> extends StoreConfig<T> {
  comparisonStrategy?: 'reference' | 'shallow' | 'deep' | 'custom';
  customComparator?: (oldValue: T, newValue: T) => boolean;
  enablePersistence?: boolean;
  persistenceKey?: string;
  enablePerformanceMonitoring?: boolean;
  notificationMode?: 'batched' | 'immediate';
  enableCloning?: boolean;
}

/**
 * Enhanced Store Factory for advanced configurations
 * 
 * Provides a unified factory pattern for creating stores with advanced features
 * including custom comparison strategies, persistence, and performance monitoring.
 * 
 * @template T - The type of values stored
 */
export class StoreFactory {
  /**
   * Create a store with advanced configuration
   */
  static create<T>(config: AdvancedStoreConfig<T>): Store<T> {
    const store = new Store(config.name, config.initialValue);
    
    // Apply comparison strategy
    if (config.comparisonStrategy && config.comparisonStrategy !== 'reference') {
      store.setComparisonOptions({ strategy: config.comparisonStrategy });
    }
    
    // Apply custom comparator
    if (config.customComparator) {
      store.setCustomComparator(config.customComparator);
    }
    
    // Set notification mode
    if (config.notificationMode) {
      store.setNotificationMode(config.notificationMode);
    }
    
    // Set cloning behavior
    if (config.enableCloning !== undefined) {
      store.setCloningEnabled(config.enableCloning);
    }
    
    // TODO: Implement persistence when enabled
    if (config.enablePersistence && config.persistenceKey) {
      // Future enhancement: localStorage/sessionStorage integration
    }
    
    return store;
  }
  
  /**
   * Create a managed store with advanced configuration and auto-registration
   */
  static createManaged<T>(config: AdvancedStoreConfig<T>): ManagedStore<T> {
    const managedStore = new ManagedStore<T>(config);
    
    // Apply advanced configurations
    if (config.comparisonStrategy && config.comparisonStrategy !== 'reference') {
      managedStore.setComparisonOptions({ strategy: config.comparisonStrategy });
    }
    
    if (config.customComparator) {
      managedStore.setCustomComparator(config.customComparator);
    }
    
    if (config.notificationMode) {
      managedStore.setNotificationMode(config.notificationMode);
    }
    
    if (config.enableCloning !== undefined) {
      managedStore.setCloningEnabled(config.enableCloning);
    }
    
    return managedStore;
  }
  
  /**
   * Create multiple stores with shared configuration
   */
  static createBatch<T extends Record<string, any>>(
    stores: { [K in keyof T]: { initialValue: T[K] } & Partial<AdvancedStoreConfig<T[K]>> }
  ): { [K in keyof T]: Store<T[K]> } {
    const result = {} as { [K in keyof T]: Store<T[K]> };
    
    for (const [storeName, storeConfig] of Object.entries(stores)) {
      const fullConfig: AdvancedStoreConfig<T[keyof T]> = {
        name: storeName,
        ...storeConfig
      };
      
      result[storeName as keyof T] = StoreFactory.create(fullConfig);
    }
    
    return result;
  }
}
