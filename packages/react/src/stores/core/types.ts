/**
 * @fileoverview Store System Core Type Definitions
 * @implements store-integration-pattern
 * @implements model-layer
 * @implements reactive-state-management
 * @memberof core-concepts
 * 
 * Comprehensive type definitions for the Context-Action framework's Store system,
 * providing reactive state management with React integration and type safety.
 * 
 * Core Type Categories:
 * - Store interfaces for reactive state management
 * - Registry types for multi-store coordination  
 * - Event system types for store communication
 * - React integration types for Context API usage
 * - Performance optimization interfaces
 * 
 * Key Design Patterns:
 * - Observer pattern for store subscriptions
 * - Registry pattern for store lifecycle management
 * - Pub-Sub pattern for store-to-store communication
 * - Context pattern for React integration
 */

/**
 * Basic subscription types for Observer pattern implementation
 * @implements observer-pattern
 * @memberof core-concepts
 */

/** Change notification callback function */
export type Listener = () => void;

/** Unsubscribe function returned by subscribe methods */
export type Unsubscribe = () => void;

/** Subscribe function signature for observer pattern */
export type Subscribe = (listener: Listener) => Unsubscribe;

/**
 * Store snapshot interface for immutable state representation
 * @implements store-snapshot
 * @implements immutable-state
 * @memberof api-terms
 * 
 * Immutable snapshot of Store state used for optimization and debugging.
 * Compatible with React's useSyncExternalStore pattern.
 * 
 * @template T The type of the stored value
 */
export interface Snapshot<T = unknown> {
  /** The current value of the store */
  value: T;
  
  /** Unique identifier for the store */
  name: string;
  
  /** Timestamp of the last update */
  lastUpdate: number;
}

/**
 * Core Store interface for reactive state management
 * @implements store-interface
 * @implements usesyncexternalstore-compatible
 * @implements observer-pattern
 * @memberof core-concepts
 * 
 * Primary interface for Store instances, compatible with React's useSyncExternalStore
 * and implementing the Observer pattern for reactive state management.
 * 
 * @template T The type of the stored value
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 */
export interface IStore<T = unknown> {
  /** Unique identifier for the store */
  readonly name: string;
  
  /** Subscribe to store changes (React useSyncExternalStore compatible) */
  subscribe: Subscribe;
  
  /** Get immutable snapshot (React useSyncExternalStore compatible) */
  getSnapshot: () => Snapshot<T>;
  
  /** Set store value with change notification */
  setValue: (value: T, options?: StoreSetValueOptions<T>) => void;
  
  /** Update store value with function (for functional updates) */
  update: (updater: (current: T) => T) => void;
  
  /** Get current value directly (for action handlers) */
  getValue: () => T;
  
  /** Get number of active listeners (debugging/monitoring) */
  getListenerCount?: () => number;
  
  /** Dispose store and clean up resources */
  dispose?: () => void;
}

/**
 * Store Registry interface for centralized store management
 * @implements store-registry
 * @implements registry-pattern
 * @memberof core-concepts
 * 
 * Central registry for managing multiple Store instances with dynamic access
 * and lifecycle management. Provides subscription capability for registry changes.
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-config
 */
export interface IStoreRegistry {
  /** Unique identifier for the registry */
  readonly name: string;
  
  /** Subscribe to registry changes */
  subscribe: Subscribe;
  
  /** Get snapshot of all registered stores */
  getSnapshot: () => Array<[string, IStore]>;
  
  /** Register a store with optional metadata */
  register: (name: string, store: IStore, metadata?: any) => void;
  
  /** Unregister a store by name */
  unregister: (name: string) => boolean;
  
  /** Get store by name */
  getStore: (name: string) => IStore | undefined;
  
  /** Get all registered stores as Map */
  getAllStores: () => Map<string, IStore>;
  
  /** Check if store exists by name */
  hasStore: (name: string) => boolean;
  
  /** Get count of registered stores */
  getStoreCount: () => number;
  
  /** Get array of registered store names */
  getStoreNames: () => string[];
  
  /** Clear all registered stores */
  clear: () => void;
  
  /** Iterate over all stores */
  forEach: (callback: (store: IStore, name: string) => void) => void;
}

// === 이벤트 시스템 타입 ===
// 핵심 설계: Store 간 비동기 통신을 위한 Pub-Sub 패턴
export interface EventHandler<T = unknown> {
  (data: T): void;  // 이벤트 핸들러 시그니처
}

export interface IEventBus {
  on: <T = unknown>(event: string, handler: EventHandler<T>) => Unsubscribe;  // 이벤트 구독
  emit: <T = unknown>(event: string, data?: T) => void;                       // 이벤트 발행
  off: (event: string, handler?: EventHandler) => void;                   // 구독 해제
  clear: () => void;                                                      // 전체 정리
}

// === Hook 설정 타입 ===
// 핵심 설계: React Hook 옵틸마이제이션 및 에러 처리
export interface StoreSyncConfig<T, R = Snapshot<T>> {
  defaultValue?: T;                           // 기본값 (초기 렌더링용)
  selector?: (snapshot: Snapshot<T>) => R;    // 선택적 구독 (성능 최적화)
}

export interface HookOptions<T> {
  defaultValue?: T;                     // 기본값
  onError?: (error: Error) => void;     // 에러 핸들러
  dependencies?: React.DependencyList;  // React useEffect 의존성
}

/**
 * Store 값 설정 시 옵션
 */
export interface StoreSetValueOptions<T> {
  /** 깊은 복사 스킵 여부 (성능 최적화) */
  skipClone?: boolean;
  /** 값 비교 스킵 여부 (강제 업데이트) */
  skipComparison?: boolean;
  /** 이벤트 객체 처리 방식 */
  eventHandling?: 'block' | 'transform' | 'allow';
  /** 이벤트 객체 변환 함수 */
  eventTransform?: (event: any) => T;
}


// === Registry 동기화 타입 ===
// 핵심 설계: 동적 Store 접근 및 생성 옵션
export interface RegistryStoreMap {
  [key: string]: unknown;  // 타입 유연성을 위한 맵 타입
}

export interface DynamicStoreOptions<T> {
  defaultValue?: T;                              // 기본값
  createIfNotExists?: boolean;                   // 없을 때 자동 생성 여부
  onNotFound?: (storeName: string) => void;      // Store 찾기 실패 콜백
}
