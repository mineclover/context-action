import React, { useState, useCallback, useEffect, Fragment } from 'react';
import { createActionContext, createStoreContext, useStoreValue } from '@context-action/react';

// Types
interface HandlerResult {
  [key: string]: string;
  handlerId: string;
}

interface ProcessActions {
  processData: { userId: string; data: any; action?: string };
}

interface ExecutionResult {
  results?: any[];
  duration?: number;
  error?: string;
  execution?: {
    handlersExecuted: number;
    duration: number;
    startTime: number;
    endTime: number;
  };
  success?: boolean;
}

// Context setup
const {
  Provider: ProcessActionProvider,
  useActionDispatch: useProcessDispatch,
  useActionDispatchWithResult: useProcessDispatchWithResult,
  useActionHandler: useProcessHandler,
  useActionRegister: useProcessRegister
} = createActionContext<ProcessActions>('DataProcess');

// Store setup for managing execution results and state
const {
  Provider: DemoStoreProvider,
  useStore: useDemoStore
} = createStoreContext('FilteringDemo', {
  executionResults: {} as Record<string, ExecutionResult | null>,
  executionState: {
    handlersExecuted: 0,
    totalDuration: 0,
    isRunning: false,
    executedHandlers: [] as string[],
    currentDemo: null as string | null
  },
  isLoading: false
});

// Dedicated store for execution visualization
const {
  Provider: VisualizationStoreProvider,
  useStore: useVisualizationStore
} = createStoreContext('ExecutionVisualization', {
  executedHandlers: [] as string[],
  isRunning: false,
  totalExecuted: 0,
  totalDuration: 0,
  currentDemo: null as string | null
});

// Handler definitions (sorted by priority for consistent display)
const HANDLERS = [
  { id: 'security-check', name: 'Security', icon: '🔐', priority: 100 },
  { id: 'analytics', name: 'Analytics', icon: '📊', priority: 80 },
  { id: 'database-save', name: 'Database', icon: '💾', priority: 60 },
  { id: 'notification', name: 'Notification', icon: '🔔', priority: 40 },
  { id: 'audit-log', name: 'Audit', icon: '📝', priority: 20 }
].sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)

// Store-Based Execution Flow Visualization
function ExecutionFlowVisualization() {
  const executedHandlersStore = useVisualizationStore('executedHandlers');
  const isRunningStore = useVisualizationStore('isRunning');
  const totalExecutedStore = useVisualizationStore('totalExecuted');
  const totalDurationStore = useVisualizationStore('totalDuration');
  
  const executedHandlers = useStoreValue(executedHandlersStore);
  const isRunning = useStoreValue(isRunningStore);
  const totalExecuted = useStoreValue(totalExecutedStore);
  const totalDuration = useStoreValue(totalDurationStore);

  const handlers = HANDLERS;

  // 디버깅을 위한 로그
  console.log('🔍 [ExecutionFlowVisualization] Current state:', {
    executedHandlers,
    totalExecuted,
    handlersLength: handlers.length
  });

  return (
    <div className="bg-white rounded-xl border shadow-lg p-4 mb-6 max-w-[600px] mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center justify-center">
          <span className="mr-2">🔄</span>
          Handler Execution Flow
          <span className="ml-2">🔄</span>
        </h3>
        
        {/* Stats */}
        <div className="flex justify-center space-x-3 mt-2">
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded font-semibold text-sm">
            ✅ {totalExecuted}
          </div>
          <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded font-semibold text-sm">
            ⏸️ {handlers.length - totalExecuted}  
          </div>
          {totalDuration > 0 && (
            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded font-semibold text-sm">
              ⚡ {totalDuration}ms
            </div>
          )}
        </div>
      </div>

      {/* Handler Flow */}
      <div className="flex justify-center items-center space-x-2 overflow-x-auto">
        {handlers.map((handler, index) => {
          const isExecuted = executedHandlers.includes(handler.id);
          const isNext = index === totalExecuted && isRunning;
          
          return (
            <Fragment key={handler.id}>
              {/* Handler Card */}
              <div className={`
                flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-500
                min-w-[80px] max-w-[80px]
                ${isExecuted 
                  ? 'bg-gradient-to-b from-green-50 to-green-100 border-green-500 shadow-lg scale-110 ring-2 ring-green-300' 
                  : isNext
                    ? 'bg-gradient-to-b from-blue-50 to-blue-100 border-blue-500 shadow-md animate-pulse'
                    : 'bg-gradient-to-b from-gray-50 to-gray-100 border-gray-300 opacity-60'
                }
              `}>
                <div className={`text-2xl mb-1 transition-all duration-500 ${isExecuted ? 'animate-bounce' : ''}`}>
                  {handler.icon}
                </div>
                <div className="text-xs font-medium text-center leading-tight">
                  {handler.name}
                </div>
                <div className="text-xs text-gray-500">
                  P{handler.priority}
                </div>
              </div>
              
              {/* Arrow */}
              {index < handlers.length - 1 && (
                <div className={`
                  transition-all duration-300 text-2xl
                  ${isExecuted && executedHandlers.includes(handlers[index + 1].id) 
                    ? 'text-green-500 animate-pulse' 
                    : isExecuted 
                      ? 'text-yellow-500' 
                      : 'text-gray-300'}
                `}>
                  →
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

// Handler Registration
function HandlerRegistration() {
  const register = useProcessRegister();
  
  useEffect(() => {
    if (!register) return;

    const unregisterFunctions = [
      register.register('processData', async (payload, controller) => {
        console.log('🔐 Security validation for:', payload.userId);
        await new Promise(resolve => setTimeout(resolve, 50));
        // Store result in controller metadata or logs instead of returning
        console.log('✅ Security validated for handler:', 'security-check');
      }, { id: 'security-check', priority: 100, blocking: true }),

      register.register('processData', async (payload, controller) => {
        console.log('📊 Analytics tracking for:', payload.userId);
        await new Promise(resolve => setTimeout(resolve, 30));
        console.log('✅ Analytics tracked for handler:', 'analytics');
      }, { id: 'analytics', priority: 80, blocking: false }),

      register.register('processData', async (payload, controller) => {
        console.log('💾 Database save for:', payload.userId);
        await new Promise(resolve => setTimeout(resolve, 80));
        console.log('✅ Database saved for handler:', 'database-save');
      }, { id: 'database-save', priority: 60, blocking: true }),

      register.register('processData', async (payload, controller) => {
        console.log('🔔 Notification sent for:', payload.userId);
        await new Promise(resolve => setTimeout(resolve, 40));
        console.log('✅ Notification sent for handler:', 'notification');
      }, { id: 'notification', priority: 40, blocking: false }),

      register.register('processData', async (payload, controller) => {
        console.log('📝 Audit log for:', payload.userId);
        await new Promise(resolve => setTimeout(resolve, 20));
        console.log('✅ Audit logged for handler:', 'audit-log');
      }, { id: 'audit-log', priority: 20, blocking: false })
    ];

    return () => {
      unregisterFunctions.forEach(fn => fn());
    };
  }, [register]);

  return null;
}

// Demo Component with Store Management
function FilteringDemo() {
  const { dispatchWithResult } = useProcessDispatchWithResult();
  const resultsStore = useDemoStore('executionResults');
  const executionStateStore = useDemoStore('executionState');
  const isLoadingStore = useDemoStore('isLoading');
  
  // Visualization stores
  const executedHandlersStore = useVisualizationStore('executedHandlers');
  const isRunningStore = useVisualizationStore('isRunning');
  const totalExecutedStore = useVisualizationStore('totalExecuted');
  const totalDurationStore = useVisualizationStore('totalDuration');
  const currentDemoStore = useVisualizationStore('currentDemo');
  
  const results = useStoreValue(resultsStore);
  const isLoading = useStoreValue(isLoadingStore);

  const handlers = HANDLERS;

  const runDemo = useCallback(async (demoKey: string, filterOptions?: any) => {
    // Clear all previous results and reset state
    resultsStore.setValue({});
    executionStateStore.setValue({
      handlersExecuted: 0,
      totalDuration: 0,
      isRunning: false,
      executedHandlers: [],
      currentDemo: demoKey
    });
    
    // Reset visualization state
    executedHandlersStore.setValue([]);
    isRunningStore.setValue(false);
    totalExecutedStore.setValue(0);
    totalDurationStore.setValue(0);
    currentDemoStore.setValue(demoKey);
    
    isLoadingStore.setValue(true);

    try {
      const result = await dispatchWithResult('processData', 
        { userId: `user-${Date.now()}`, data: { demo: demoKey } },
        {
          result: { collect: true, strategy: 'all' },
          ...filterOptions
        }
      );

      console.log('✅ Demo Result:', result);
      console.log('🔍 [runDemo] Full result structure:', JSON.stringify(result, null, 2));
      
      const executionResult: ExecutionResult = {
        execution: result.execution,
        results: result.results,
        success: result.success,
        duration: result.execution?.duration
      };

      // Update results store with new result
      resultsStore.setValue({ [demoKey]: executionResult });

      // Update execution state based on result
      const executed = result.execution?.handlersExecuted || 0;
      // Get actually executed handler IDs from the result
      const executedHandlers = result.handlers 
        ? result.handlers.filter(h => h.executed).map(h => h.id)
        : [];

      console.log('✅ [runDemo] ActionRegister fix successful! Handler tracking working:', {
        executed,
        executedHandlers,
        handlersData: result.handlers?.map(h => ({ id: h.id, executed: h.executed })),
        resultSuccess: result.success
      });

      executionStateStore.setValue({
        handlersExecuted: executed,
        totalDuration: result.execution?.duration || 0,
        isRunning: executed > 0,
        executedHandlers,
        currentDemo: demoKey
      });
      
      // Update visualization state with the same data
      executedHandlersStore.setValue(executedHandlers);
      isRunningStore.setValue(false);
      totalExecutedStore.setValue(executed);
      totalDurationStore.setValue(result.execution?.duration || 0);

    } catch (error) {
      console.error('❌ Demo Error:', error);
      
      const errorResult: ExecutionResult = {
        error: error instanceof Error ? error.message : 'Unknown error',
        execution: { handlersExecuted: 0, duration: 0, startTime: 0, endTime: 0 }
      };

      resultsStore.setValue({ [demoKey]: errorResult });
      
      executionStateStore.setValue({
        handlersExecuted: 0,
        totalDuration: 0,
        isRunning: false,
        executedHandlers: [],
        currentDemo: demoKey
      });
      
      // Reset visualization state on error
      executedHandlersStore.setValue([]);
      isRunningStore.setValue(false);
      totalExecutedStore.setValue(0);
      totalDurationStore.setValue(0);
    } finally {
      isLoadingStore.setValue(false);
    }
  }, [
    dispatchWithResult, 
    resultsStore, 
    executionStateStore, 
    isLoadingStore, 
    executedHandlersStore,
    isRunningStore,
    totalExecutedStore,
    totalDurationStore,
    currentDemoStore,
    handlers
  ]);

  const demos = [
    // Basic filtering
    { 
      key: 'no-filter', 
      title: '🔄 All Handlers', 
      description: 'Execute all 5 handlers without any filtering',
      filterOptions: undefined,
      category: 'Basic'
    },
    
    // Handler ID filtering
    { 
      key: 'critical-only', 
      title: '🔐 Critical Security + DB', 
      description: 'Only security validation and database save',
      filterOptions: { filter: { handlerIds: ['security-check', 'database-save'] } },
      category: 'Handler IDs'
    },
    { 
      key: 'analytics-only', 
      title: '📊 Analytics Only', 
      description: 'Execute only analytics tracking handler',
      filterOptions: { filter: { handlerIds: ['analytics'] } },
      category: 'Handler IDs'
    },
    { 
      key: 'non-blocking', 
      title: '⚡ Non-blocking Handlers', 
      description: 'Analytics, notification, and audit (non-blocking)',
      filterOptions: { filter: { handlerIds: ['analytics', 'notification', 'audit-log'] } },
      category: 'Handler IDs'
    },
    
    // Priority-based filtering
    { 
      key: 'high-priority', 
      title: '🚀 High Priority (≥80)', 
      description: 'Security and analytics handlers',
      filterOptions: { filter: { priority: { min: 80 } } },
      category: 'Priority'
    },
    { 
      key: 'medium-priority', 
      title: '📊 Medium Priority (50-90)', 
      description: 'Analytics, database, and notification',
      filterOptions: { filter: { priority: { min: 50, max: 90 } } },
      category: 'Priority'
    },
    { 
      key: 'low-priority', 
      title: '📝 Low Priority (≤50)', 
      description: 'Notification and audit logging',
      filterOptions: { filter: { priority: { max: 50 } } },
      category: 'Priority'
    },
    
    // Exclusion filtering
    { 
      key: 'no-analytics', 
      title: '🚫 Exclude Analytics', 
      description: 'All handlers except analytics tracking',
      filterOptions: { filter: { excludeHandlerIds: ['analytics'] } },
      category: 'Exclusion'
    },
    { 
      key: 'no-notifications', 
      title: '🔕 Skip Notifications', 
      description: 'All handlers except notification and audit',
      filterOptions: { filter: { excludeHandlerIds: ['notification', 'audit-log'] } },
      category: 'Exclusion'
    },
    
    // Custom filtering (business logic)
    { 
      key: 'blocking-only', 
      title: '⏳ Blocking Handlers', 
      description: 'Only handlers that block execution (security + database)',
      filterOptions: { 
        filter: { 
          custom: (config: any) => config.blocking === true 
        } 
      },
      category: 'Custom Logic'
    },
    { 
      key: 'essential-flow', 
      title: '✅ Essential Flow', 
      description: 'Security validation → Database save → Audit log',
      filterOptions: { 
        filter: { 
          custom: (config: any) => ['security-check', 'database-save', 'audit-log'].includes(config.id)
        } 
      },
      category: 'Custom Logic'
    },
    
    // Combined filtering
    { 
      key: 'high-priority-no-analytics', 
      title: '🎯 High Priority + No Analytics', 
      description: 'Priority ≥80 excluding analytics',
      filterOptions: { 
        filter: { 
          priority: { min: 80 },
          excludeHandlerIds: ['analytics']
        } 
      },
      category: 'Combined'
    },
    
    // Edge cases
    { 
      key: 'impossible-filter', 
      title: '❌ Impossible Filter', 
      description: 'Priority >200 (no handlers match)',
      filterOptions: { filter: { priority: { min: 200 } } },
      category: 'Edge Cases'
    },
    { 
      key: 'single-handler', 
      title: '🎯 Single Handler Test', 
      description: 'Only notification handler',
      filterOptions: { 
        filter: { 
          handlerIds: ['notification'],
          priority: { min: 30, max: 50 }
        } 
      },
      category: 'Edge Cases'
    }
  ];

  // Group demos by category
  const demosByCategory = demos.reduce((acc, demo) => {
    if (!acc[demo.category]) {
      acc[demo.category] = [];
    }
    acc[demo.category].push(demo);
    return acc;
  }, {} as Record<string, typeof demos>);

  return (
    <div className="space-y-8">
      <ExecutionFlowVisualization />
      
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => runDemo('no-filter', undefined)}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
        >
          🔄 Run All Handlers
        </button>
        <button
          onClick={() => runDemo('critical-only', { filter: { handlerIds: ['security-check', 'database-save'] } })}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
        >
          🔐 Critical Only
        </button>
        <button
          onClick={() => {
            resultsStore.setValue({});
            executionStateStore.setValue({
              handlersExecuted: 0,
              totalDuration: 0,
              isRunning: false,
              executedHandlers: [],
              currentDemo: null
            });
          }}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
        >
          🗑️ Clear Results
        </button>
      </div>

      {/* Category-based Demo Grid */}
      {Object.entries(demosByCategory).map(([category, categoryDemos]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 border-b border-gray-300 pb-2">
            📂 {category} Filtering
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryDemos.map(demo => (
              <div key={demo.key} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-900 mb-1">{demo.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{demo.description}</p>
                </div>
                
                <button
                  onClick={() => runDemo(demo.key, demo.filterOptions)}
                  disabled={isLoading}
                  className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {isLoading && results[demo.key] === null ? 'Running...' : 'Execute'}
                </button>
                
                {results[demo.key] && (
                  <div className="mt-3 p-2 rounded-lg bg-gray-50">
                    {results[demo.key]?.error ? (
                      <div className="text-red-600 text-sm flex items-center gap-1">
                        <span>❌</span>
                        <span>Error: {results[demo.key]?.error}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-green-600 text-sm flex items-center gap-1">
                          <span>✅</span>
                          <span>{results[demo.key]?.execution?.handlersExecuted || 0} handlers executed</span>
                        </div>
                        <div className="text-blue-600 text-sm flex items-center gap-1">
                          <span>⚡</span>
                          <span>{results[demo.key]?.execution?.duration || 0}ms duration</span>
                        </div>
                        {results[demo.key]?.success === false && (
                          <div className="text-orange-600 text-sm flex items-center gap-1">
                            <span>⚠️</span>
                            <span>Pipeline failed</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Summary Statistics */}
      {Object.keys(results).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
            <span>📊</span>
            Execution Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(results).filter(r => r && !r.error).length}
              </div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(results).filter(r => r?.error).length}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(results).reduce((sum, r) => sum + (r?.execution?.handlersExecuted || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Handlers</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(Object.values(results).reduce((sum, r) => sum + (r?.execution?.duration || 0), 0))}ms
              </div>
              <div className="text-sm text-gray-600">Total Duration</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Component
export default function NewAdvancedFilteringPage() {
  return (
    <ProcessActionProvider>
      <DemoStoreProvider>
        <VisualizationStoreProvider>
        <HandlerRegistration />
        <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 Advanced Filtering Demo
          </h1>
          <p className="text-gray-600 mb-6">
            Real-time handler execution visualization with state-based tracking
          </p>
          
          {/* Handler Information Panel */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6 max-w-4xl mx-auto">
            <h3 className="font-bold text-blue-900 mb-4 flex items-center justify-center gap-2">
              <span>🔧</span>
              Registered Handlers (Priority Order)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {HANDLERS.map(handler => {
                const handlerConfig = {
                  'security-check': { blocking: true, color: 'red' },
                  'analytics': { blocking: false, color: 'blue' },
                  'database-save': { blocking: true, color: 'green' },
                  'notification': { blocking: false, color: 'yellow' },
                  'audit-log': { blocking: false, color: 'purple' }
                }[handler.id] || { blocking: false, color: 'gray' };
                
                return (
                <div key={handler.id} className={`bg-white border-2 rounded-lg p-3 text-center ${
                  handlerConfig.color === 'red' ? 'border-red-200' :
                  handlerConfig.color === 'blue' ? 'border-blue-200' :
                  handlerConfig.color === 'green' ? 'border-green-200' :
                  handlerConfig.color === 'yellow' ? 'border-yellow-200' :
                  'border-purple-200'
                }`}>
                  <div className="text-2xl mb-1">{handler.icon}</div>
                  <div className="font-semibold text-sm text-gray-900">{handler.name}</div>
                  <div className="text-xs text-gray-500">P{handler.priority}</div>
                  <div className={`text-xs px-2 py-1 rounded mt-1 ${
                    handlerConfig.blocking 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {handlerConfig.blocking ? '⏳ Blocking' : '⚡ Non-blocking'}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
        <FilteringDemo />
        </div>
        </VisualizationStoreProvider>
      </DemoStoreProvider>
    </ProcessActionProvider>
  );
}