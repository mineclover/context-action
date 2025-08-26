/**
 * ActionGuard Domain Hooks
 * Performance monitoring, API management, and advanced action handling hooks
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeTimeout, usePerformanceMonitor } from '@/lib/hooks';
import type {
  PerformanceMetrics,
  ActionPerformanceData,
  ApiRequestConfig,
  ApiResponse,
  CacheEntry,
  SearchConfig,
  SearchResult,
  UsePerformanceMonitorReturn,
  UseApiManagerReturn,
  UseSearchReturn,
  UsePriorityExecutionReturn
} from '../types';

// Performance monitoring hook
export function useActionPerformanceMonitor(): UsePerformanceMonitorReturn {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const performanceMonitor = usePerformanceMonitor('actionGuard');

  const recordAction = useCallback((
    actionType: string,
    startTime: number,
    endTime: number,
    priority: number
  ) => {
    if (!isMonitoring) return;

    const metric: PerformanceMetrics = {
      executionTime: endTime - startTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      actionCount: metrics.length + 1,
      priority,
      timestamp: Date.now(),
      actionType
    };

    setMetrics(prev => [...prev.slice(-99), metric]); // Keep last 100 metrics
  }, [isMonitoring, metrics.length]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    performanceMonitor.startTimer();
  }, [performanceMonitor]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    performanceMonitor.endTimer();
  }, [performanceMonitor]);

  const clearMetrics = useCallback(() => {
    setMetrics([]);
  }, []);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearMetrics,
    recordAction
  };
}

// API management hook with caching and deduplication
export function useApiManager(): UseApiManagerReturn {
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0
  });

  const activeRequests = useRef<Map<string, Promise<ApiResponse>>>(new Map());
  const responseTimes = useRef<number[]>([]);

  const execute = useCallback(async <T>(config: ApiRequestConfig): Promise<ApiResponse<T>> => {
    const startTime = Date.now();
    const cacheKey = config.cacheKey || `${config.method}-${config.url}-${JSON.stringify(config.body)}`;

    // Check cache first
    if (config.cacheKey && cache.has(cacheKey)) {
      const entry = cache.get(cacheKey)!;
      if (Date.now() - entry.timestamp < (config.cacheTtl || entry.ttl)) {
        setStats(prev => ({
          ...prev,
          cacheHits: prev.cacheHits + 1
        }));
        return {
          data: entry.data,
          status: 200,
          headers: {},
          cached: true,
          executionTime: Date.now() - startTime
        };
      } else {
        // Remove expired entry
        const newCache = new Map(cache);
        newCache.delete(cacheKey);
        setCache(newCache);
      }
    }

    // Check for duplicate request
    if (activeRequests.current.has(cacheKey)) {
      return activeRequests.current.get(cacheKey) as Promise<ApiResponse<T>>;
    }

    setIsLoading(true);
    setError(null);

    const requestPromise = (async (): Promise<ApiResponse<T>> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout || 10000);

        const response = await fetch(config.url, {
          method: config.method,
          headers: config.headers,
          body: config.body ? JSON.stringify(config.body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const endTime = Date.now();
        const executionTime = endTime - startTime;

        // Update response time tracking
        responseTimes.current.push(executionTime);
        if (responseTimes.current.length > 100) {
          responseTimes.current.shift();
        }

        const apiResponse: ApiResponse<T> = {
          data,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          cached: false,
          executionTime
        };

        // Cache the response if caching is enabled
        if (config.cacheKey) {
          const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: config.cacheTtl || 300000, // 5 minutes default
            key: cacheKey
          };
          
          const newCache = new Map(cache);
          newCache.set(cacheKey, entry);
          setCache(newCache);
        }

        // Update stats
        setStats(prev => {
          const newTotalRequests = prev.totalRequests + 1;
          const avgResponseTime = responseTimes.current.reduce((sum, time) => sum + time, 0) / responseTimes.current.length;
          
          return {
            ...prev,
            totalRequests: newTotalRequests,
            cacheMisses: prev.cacheMisses + 1,
            averageResponseTime: avgResponseTime
          };
        });

        return apiResponse;

      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        activeRequests.current.delete(cacheKey);
        setIsLoading(false);
      }
    })();

    activeRequests.current.set(cacheKey, requestPromise);
    return requestPromise;
  }, [cache]);

  const clearCache = useCallback(() => {
    setCache(new Map());
    setStats(prev => ({
      ...prev,
      cacheHits: 0,
      cacheMisses: 0
    }));
  }, []);

  return {
    execute,
    cache,
    clearCache,
    isLoading,
    error,
    stats
  };
}

// Smart search hook with debouncing and abort capability
export function useSmartSearch<T>(
  searchFn: (query: string, config: SearchConfig) => Promise<T[]>,
  initialConfig: Partial<SearchConfig> = {}
): UseSearchReturn {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const abortController = useRef<AbortController | null>(null);
  const { setSafeTimeout, clearSafeTimeout } = useSafeTimeout();

  const config: SearchConfig = {
    debounceMs: 300,
    minLength: 2,
    maxResults: 50,
    includeHighlight: true,
    query: '',
    ...initialConfig
  };

  const search = useCallback(async (query: string): Promise<SearchResult> => {
    // Clear previous timeout
    clearSafeTimeout();
    
    // Abort previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    if (query.length < config.minLength) {
      setResults(null);
      return { items: [], totalCount: 0, executionTime: 0, query, hasMore: false };
    }

    const searchConfig = { ...config, query };
    
    return new Promise((resolve, reject) => {
      setSafeTimeout(async () => {
        setIsLoading(true);
        setError(null);
        
        abortController.current = new AbortController();
        const startTime = Date.now();

        try {
          const items = await searchFn(query, searchConfig);
          const endTime = Date.now();
          
          const result: SearchResult = {
            items: items.slice(0, config.maxResults),
            totalCount: items.length,
            executionTime: endTime - startTime,
            query,
            hasMore: items.length > config.maxResults
          };

          setResults(result);
          resolve(result);
        } catch (err) {
          if (err instanceof Error && err.name !== 'AbortError') {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            reject(error);
          }
        } finally {
          setIsLoading(false);
          abortController.current = null;
        }
      }, config.debounceMs);
    });
  }, [searchFn, config, setSafeTimeout, clearSafeTimeout]);

  const abortSearch = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    clearSafeTimeout();
    setIsLoading(false);
  }, [clearSafeTimeout]);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
    abortSearch();
  }, [abortSearch]);

  useEffect(() => {
    return () => {
      abortSearch();
    };
  }, [abortSearch]);

  return {
    search,
    results,
    isLoading,
    error,
    abortSearch,
    clearResults
  };
}

// Priority-based action execution hook
export function usePriorityExecution(): UsePriorityExecutionReturn {
  const [queue, setQueue] = useState<ActionPerformanceData[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);

  const processingQueue = useRef<ActionPerformanceData[]>([]);
  const isProcessing = useRef(false);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || processingQueue.current.length === 0) {
      return;
    }

    isProcessing.current = true;
    setIsExecuting(true);

    // Sort by priority (lower number = higher priority)
    processingQueue.current.sort((a, b) => a.priority - b.priority);

    while (processingQueue.current.length > 0) {
      const action = processingQueue.current.shift()!;
      const startTime = Date.now();
      
      try {
        action.status = 'executing';
        setQueue(prev => prev.map(item => 
          item.actionId === action.actionId ? action : item
        ));

        // Simulate action execution (in real app, this would call the actual action)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

        const endTime = Date.now();
        action.endTime = endTime;
        action.duration = endTime - startTime;
        action.status = 'completed';

        // Record metrics
        const metric: PerformanceMetrics = {
          executionTime: action.duration,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          actionCount: metrics.length + 1,
          priority: action.priority,
          timestamp: endTime,
          actionType: action.actionId
        };

        setMetrics(prev => [...prev.slice(-99), metric]);
        setQueue(prev => prev.map(item => 
          item.actionId === action.actionId ? action : item
        ));

      } catch (error) {
        action.status = 'failed';
        action.error = error instanceof Error ? error : new Error(String(error));
        setQueue(prev => prev.map(item => 
          item.actionId === action.actionId ? action : item
        ));
      }
    }

    isProcessing.current = false;
    setIsExecuting(false);
  }, [metrics.length]);

  const execute = useCallback(async <T>(
    actionId: string, 
    payload: any, 
    priority: number = 5
  ): Promise<T> => {
    const actionData: ActionPerformanceData = {
      actionId,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      priority,
      status: 'pending',
      result: payload
    };

    setQueue(prev => [...prev, actionData]);
    processingQueue.current.push(actionData);

    // Start processing if not already processing
    processQueue();

    // Return a promise that resolves when the action completes
    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const currentAction = queue.find(item => item.actionId === actionId);
        if (!currentAction) {
          setTimeout(checkStatus, 50);
          return;
        }

        if (currentAction.status === 'completed') {
          resolve(currentAction.result);
        } else if (currentAction.status === 'failed') {
          reject(currentAction.error);
        } else {
          setTimeout(checkStatus, 50);
        }
      };
      checkStatus();
    });
  }, [queue, processQueue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    processingQueue.current = [];
    setMetrics([]);
  }, []);

  return {
    execute,
    queue,
    isExecuting,
    metrics,
    clearQueue
  };
}

// Throttled event handler hook
export function useThrottledEventHandler<T extends any[]>(
  handler: (...args: T) => void,
  throttleMs: number = 100
) {
  const lastExecuted = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledHandler = useCallback((...args: T) => {
    const now = Date.now();
    
    if (now - lastExecuted.current >= throttleMs) {
      // Execute immediately
      handler(...args);
      lastExecuted.current = now;
    } else {
      // Schedule for later execution
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        handler(...args);
        lastExecuted.current = Date.now();
      }, throttleMs - (now - lastExecuted.current));
    }
  }, [handler, throttleMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledHandler;
}