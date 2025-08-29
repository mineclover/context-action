/**
 * ActionGuard Domain Components
 * Performance monitoring, API management, and action handling components
 */

import { useState, useCallback, useEffect } from 'react';
export { ContextActionDemo } from './ContextActionDemo';
import { DemoCard, Container, StatusIndicator, MetricsDisplay } from '@/components/ui';
import { 
  useActionPerformanceMonitor,
  useApiManager,
  useSmartSearch,
  useThrottledEventHandler
} from '../hooks';
import { createActionContext } from '@context-action/react';
import type {
  PerformanceMonitorProps,
  PriorityControlsProps,
  ApiManagerProps,
  SearchDemoProps,
  PerformanceMetrics,
  ApiRequestConfig,
  ApiResponse
} from '../types';

// Type definitions for API responses
interface JsonPlaceholderPost {
  userId: number;
  id: number;
  title: string;
  body: string;
}

interface JsonPlaceholderUser {
  id: number;
  name: string;
  username: string;
  email: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
  phone: string;
  website: string;
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}

// Union type for common API responses (direct data, not wrapped in ApiResponse interface)
type ApiResponseData = JsonPlaceholderPost | JsonPlaceholderUser | Record<string, unknown>;

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

// Define action types for the priority demo
interface PriorityDemoActions {
  registerWord: { priority: number; word: string };
  executeRegistered: void;
  clear: void;
}

// Create action context for priority demo
const { 
  Provider: PriorityDemoProvider, 
  useActionDispatch,
  useActionHandler 
} = createActionContext<PriorityDemoActions>('PriorityDemo');

// =============================================================================
// PRIORITY EXECUTION TEST CASES - Split into Separate Components
// =============================================================================

// Test Case 1: Basic Priority Registration
function TestCase1_BasicRegistration({ 
  onRegister, 
  registeredActions, 
  isExecuting, 
  wordsByPriority 
}: {
  onRegister: (priority: number) => void;
  registeredActions: Array<{ priority: number; word: string; registered: boolean }>;
  isExecuting: boolean;
  wordsByPriority: Record<number, string>;
}) {
  const isRegistered = useCallback((priority: number) => {
    return registeredActions.some(item => item.priority === priority);
  }, [registeredActions]);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">TEST 1</span>
        Register Actions (Click to Register)
      </h4>
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(wordsByPriority).map(([priority, word]) => {
          const registered = isRegistered(Number(priority));
          return (
            <button
              key={priority}
              onClick={() => onRegister(Number(priority))}
              disabled={registered || isExecuting}
              className={`p-2 text-xs rounded transition-colors disabled:cursor-not-allowed ${
                registered 
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
                  : Number(priority) <= 2 
                  ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                  : Number(priority) <= 3
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
              title={`Priority ${priority}: ${word}${registered ? ' (Registered)' : ''}`}
            >
              {registered ? '✓ ' : ''}P{priority}<br/>{word}
            </button>
          );
        })}
      </div>
      <div className="text-xs text-gray-500">
        💡 Register actions in any order - they will execute by priority!
      </div>
    </div>
  );
}

// Test Case 2: Execution Controls
function TestCase2_ExecutionControls({ 
  onExecute, 
  onClear, 
  registeredActions, 
  isExecuting 
}: {
  onExecute: () => void;
  onClear: () => void;
  registeredActions: Array<{ priority: number; word: string; registered: boolean }>;
  isExecuting: boolean;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">TEST 2</span>
        Execute Registered Actions
      </h4>
      <button
        onClick={onExecute}
        disabled={isExecuting || registeredActions.length === 0}
        className={`w-full px-4 py-2 rounded text-white font-medium transition-colors ${
          isExecuting 
            ? 'bg-gray-400 cursor-not-allowed' 
            : registeredActions.length === 0
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isExecuting 
          ? 'Executing Registered Actions...' 
          : registeredActions.length === 0 
          ? 'No Actions Registered'
          : `Execute ${registeredActions.length} Registered Actions`}
      </button>
      <button
        onClick={onClear}
        disabled={isExecuting}
        className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
      >
        Clear All
      </button>
    </div>
  );
}

// Test Case 3: Real-time Status Display
function TestCase3_StatusDisplay({ 
  registeredActions, 
  executionStatus 
}: {
  registeredActions: Array<{ priority: number; word: string; registered: boolean }>;
  executionStatus: Array<{ priority: number; word: string; status: 'registered' | 'executing' | 'completed' }>;
}) {
  if (registeredActions.length === 0) return null;

  return (
    <div className="border rounded">
      <div className="bg-gray-50 px-3 py-2 border-b">
        <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">TEST 3</span>
          Registered Actions ({registeredActions.length}) - Will Execute in Priority Order
        </div>
      </div>
      <div className="p-3">
        <div className="space-y-2">
          {executionStatus.map((item, index) => (
            <div key={`${item.priority}-${index}`} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded font-medium ${
                  item.status === 'completed' ? 'bg-green-100 text-green-700' :
                  item.status === 'executing' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {item.status === 'registered' ? 'ready' : item.status}
                </span>
                <span className="font-mono">P{item.priority}</span>
                <span>"{item.word}"</span>
              </div>
              <div className={`px-1 rounded text-xs ${
                item.priority <= 2 ? 'bg-red-200 text-red-800' :
                item.priority <= 3 ? 'bg-yellow-200 text-yellow-800' :
                'bg-green-200 text-green-800'
              }`}>
                Priority {item.priority}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Test Case 4: Execution Results Display
function TestCase4_ResultsDisplay({ 
  executionResult 
}: {
  executionResult: string;
}) {
  if (!executionResult) return null;

  return (
    <div className="border-2 border-green-300 rounded-lg">
      <div className="bg-green-100 px-3 py-2 border-b border-green-200">
        <div className="text-sm font-semibold text-green-800 flex items-center gap-2">
          <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">TEST 4</span>
          Execution Result Display
        </div>
      </div>
      <div className="p-4 bg-green-50">
        <div className="text-sm font-medium text-green-800 mb-2">✨ Final Execution Result:</div>
        <div className="text-xl font-bold text-green-900 mb-2">"{executionResult}"</div>
        <div className="text-xs text-green-600 bg-white p-2 rounded border border-green-200">
          ✅ Actions executed in priority order (1 → 2 → 3 → 4 → 5) regardless of registration order<br/>
          💡 This demonstrates the Context-Action framework's priority-based execution system
        </div>
      </div>
    </div>
  );
}

// Main Priority Execution Demo Component (internal)
function PriorityExecutionDemoInternal({
  className = ''
}: { className?: string }) {
  const dispatch = useActionDispatch();
  const [registeredActions, setRegisteredActions] = useState<Array<{ priority: number; word: string; registered: boolean }>>([]);
  const [executionResult, setExecutionResult] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<Array<{ priority: number; word: string; status: 'registered' | 'executing' | 'completed' }>>([]);
  
  // Debug execution result state changes
  useEffect(() => {
    console.log('🎯 executionResult state changed:', `"${executionResult}"`, 'Length:', executionResult.length);
    console.log('🎯 Will show result?', !!executionResult);
  }, [executionResult]);
  
  const wordsByPriority = {
    1: 'Hello', 
    2: 'Beautiful',
    3: 'World',
    4: 'from',
    5: 'Context-Action!'
  };

  // Register action handlers using Context-Action framework
  useActionHandler('registerWord', useCallback(async (payload: { priority: number; word: string }) => {
    setRegisteredActions(prev => {
      // Check if already registered
      if (prev.some(item => item.priority === payload.priority)) {
        return prev;
      }
      
      const newItem = { ...payload, registered: true };
      const newList = [...prev, newItem];
      // Sort by priority for display (1 = highest priority)
      return newList.sort((a, b) => a.priority - b.priority);
    });
    
    // Update execution status
    setExecutionStatus(prev => {
      if (prev.some(item => item.priority === payload.priority)) {
        return prev;
      }
      const newItem = { ...payload, status: 'registered' as const };
      const newList = [...prev, newItem];
      return newList.sort((a, b) => a.priority - b.priority);
    });
  }, []));

  useActionHandler('executeRegistered', useCallback(async () => {
    console.log('🎬 executeRegistered handler called!');
    
    // Get current state using the state setter functions to avoid stale closures
    setIsExecuting(currentIsExecuting => {
      if (currentIsExecuting) {
        console.log('❌ Execution blocked: already executing');
        return currentIsExecuting;
      }
      
      setRegisteredActions(currentRegisteredActions => {
        if (currentRegisteredActions.length === 0) {
          console.log('❌ Execution blocked: no registered actions');
          return currentRegisteredActions;
        }
        
        console.log('🚀 Starting execution with registered actions:', currentRegisteredActions);
        
        setExecutionResult('');
        console.log('🧹 Cleared execution result');
        
        // Mark all registered actions as executing
        setExecutionStatus(prev => 
          prev.map(item => ({ ...item, status: 'executing' as const }))
        );
        
        // Simulate execution with delays to show priority order
        const sortedActions = [...currentRegisteredActions].sort((a, b) => a.priority - b.priority);
        const resultWords: string[] = [];
        
        console.log('📋 Sorted actions for execution:', sortedActions);
        
        // Execute the actions asynchronously
        (async () => {
          try {
            for (const action of sortedActions) {
              console.log(`⏳ Executing action P${action.priority}: ${action.word}`);
              await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
              
              resultWords.push(action.word);
              console.log(`✅ Current result words:`, resultWords);
              
              // Mark this action as completed
              setExecutionStatus(prev => 
                prev.map(item => 
                  item.priority === action.priority 
                    ? { ...item, status: 'completed' as const }
                    : item
                )
              );
              
              // Show intermediate result
              const currentResult = resultWords.join(' ');
              console.log(`📝 Setting execution result to: "${currentResult}"`);
              setExecutionResult(currentResult);
              console.log(`📝 setExecutionResult called with: "${currentResult}"`);
            }
            
            console.log('🏁 Execution completed, setting isExecuting to false');
            setIsExecuting(false);
            console.log('🏁 Final result should be:', resultWords.join(' '));
          } catch (error) {
            console.error('💥 Execution error:', error);
            setIsExecuting(false);
          }
        })();
        
        return currentRegisteredActions;
      });
      
      return true; // Set isExecuting to true
    });
  }, []));

  useActionHandler('clear', useCallback(async () => {
    setRegisteredActions([]);
    setExecutionResult('');
    setExecutionStatus([]);
    setIsExecuting(false);
  }, []));

  const registerAction = useCallback((priority: number) => {
    const word = wordsByPriority[priority as keyof typeof wordsByPriority];
    dispatch('registerWord', { priority, word });
  }, [dispatch]);

  const isRegistered = useCallback((priority: number) => {
    return registeredActions.some(item => item.priority === priority);
  }, [registeredActions]);

  return (
    <DemoCard title="🧪 Priority-Based Action Execution - Test Cases" className={className}>
      <div className="space-y-6">
        {/* Header explaining the split test case approach */}
        <div className="text-sm text-gray-600 bg-blue-50 rounded p-3 border border-blue-200">
          <div className="font-semibold text-blue-800 mb-1">🎣 Split Test Case Architecture</div>
          This demo is split into 4 separate test components for better code organization and testing:
          <div className="mt-2 space-y-1 text-xs">
            <div><span className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs font-bold">TEST 1</span> Action Registration</div>
            <div><span className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs font-bold">TEST 2</span> Execution Controls</div>
            <div><span className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-xs font-bold">TEST 3</span> Status Display</div>
            <div><span className="bg-green-600 text-white px-1 py-0.5 rounded text-xs font-bold">TEST 4</span> Results Display</div>
          </div>
        </div>

        {/* Test Case 1: Registration */}
        <TestCase1_BasicRegistration 
          onRegister={registerAction}
          registeredActions={registeredActions}
          isExecuting={isExecuting}
          wordsByPriority={wordsByPriority}
        />

        {/* Test Case 2: Execution Controls */}
        <TestCase2_ExecutionControls 
          onExecute={() => dispatch('executeRegistered')}
          onClear={() => dispatch('clear')}
          registeredActions={registeredActions}
          isExecuting={isExecuting}
        />

        {/* Test Case 3: Status Display */}
        <TestCase3_StatusDisplay 
          registeredActions={registeredActions}
          executionStatus={executionStatus}
        />

        {/* Test Case 4: Results Display */}
        <TestCase4_ResultsDisplay 
          executionResult={executionResult}
        />

        {/* Technical Information */}
        <div className="text-xs text-gray-600 bg-gray-50 rounded p-3 border border-gray-200">
          <div className="font-semibold text-gray-800 mb-2">🔧 How the Context-Action Framework Works:</div>
          <div className="space-y-1">
            <div><strong>Registration:</strong> Actions registered via <code className="bg-gray-200 px-1 rounded">dispatch('registerWord')</code></div>
            <div><strong>Execution:</strong> Priority-based execution (1=highest → 5=lowest) via <code className="bg-gray-200 px-1 rounded">dispatch('executeRegistered')</code></div>
            <div><strong>Result:</strong> Final output shows: <strong>"Hello Beautiful World from Context-Action!"</strong></div>
            <div><strong>Architecture:</strong> Each test case is a separate component for better modularity</div>
          </div>
        </div>
      </div>
    </DemoCard>
  );
}

// Exported Priority Execution Demo Component with Provider
export function PriorityExecutionDemo(props: { className?: string }) {
  return (
    <PriorityDemoProvider>
      <PriorityExecutionDemoInternal {...props} />
    </PriorityDemoProvider>
  );
}

// API Manager Demo Component
export function ApiManagerDemo({
  className = ''
}: { className?: string }) {
  const { execute, cache, clearCache, isLoading, error, stats } = useApiManager();
  const [requestUrl, setRequestUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [response, setResponse] = useState<ApiResponse<ApiResponseData> | null>(null);

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
      setResponse(result as ApiResponse<ApiResponseData>);
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
                    {String(item)}
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