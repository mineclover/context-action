/**
 * ActionGuard Domain Components
 * Performance monitoring, API management, and action handling components
 */

import { useState, useCallback } from 'react';
import { DemoCard, MetricsDisplay, StatusIndicator } from '../../../domains/shared/components';
import { 
  useActionPerformanceMonitor,
  useApiManager,
  useSmartSearch,
  usePriorityExecution,
  useThrottledEventHandler
} from '../hooks';
import type {
  PerformanceMonitorProps,
  PriorityControlsProps,
  ApiManagerProps,
  SearchDemoProps,
  PerformanceMetrics,
  ApiRequestConfig
} from '../types';

// Performance Monitor Component
export function PerformanceMonitor({
  className = ''
}: { className?: string }) {
  const {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearMetrics,
    recordAction
  } = useActionPerformanceMonitor();

  const simulateAction = useCallback(() => {
    const startTime = Date.now();
    setTimeout(() => {
      const endTime = Date.now();
      recordAction('simulatedAction', startTime, endTime, Math.floor(Math.random() * 5) + 1);
    }, Math.random() * 500 + 100);
  }, [recordAction]);

  const averageExecutionTime = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length 
    : 0;

  const averageMemoryUsage = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length
    : 0;

  return (
    <DemoCard title="Performance Monitor" className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <StatusIndicator
            status={isMonitoring ? 'success' : 'idle'}
            message={isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
          />
          <div className="flex gap-2">
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`px-3 py-1 text-sm rounded font-medium ${
                isMonitoring 
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isMonitoring ? 'Stop' : 'Start'}
            </button>
            <button
              onClick={clearMetrics}
              className="px-3 py-1 text-sm rounded font-medium bg-gray-500 text-white hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>

        <MetricsDisplay
          title="Performance Metrics"
          metrics={{
            'Total Actions': metrics.length,
            'Avg Execution Time': `${averageExecutionTime.toFixed(1)}ms`,
            'Avg Memory Usage': `${(averageMemoryUsage / 1024 / 1024).toFixed(1)}MB`,
            'Current Status': isMonitoring ? 'Active' : 'Idle'
          }}
        />

        <button
          onClick={simulateAction}
          disabled={!isMonitoring}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Simulate Action
        </button>

        {/* Performance Chart */}
        {metrics.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium mb-2">Execution Time Trend</div>
            <div className="h-16 bg-white rounded border flex items-end justify-between px-2">
              {metrics.slice(-20).map((metric, index) => {
                const height = Math.min((metric.executionTime / 1000) * 100, 100);
                return (
                  <div
                    key={index}
                    className="bg-blue-500 w-1 transition-all duration-200"
                    style={{ height: `${height}%` }}
                    title={`${metric.actionType}: ${metric.executionTime}ms`}
                  />
                );
              })}
            </div>
            <div className="text-xs text-gray-500 mt-1 flex justify-between">
              <span>0ms</span>
              <span>1000ms</span>
            </div>
          </div>
        )}
      </div>
    </DemoCard>
  );
}

// Priority Execution Demo Component
export function PriorityExecutionDemo({
  className = ''
}: { className?: string }) {
  const { execute, queue, isExecuting, clearQueue } = usePriorityExecution();

  const executeAction = useCallback(async (priority: number) => {
    const actionId = `action-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    try {
      await execute(actionId, { priority }, priority);
    } catch (error) {
      console.error('Action failed:', error);
    }
  }, [execute]);

  const priorityButtons = [1, 2, 3, 4, 5].map(priority => (
    <button
      key={priority}
      onClick={() => executeAction(priority)}
      disabled={isExecuting}
      className={`px-3 py-2 text-sm rounded font-medium transition-colors ${
        priority <= 2 
          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
          : priority <= 3
          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
          : 'bg-green-100 text-green-700 hover:bg-green-200'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      Priority {priority}
    </button>
  ));

  return (
    <DemoCard title="Priority-Based Execution" className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <StatusIndicator
            status={isExecuting ? 'loading' : 'idle'}
            message={`${queue.length} actions in queue`}
          />
          <button
            onClick={clearQueue}
            className="px-3 py-1 text-sm rounded font-medium bg-gray-500 text-white hover:bg-gray-600"
          >
            Clear Queue
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Add Actions by Priority:</div>
          <div className="flex flex-wrap gap-2">
            {priorityButtons}
          </div>
        </div>

        {/* Queue Display */}
        {queue.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium mb-2">Execution Queue</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {queue.map((action) => (
                <div
                  key={action.actionId}
                  className={`flex items-center justify-between p-2 rounded text-xs ${
                    action.status === 'executing' ? 'bg-blue-100 border-blue-300' :
                    action.status === 'completed' ? 'bg-green-100 border-green-300' :
                    action.status === 'failed' ? 'bg-red-100 border-red-300' :
                    'bg-white border-gray-200'
                  } border`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{action.actionId.slice(-8)}</span>
                    <span className={`px-1 rounded text-xs font-medium ${
                      action.priority <= 2 ? 'bg-red-200 text-red-800' :
                      action.priority <= 3 ? 'bg-yellow-200 text-yellow-800' :
                      'bg-green-200 text-green-800'
                    }`}>
                      P{action.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`capitalize ${
                      action.status === 'executing' ? 'text-blue-600' :
                      action.status === 'completed' ? 'text-green-600' :
                      action.status === 'failed' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {action.status}
                    </span>
                    {action.duration > 0 && (
                      <span className="text-gray-500">{action.duration}ms</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DemoCard>
  );
}

// API Manager Demo Component
export function ApiManagerDemo({
  className = ''
}: { className?: string }) {
  const { execute, cache, clearCache, isLoading, error, stats } = useApiManager();
  const [requestUrl, setRequestUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [response, setResponse] = useState<any>(null);

  const makeRequest = useCallback(async () => {
    try {
      setResponse(null);
      const config: ApiRequestConfig = {
        url: requestUrl,
        method: 'GET',
        cacheKey: `api-demo-${requestUrl}`,
        cacheTtl: 30000 // 30 seconds
      };
      
      const result = await execute(config);
      setResponse(result);
    } catch (err) {
      console.error('API request failed:', err);
    }
  }, [execute, requestUrl]);

  return (
    <DemoCard title="API Manager with Caching" className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <StatusIndicator
            status={isLoading ? 'loading' : error ? 'error' : 'idle'}
            message={isLoading ? 'Loading...' : error ? error.message : 'Ready'}
          />
          <button
            onClick={clearCache}
            className="px-3 py-1 text-sm rounded font-medium bg-gray-500 text-white hover:bg-gray-600"
          >
            Clear Cache
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">API URL:</label>
          <input
            type="text"
            value={requestUrl}
            onChange={(e) => setRequestUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            placeholder="Enter API URL"
          />
          <button
            onClick={makeRequest}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Make Request'}
          </button>
        </div>

        <MetricsDisplay
          title="API Statistics"
          metrics={{
            'Total Requests': stats.totalRequests,
            'Cache Hits': stats.cacheHits,
            'Cache Misses': stats.cacheMisses,
            'Hit Rate': `${stats.totalRequests > 0 ? ((stats.cacheHits / stats.totalRequests) * 100).toFixed(1) : 0}%`,
            'Avg Response Time': `${stats.averageResponseTime.toFixed(1)}ms`,
            'Cache Size': cache.size
          }}
        />

        {/* Response Display */}
        {response && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Response</div>
              <div className="flex items-center gap-2 text-xs">
                {response.cached && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                    Cached
                  </span>
                )}
                <span className="text-gray-500">{response.executionTime}ms</span>
              </div>
            </div>
            <div className="bg-white rounded border p-2 text-xs font-mono max-h-32 overflow-y-auto">
              <pre>{JSON.stringify(response.data, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </DemoCard>
  );
}

// Smart Search Demo Component  
export function SmartSearchDemo({
  className = ''
}: { className?: string }) {
  const [query, setQuery] = useState('');
  
  const mockSearchFn = useCallback(async (searchQuery: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    const mockData = [
      'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js',
      'Python', 'Django', 'Flask', 'Java', 'Spring', 'Kotlin',
      'Go', 'Rust', 'C++', 'C#', '.NET', 'PHP', 'Laravel',
      'Ruby', 'Rails', 'Swift', 'Objective-C', 'Dart', 'Flutter'
    ];
    
    return mockData.filter(item => 
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, []);

  const { search, results, isLoading, clearResults } = useSmartSearch(mockSearchFn, {
    debounceMs: 300,
    minLength: 1,
    maxResults: 10
  });

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery) {
      search(searchQuery);
    } else {
      clearResults();
    }
  }, [search, clearResults]);

  return (
    <DemoCard title="Smart Search with Debouncing" className={className}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Search Technologies:</label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm pr-10"
              placeholder="Start typing to search..."
            />
            {isLoading && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        </div>

        {results && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">
                Results ({results.totalCount})
              </div>
              <div className="text-xs text-gray-500">
                {results.executionTime}ms
              </div>
            </div>
            
            {results.items.length > 0 ? (
              <div className="space-y-1">
                {results.items.map((item, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 bg-white rounded border text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    {item}
                  </div>
                ))}
                {results.hasMore && (
                  <div className="text-xs text-gray-500 text-center py-2">
                    ... and {results.totalCount - results.items.length} more
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No results found for "{results.query}"
              </div>
            )}
          </div>
        )}
      </div>
    </DemoCard>
  );
}

// Throttled Event Demo Component
export function ThrottledEventDemo({
  className = ''
}: { className?: string }) {
  const [eventCount, setEventCount] = useState(0);
  const [throttledCount, setThrottledCount] = useState(0);
  const [throttleMs, setThrottleMs] = useState(100);

  const handleNormalEvent = useCallback(() => {
    setEventCount(prev => prev + 1);
  }, []);

  const handleThrottledEvent = useThrottledEventHandler(
    useCallback(() => {
      setThrottledCount(prev => prev + 1);
    }, []),
    throttleMs
  );

  const reset = useCallback(() => {
    setEventCount(0);
    setThrottledCount(0);
  }, []);

  return (
    <DemoCard title="Event Throttling Demo" className={className}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Throttle Delay (ms):</label>
          <input
            type="range"
            min="50"
            max="1000"
            step="50"
            value={throttleMs}
            onChange={(e) => setThrottleMs(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-center">{throttleMs}ms</div>
        </div>

        <MetricsDisplay
          title="Event Metrics"
          metrics={{
            'Normal Events': eventCount,
            'Throttled Events': throttledCount,
            'Reduction': `${eventCount > 0 ? (((eventCount - throttledCount) / eventCount) * 100).toFixed(1) : 0}%`
          }}
        />

        <div className="flex gap-2">
          <button
            onClick={() => {
              handleNormalEvent();
              handleThrottledEvent();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Trigger Event
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset
          </button>
        </div>

        <div className="text-xs text-gray-600 bg-gray-50 rounded p-3">
          <strong>How it works:</strong> The throttled handler ensures events are processed 
          at most once per {throttleMs}ms window, reducing processing overhead while maintaining 
          responsiveness.
        </div>
      </div>
    </DemoCard>
  );
}

// Combined ActionGuard Demos Component
export function ActionGuardDemos({
  className = ''
}: { className?: string }) {
  return (
    <div className={`space-y-8 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceMonitor />
        <PriorityExecutionDemo />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ApiManagerDemo />
        <SmartSearchDemo />
      </div>

      <ThrottledEventDemo />
    </div>
  );
}