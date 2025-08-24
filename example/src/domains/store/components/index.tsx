/**
 * Store domain components
 * Specialized components for store pattern demonstrations
 */

import React from 'react';
import { useStoreValue } from '@context-action/react';
import { 
  DemoCard, 
  CodeExample, 
  PatternBadge, 
  StatusIndicator,
  MetricsDisplay 
} from '../../shared/components';
import { useStorePerformanceTracking, useStoreDebugger } from '../hooks';

// Store Value Display Component
export function StoreValueDisplay({ 
  store, 
  storeName, 
  selector,
  title,
  className = ''
}: {
  store: any;
  storeName: string;
  selector?: (value: any) => any;
  title?: string;
  className?: string;
}) {
  const value = useStoreValue(store, selector);
  const displayTitle = title || `${storeName} Store Value`;

  return (
    <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800">{displayTitle}</h4>
        <PatternBadge type="store" difficulty="beginner" />
      </div>
      <pre className="bg-white p-3 rounded border text-sm overflow-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

// Store Update Controls Component
export function StoreUpdateControls({
  store,
  storeName,
  actions,
  className = ''
}: {
  store: any;
  storeName: string;
  actions: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  }>;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="font-semibold text-gray-800">{storeName} Actions</h4>
      <div className="flex flex-wrap gap-2">
        {actions.map((actionItem, index) => (
          <button
            key={index}
            onClick={actionItem.action}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              actionItem.variant === 'primary' 
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : actionItem.variant === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : actionItem.variant === 'outline'
                ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {actionItem.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Store Performance Monitor Component
export function StorePerformanceMonitor({
  store,
  storeName,
  enabled = true,
  className = ''
}: {
  store: any;
  storeName: string;
  enabled?: boolean;
  className?: string;
}) {
  const { updateCount, getMetrics, resetMetrics } = useStorePerformanceTracking(storeName, store);
  const metrics = getMetrics();

  if (!enabled) {
    return (
      <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          Performance monitoring disabled
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-blue-50 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-blue-800">Performance Monitor</h4>
        <button
          onClick={resetMetrics}
          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
        >
          Reset
        </button>
      </div>
      
      <MetricsDisplay
        title="Store Metrics"
        metrics={{
          'Updates': updateCount,
          'Avg Duration': metrics ? `${metrics.avgResponseTime.toFixed(2)}ms` : 'N/A',
          'Total Duration': metrics ? `${(metrics.duration || 0).toFixed(2)}ms` : 'N/A',
          'Operations': metrics?.operations || 0,
          'Errors': metrics?.errors || 0
        }}
      />
    </div>
  );
}

// Store Debugger Component
export function StoreDebugger({
  store,
  storeName,
  enabled = true,
  maxHistoryItems = 10,
  className = ''
}: {
  store: any;
  storeName: string;
  enabled?: boolean;
  maxHistoryItems?: number;
  className?: string;
}) {
  const { debugInfo, exportDebugData, clearHistory, isDebugging } = useStoreDebugger(
    storeName, 
    store, 
    enabled
  );

  if (!enabled) {
    return (
      <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          Store debugging disabled
        </div>
      </div>
    );
  }

  const recentHistory = debugInfo.updateHistory.slice(-maxHistoryItems);

  return (
    <div className={`p-4 bg-green-50 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-green-800">Store Debugger</h4>
        <div className="flex gap-2">
          <StatusIndicator 
            status={isDebugging ? 'success' : 'idle'} 
            message={isDebugging ? 'Active' : 'Inactive'}
          />
          <button
            onClick={clearHistory}
            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
          >
            Clear
          </button>
          <button
            onClick={() => {
              const data = exportDebugData();
              console.log(`[${storeName}] Debug Export:`, data);
              navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
            }}
            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
          >
            Export
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <MetricsDisplay
          title="Debug Stats"
          metrics={{
            'Active Subscriptions': debugInfo.subscriptions,
            'Total Updates': debugInfo.updates,
            'History Items': debugInfo.updateHistory.length
          }}
        />

        <div>
          <h5 className="text-sm font-medium text-green-800 mb-2">Current Value</h5>
          <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(debugInfo.currentValue, null, 2)}
          </pre>
        </div>

        {recentHistory.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-green-800 mb-2">
              Recent Updates (Last {maxHistoryItems})
            </h5>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentHistory.reverse().map((update, index) => (
                <div key={index} className="bg-white p-2 rounded text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Update #{debugInfo.updates - index}</span>
                    <span className="text-gray-500">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <details className="cursor-pointer">
                    <summary className="text-green-700 hover:text-green-800">
                      View Changes
                    </summary>
                    <div className="mt-1 pl-2 border-l-2 border-green-200">
                      <div className="mb-1">
                        <strong className="text-red-600">Before:</strong>
                        <pre className="text-xs">{JSON.stringify(update.previousValue)}</pre>
                      </div>
                      <div>
                        <strong className="text-green-600">After:</strong>
                        <pre className="text-xs">{JSON.stringify(update.value)}</pre>
                      </div>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Store Pattern Demo Container
export function StorePatternDemo({
  title,
  description,
  store,
  storeName,
  actions,
  showPerformanceMonitor = true,
  showDebugger = false,
  codeExample,
  children,
  className = ''
}: {
  title: string;
  description: string;
  store: any;
  storeName: string;
  actions: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  }>;
  showPerformanceMonitor?: boolean;
  showDebugger?: boolean;
  codeExample?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <DemoCard title={title} className={className}>
      <div className="space-y-6">
        <p className="text-gray-600">{description}</p>
        
        {children && (
          <div className="bg-gray-50 rounded-lg p-4">
            {children}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StoreValueDisplay 
            store={store} 
            storeName={storeName}
            title={`${title} - Current State`}
          />
          <StoreUpdateControls 
            store={store} 
            storeName={storeName} 
            actions={actions} 
          />
        </div>

        {(showPerformanceMonitor || showDebugger) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {showPerformanceMonitor && (
              <StorePerformanceMonitor store={store} storeName={storeName} />
            )}
            {showDebugger && (
              <StoreDebugger store={store} storeName={storeName} />
            )}
          </div>
        )}

        {codeExample && (
          <CodeExample>
            {codeExample}
          </CodeExample>
        )}
      </div>
    </DemoCard>
  );
}

// Store Comparison Component
export function StoreComparison({
  stores,
  title = 'Store Comparison',
  className = ''
}: {
  stores: Array<{
    store: any;
    name: string;
    description?: string;
  }>;
  title?: string;
  className?: string;
}) {
  return (
    <DemoCard title={title} className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map(({ store, name, description }, index) => (
          <div key={index} className="space-y-3">
            <div className="flex items-center gap-2">
              <PatternBadge type="store" difficulty="intermediate" />
              <h4 className="font-semibold text-gray-800">{name}</h4>
            </div>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
            <StoreValueDisplay 
              store={store} 
              storeName={name}
              className="min-h-32"
            />
          </div>
        ))}
      </div>
    </DemoCard>
  );
}