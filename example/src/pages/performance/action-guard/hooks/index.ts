/**
 * ActionGuard Domain Hooks
 * Performance monitoring, API management, and advanced action handling hooks
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePerformanceMonitor, useSafeTimeout } from '@/lib/hooks';
import type {
  ApiRequestConfig,
  ApiResponse,
  CacheEntry,
  PerformanceMetrics,
  SearchConfig,
  SearchResult,
  UseApiManagerReturn,
  UsePerformanceMonitorReturn,
  UseSearchReturn,
} from '../types';

// Performance monitoring hook
export function useActionPerformanceMonitor(): UsePerformanceMonitorReturn {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const performanceMonitor = usePerformanceMonitor();

  const recordAction = useCallback(
    (
      actionType: string,
      startTime: number,
      endTime: number,
      priority: number
    ) => {
      if (!isMonitoring) return;

      const metric: PerformanceMetrics = {
        executionTime: endTime - startTime,
        memoryUsage:
          (performance as Performance & { memory?: { usedJSHeapSize: number } })
            .memory?.usedJSHeapSize || 0,
        actionCount: metrics.length + 1,
        priority,
        timestamp: Date.now(),
        actionType,
      };

      setMetrics((prev) => [...prev.slice(-99), metric]); // Keep last 100 metrics
    },
    [isMonitoring, metrics.length]
  );

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
    recordAction,
  };
}

// API management hook with caching and deduplication
export function useApiManager(): UseApiManagerReturn {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const [cache, setCache] = useState<Map<string, CacheEntry>>(() => new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
  });

  const activeRequests = useRef<Map<string, Promise<ApiResponse>>>(new Map());
  const responseTimes = useRef<number[]>([]);

  const execute = useCallback(
    async <T>(config: ApiRequestConfig): Promise<ApiResponse<T>> => {
      const startTime = Date.now();
      const cacheKey =
        config.cacheKey ||
        `${config.method}-${config.url}-${JSON.stringify(config.body)}`;

      // Check cache first
      if (config.cacheKey && cacheRef.current.has(cacheKey)) {
        const entry = cacheRef.current.get(cacheKey)!;
        if (Date.now() - entry.timestamp < (config.cacheTtl || entry.ttl)) {
          setStats((prev) => ({
            ...prev,
            totalRequests: prev.totalRequests + 1,
            cacheHits: prev.cacheHits + 1,
          }));
          return {
            data: entry.data,
            status: 200,
            headers: {},
            cached: true,
            executionTime: Date.now() - startTime,
          } as ApiResponse<T>;
        } else {
          // Remove expired entry
          cacheRef.current.delete(cacheKey);
          setCache(new Map(cacheRef.current));
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
          const timeoutId = setTimeout(
            () => controller.abort(),
            config.timeout || 10000
          );

          let response: Response;
          try {
            response = await fetch(config.url, {
              method: config.method,
              headers: config.headers,
              body: config.body ? JSON.stringify(config.body) : undefined,
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timeoutId);
          }

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
            executionTime,
          };

          // Cache the response if caching is enabled
          if (config.cacheKey) {
            const entry: CacheEntry<T> = {
              data,
              timestamp: Date.now(),
              ttl: config.cacheTtl || 300000, // 5 minutes default
              key: cacheKey,
            };

            cacheRef.current.set(cacheKey, entry);
            setCache(new Map(cacheRef.current));
          }

          // Update stats
          setStats((prev) => {
            const newTotalRequests = prev.totalRequests + 1;
            const avgResponseTime =
              responseTimes.current.reduce((sum, time) => sum + time, 0) /
              responseTimes.current.length;

            return {
              ...prev,
              totalRequests: newTotalRequests,
              cacheMisses: prev.cacheMisses + 1,
              averageResponseTime: avgResponseTime,
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
    },
    []
  );

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setCache(new Map());
    responseTimes.current = [];
    setStats({
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
    });
  }, []);

  return {
    execute,
    cache,
    clearCache,
    isLoading,
    error,
    stats,
  };
}

function createEmptySearchResult(query: string): SearchResult {
  return {
    items: [],
    totalCount: 0,
    executionTime: 0,
    query,
    hasMore: false,
  };
}

// Smart search hook with debouncing and abort capability
export function useSmartSearch<T>(
  searchFn: (
    query: string,
    config: SearchConfig,
    signal?: AbortSignal
  ) => Promise<T[]>,
  initialConfig: Partial<SearchConfig> = {}
): UseSearchReturn {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortController = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const pendingSettleRef = useRef<(() => void) | null>(null);
  const filtersRef = useRef(initialConfig.filters);
  filtersRef.current = initialConfig.filters;
  const { setSafeTimeout, clearSafeTimeout } = useSafeTimeout();

  const debounceMs = initialConfig.debounceMs ?? 300;
  const minLength = initialConfig.minLength ?? 2;
  const maxResults = initialConfig.maxResults ?? 50;
  const includeHighlight = initialConfig.includeHighlight ?? true;

  const search = useCallback(
    async (query: string): Promise<SearchResult> => {
      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      // Cancel and settle any superseded search
      clearSafeTimeout();
      pendingSettleRef.current?.();
      pendingSettleRef.current = null;

      // Abort previous in-flight request
      if (abortController.current) {
        abortController.current.abort();
        abortController.current = null;
      }

      if (query.length < minLength) {
        setResults(null);
        setError(null);
        setIsLoading(false);
        return createEmptySearchResult(query);
      }

      const searchConfig: SearchConfig = {
        debounceMs,
        minLength,
        maxResults,
        includeHighlight,
        query,
        ...(filtersRef.current !== undefined && {
          filters: filtersRef.current,
        }),
      };

      return new Promise((resolve, reject) => {
        let settled = false;
        const settleEmpty = () => {
          if (settled) return;
          settled = true;
          if (pendingSettleRef.current === settleEmpty) {
            pendingSettleRef.current = null;
          }
          resolve(createEmptySearchResult(query));
        };
        pendingSettleRef.current = settleEmpty;

        setSafeTimeout(async () => {
          if (requestId !== requestIdRef.current) {
            settleEmpty();
            return;
          }

          const controller = new AbortController();
          abortController.current = controller;
          setIsLoading(true);
          setError(null);

          const startTime = Date.now();

          try {
            const items = await searchFn(
              query,
              searchConfig,
              controller.signal
            );
            if (
              controller.signal.aborted ||
              requestId !== requestIdRef.current
            ) {
              settleEmpty();
              return;
            }

            const endTime = Date.now();
            const result: SearchResult = {
              items: items.slice(0, maxResults),
              totalCount: items.length,
              executionTime: endTime - startTime,
              query,
              hasMore: items.length > maxResults,
            };

            setResults(result);
            if (!settled) {
              settled = true;
              if (pendingSettleRef.current === settleEmpty) {
                pendingSettleRef.current = null;
              }
              resolve(result);
            }
          } catch (err) {
            if (
              controller.signal.aborted ||
              requestId !== requestIdRef.current ||
              (err instanceof Error && err.name === 'AbortError')
            ) {
              settleEmpty();
              return;
            }

            const normalizedError =
              err instanceof Error ? err : new Error(String(err));
            setError(normalizedError);
            if (!settled) {
              settled = true;
              if (pendingSettleRef.current === settleEmpty) {
                pendingSettleRef.current = null;
              }
              reject(normalizedError);
            }
          } finally {
            if (requestId === requestIdRef.current) {
              setIsLoading(false);
              if (abortController.current === controller) {
                abortController.current = null;
              }
            }
          }
        }, debounceMs);
      });
    },
    [
      clearSafeTimeout,
      debounceMs,
      includeHighlight,
      maxResults,
      minLength,
      searchFn,
      setSafeTimeout,
    ]
  );

  const abortSearch = useCallback(() => {
    requestIdRef.current += 1;
    clearSafeTimeout();
    pendingSettleRef.current?.();
    pendingSettleRef.current = null;
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
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
    clearResults,
  };
}

// Throttled event handler hook
export function useThrottledEventHandler<T extends unknown[]>(
  handler: (...args: T) => void,
  throttleMs: number = 100
) {
  const lastExecuted = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledHandler = useCallback(
    (...args: T) => {
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

        timeoutRef.current = setTimeout(
          () => {
            handler(...args);
            lastExecuted.current = Date.now();
          },
          throttleMs - (now - lastExecuted.current)
        );
      }
    },
    [handler, throttleMs]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledHandler;
}
