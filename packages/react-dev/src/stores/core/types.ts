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
 * @since 1.0.0
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
 * @since 1.0.0
 * 
 * Immutable snapshot of Store state used for optimization and debugging.
 * Compatible with React's useSyncExternalStore pattern.
 * 
 * @template T The type of the stored value
 */
export interface Snapshot<T = any> {
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
 * @since 1.0.0
 * 
 * Primary interface for Store instances, compatible with React's useSyncExternalStore
 * and implementing the Observer pattern for reactive state management.
 * 
 * @template T The type of the stored value
 * 
 * @example
 * ```typescript
 * const userStore: IStore<User> = createStore('user', { 
 *   id: '', 
 *   name: '', 
 *   email: '' 
 * });
 * 
 * // Subscribe to changes
 * const unsubscribe = userStore.subscribe(() => {
 *   console.log('User store updated:', userStore.getSnapshot().value);
 * });
 * 
 * // Update store value
 * userStore.setValue({ id: '1', name: 'John', email: 'john@example.com' });
 * 
 * // Get current value for action handlers
 * const currentUser = userStore.getValue();
 * ```
 */
export interface IStore<T = any> {
  /** Unique identifier for the store */
  readonly name: string;
  
  /** Subscribe to store changes (React useSyncExternalStore compatible) */
  subscribe: Subscribe;
  
  /** Get immutable snapshot (React useSyncExternalStore compatible) */
  getSnapshot: () => Snapshot<T>;
  
  /** Set store value with change notification */
  setValue: (value: T) => void;
  
  /** Get current value directly (for action handlers) */
  getValue: () => T;
  
  /** Get number of active listeners (debugging/monitoring) */
  getListenerCount?: () => number;
}

/**
 * Store Registry interface for centralized store management
 * @implements store-registry
 * @implements registry-pattern
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * Central registry for managing multiple Store instances with dynamic access
 * and lifecycle management. Provides subscription capability for registry changes.
 * 
 * @example
 * ```typescript
 * const registry = new StoreRegistry('app-registry');
 * 
 * // Register stores
 * const userStore = createStore('user', { name: '', email: '' });
 * const settingsStore = createStore('settings', { theme: 'light' });
 * 
 * registry.register('user', userStore);
 * registry.register('settings', settingsStore);
 * 
 * // Access stores dynamically
 * const user = registry.getStore('user');
 * const settings = registry.getStore('settings');
 * 
 * // Subscribe to registry changes
 * registry.subscribe(() => {
 *   console.log('Registry changed, store count:', registry.getStoreCount());
 * });
 * ```
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
export interface EventHandler<T = any> {
  (data: T): void;  // 이벤트 핸들러 시그니처
}

export interface IEventBus {
  on: <T = any>(event: string, handler: EventHandler<T>) => Unsubscribe;  // 이벤트 구독
  emit: <T = any>(event: string, data?: T) => void;                       // 이벤트 발행
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

// === Context 타입 ===
// 핵심 설계: React Context API를 통한 Store 공유
export interface StoreContextType {
  storeRegistryRef: React.RefObject<IStoreRegistry>;  // Registry 참조 (RefObject 패턴)
}

export interface StoreContextReturn {
  Provider: React.FC<{ children: React.ReactNode }>;  // Context Provider 컴포넌트
  useStoreContext: () => StoreContextType;            // Context 접근 Hook
  useStoreRegistry: () => IStoreRegistry;             // Registry 접근 Hook
}

// === Registry 동기화 타입 ===
// 핵심 설계: 동적 Store 접근 및 생성 옵션
export interface RegistryStoreMap {
  [key: string]: any;  // 타입 유연성을 위한 맵 타입
}

export interface DynamicStoreOptions<T> {
  defaultValue?: T;                              // 기본값
  createIfNotExists?: boolean;                   // 없을 때 자동 생성 여부
  onNotFound?: (storeName: string) => void;      // Store 찾기 실패 콜백
}
