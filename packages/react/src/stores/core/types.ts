/**
 * @fileoverview Enhanced Store System Core Type Definitions
 * @implements store-integration-pattern
 * @implements model-layer
 * @implements reactive-state-management
 * @memberof core-concepts
 * 
 * Comprehensive type definitions for the Context-Action framework's enhanced Store system,
 * featuring advanced memory management, security hardening, and error recovery capabilities.
 * 
 * Enhanced Type Categories:
 * - Store interfaces with memory management and cleanup
 * - Registry types with health monitoring and lifecycle management
 * - Event system types with security validation and error recovery
 * - React integration types with performance optimization
 * - Security interfaces for XSS and prototype pollution prevention
 * - Performance monitoring and metrics collection
 * - Resource management and automatic cleanup systems
 * 
 * Key Design Patterns:
 * - Observer pattern with error recovery for store subscriptions
 * - Registry pattern with health monitoring for store lifecycle management
 * - Pub-Sub pattern with security validation for store-to-store communication
 * - Context pattern with performance optimization for React integration
 * - Cleanup pattern for automatic resource management
 * - Circuit Breaker pattern for error recovery and resilience
 * 
 * Security Features:
 * - XSS prevention through value sanitization
 * - Prototype pollution detection and prevention
 * - Input validation with customizable rules
 * - Trust levels and security metadata tracking
 * 
 * Performance Features:
 * - Automatic resource monitoring and cleanup
 * - Memory usage tracking and optimization
 * - Performance metrics collection and analysis
 * - Subscription throttling and debouncing
 * - Selective updates with path-based subscriptions
 */

/**
 * Enhanced subscription types for resilient Observer pattern implementation
 * @implements observer-pattern
 * @implements error-recovery-pattern
 * @implements resource-management-pattern
 * @memberof core-concepts
 */

/** Change notification callback function */
export type Listener = () => void;

/** Enhanced listener with error handling context */
export type EnhancedListener = {
  /** The actual listener function */
  listener: Listener;
  /** Error count for this listener */
  errorCount: number;
  /** Last error timestamp */
  lastError?: number;
  /** Component name for debugging */
  componentName?: string;
};

/** Enhanced unsubscribe function with metadata */
export type Unsubscribe = () => void;

/** Subscribe function signature for observer pattern */
export type Subscribe = (listener: Listener) => Unsubscribe;

/** Enhanced subscribe function with options */
export type EnhancedSubscribe = (
  listener: Listener,
  options?: {
    /** Enable error recovery for this subscription */
    enableRetry?: boolean;
    /** Maximum retry attempts */
    maxRetries?: number;
    /** Component name for debugging */
    componentName?: string;
  }
) => Unsubscribe;

/**
 * Enhanced store snapshot with metadata and validation
 * @implements store-snapshot
 * @implements immutable-state
 * @memberof api-terms
 * 
 * Enhanced immutable snapshot with comprehensive metadata, validation status,
 * and performance metrics for advanced debugging and monitoring.
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
  
  /** Snapshot version for optimistic updates */
  version?: number;
  
  /** Validation status of the current value */
  isValid?: boolean;
  
  /** Error message if validation failed */
  validationError?: string;
  
  /** Performance metrics for this snapshot */
  metrics?: {
    /** Time taken to create this snapshot (ms) */
    creationTime: number;
    /** Memory size estimate (bytes) */
    sizeEstimate?: number;
    /** Number of listeners notified */
    notificationCount?: number;
  };
  
  /** Security metadata */
  security?: {
    /** Whether value passed security validation */
    validated: boolean;
    /** Sanitization applied */
    sanitized?: boolean;
    /** Trust level (0-100) */
    trustLevel?: number;
  };
}

/**
 * Enhanced Store interface with advanced memory management and error recovery
 * @implements store-interface
 * @implements usesyncexternalstore-compatible
 * @implements observer-pattern
 * @memberof core-concepts
 * 
 * Enhanced Store interface with comprehensive resource management, automatic cleanup,
 * error recovery strategies, and advanced security features.
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
  
  /** Set store value with enhanced options and validation */
  setValue: (value: T, options?: StoreSetValueOptions<T>) => void;
  
  /** Update store value with function (for functional updates) */
  update: (updater: (current: T) => T) => void;
  
  /** Get current value directly (for action handlers) */
  getValue: () => T;
  
  /** Get number of active listeners (debugging/monitoring) */
  getListenerCount?: () => number;
  
  /** Enhanced disposal with comprehensive cleanup */
  dispose?: () => void;
  
  // 🧹 Enhanced Cleanup System
  /** Register cleanup task for automatic execution on disposal */
  registerCleanup?: (task: () => void) => () => void;
  
  /** Check if store is disposed */
  isStoreDisposed?: () => boolean;
  
  // 📊 Performance and Monitoring
  /** Get store performance metrics */
  getMetrics?: () => StoreMetrics;
  
  /** Reset performance metrics */
  resetMetrics?: () => void;
  
  // 🔧 Advanced Configuration
  /** Set security options */
  setSecurityOptions?: (options: SecurityOptions) => void;
  
  /** Get current security options */
  getSecurityOptions?: () => SecurityOptions | undefined;
}

/**
 * Enhanced Store Registry interface with advanced lifecycle management
 * @implements store-registry
 * @implements registry-pattern
 * @memberof core-concepts
 * 
 * Enhanced registry with comprehensive store lifecycle management, automatic cleanup,
 * health monitoring, and advanced security features.
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
  
  /** Register a store with optional metadata and validation */
  register: (name: string, store: IStore, metadata?: any) => void;
  
  /** Unregister a store by name with cleanup */
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
  
  /** Clear all registered stores with proper cleanup */
  clear: () => void;
  
  /** Iterate over all stores */
  forEach: (callback: (store: IStore, name: string) => void) => void;
  
  // 🧹 Enhanced Lifecycle Management
  /** Dispose registry and all stores */
  dispose?: () => void;
  
  /** Check if registry is disposed */
  isDisposed?: () => boolean;
  
  /** Register cleanup task for the registry */
  registerCleanup?: (task: () => void) => () => void;
  
  // 🏥 Health Monitoring
  /** Get registry health status */
  getHealthStatus?: () => {
    totalStores: number;
    healthyStores: number;
    errorStores: number;
    disposedStores: number;
    memoryUsage?: number;
  };
  
  /** Perform health check on all stores */
  performHealthCheck?: () => Promise<Map<string, boolean>>;
  
  // 🔧 Advanced Configuration
  /** Set registry-wide security options */
  setSecurityOptions?: (options: SecurityOptions) => void;
  
  /** Enable/disable automatic cleanup */
  setAutoCleanup?: (enabled: boolean) => void;
}


// === Enhanced Hook Configuration Types ===
// Advanced React Hook optimization and error handling
export interface StoreSyncConfig<T, R = Snapshot<T>> {
  /** 기본값 (초기 렌더링용) */
  defaultValue?: T;
  /** 선택적 구독 (성능 최적화) */
  selector?: (snapshot: Snapshot<T>) => R;
  /** Equality function for selector results */
  isEqual?: (prev: R, next: R) => boolean;
  /** Enable error boundary integration */
  errorBoundary?: boolean;
  /** Suspension support for concurrent features */
  suspense?: boolean;
}

/**
 * Enhanced hook options with error recovery and performance features
 */
export interface HookOptions<T> {
  /** 기본값 */
  defaultValue?: T;
  /** Enhanced error handler with retry capability */
  onError?: (error: Error, retryCount?: number) => void | boolean;
  /** React useEffect 의존성 */
  dependencies?: React.DependencyList;
  /** Enable automatic error recovery */
  enableRetry?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Enable performance monitoring */
  enableMetrics?: boolean;
  /** Throttle updates (milliseconds) */
  throttle?: number;
  /** Debounce updates (milliseconds) */
  debounce?: number;
}

/**
 * Store 값 설정 시 옵션
 * Enhanced with security and performance features
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
  /** Value sanitization function */
  sanitizer?: (value: T) => T;
  /** Validation function */
  validator?: (value: T) => boolean | string;
}

/**
 * Subscription metadata for enhanced error tracking
 */
export interface SubscriptionMetadata {
  /** When the subscription was created */
  subscribedAt: number;
  /** Number of errors encountered by this subscription */
  errorCount: number;
  /** Enhanced listener with error handling */
  enhancedListener: () => void;
  /** Component name or identifier (optional) */
  componentName?: string;
}

/**
 * Resource monitoring interface for memory management
 */
export interface ResourceMonitor {
  /** Current memory usage estimate */
  memoryUsage: number;
  /** Number of active subscriptions */
  activeSubscriptions: number;
  /** Number of pending operations */
  pendingOperations: number;
  /** Last activity timestamp */
  lastActivity: number;
  /** Cleanup monitor resources */
  dispose(): void;
}

/**
 * Store performance metrics
 */
export interface StoreMetrics {
  /** Total number of setValue calls */
  totalSets: number;
  /** Total number of getValue calls */
  totalGets: number;
  /** Total number of updates */
  totalUpdates: number;
  /** Total number of notifications sent */
  totalNotifications: number;
  /** Average time per operation (ms) */
  averageOperationTime: number;
  /** Peak listener count */
  peakListenerCount: number;
  /** Total errors encountered */
  totalErrors: number;
}

/**
 * Enhanced cleanup task interface
 */
export interface CleanupTask {
  /** The cleanup function */
  task: () => void;
  /** Task identifier for debugging */
  id?: string;
  /** Priority level (higher = more important) */
  priority?: number;
  /** Optional timeout for task execution (ms) */
  timeout?: number;
}

/**
 * Security validation options
 */
export interface SecurityOptions {
  /** Enable prototype pollution detection */
  preventPrototypePollution?: boolean;
  /** Enable XSS prevention */
  preventXSS?: boolean;
  /** Maximum object depth allowed */
  maxDepth?: number;
  /** Maximum string length allowed */
  maxStringLength?: number;
  /** Allowed property names pattern */
  allowedProperties?: RegExp;
  /** Blocked property names pattern */
  blockedProperties?: RegExp;
}


// === Registry 동기화 타입 ===
// 핵심 설계: 동적 Store 접근 및 생성 옵션
/**
 * Type-safe registry store map with strict type constraints
 */
export interface RegistryStoreMap {
  [key: string]: unknown;  // 타입 유연성을 위한 맵 타입
}

/**
 * Strict store registry map with enhanced type safety
 */
export type StrictStoreDefinitions<T extends Record<string, unknown>> = {
  [K in keyof T]: {
    initialValue: T[K];
  } | T[K];
};

/**
 * Context return type with strict typing
 */
export interface StrictStoreContextReturn<T extends Record<string, unknown>> {
  Provider: React.ComponentType<{ children: React.ReactNode }>;
  useStore: <K extends keyof T>(name: K) => IStore<T[K]>;
  useStoreManager?: () => {
    getStore: <K extends keyof T>(name: K) => IStore<T[K]> | undefined;
    getAllStores: () => Map<string, IStore>;
    hasStore: (name: string) => boolean;
  };
}

/**
 * Enhanced dynamic store options with advanced features
 */
export interface DynamicStoreOptions<T> {
  /** 기본값 */
  defaultValue?: T;
  /** 없을 때 자동 생성 여부 */
  createIfNotExists?: boolean;
  /** Store 찾기 실패 콜백 */
  onNotFound?: (storeName: string) => void;
  /** Security options for auto-created stores */
  securityOptions?: SecurityOptions;
  /** Cleanup options for auto-created stores */
  autoCleanup?: boolean;
  /** Performance monitoring for auto-created stores */
  enableMetrics?: boolean;
}
