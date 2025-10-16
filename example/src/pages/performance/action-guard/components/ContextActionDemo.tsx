/**
 * Context-Action Performance Tracking Demo
 * Demonstrates ActionPerformanceData using Context-Action framework
 */

import { useCallback, useState } from 'react';
import { PerformanceProvider, usePriorityExecution } from '../hooks';
import type { PerformanceTrackingActions } from '../types';

function ContextActionPerformanceDemo() {
  const {
    executeWithPriority,
    performanceQueue,
    metrics,
    isExecuting,
    clearQueue,
    getMetricsByType: _getMetricsByType,
    getAverageExecutionTime,
  } = usePriorityExecution();

  const [selectedAction, setSelectedAction] = useState<
    keyof PerformanceTrackingActions
  >('recordPerformanceMetrics');
  const [customPayload, setCustomPayload] = useState('{"test": "data"}');

  const handleExecuteAction = useCallback(async () => {
    try {
      const payload = JSON.parse(customPayload);
      const result = await executeWithPriority(
        selectedAction,
        payload,
        Math.floor(Math.random() * 5) + 1
      );
      console.log('🎯 Context-Action execution result:', result);
    } catch (error) {
      console.error('❌ Context-Action execution failed:', error);
    }
  }, [selectedAction, customPayload, executeWithPriority]);

  const handleBulkExecution = useCallback(async () => {
    const actions: Array<{
      action: keyof PerformanceTrackingActions;
      payload: unknown;
      priority: number;
    }> = [
      {
        action: 'recordPerformanceMetrics',
        payload: {
          actionType: 'bulkTest1',
          executionTime: 150,
          memoryUsage: 2048,
          priority: 1,
        },
        priority: 1,
      },
      {
        action: 'addToQueue',
        payload: { actionId: 'bulk-1', priority: 2, queueTime: Date.now() },
        priority: 2,
      },
      {
        action: 'recordPerformanceMetrics',
        payload: {
          actionType: 'bulkTest2',
          executionTime: 300,
          memoryUsage: 4096,
          priority: 3,
        },
        priority: 3,
      },
      {
        action: 'removeFromQueue',
        payload: { actionId: 'bulk-1', dequeueTime: Date.now() + 1000 },
        priority: 4,
      },
    ];

    for (const { action, payload, priority } of actions) {
      await executeWithPriority(action, payload, priority);
      await new Promise((resolve) => setTimeout(resolve, 200)); // Small delay between executions
    }
  }, [executeWithPriority]);

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-indigo-900 mb-2">
          🎯 Context-Action Performance Tracking Demo
        </h2>
        <p className="text-indigo-700">
          ActionPerformanceData powered by Context-Action framework
        </p>
      </div>

      {/* Execution Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            🚀 Action Execution
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                value={selectedAction}
                onChange={(e) =>
                  setSelectedAction(
                    e.target.value as keyof PerformanceTrackingActions
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="recordPerformanceMetrics">
                  Record Performance Metrics
                </option>
                <option value="addToQueue">Add to Queue</option>
                <option value="removeFromQueue">Remove from Queue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payload (JSON)
              </label>
              <textarea
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder='{"actionType": "test", "executionTime": 100}'
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleExecuteAction}
                disabled={isExecuting}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExecuting ? '⏳ Executing...' : '▶️ Execute Action'}
              </button>

              <button
                onClick={handleBulkExecution}
                disabled={isExecuting}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔄 Bulk Execute
              </button>
            </div>
          </div>
        </div>

        {/* Queue Status */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            📊 Performance Queue
          </h3>

          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Queue Size:</span>{' '}
              {performanceQueue.length} actions
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Execution Status:</span>
              <span
                className={isExecuting ? 'text-yellow-600' : 'text-green-600'}
              >
                {isExecuting ? ' 🔄 Active' : ' ✅ Idle'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Metrics Count:</span>{' '}
              {metrics.length} entries
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Avg Execution Time:</span>{' '}
              {getAverageExecutionTime()}ms
            </div>
          </div>

          <button
            onClick={clearQueue}
            className="mt-3 w-full bg-red-600 text-white px-3 py-2 text-sm rounded-md hover:bg-red-700"
          >
            🗑️ Clear Queue
          </button>
        </div>
      </div>

      {/* Performance Queue Display */}
      {performanceQueue.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            🎯 Action Performance Queue
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {performanceQueue.map((action) => (
              <div
                key={action.actionId}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
                <div className="flex-1">
                  <span className="font-medium text-sm">
                    {action.actionType}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    Priority: {action.priority} | Status:
                    <span
                      className={
                        action.status === 'completed'
                          ? 'text-green-600'
                          : action.status === 'failed'
                            ? 'text-red-600'
                            : action.status === 'executing'
                              ? 'text-yellow-600'
                              : 'text-blue-600'
                      }
                    >
                      {action.status}
                    </span>
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {action.duration > 0 ? `${action.duration}ms` : 'Pending'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics Display */}
      {metrics.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            📈 Performance Metrics
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {metrics.slice(-10).map((metric, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded border"
              >
                <div className="flex-1">
                  <span className="font-medium text-sm">
                    {metric.actionType}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    Priority: {metric.priority} | Memory:{' '}
                    {(metric.memoryUsage / 1024 / 1024).toFixed(1)}MB
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {metric.executionTime}ms
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context-Action Framework Info */}
      <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-4 rounded-lg border-l-4 border-indigo-500">
        <h3 className="text-lg font-semibold text-indigo-900 mb-2">
          🎉 Context-Action Integration
        </h3>
        <div className="text-sm text-indigo-800 space-y-1">
          <p>
            ✨ <strong>ActionPerformanceData</strong> now uses Context-Action
            framework patterns
          </p>
          <p>
            🔄 <strong>Action Handlers:</strong> startActionExecution,
            completeActionExecution, recordPerformanceMetrics
          </p>
          <p>
            📦 <strong>Provider:</strong> PerformanceProvider wraps components
            for context isolation
          </p>
          <p>
            🎯 <strong>Type Safety:</strong> PerformanceTrackingActions extends
            ActionPayloadMap
          </p>
          <p>
            ⚡ <strong>Performance:</strong> Priority-based execution with
            Context-Action dispatch patterns
          </p>
        </div>
      </div>
    </div>
  );
}

export function ContextActionDemo() {
  return (
    <PerformanceProvider>
      <ContextActionPerformanceDemo />
    </PerformanceProvider>
  );
}
