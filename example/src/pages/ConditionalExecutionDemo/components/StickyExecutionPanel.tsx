import React, { useState, useEffect } from 'react';
import { useStoreValue } from '@context-action/react';
import { useConditionalStore } from '../stores';
import { LogEntry } from '../types';

interface ExecutionState {
  isRunning: boolean;
  currentAction?: string;
  progress: number;
  lastUpdate: number;
}

export function StickyExecutionPanel() {
  const logsStore = useConditionalStore('logs');
  const logs = useStoreValue(logsStore);
  
  const deploymentStore = useConditionalStore('deploymentResults');
  const deploymentResults = useStoreValue(deploymentStore);
  
  const userProcessingStore = useConditionalStore('userProcessingResults');
  const userProcessingResults = useStoreValue(userProcessingStore);
  
  const systemStore = useConditionalStore('systemResults');
  const systemResults = useStoreValue(systemStore);
  
  const orderStore = useConditionalStore('orderResults');
  const orderResults = useStoreValue(orderStore);
  
  const scheduleStore = useConditionalStore('scheduleResults');
  const scheduleResults = useStoreValue(scheduleStore);

  const [executionState, setExecutionState] = useState<ExecutionState>({
    isRunning: false,
    progress: 0,
    lastUpdate: Date.now()
  });

  const [activeTab, setActiveTab] = useState<'live' | 'logs' | 'results'>('live');
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-detect execution state from logs
  useEffect(() => {
    if (logs.length > 0) {
      const lastLog = logs[logs.length - 1];
      const timeSinceLastLog = Date.now() - lastLog.timestamp;
      
      setExecutionState(prev => ({
        ...prev,
        isRunning: timeSinceLastLog < 2000, // Consider running if last log < 2s ago
        currentAction: lastLog.message.includes('started') ? 
          lastLog.message.split(' ')[1] : undefined,
        lastUpdate: lastLog.timestamp,
        progress: Math.min(100, (logs.length % 10) * 10) // Simple progress simulation
      }));
    }
  }, [logs]);

  const recentLogs = logs.slice(-10).reverse();
  const allResults = [
    ...deploymentResults.map(r => ({ ...r, type: 'deployment' })),
    ...userProcessingResults.map(r => ({ ...r, type: 'user-processing' })),
    ...systemResults.map(r => ({ ...r, type: 'system' })),
    ...orderResults.map(r => ({ ...r, type: 'order' })),
    ...scheduleResults.map(r => ({ ...r, type: 'schedule' }))
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return '🔵';
      case 'warning': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deployment': return '🚀';
      case 'user-processing': return '👤';
      case 'system': return '⚙️';
      case 'order': return '📦';
      case 'schedule': return '⏰';
      default: return '📊';
    }
  };

  return (
    <div className={`fixed right-4 top-4 bottom-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50 transition-all duration-300 ${
      isMinimized ? 'w-16' : 'w-96'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
        {!isMinimized && (
          <>
            <h3 className="font-semibold text-gray-800">🎯 Execution Monitor</h3>
            <div className="flex items-center gap-2">
              {executionState.isRunning && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Running</span>
                </div>
              )}
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ➖
              </button>
            </div>
          </>
        )}
        
        {isMinimized && (
          <button
            onClick={() => setIsMinimized(false)}
            className="w-full h-full flex items-center justify-center text-gray-600 hover:text-gray-800"
          >
            📊
          </button>
        )}
      </div>

      {!isMinimized && (
        <>
          {/* Status Bar */}
          {executionState.isRunning && (
            <div className="p-2 bg-blue-50 border-b">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-blue-700">
                  {executionState.currentAction || 'Processing...'}
                </span>
                <span className="text-blue-600">{executionState.progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${executionState.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 py-2 px-3 text-sm ${
                activeTab === 'live' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔴 Live
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-2 px-3 text-sm ${
                activeTab === 'logs' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Logs ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex-1 py-2 px-3 text-sm ${
                activeTab === 'results' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Results ({allResults.length})
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {/* Live Tab */}
            {activeTab === 'live' && (
              <div className="h-full flex flex-col">
                <div className="p-3 border-b bg-gray-50">
                  <div className="text-sm font-medium text-gray-700 mb-2">Current State</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded border">
                      <div className="text-gray-500">Deployments</div>
                      <div className="font-semibold">{deploymentResults.length}</div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <div className="text-gray-500">Orders</div>
                      <div className="font-semibold">{orderResults.length}</div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <div className="text-gray-500">Users</div>
                      <div className="font-semibold">{userProcessingResults.length}</div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <div className="text-gray-500">System</div>
                      <div className="font-semibold">{systemResults.length}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">Recent Activity</div>
                  <div className="space-y-2">
                    {recentLogs.map((log, index) => (
                      <div 
                        key={`${log.timestamp}-${index}`}
                        className="flex items-start gap-2 text-xs p-2 bg-gray-50 rounded"
                      >
                        <span>{getLogIcon(log.level)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-gray-800">{log.message}</div>
                          <div className="text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div className="h-full overflow-y-auto p-3">
                <div className="space-y-1">
                  {logs.slice(-50).reverse().map((log, index) => (
                    <div 
                      key={`${log.timestamp}-${index}`}
                      className="text-xs p-2 border-l-2 border-gray-200 hover:bg-gray-50"
                      style={{
                        borderLeftColor: log.level === 'error' ? '#ef4444' : 
                                       log.level === 'warning' ? '#f59e0b' : '#3b82f6'
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span>{getLogIcon(log.level)}</span>
                        <span className="font-medium text-gray-800">{log.level.toUpperCase()}</span>
                        <span className="text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-gray-700 ml-4">{log.message}</div>
                      {log.data && (
                        <details className="ml-4 mt-1">
                          <summary className="cursor-pointer text-blue-600">Data</summary>
                          <pre className="text-xs bg-gray-100 p-1 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div className="h-full overflow-y-auto p-3">
                <div className="space-y-2">
                  {allResults.map((result, index) => (
                    <div 
                      key={`${result.timestamp}-${index}`}
                      className="text-xs p-2 bg-gray-50 rounded border hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span>{getTypeIcon(result.type)}</span>
                        <span className="font-medium text-gray-800 capitalize">
                          {result.type.replace('-', ' ')}
                        </span>
                        <span className="text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <details className="ml-4">
                        <summary className="cursor-pointer text-blue-600">View Details</summary>
                        <pre className="text-xs bg-white p-2 rounded mt-1 border overflow-x-auto">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t bg-gray-50 text-xs text-gray-500">
            Last update: {new Date(executionState.lastUpdate).toLocaleTimeString()}
          </div>
        </>
      )}
    </div>
  );
}