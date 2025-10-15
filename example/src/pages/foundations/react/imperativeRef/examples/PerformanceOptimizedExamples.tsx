/**
 * Performance Optimized Handler Registration Examples
 *
 * This file demonstrates advanced performance patterns for handler registration:
 * - Memory leak prevention
 * - Cleanup patterns
 * - Performance monitoring
 * - Optimized re-registration strategies
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRefRegistry } from '../contexts/RefContexts';
import { validateFormData, FormData } from '../business/imperativeRefBusinessLogic';

// 🎯 Performance Monitoring Hook
function usePerformanceMonitor(label: string) {
  const startTime = useRef<number | null>(null);
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
  });

  const startMeasure = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const endMeasure = useCallback(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      console.log(`⚡ ${label}: ${duration.toFixed(2)}ms (render #${renderCount.current})`);
    }
  }, [label]);

  return { startMeasure, endMeasure, renderCount: renderCount.current };
}

// 🎯 Memory Leak Prevention Example
export function MemoryLeakPreventionExample({ children }: { children: React.ReactNode }) {
  const refRegistry = useRefRegistry();
  const [logs, setLogs] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const { startMeasure, endMeasure, renderCount } = usePerformanceMonitor('MemoryLeakPrevention');

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 4)]);
  }, []);

  // 🔑 Cleanup Pattern: useEffect cleanup function
  useEffect(() => {
    if (!isActive) return;

    addLog('🔧 Setting up event listeners');

    // Timer interval that needs cleanup
    const interval = setInterval(() => {
      const timerValue = refRegistry.timer.current?.getTime() || 0;
      if (timerValue > 0 && timerValue % 10 === 0) {
        addLog(`📊 Timer checkpoint: ${timerValue}s`);
      }
    }, 1000);

    // Cleanup function - critical for preventing memory leaks
    return () => {
      addLog('🧹 Cleaning up event listeners');
      clearInterval(interval);
    };
  }, [refRegistry, addLog, isActive]);

  // 🔑 Handler with performance monitoring
  const handleOptimizedOperation = useCallback(() => {
    startMeasure();

    addLog('🚀 Starting optimized operation');

    // Batch DOM operations for better performance
    const operations = [
      () => refRegistry.nameInput.current?.getValue(),
      () => refRegistry.emailInput.current?.getValue(),
      () => refRegistry.counter.current?.getValue()
    ];

    // Execute operations and measure performance
    const results = operations.map(op => op());

    endMeasure();
    addLog(`✅ Batch operation completed: ${results.join(', ')}`);

  }, [refRegistry, addLog, startMeasure, endMeasure]);

  return (
    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
      <h3 className="font-semibold text-red-800 mb-2">🛡️ Memory Leak Prevention</h3>
      <p className="text-sm text-red-600 mb-3">
        Demonstrates proper cleanup patterns and performance monitoring (Render #{renderCount})
      </p>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-3 py-1 rounded text-sm ${
            isActive
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-400 text-white hover:bg-gray-500'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </button>

        <button
          onClick={handleOptimizedOperation}
          disabled={!isActive}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
        >
          Run Optimized Operation
        </button>
      </div>

      <div className="text-xs bg-red-100 p-2 rounded max-h-20 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-red-500">No activity yet</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="text-red-700 font-mono">{log}</div>
          ))
        )}
      </div>

      {children}
    </div>
  );
}

// 🎯 Optimized Re-registration Example
export function OptimizedReregistrationExample({
  debounceMs = 300,
  children
}: {
  debounceMs?: number;
  children: React.ReactNode;
}) {
  const refRegistry = useRefRegistry();
  const [logs, setLogs] = useState<string[]>([]);
  const [triggerCount, setTriggerCount] = useState(0);
  const { startMeasure, endMeasure } = usePerformanceMonitor('OptimizedReregistration');

  // 🔑 Debounced state for preventing excessive re-registrations
  const [debouncedTriggerCount, setDebouncedTriggerCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTriggerCount(triggerCount);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [triggerCount, debounceMs]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 4)]);
  }, []);

  // 🔑 Memoized handler - only re-creates when debouncedTriggerCount changes
  const handleOptimizedValidation = useMemo(() => {
    return () => {
      startMeasure();
      addLog(`🔄 Handler re-registered (trigger: ${debouncedTriggerCount})`);

      const formData: FormData = {
        name: refRegistry.nameInput.current?.getValue() || '',
        email: refRegistry.emailInput.current?.getValue() || '',
        message: refRegistry.messageInput.current?.getValue() || ''
      };

      const result = validateFormData(formData);
      addLog(`📋 Validation result: ${result.isValid ? 'Valid' : 'Invalid'}`);

      endMeasure();
      return result;
    };
  }, [refRegistry, addLog, debouncedTriggerCount, startMeasure, endMeasure]);

  return (
    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
      <h3 className="font-semibold text-indigo-800 mb-2">⚡ Optimized Re-registration</h3>
      <p className="text-sm text-indigo-600 mb-3">
        Debounced handler re-registration (debounce: {debounceMs}ms)
      </p>
      <p className="text-xs text-indigo-500 mb-2">
        Trigger Count: {triggerCount} | Debounced: {debouncedTriggerCount}
      </p>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTriggerCount(prev => prev + 1)}
          className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
        >
          Trigger Re-registration
        </button>

        <button
          onClick={handleOptimizedValidation}
          className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
        >
          Run Validation
        </button>
      </div>

      <div className="text-xs bg-indigo-100 p-2 rounded max-h-20 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-indigo-500">No activity yet</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="text-indigo-700 font-mono">{log}</div>
          ))
        )}
      </div>

      {children}
    </div>
  );
}

// 🎯 Resource Cleanup Example with WeakMap pattern
export function WeakMapCleanupExample({ children }: { children: React.ReactNode }) {
  const refRegistry = useRefRegistry();
  const [logs, setLogs] = useState<string[]>([]);

  // 🔑 WeakMap for automatic garbage collection
  const handlerMap = useRef(new WeakMap());
  const resourceMap = useRef(new Map<string, any>());

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 4)]);
  }, []);

  // 🔑 Resource creation with automatic cleanup tracking
  const createResource = useCallback((id: string) => {
    // Simulate resource creation (e.g., event listener, subscription)
    const resource = {
      id,
      createdAt: Date.now(),
      cleanup: () => {
        addLog(`🗑️ Resource ${id} cleaned up`);
        resourceMap.current.delete(id);
      }
    };

    resourceMap.current.set(id, resource);
    addLog(`🆕 Resource ${id} created`);

    return resource;
  }, [addLog]);

  // 🔑 Handler with WeakMap pattern
  const handleResourceOperation = useCallback(() => {
    const resourceId = `resource_${Date.now()}`;
    const resource = createResource(resourceId);

    // Store handler in WeakMap for automatic cleanup
    const handler = () => {
      addLog(`🔧 Using resource ${resource.id}`);
    };

    handlerMap.current.set(resource, handler);

    // Simulate using the resource
    handler();

    // Schedule cleanup after 3 seconds
    setTimeout(() => {
      resource.cleanup();
    }, 3000);

  }, [createResource, addLog]);

  // 🔑 Manual cleanup all resources
  const cleanupAllResources = useCallback(() => {
    const resourceCount = resourceMap.current.size;

    for (const [, resource] of resourceMap.current) {
      resource.cleanup();
    }

    addLog(`🧹 Cleaned up ${resourceCount} resources`);
  }, [addLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAllResources();
    };
  }, [cleanupAllResources]);

  return (
    <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
      <h3 className="font-semibold text-teal-800 mb-2">🗂️ WeakMap Cleanup Pattern</h3>
      <p className="text-sm text-teal-600 mb-3">
        Automatic resource cleanup using WeakMap and proper resource management
      </p>
      <p className="text-xs text-teal-500 mb-2">
        Active Resources: {resourceMap.current.size}
      </p>

      <div className="flex gap-2 mb-3">
        <button
          onClick={handleResourceOperation}
          className="px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700"
        >
          Create Resource
        </button>

        <button
          onClick={cleanupAllResources}
          className="px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700"
        >
          Cleanup All
        </button>
      </div>

      <div className="text-xs bg-teal-100 p-2 rounded max-h-20 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-teal-500">No activity yet</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="text-teal-700 font-mono">{log}</div>
          ))
        )}
      </div>

      {children}
    </div>
  );
}

// 🎯 Main Performance Examples Demo
export function PerformanceOptimizedDemo() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h2 className="text-lg font-bold text-gray-800 mb-3">
          ⚡ Performance Optimized Handler Patterns
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          고급 성능 최적화 패턴: 메모리 누수 방지, 리소스 관리, 최적화된 재등록 전략
        </p>
      </div>

      {/* Examples Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <MemoryLeakPreventionExample>
          <div></div>
        </MemoryLeakPreventionExample>

        <OptimizedReregistrationExample debounceMs={500}>
          <div></div>
        </OptimizedReregistrationExample>

        <WeakMapCleanupExample>
          <div></div>
        </WeakMapCleanupExample>

        {/* Comparison Chart */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-semibold text-gray-800 mb-3">📊 Performance Metrics</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Memory Usage:</span>
              <span className="text-green-600">Optimized ✓</span>
            </div>
            <div className="flex justify-between">
              <span>Re-render Count:</span>
              <span className="text-green-600">Minimized ✓</span>
            </div>
            <div className="flex justify-between">
              <span>Cleanup Coverage:</span>
              <span className="text-green-600">100% ✓</span>
            </div>
            <div className="flex justify-between">
              <span>Handler Stability:</span>
              <span className="text-green-600">Stable ✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <h3 className="font-semibold text-amber-800 mb-2">💡 Performance Best Practices</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-amber-700">
          <div>
            <h4 className="font-medium mb-1">Memory Management</h4>
            <ul className="space-y-1">
              <li>• useEffect cleanup functions</li>
              <li>• WeakMap for automatic GC</li>
              <li>• Resource pooling patterns</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">Handler Optimization</h4>
            <ul className="space-y-1">
              <li>• Debounced re-registration</li>
              <li>• Memoized handler creation</li>
              <li>• Batch operation patterns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}