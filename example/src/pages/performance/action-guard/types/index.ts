/**
 * ActionGuard Domain Types
 * Type definitions for performance optimization, API management, and advanced action handling
 */

// Performance monitoring types
export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  actionCount: number;
  priority: number;
  timestamp: number;
  actionType: string;
}

export interface PriorityConfig {
  level: number;
  maxConcurrency: number;
  timeoutMs: number;
  retryCount: number;
}

// =============================================================================
// CONTEXT-ACTION BASED PERFORMANCE TRACKING SYSTEM
// =============================================================================
// Context-Action 라이브러리를 직접 사용한 성능 추적 시스템

import type {
  ActionPayloadMap,
  ExecutionResult,
  HandlerConfig,
} from '@context-action/core';

// Performance tracking action types using Context-Action
export interface PerformanceTrackingActions extends ActionPayloadMap {
  // Action execution tracking
  startActionExecution: {
    actionId: string;
    actionType: string;
    priority: number;
    payload?: unknown;
    metadata?: ActionExecutionMetadata;
  };

  completeActionExecution: {
    actionId: string;
    result?: unknown;
    duration: number;
    success: boolean;
  };

  failActionExecution: {
    actionId: string;
    error: Error;
    duration: number;
  };

  // Performance analytics
  recordPerformanceMetrics: {
    actionType: string;
    executionTime: number;
    memoryUsage: number;
    priority: number;
  };

  // Queue management
  addToQueue: {
    actionId: string;
    priority: number;
    queueTime: number;
  };

  removeFromQueue: {
    actionId: string;
    dequeueTime: number;
  };
}

// Enhanced ActionPerformanceData using Context-Action patterns
export interface ActionPerformanceData<TPayload = unknown, TResult = unknown> {
  // Core identification
  readonly actionId: string;
  readonly actionType: string;

  // Context-Action integration
  readonly handlerConfig?: HandlerConfig; // Uses Context-Action's HandlerConfig
  readonly executionResult?: ExecutionResult<TResult>; // Uses Context-Action's ExecutionResult

  // Timing (all in milliseconds)
  readonly startTime: number;
  readonly endTime: number;
  readonly duration: number;
  readonly queueTime?: number;

  // Status tracking
  readonly status: ActionExecutionStatus;
  readonly priority: number; // Uses Context-Action's priority system

  // Data
  readonly payload?: TPayload;
  readonly result?: TResult;
  readonly error?: Error;

  // Enhanced metadata
  readonly metadata?: ActionExecutionMetadata;
}

// Action execution status (simplified but comprehensive)
type ActionExecutionStatus =
  | 'queued' // Added to execution queue
  | 'executing' // Currently being processed
  | 'completed' // Successfully completed
  | 'failed' // Failed with error
  | 'aborted' // Manually aborted
  | 'timeout'; // Exceeded timeout

// Execution metadata for Context-Action integration
export interface ActionExecutionMetadata {
  readonly component?: string; // React component that triggered action
  readonly userId?: string; // User identifier
  readonly sessionId?: string; // Session identifier
  readonly source: 'user' | 'system' | 'background';
  readonly tags?: readonly string[]; // Tags for filtering and categorization
  readonly context?: Record<string, unknown>; // Additional context data
}

// API management types
export interface ApiRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | Record<string, unknown> | FormData | null;
  timeout?: number;
  retries?: number;
  cacheKey?: string;
  cacheTtl?: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
  cached: boolean;
  executionTime: number;
}

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

// Search and filtering types
export interface SearchConfig {
  query: string;
  debounceMs: number;
  minLength: number;
  maxResults: number;
  includeHighlight: boolean;
  filters?: Record<string, string | number | boolean>;
}

export interface SearchResult<T = unknown> {
  items: T[];
  totalCount: number;
  executionTime: number;
  query: string;
  hasMore: boolean;
}

// Event handling types
export interface EventHandlingConfig {
  throttleMs?: number;
  debounceMs?: number;
  maxEventQueue?: number;
  batchSize?: number;
  priority?: number;
}

export interface EventMetrics {
  eventType: string;
  frequency: number;
  averageProcessingTime: number;
  queueSize: number;
  droppedEvents: number;
}

// Conditional execution types
export interface ExecutionCondition {
  type: 'permission' | 'feature-flag' | 'business-rule' | 'environment';
  key: string;
  value: string | number | boolean;
  operator: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than';
}

export interface ConditionalConfig {
  conditions: ExecutionCondition[];
  operator: 'and' | 'or';
  fallbackAction?: string;
  onConditionFailed?: (condition: ExecutionCondition) => void;
}

// Component prop types
export interface PerformanceMonitorProps {
  metrics: PerformanceMetrics[];
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

export interface PriorityControlsProps {
  priorities: PriorityConfig[];
  onPriorityChange: (priority: number, config: PriorityConfig) => void;
  disabled?: boolean;
}

export interface ApiManagerProps {
  requests: ApiRequestConfig[];
  onRequestExecute: (config: ApiRequestConfig) => Promise<ApiResponse>;
  cacheEnabled: boolean;
  onCacheToggle: () => void;
}

export interface SearchDemoProps {
  config: SearchConfig;
  onConfigChange: (config: Partial<SearchConfig>) => void;
  onSearch: (query: string) => Promise<SearchResult>;
  results?: SearchResult;
  isLoading?: boolean;
}

// Hook return types
export interface UsePerformanceMonitorReturn {
  metrics: PerformanceMetrics[];
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearMetrics: () => void;
  recordAction: (
    actionType: string,
    startTime: number,
    endTime: number,
    priority: number
  ) => void;
}

export interface UseApiManagerReturn {
  execute: <T>(config: ApiRequestConfig) => Promise<ApiResponse<T>>;
  cache: Map<string, CacheEntry>;
  clearCache: () => void;
  isLoading: boolean;
  error: Error | null;
  stats: {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    averageResponseTime: number;
  };
}

export interface UseSearchReturn {
  search: (query: string) => Promise<SearchResult>;
  results: SearchResult | null;
  isLoading: boolean;
  error: Error | null;
  abortSearch: () => void;
  clearResults: () => void;
}

// Context-Action 기반 Priority Execution Hook 반환 타입
export interface UsePriorityExecutionReturn {
  // Context-Action의 dispatch 패턴을 활용
  executeWithPriority: <T = unknown, P = unknown>(
    actionType: keyof PerformanceTrackingActions,
    payload: P,
    priority?: number
  ) => Promise<T>;

  // Performance tracking data
  performanceQueue: ActionPerformanceData[];
  metrics: PerformanceMetrics[];

  // State
  isExecuting: boolean;

  // Management functions
  clearQueue: () => void;
  getMetricsByType: (actionType: string) => PerformanceMetrics[];
  getAverageExecutionTime: (actionType?: string) => number;
}

// Configuration types
export interface ActionGuardConfig {
  performance: {
    enableMonitoring: boolean;
    maxMetricsHistory: number;
    defaultTimeout: number;
    maxConcurrentActions: number;
  };
  api: {
    enableCaching: boolean;
    defaultCacheTtl: number;
    maxCacheSize: number;
    enableDeduplication: boolean;
  };
  search: {
    defaultDebounce: number;
    minQueryLength: number;
    maxResults: number;
    highlightMatches: boolean;
  };
  events: {
    defaultThrottle: number;
    maxQueueSize: number;
    batchProcessing: boolean;
  };
}
