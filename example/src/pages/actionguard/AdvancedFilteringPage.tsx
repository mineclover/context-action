/**
 * @fileoverview Advanced Filtering Demo Page - 고급 필터링 패턴 데모
 */

import React, { useEffect, useCallback, useState, Fragment } from 'react';
import { createActionContext, ActionPayloadMap } from '@context-action/react';

// Types
interface ProcessActions extends ActionPayloadMap {
  processData: { userId: string; data: any; action?: string };
}

// Context setup
const {
  Provider: ProcessActionProvider,
  useActionDispatch: useProcessDispatch,
  useActionHandler: useProcessHandler,
  useActionRegister: useProcessRegister
} = createActionContext<ProcessActions>('DataProcess');

// Handler Registration Component
function HandlerRegistration() {
  const register = useProcessRegister();
  
  useEffect(() => {
    if (!register) return;

    // High priority security validation (blocking)
    const unregisterSecurity = register.register('processData', 
      async (payload: any, controller: any) => {
        console.log('🔐 Security validation for:', payload.userId);
        // Simulate validation logic
        if (!payload.userId) {
          controller.abort('Invalid user ID');
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async work
        return { security: 'validated', handlerId: 'security-check' };
      }, 
      { 
        id: 'security-check', 
        priority: 100, 
        blocking: true 
      }
    );

    // Medium priority analytics (non-blocking)
    const unregisterAnalytics = register.register('processData',
      async (payload: any, controller: any) => {
        console.log('📊 Analytics tracking for:', payload.userId);
        await new Promise(resolve => setTimeout(resolve, 30)); // Simulate async work
        return { analytics: 'tracked', handlerId: 'analytics' };
      },
      { 
        id: 'analytics', 
        priority: 80, 
        blocking: false 
      }
    );

    // Medium priority database save (blocking)
    const unregisterDatabase = register.register('processData',
      async (payload: any, controller: any) => {
        console.log('💾 Database save for:', payload.userId);
        await new Promise(resolve => setTimeout(resolve, 80)); // Simulate async work
        return { database: 'saved', handlerId: 'database-save' };
      },
      { 
        id: 'database-save', 
        priority: 60, 
        blocking: true 
      }
    );

    // Low priority notification (non-blocking)
    const unregisterNotification = register.register('processData',
      async (payload: any, controller: any) => {
        console.log('🔔 Notification sent for:', payload.userId);
        await new Promise(resolve => setTimeout(resolve, 40)); // Simulate async work
        return { notification: 'sent', handlerId: 'notification' };
      },
      { 
        id: 'notification', 
        priority: 40, 
        blocking: false 
      }
    );

    // Lowest priority audit log (non-blocking)
    const unregisterAudit = register.register('processData',
      async (payload: any, controller: any) => {
        console.log('📝 Audit log for:', payload.userId);
        await new Promise(resolve => setTimeout(resolve, 20)); // Simulate async work
        return { audit: 'logged', handlerId: 'audit-log' };
      },
      { 
        id: 'audit-log', 
        priority: 20, 
        blocking: false 
      }
    );

    // Cleanup function
    return () => {
      unregisterSecurity();
      unregisterAnalytics();
      unregisterDatabase();
      unregisterNotification();
      unregisterAudit();
    };
  }, [register]);

  return null;
}

// Results Display Component
interface ExecutionResult {
  results?: Record<string, any>;
  duration?: number;
  error?: string;
  executedHandlers?: string[];
}

// Fixed Execution Flow Visualization Component (Always visible at top)
function FixedExecutionFlowDisplay({ results }: { results: Record<string, ExecutionResult | null> }) {
  const handlers = [
    { id: 'security-check', label: '🔐 Security', priority: 100, blocking: true },
    { id: 'analytics', label: '📊 Analytics', priority: 80, blocking: false },
    { id: 'database-save', label: '💾 Database', priority: 60, blocking: true },
    { id: 'notification', label: '🔔 Notification', priority: 40, blocking: false },
    { id: 'audit-log', label: '📝 Audit', priority: 20, blocking: false }
  ];

  // Get all execution results to show cumulative state
  const allResults = Object.values(results).filter(r => r !== null);
  const latestResult = allResults[allResults.length - 1];
  
  // Extract executed handler IDs from all results (improved logic)
  const executedHandlerIds = new Set<string>();
  
  allResults.forEach(result => {
    if (result?.results) {
      // Direct handler ID matching - this is the most reliable method
      Object.keys(result.results).forEach(key => {
        const handler = handlers.find(h => h.id === key);
        if (handler) {
          executedHandlerIds.add(handler.id);
        }
      });
      
      // Alternative matching for different result key formats
      handlers.forEach(handler => {
        const resultKeys = Object.keys(result.results || {});
        
        // Check various possible key formats
        const possibleKeys = [
          handler.id,                           // 'security-check'
          handler.id.replace('-', ''),          // 'securitycheck'
          handler.label.split(' ')[1]?.toLowerCase(),  // 'security'
          handler.label.split(' ')[0]          // '🔐'
        ].filter(Boolean);
        
        if (possibleKeys.some(key => resultKeys.includes(key))) {
          executedHandlerIds.add(handler.id);
        }
        
        // Check if any result contains expected handler response patterns
        Object.values(result.results || {}).forEach(resultValue => {
          if (typeof resultValue === 'object' && resultValue !== null) {
            const resultObj = resultValue as Record<string, any>;
            
            // Pattern matching for specific handlers
            if (handler.id === 'security-check' && resultObj.security) {
              executedHandlerIds.add('security-check');
            } else if (handler.id === 'analytics' && resultObj.analytics) {
              executedHandlerIds.add('analytics');
            } else if (handler.id === 'database-save' && resultObj.database) {
              executedHandlerIds.add('database-save');
            } else if (handler.id === 'notification' && resultObj.notification) {
              executedHandlerIds.add('notification');
            } else if (handler.id === 'audit-log' && resultObj.audit) {
              executedHandlerIds.add('audit-log');
            }
          }
        });
      });
    }
  });

  return (
    <div className="sticky top-4 z-10 bg-white rounded-xl border border-gray-300 shadow-lg p-6 mb-6">
      <div className="mb-6">
        {/* Title */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center">
            <span className="mr-3 text-2xl">🎭</span>
            Handler Execution Flow
            <span className="ml-3 text-2xl">🎭</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Real-time visualization of handler execution states
          </p>
        </div>
        
        {/* Statistics */}
        {Object.keys(results).length > 0 && (
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-300">
              ✅ {executedHandlerIds.size} Executed
            </div>
            <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-semibold border border-gray-300">
              ⏸️ {handlers.length - executedHandlerIds.size} Skipped
            </div>
            {latestResult?.duration && (
              <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold border border-blue-300">
                ⚡ {latestResult.duration}ms Total
              </div>
            )}
            <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold border border-purple-300">
              📊 {Object.keys(results).length} Demos Run
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-center space-x-3 overflow-x-auto pb-2">
        {handlers.map((handler, index) => {
          const isExecuted = executedHandlerIds.has(handler.id);
          const isBlocking = handler.blocking;
          
          return (
            <Fragment key={handler.id}>
              <div
                className={`relative flex flex-col items-center p-5 rounded-2xl border-3 transition-all duration-500 min-w-[110px] max-w-[110px] ${
                  isExecuted 
                    ? 'bg-gradient-to-b from-green-50 to-green-100 border-green-500 shadow-xl transform scale-110 ring-2 ring-green-300' 
                    : 'bg-gradient-to-b from-gray-50 to-gray-100 border-gray-300 opacity-60 hover:opacity-80'
                }`}
              >
                {/* Handler Icon */}
                <div className={`text-4xl mb-3 transition-all duration-500 ${isExecuted ? 'animate-bounce scale-125 drop-shadow-lg' : 'scale-90 grayscale'}`}>
                  {handler.label.split(' ')[0]}
                </div>
                
                {/* Handler Name */}
                <div className={`text-sm font-semibold text-center ${
                  isExecuted ? 'text-green-800' : 'text-gray-600'
                }`}>
                  {handler.label.split(' ')[1]}
                </div>
                
                {/* Priority */}
                <div className={`text-xs mt-2 px-2 py-1 rounded-full font-mono font-semibold ${isExecuted ? 'bg-green-200 text-green-800 border border-green-400' : 'bg-gray-200 text-gray-600'}`}>
                  P{handler.priority}
                </div>

                {/* Blocking Indicator */}
                {isBlocking && (
                  <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold shadow-lg border border-yellow-500 animate-pulse">
                    ⚡BLOCK
                  </div>
                )}

                {/* Execution Success Indicator */}
                {isExecuted && (
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg animate-pulse border border-green-400">
                    ✓ EXECUTED
                  </div>
                )}

                {/* Handler Status */}
                <div className="absolute top-2 left-2 w-3 h-3 rounded-full ${isExecuted ? 'bg-green-500 animate-ping' : 'bg-gray-400'}"></div>
                
                <div className={`mt-4 text-xs font-semibold text-center ${
                  isExecuted ? 'text-green-700' : 'text-gray-500'
                }`}>
                  {isExecuted ? '✅ DONE' : '⏳ WAIT'}
                </div>
              </div>
              
              {/* Connection Line */}
              {index < handlers.length - 1 && (
                <div className="flex flex-col items-center justify-center mx-2">
                  <div className={`text-3xl transition-all duration-500 ${
                    isExecuted 
                      ? 'text-green-500 animate-pulse transform scale-125 drop-shadow-lg' 
                      : 'text-gray-300'
                  }`}>
                    →
                  </div>
                  <div className={`w-16 h-1 mt-1 rounded-full transition-all duration-500 ${
                    isExecuted 
                      ? 'bg-green-400 shadow-lg' 
                      : 'bg-gray-300'
                  }`}></div>
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Overall Status */}
      <div className="mt-6 text-center">
        {executedHandlerIds.size === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700 text-sm font-medium flex items-center justify-center">
              <span className="mr-2 text-lg">🎯</span>
              Ready to execute! Click any demo button below to see the handler flow in action.
              <span className="ml-2 text-lg">🚀</span>
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 text-sm font-semibold mb-1">
              🎉 Execution Complete!
            </div>
            <p className="text-green-700 text-xs">
              Last execution processed {executedHandlerIds.size} of {handlers.length} handlers in {latestResult?.duration}ms
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Handler Execution Summary Component
function HandlerSummary({ results }: { results: Record<string, ExecutionResult | null> }) {
  const totalExecutions = Object.keys(results).filter(k => results[k] !== null).length;
  const successfulExecutions = Object.keys(results).filter(k => results[k] && !results[k].error).length;
  const failedExecutions = totalExecutions - successfulExecutions;
  const averageTime = totalExecutions > 0 
    ? Math.round(Object.values(results)
        .filter(r => r?.duration)
        .reduce((sum, r) => sum + (r?.duration || 0), 0) / totalExecutions)
    : 0;

  if (totalExecutions === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6 text-center">
        <div className="text-gray-400 text-4xl mb-2">🎭</div>
        <h3 className="font-semibold text-gray-700 mb-2">No executions yet</h3>
        <p className="text-gray-500 text-sm">Click any demo button below to see filtering in action!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">📊</span>
        Execution Summary
        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          {totalExecutions} test{totalExecutions !== 1 ? 's' : ''} completed
        </span>
      </h3>
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{totalExecutions}</div>
          <div className="text-xs text-blue-800 font-medium">Total</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="text-2xl font-bold text-green-600">{successfulExecutions}</div>
          <div className="text-xs text-green-800 font-medium">Success</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <div className="text-2xl font-bold text-red-600">{failedExecutions}</div>
          <div className="text-xs text-red-800 font-medium">Failed</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{averageTime}ms</div>
          <div className="text-xs text-purple-800 font-medium">Avg. Time</div>
        </div>
      </div>
    </div>
  );
}

interface FilterOptions {
  handlerIds?: string[];
  excludeHandlerIds?: string[];
  priority?: { min?: number; max?: number };
  custom?: (config: any) => boolean;
}

function ResultsDisplay({ 
  result, 
  title, 
  filterOptions 
}: { 
  result: ExecutionResult | null; 
  title: string;
  filterOptions?: FilterOptions;
}) {
  if (!result) return null;

  // Generate filter description
  const getFilterDescription = () => {
    if (!filterOptions) return 'No filters applied - all handlers executed';
    
    const descriptions: string[] = [];
    
    if (filterOptions.handlerIds && filterOptions.handlerIds.length > 0) {
      descriptions.push(`🎯 Only handlers: ${filterOptions.handlerIds.join(', ')}`);
    }
    
    if (filterOptions.excludeHandlerIds && filterOptions.excludeHandlerIds.length > 0) {
      descriptions.push(`❌ Exclude handlers: ${filterOptions.excludeHandlerIds.join(', ')}`);
    }
    
    if (filterOptions.priority) {
      if (filterOptions.priority.min && filterOptions.priority.max) {
        descriptions.push(`📊 Priority range: ${filterOptions.priority.min}-${filterOptions.priority.max}`);
      } else if (filterOptions.priority.min) {
        descriptions.push(`📈 Priority >= ${filterOptions.priority.min}`);
      } else if (filterOptions.priority.max) {
        descriptions.push(`📉 Priority <= ${filterOptions.priority.max}`);
      }
    }
    
    if (filterOptions.custom) {
      descriptions.push(`⚙️ Custom logic: ${filterOptions.custom.toString().includes('blocking') ? 'blocking-based filter' : 'custom filter'}`);
    }
    
    return descriptions.length > 0 
      ? descriptions.join(' • ') 
      : 'No specific filters applied';
  };

  // Generate filter code for code example
  const generateFilterCode = () => {
    if (!filterOptions) {
      return <div className="text-gray-400 ml-4">// No filter applied</div>;
    }

    return (
      <div className="text-white ml-4">
        filter: {`{`}
        {filterOptions.handlerIds && (
          <div className="ml-4 text-cyan-300">
            handlerIds: [{filterOptions.handlerIds.map(id => `'${id}'`).join(', ')}],
          </div>
        )}
        {filterOptions.excludeHandlerIds && (
          <div className="ml-4 text-red-300">
            excludeHandlerIds: [{filterOptions.excludeHandlerIds.map(id => `'${id}'`).join(', ')}],
          </div>
        )}
        {filterOptions.priority && (
          <div className="ml-4 text-yellow-300">
            priority: {`{`}
            {filterOptions.priority.min && ` min: ${filterOptions.priority.min}`}
            {filterOptions.priority.max && `, max: ${filterOptions.priority.max}`}
            {` }`},
          </div>
        )}
        {filterOptions.custom && (
          <div className="ml-4 text-purple-300">
            custom: (config) =&gt; config.blocking === {filterOptions.custom.toString().includes('false') ? 'false' : 'true'}
          </div>
        )}
        <div className="text-white">{`}`}</div>
      </div>
    );
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">{title}</h4>
          {result.duration && (
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
              ⏱️ {result.duration}ms
            </span>
          )}
        </div>
        
        {/* Filter Options Display */}
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <span className="font-semibold">🔍 Filter Applied:</span>
          </div>
          <div className="text-sm text-blue-700 mt-1">
            {getFilterDescription()}
          </div>
        </div>
        
        {result.error ? (
          <div className="text-red-600 text-sm flex items-center p-3 bg-red-50 rounded-lg border border-red-200">
            <span className="mr-2">❌</span>
            <span>Error: {result.error}</span>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Results Summary */}
            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center text-green-600">
                <span className="mr-1">✅</span>
                {Object.keys(result.results || {}).length} handlers executed
              </span>
              <span className="flex items-center text-blue-600">
                <span className="mr-1">⚡</span>
                {result.duration}ms total
              </span>
            </div>
            
            {/* Code Example (Collapsible) */}
            <div className="text-sm">
              <details className="group border border-gray-200 rounded-md">
                <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900 p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="mr-2">💻</span>
                    Implementation Example (Click to expand)
                  </span>
                  <span className="group-open:rotate-90 transition-transform">▶</span>
                </summary>
                <div className="p-3 bg-white border-t border-gray-200">
                  <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-xs overflow-auto max-h-60">
                    <div className="text-yellow-400 mb-2">// Implementation Code</div>
                    <div className="text-blue-300">const result = await dispatch('processData', payload, {`{`}</div>
                    <div className="text-white ml-4">result: {`{`} collect: true, strategy: 'all' {`}`},</div>
                    {generateFilterCode()}
                    <div className="text-blue-300">{`});`}</div>
                    <div className="mt-3 text-yellow-400">// Execution Results</div>
                    {Object.entries(result.results || {}).map(([handlerId, handlerResult]) => (
                      <div key={handlerId} className="text-green-300">
                        <span className="text-cyan-400">{handlerId}:</span> {JSON.stringify(handlerResult)}
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Demo Component
function FilteringDemoComponent() {
  const dispatch = useProcessDispatch();
  const [results, setResults] = useState<Record<string, ExecutionResult | null>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const executeWithResult = useCallback(async (
    key: string, 
    title: string, 
    payload: any, 
    options: any = {}
  ) => {
    setIsLoading(prev => ({ ...prev, [key]: true }));
    setResults(prev => ({ ...prev, [key]: null }));
    
    const startTime = performance.now();
    
    try {
      const result = await dispatch('processData', payload, {
        result: { collect: true, strategy: 'all' },
        ...options
      });
      
      const duration = Math.round(performance.now() - startTime);
      
      setResults(prev => ({
        ...prev,
        [key]: {
          results: (result as any)?.results || result,
          duration
        }
      }));
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      setResults(prev => ({
        ...prev,
        [key]: {
          error: error instanceof Error ? error.message : String(error),
          duration
        }
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, [key]: false }));
    }
  }, [dispatch]);

  const filteringDemos = [
    {
      key: 'no-filter',
      title: '🔄 No Filter (All Handlers)',
      description: 'Execute all registered handlers without any filtering',
      filterOptions: undefined,
      action: () => executeWithResult(
        'no-filter',
        'All Handlers Execution',
        { userId: 'user-123', data: { action: 'all-handlers' } }
      )
    },
    {
      key: 'handler-ids',
      title: '🎯 Handler ID Filtering',
      description: 'Execute only security and database handlers',
      filterOptions: { handlerIds: ['security-check', 'database-save'] },
      action: () => executeWithResult(
        'handler-ids',
        'Handler ID Filtering',
        { userId: 'user-456', data: { action: 'critical' } },
        {
          filter: {
            handlerIds: ['security-check', 'database-save']
          }
        }
      )
    },
    {
      key: 'priority-range',
      title: '📊 Priority Range Filtering',
      description: 'Execute handlers with priority between 50-90',
      filterOptions: { priority: { min: 50, max: 90 } },
      action: () => executeWithResult(
        'priority-range',
        'Priority Range Filtering',
        { userId: 'user-789', data: { action: 'medium-priority' } },
        {
          filter: {
            priority: { min: 50, max: 90 }
          }
        }
      )
    },
    {
      key: 'high-priority',
      title: '⚡ High Priority Only',
      description: 'Execute only high-priority handlers (>=80)',
      filterOptions: { priority: { min: 80 } },
      action: () => executeWithResult(
        'high-priority',
        'High Priority Filtering',
        { userId: 'user-321', data: { action: 'urgent' } },
        {
          filter: {
            priority: { min: 80 }
          }
        }
      )
    },
    {
      key: 'custom-blocking',
      title: '🚧 Custom Filter (Blocking Only)',
      description: 'Execute only blocking handlers using custom filter',
      filterOptions: { custom: (config: any) => config.blocking === true },
      action: () => executeWithResult(
        'custom-blocking',
        'Custom Blocking Filter',
        { userId: 'user-654', data: { action: 'blocking-only' } },
        {
          filter: {
            custom: (config: any) => config.blocking === true
          }
        }
      )
    },
    {
      key: 'custom-non-blocking',
      title: '🌊 Custom Filter (Non-blocking + High Priority)',
      description: 'Execute high-priority, non-blocking handlers only',
      filterOptions: { custom: (config: any) => config.priority >= 70 && config.blocking === false },
      action: () => executeWithResult(
        'custom-non-blocking',
        'Custom Non-blocking Filter',
        { userId: 'user-987', data: { action: 'non-blocking-priority' } },
        {
          filter: {
            custom: (config: any) => config.priority >= 70 && config.blocking === false
          }
        }
      )
    },
    {
      key: 'combined',
      title: '🔗 Combined Filtering',
      description: 'Priority >= 50 + Exclude analytics + Only non-blocking',
      filterOptions: { 
        priority: { min: 50 }, 
        excludeHandlerIds: ['analytics'], 
        custom: (config: any) => config.blocking === false 
      },
      action: () => executeWithResult(
        'combined',
        'Combined Filtering',
        { userId: 'user-111', data: { action: 'combined' } },
        {
          filter: {
            priority: { min: 50 },
            excludeHandlerIds: ['analytics'],
            custom: (config: any) => config.blocking === false
          }
        }
      )
    },
    {
      key: 'exclude',
      title: '❌ Exclude Filtering',
      description: 'Run all handlers except analytics and audit',
      filterOptions: { excludeHandlerIds: ['analytics', 'audit-log'] },
      action: () => executeWithResult(
        'exclude',
        'Exclude Filtering',
        { userId: 'user-555', data: { action: 'no-tracking' } },
        {
          filter: {
            excludeHandlerIds: ['analytics', 'audit-log']
          }
        }
      )
    }
  ];

  // Clear all results handler
  const clearAllResults = useCallback(() => {
    setResults({});
  }, []);

  return (
    <div className="space-y-8">
      {/* Fixed Execution Flow Visualization at Top */}
      <FixedExecutionFlowDisplay results={results} />

      {/* Summary Dashboard with Clear Button */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-grow">
          <HandlerSummary results={results} />
        </div>
        {Object.keys(results).length > 0 && (
          <button
            onClick={clearAllResults}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 mt-4"
          >
            <span>🗑️</span>
            <span>Clear All Results</span>
          </button>
        )}
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">📋 Registered Handlers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-blue-800">
              <strong>🔐 security-check</strong> (Priority: 100, Blocking)
            </div>
            <div className="text-blue-800">
              <strong>📊 analytics</strong> (Priority: 80, Non-blocking)
            </div>
            <div className="text-blue-800">
              <strong>💾 database-save</strong> (Priority: 60, Blocking)
            </div>
          </div>
          <div>
            <div className="text-blue-800">
              <strong>🔔 notification</strong> (Priority: 40, Non-blocking)
            </div>
            <div className="text-blue-800">
              <strong>📝 audit-log</strong> (Priority: 20, Non-blocking)
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-blue-700">
          💡 Check the browser console to see detailed handler execution logs
        </div>
      </div>

      {/* Demo Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteringDemos.map((demo) => (
          <div key={demo.key} className="bg-white border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{demo.title}</h3>
                <p className="text-sm text-gray-600">{demo.description}</p>
              </div>
            </div>
            
            <button
              onClick={demo.action}
              disabled={isLoading[demo.key]}
              className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                isLoading[demo.key]
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading[demo.key] ? '🔄 Executing...' : 'Execute Demo'}
            </button>

            <ResultsDisplay 
              result={results[demo.key]} 
              title={demo.title}
              filterOptions={demo.filterOptions}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Page Component
export default function AdvancedFilteringPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="page-header">
        <h1>🎛️ Advanced Filtering Demo</h1>
        <p className="page-description">
          Context-Action 프레임워크의 고급 필터링 패턴을 실제로 체험해보세요.
          다양한 필터링 전략을 통해 정확한 핸들러 실행 제어를 경험할 수 있습니다.
        </p>
        <div className="flex items-center gap-4 mt-4">
          <a
            href="/actionguard"
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            ← ActionGuard 목록으로
          </a>
          <a
            href="https://github.com/mineclover/context-action/blob/main/docs/en/guide/patterns/action/advanced-filtering.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            📖 Documentation
          </a>
        </div>
      </header>

      {/* Demo Content */}
      <ProcessActionProvider>
        <HandlerRegistration />
        <FilteringDemoComponent />
      </ProcessActionProvider>

      {/* Additional Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-green-900 mb-3">🎯 Filtering Strategies</h3>
        <div className="text-sm text-green-800 space-y-2">
          <div><strong>Handler ID Filtering:</strong> Execute specific handlers by their unique identifiers</div>
          <div><strong>Priority Range Filtering:</strong> Filter handlers based on priority thresholds</div>
          <div><strong>Custom Logic Filtering:</strong> Apply complex conditional logic for handler selection</div>
          <div><strong>Combined Filtering:</strong> Use multiple filter types for precise control</div>
          <div><strong>Exclude Filtering:</strong> Skip specific handlers while running others</div>
        </div>
      </div>
    </div>
  );
}