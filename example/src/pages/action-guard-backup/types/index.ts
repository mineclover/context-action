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

export interface ActionPerformanceData {
  actionId: string;
  startTime: number;
  endTime: number;
  duration: number;
  priority: number;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'timeout';
  result?: any;
  error?: Error;
}

// API management types
export interface ApiRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cacheKey?: string;
  cacheTtl?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  cached: boolean;
  executionTime: number;
}

export interface CacheEntry<T = any> {
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
  filters?: Record<string, any>;
}

export interface SearchResult<T = any> {
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
  value: any;
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
  recordAction: (actionType: string, startTime: number, endTime: number, priority: number) => void;
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

export interface UsePriorityExecutionReturn {
  execute: <T>(actionId: string, payload: any, priority?: number) => Promise<T>;
  queue: ActionPerformanceData[];
  isExecuting: boolean;
  metrics: PerformanceMetrics[];
  clearQueue: () => void;
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