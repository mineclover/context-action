/**
 * Async domain components
 * Specialized components for async pattern demonstrations
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  DemoCard, 
  CodeExample, 
  PatternBadge, 
  StatusIndicator, 
  MetricsDisplay,
  LoadingSpinner 
} from '../../shared/components';
import { useAsyncState, useSafeTimeout } from '../../shared/hooks';
import { 
  TimeoutProtectionService,
  CircuitBreakerService,
  AsyncPerformanceMonitor,
  RealtimeStateService
} from '../patterns';

// Async Operation Status Display
export function AsyncOperationStatus({
  operationName,
  isRunning,
  result,
  error,
  duration,
  className = ''
}: {
  operationName: string;
  isRunning: boolean;
  result?: any;
  error?: Error | null;
  duration?: number;
  className?: string;
}) {
  const getStatus = () => {
    if (isRunning) return 'loading';
    if (error) return 'error';
    if (result !== undefined) return 'success';
    return 'idle';
  };

  return (
    <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800">{operationName}</h4>
        <div className="flex items-center gap-2">
          <StatusIndicator status={getStatus()} />
          {isRunning && <LoadingSpinner size="sm" />}
        </div>
      </div>
      
      <div className="space-y-2">
        {duration !== undefined && (
          <div className="text-sm text-gray-600">
            Duration: <span className="font-medium">{duration.toFixed(2)}ms</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <div className="text-sm font-medium text-red-800">Error</div>
            <div className="text-xs text-red-600">{error.message}</div>
          </div>
        )}
        
        {result !== undefined && !error && (
          <div className="bg-green-50 border border-green-200 rounded p-2">
            <div className="text-sm font-medium text-green-800">Success</div>
            <pre className="text-xs text-green-700 mt-1">
              {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// Timeout Protection Demo Component
export function TimeoutProtectionDemo({
  title = 'Timeout Protection',
  className = ''
}: {
  title?: string;
  className?: string;
}) {
  const [basicState, setBasicState] = useState<{ isRunning: boolean; result?: any; error?: Error; duration?: number }>({
    isRunning: false
  });
  
  const [progressiveState, setProgressiveState] = useState<{ isRunning: boolean; result?: any; error?: Error; duration?: number }>({
    isRunning: false
  });

  const runBasicTimeout = async () => {
    setBasicState({ isRunning: true });
    const startTime = performance.now();
    
    try {
      // Simulate slow operation
      const slowOperation = () => new Promise(resolve => 
        setTimeout(() => resolve('Basic operation completed'), 2000)
      );
      
      const result = await TimeoutProtectionService.basicTimeout(
        slowOperation(),
        3000, // 3 second timeout
        'Operation timed out'
      );
      
      setBasicState({
        isRunning: false,
        result,
        duration: performance.now() - startTime
      });
    } catch (error) {
      setBasicState({
        isRunning: false,
        error: error as Error,
        duration: performance.now() - startTime
      });
    }
  };

  const runProgressiveTimeout = async () => {
    setProgressiveState({ isRunning: true });
    const startTime = performance.now();
    
    try {
      const result = await TimeoutProtectionService.progressiveTimeout(
        async () => {
          // Simulate unreliable operation
          await new Promise(resolve => setTimeout(resolve, Math.random() * 4000));
          if (Math.random() < 0.3) {
            throw new Error('Random failure');
          }
          return 'Progressive operation completed';
        },
        {
          initialTimeout: 1000,
          maxTimeout: 5000,
          timeoutMultiplier: 1.5,
          maxRetries: 3
        }
      );
      
      setProgressiveState({
        isRunning: false,
        result,
        duration: performance.now() - startTime
      });
    } catch (error) {
      setProgressiveState({
        isRunning: false,
        error: error as Error,
        duration: performance.now() - startTime
      });
    }
  };

  return (
    <DemoCard title={title} className={className}>
      <div className="space-y-6">
        <div>
          <PatternBadge type="async" difficulty="intermediate" className="mb-3" />
          <p className="text-gray-600 mb-4">
            Demonstrates different timeout protection strategies for async operations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <button
              onClick={runBasicTimeout}
              disabled={basicState.isRunning}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {basicState.isRunning ? 'Running Basic Timeout...' : 'Test Basic Timeout (3s)'}
            </button>
            
            <AsyncOperationStatus
              operationName="Basic Timeout"
              isRunning={basicState.isRunning}
              result={basicState.result}
              error={basicState.error}
              duration={basicState.duration}
            />
          </div>

          <div className="space-y-3">
            <button
              onClick={runProgressiveTimeout}
              disabled={progressiveState.isRunning}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {progressiveState.isRunning ? 'Running Progressive...' : 'Test Progressive Timeout'}
            </button>
            
            <AsyncOperationStatus
              operationName="Progressive Timeout"
              isRunning={progressiveState.isRunning}
              result={progressiveState.result}
              error={progressiveState.error}
              duration={progressiveState.duration}
            />
          </div>
        </div>

        <CodeExample>
{`// Basic timeout protection
const result = await TimeoutProtectionService.basicTimeout(
  slowOperation(),
  3000, // 3 second timeout
  'Operation timed out'
);

// Progressive timeout with retry logic
const result = await TimeoutProtectionService.progressiveTimeout(
  async () => unreliableOperation(),
  {
    initialTimeout: 1000,
    maxTimeout: 5000,
    timeoutMultiplier: 1.5,
    maxRetries: 3
  }
);`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Circuit Breaker Demo Component
export function CircuitBreakerDemo({
  title = 'Circuit Breaker Pattern',
  className = ''
}: {
  title?: string;
  className?: string;
}) {
  const [circuitBreaker] = useState(() => new CircuitBreakerService(3, 10000)); // 3 failures, 10s reset
  const [state, setState] = useState(() => circuitBreaker.getState());
  const [operationState, setOperationState] = useState<{ isRunning: boolean; result?: any; error?: Error }>({
    isRunning: false
  });

  const { setSafeTimeout } = useSafeTimeout();

  // Update circuit breaker state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setState(circuitBreaker.getState());
    }, 1000);

    return () => clearInterval(interval);
  }, [circuitBreaker]);

  const executeOperation = async () => {
    setOperationState({ isRunning: true });
    
    try {
      const result = await circuitBreaker.execute(async () => {
        // Simulate unreliable service (50% failure rate)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (Math.random() < 0.5) {
          throw new Error('Service temporarily unavailable');
        }
        
        return 'Operation successful';
      });
      
      setOperationState({ isRunning: false, result });
    } catch (error) {
      setOperationState({ isRunning: false, error: error as Error });
    }
  };

  const resetCircuitBreaker = () => {
    circuitBreaker.reset();
    setState(circuitBreaker.getState());
  };

  const getStateColor = () => {
    switch (state.state) {
      case 'CLOSED': return 'text-green-600';
      case 'HALF_OPEN': return 'text-yellow-600';
      case 'OPEN': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <DemoCard title={title} className={className}>
      <div className="space-y-6">
        <div>
          <PatternBadge type="async" difficulty="advanced" className="mb-3" />
          <p className="text-gray-600 mb-4">
            Circuit breaker prevents cascading failures by monitoring operation success rates.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <MetricsDisplay
              title="Circuit Breaker State"
              metrics={{
                'State': state.state,
                'Failures': state.failures,
                'Last Failure': state.lastFailureTime ? 
                  new Date(state.lastFailureTime).toLocaleTimeString() : 'None'
              }}
            />
            
            <div className="flex gap-2">
              <button
                onClick={executeOperation}
                disabled={operationState.isRunning || state.state === 'OPEN'}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {operationState.isRunning ? 'Executing...' : 'Execute Operation'}
              </button>
              
              <button
                onClick={resetCircuitBreaker}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className={`text-center p-4 rounded-lg border-2 ${
              state.state === 'CLOSED' ? 'border-green-200 bg-green-50' :
              state.state === 'HALF_OPEN' ? 'border-yellow-200 bg-yellow-50' :
              'border-red-200 bg-red-50'
            }`}>
              <div className={`text-2xl font-bold ${getStateColor()}`}>
                {state.state}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Circuit Breaker Status
              </div>
            </div>
            
            <AsyncOperationStatus
              operationName="Circuit Breaker Operation"
              isRunning={operationState.isRunning}
              result={operationState.result}
              error={operationState.error}
            />
          </div>
        </div>

        <CodeExample>
{`// Create circuit breaker
const circuitBreaker = new CircuitBreakerService(3, 10000); // 3 failures, 10s reset

// Execute operation through circuit breaker
const result = await circuitBreaker.execute(async () => {
  // Your unreliable operation here
  return await unreliableService();
});`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Async Performance Monitor Component
export function AsyncPerformanceMonitorDemo({
  title = 'Async Performance Monitor',
  className = ''
}: {
  title?: string;
  className?: string;
}) {
  const [monitor] = useState(() => new AsyncPerformanceMonitor());
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [isRunning, setIsRunning] = useState(false);

  const updateMetrics = useCallback(() => {
    setMetrics(monitor.getMetrics());
  }, [monitor]);

  const runMonitoredOperation = async (operationName: string) => {
    setIsRunning(true);
    
    try {
      await monitor.monitor(operationName, async () => {
        // Simulate various operation durations
        const duration = Math.random() * 2000 + 500;
        await new Promise(resolve => setTimeout(resolve, duration));
        
        // Simulate occasional failures
        if (Math.random() < 0.2) {
          throw new Error('Random operation failure');
        }
        
        return 'Operation completed';
      });
    } catch {
      // Error is already handled by monitor
    } finally {
      setIsRunning(false);
      updateMetrics();
    }
  };

  const clearMetrics = () => {
    monitor.clearMetrics();
    updateMetrics();
  };

  return (
    <DemoCard title={title} className={className}>
      <div className="space-y-6">
        <div>
          <PatternBadge type="async" difficulty="intermediate" className="mb-3" />
          <p className="text-gray-600 mb-4">
            Monitor async operation performance with detailed metrics and success rates.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => runMonitoredOperation('fastOperation')}
            disabled={isRunning}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Fast Operation
          </button>
          <button
            onClick={() => runMonitoredOperation('slowOperation')}
            disabled={isRunning}
            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Slow Operation
          </button>
          <button
            onClick={() => runMonitoredOperation('unreliableOperation')}
            disabled={isRunning}
            className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            Unreliable Operation
          </button>
          <button
            onClick={clearMetrics}
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Metrics
          </button>
        </div>

        {isRunning && (
          <div className="flex items-center gap-2 text-blue-600">
            <LoadingSpinner size="sm" />
            <span>Running monitored operation...</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Object.entries(metrics).map(([operationName, operationMetrics]) => (
            <MetricsDisplay
              key={operationName}
              title={operationName}
              metrics={{
                'Calls': operationMetrics.calls,
                'Success Rate': `${operationMetrics.successRate.toFixed(1)}%`,
                'Avg Duration': `${operationMetrics.avgDuration.toFixed(1)}ms`,
                'Min Duration': `${operationMetrics.minDuration.toFixed(1)}ms`,
                'Max Duration': `${operationMetrics.maxDuration.toFixed(1)}ms`,
                'Errors': operationMetrics.errors
              }}
            />
          ))}
        </div>

        {Object.keys(metrics).length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Run some operations to see performance metrics
          </div>
        )}

        <CodeExample>
{`// Create performance monitor
const monitor = new AsyncPerformanceMonitor();

// Monitor operation performance
const result = await monitor.monitor('operationName', async () => {
  return await yourAsyncOperation();
});

// Get metrics
const metrics = monitor.getMetrics('operationName');`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Wait for Refs Demo Component
export function WaitForRefsDemo({
  title = 'Wait for Refs Pattern',
  waitForRefs,
  getRefTarget,
  registerRef,
  className = ''
}: {
  title?: string;
  waitForRefs: (key: string) => Promise<void>;
  getRefTarget: (key: string) => HTMLElement | null;
  registerRef: (key: string, element: HTMLElement | null) => void;
  className?: string;
}) {
  const { data: operationState, loading: isRunning, execute } = useAsyncState({
    result: null as any,
    error: null as Error | null
  });

  const performWaitOperation = execute(async () => {
    // Wait for element to be available
    await waitForRefs('demo-target');
    
    const element = getRefTarget('demo-target');
    if (!element) {
      throw new Error('Element not found after waiting');
    }

    // Perform DOM operations
    element.style.backgroundColor = '#f0f9ff';
    element.style.border = '2px solid #3b82f6';
    element.textContent = 'Element found and modified!';
    
    // Reset after delay
    setTimeout(() => {
      element.style.backgroundColor = '';
      element.style.border = '';
      element.textContent = 'Demo Target Element';
    }, 2000);
    
    return 'DOM operation completed successfully';
  });

  return (
    <DemoCard title={title} className={className}>
      <div className="space-y-6">
        <div>
          <PatternBadge type="ref" difficulty="beginner" className="mb-3" />
          <p className="text-gray-600 mb-4">
            Wait for DOM elements to be available before performing operations.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={performWaitOperation}
            disabled={isRunning}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isRunning ? 'Waiting for element...' : 'Perform Wait Operation'}
          </button>

          <div
            ref={(el) => registerRef('demo-target', el)}
            className="p-4 bg-gray-100 rounded text-center font-medium"
          >
            Demo Target Element
          </div>

          <AsyncOperationStatus
            operationName="Wait for Refs"
            isRunning={isRunning}
            result={operationState.result}
            error={operationState.error}
          />
        </div>

        <CodeExample>
{`// Wait for element to be available
await waitForRefs('elementKey');

// Get element and perform operations
const element = getRefTarget('elementKey');
if (element) {
  element.style.backgroundColor = '#f0f9ff';
  element.textContent = 'Element found!';
}`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}