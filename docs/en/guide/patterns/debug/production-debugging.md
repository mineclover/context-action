# Production Debugging Migration Guide

Suggestion-migration process for implementing advanced debugging patterns in Context-Action framework applications.

## Prerequisites

**Required Setup**: This guide builds upon established setup patterns. Please configure your base contexts first:

- **[Basic Action Setup](../setup/basic-action-setup.md)** - Action context configuration with debugging actions
- **[Basic Store Setup](../setup/basic-store-setup.md)** - Store context configuration for debug state management
- **[Multi-Context Setup](../setup/multi-context-setup.md)** - For complex debugging scenarios requiring multiple contexts

**Proposed Enhancement**: See **[Debug Store Types Proposal](../proposals/debug-store-types.md)** for advanced type definitions and monitoring capabilities.

## 📋 Migration Process

1. [Core Issues Migration](#core-issues-migration)
2. [Monitoring Integration](#monitoring-integration)  
3. [Recovery Pattern Implementation](#recovery-pattern-implementation)
4. [Testing Infrastructure Setup](#testing-infrastructure-setup)
5. [Common Scenario Solutions](#common-scenario-solutions)

---

## Core Issues Migration

### Migration from Ad-hoc to Systematic Debugging

**Current Problem**: Inconsistent debugging approaches across development teams.

**Migration Strategy**: Standardize debugging patterns using Context-Action framework conventions.

### ⚠️ Action Handler Registration Pattern

**Problem**: Inconsistent handler registration leading to debugging difficulties.

**Setup Integration**: Following [Basic Action Setup](../setup/basic-action-setup.md) naming conventions:

```tsx
// ✅ STANDARD: Using setup-based action pattern
import { useEventHandler } from '../actions/EventActions';

// From Basic Action Setup - EventActions pattern
interface DebugEventActions {
  updateResults: { data: any; debugInfo?: { timestamp: number; source: string } };
  trackError: { error: Error; context: string };
  logPerformance: { operation: string; duration: number };
}

const updateResultsHandler = useCallback(async (payload) => {
  const { data, debugInfo } = payload;
  
  // Log debug information if provided
  if (debugInfo && process.env.NODE_ENV === 'development') {
    console.log(`[${debugInfo.timestamp}] Update from: ${debugInfo.source}`);
  }
  
  resultStore.setValue(data);
}, [resultStore]);

useEventHandler('updateResults', updateResultsHandler);
```

**Migration Command**: `grep -rn "useActionHandler" src/ | grep -v "useCallback"`

### 🔄 Race Condition Prevention Pattern

**Problem**: Concurrent operations causing state inconsistencies.

**Setup Integration**: Using [Basic Store Setup](../setup/basic-store-setup.md) patterns:

```tsx
// ✅ STANDARD: Following store setup conventions
import { useUIStore, useUIStoreManager } from '../stores/UIStores';

// From Basic Store Setup - UIStores pattern
const {  
  Provider: DebugUIStoreProvider,
  useStore: useDebugUIStore,
  useStoreManager: useDebugUIStoreManager
} = createStoreContext('DebugUI', {
  operationState: {
    initialValue: {
      isProcessing: false,
      currentOperation: null as string | null,
      operationQueue: [] as string[]
    },
    strategy: 'shallow' as const
  },
  debugMetrics: {
    initialValue: {
      operationCount: 0,
      averageTime: 0,
      errorCount: 0
    },
    strategy: 'shallow' as const
  }
});

const criticalActionHandler = useCallback(async (payload) => {
  const operationStore = useDebugUIStore('operationState');
  const currentState = operationStore.getValue();
  
  if (currentState.isProcessing) {
    // Queue the operation instead of ignoring
    operationStore.update(prev => ({
      ...prev,
      operationQueue: [...prev.operationQueue, payload.operationId]
    }));
    return;
  }
  
  const startTime = performance.now();
  operationStore.setValue({
    isProcessing: true,
    currentOperation: payload.operationId,
    operationQueue: currentState.operationQueue
  });
  
  try {
    await performCriticalOperation(payload);
    
    // Update metrics
    const duration = performance.now() - startTime;
    const metricsStore = useDebugUIStore('debugMetrics');
    metricsStore.update(prev => ({
      operationCount: prev.operationCount + 1,
      averageTime: (prev.averageTime * prev.operationCount + duration) / (prev.operationCount + 1),
      errorCount: prev.errorCount
    }));
  } catch (error) {
    // Handle error and update metrics
    const metricsStore = useDebugUIStore('debugMetrics');
    metricsStore.update(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    throw error;
  } finally {
    operationStore.setValue({
      isProcessing: false,
      currentOperation: null,
      operationQueue: currentState.operationQueue
    });
  }
}, []);

// ✅ STANDARD: Component follows naming conventions
function DebugActionButton() {
  const operationStore = useDebugUIStore('operationState');
  const metricsStore = useDebugUIStore('debugMetrics');
  const operationState = useStoreValue(operationStore);
  const metrics = useStoreValue(metricsStore);
  const dispatch = useEventDispatch();
  
  return (
    <div>
      <button
        onClick={() => dispatch('criticalAction', { operationId: Date.now().toString() })}
        disabled={operationState.isProcessing}
      >
        {operationState.isProcessing 
          ? `⏳ Processing ${operationState.currentOperation}...` 
          : 'Execute Action'
        }
      </button>
      <div>Operations: {metrics.operationCount} | Errors: {metrics.errorCount}</div>
    </div>
  );
}
```

### 🔧 Lifecycle Management Pattern

**Problem**: Component lifecycle conflicts with debugging state management.

**Setup Integration**: Following [RefContext Setup](../setup/ref-context-setup.md) conventions:

```tsx
// ✅ STANDARD: Using ref context setup pattern
import { useRefHandler } from '../contexts/RefContext';
import { useDebugUIStore } from '../stores/DebugUIStores';

function DebugComponent({ componentId }: { componentId: string }) {
  const elementRef = useRefHandler(componentId);
  const lifecycleStore = useDebugUIStore('lifecycle');
  
  useEffect(() => {
    // Track component lifecycle for debugging
    lifecycleStore.update(prev => ({
      ...prev,
      mountedComponents: {
        ...prev.mountedComponents,
        [componentId]: {
          mountTime: Date.now(),
          refStatus: 'mounting',
          debugInfo: { source: 'useEffect' }
        }
      }
    }));
    
    return () => {
      // Track unmounting for debugging
      lifecycleStore.update(prev => ({
        ...prev,
        mountedComponents: {
          ...prev.mountedComponents,
          [componentId]: {
            ...prev.mountedComponents[componentId],
            unmountTime: Date.now(),
            refStatus: 'unmounting'
          }
        }
      }));
    };
  }, [componentId, lifecycleStore]);
  
  // Let React handle DOM, actions handle business logic
  return <div ref={elementRef.setRef} data-debug-id={componentId} />;
}

// ✅ STANDARD: Action handler follows naming conventions
const cleanupComponentHandler = useCallback(async ({ componentId }) => {
  const lifecycleStore = useDebugUIStore('lifecycle');
  const currentState = lifecycleStore.getValue();
  
  if (currentState.mountedComponents[componentId]) {
    // Update lifecycle state first
    lifecycleStore.update(prev => ({
      ...prev,
      mountedComponents: {
        ...prev.mountedComponents,
        [componentId]: {
          ...prev.mountedComponents[componentId],
          refStatus: 'cleaned',
          cleanupTime: Date.now()
        }
      }
    }));
    
    // Optional: Clean ref state if needed for debugging
    const elementRef = useRefHandler(componentId);
    if (elementRef.target) {
      console.log(`[Debug] Cleaning up ref for ${componentId}`);
      elementRef.setRef(null);
    }
  }
}, []);

useEventHandler('cleanupComponent', cleanupComponentHandler);
```

---

## Monitoring Integration

### Systematic State Monitoring Migration

**Current Problem**: Scattered monitoring logic across components.

**Migration Strategy**: Centralize monitoring using established store patterns.

### 📊 Monitoring Store Integration

**Setup Integration**: Following [Basic Store Setup](../setup/basic-store-setup.md) type patterns:

```tsx
// ✅ STANDARD: Following store setup type conventions
interface MonitoringStores {
  actionLog: {
    entries: Array<{
      id: string;
      timestamp: number;
      actionType: string;
      payload?: any;
      duration?: number;
    }>;
    maxEntries: number;
    isEnabled: boolean;
  };
  errorTracking: {
    errors: Array<{
      id: string;
      timestamp: number;
      message: string;
      stack?: string;
      context: string;
    }>;
    totalCount: number;
    resolvedCount: number;
  };
  performanceMetrics: {
    operations: Record<string, {
      totalCalls: number;
      averageTime: number;
      lastCall: number;
    }>;
    memoryUsage: number;
    renderCount: number;
  };
}

// Using store setup pattern
const {
  Provider: MonitoringStoreProvider,
  useStore: useMonitoringStore,
  useStoreManager: useMonitoringStoreManager
} = createStoreContext('Monitoring', {
  actionLog: {
    initialValue: {
      entries: [],
      maxEntries: 50,
      isEnabled: process.env.NODE_ENV === 'development'
    },
    strategy: 'shallow' as const
  },
  errorTracking: {
    initialValue: {
      errors: [],
      totalCount: 0,
      resolvedCount: 0
    },
    strategy: 'shallow' as const
  },
  performanceMetrics: {
    initialValue: {
      operations: {},
      memoryUsage: 0,
      renderCount: 0
    },
    strategy: 'shallow' as const
  }
});

// Action handler follows naming conventions
const logActionHandler = useCallback(async ({ actionType, payload, duration }) => {
  const actionLogStore = useMonitoringStore('actionLog');
  const currentLog = actionLogStore.getValue();
  
  if (!currentLog.isEnabled) return;
  
  const logEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    actionType,
    payload: process.env.NODE_ENV === 'development' ? payload : undefined,
    duration
  };
  
  actionLogStore.update(prev => ({
    ...prev,
    entries: [
      ...prev.entries.slice(-(prev.maxEntries - 1)),
      logEntry
    ]
  }));
}, []);

useEventHandler('logAction', logActionHandler);
```

### 🔍 Debug Utility Integration

**Setup Integration**: Utility functions following framework conventions:

```tsx
// ✅ STANDARD: Debug utilities following naming conventions
interface StateLogger<T> {
  storeName: string;
  logCurrent: () => void;
  logChange: (action: string) => (after: T) => void;
  logHistory: () => void;
  exportSnapshot: () => { storeName: string; value: T; timestamp: number };
}

// Following store manager patterns from setup
const createDebugStateLogger = <T>(
  storeName: string, 
  store: Store<T>,
  monitoringManager: ReturnType<typeof useMonitoringStoreManager>
): StateLogger<T> => {
  return {
    storeName,
    logCurrent: () => {
      const value = store.getValue();
      console.log(`[${storeName}] Current:`, value);
      
      // Log to monitoring store
      const actionLogStore = monitoringManager.getStore('actionLog');
      const logEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actionType: 'STATE_LOG',
        payload: { storeName, operation: 'logCurrent' }
      };
      
      actionLogStore.update(prev => ({
        ...prev,
        entries: [...prev.entries.slice(-49), logEntry]
      }));
    },
    logChange: (action: string) => {
      const before = store.getValue();
      return (after: T) => {
        console.log(`[${storeName}] ${action}:`, { before, after });
        
        // Track state changes
        const performanceStore = monitoringManager.getStore('performanceMetrics');
        performanceStore.update(prev => ({
          ...prev,
          operations: {
            ...prev.operations,
            [`${storeName}_${action}`]: {
              totalCalls: (prev.operations[`${storeName}_${action}`]?.totalCalls || 0) + 1,
              averageTime: 0, // Would be calculated from actual timing
              lastCall: Date.now()
            }
          }
        }));
      };
    },
    logHistory: () => {
      const actionLogStore = monitoringManager.getStore('actionLog');
      const logs = actionLogStore.getValue().entries
        .filter(entry => entry.payload?.storeName === storeName);
      console.table(logs);
    },
    exportSnapshot: () => ({
      storeName,
      value: store.getValue(),
      timestamp: Date.now()
    })
  };
};

// Usage with proper typing
const userStoreLogger = createDebugStateLogger(
  'user',
  userStore,
  monitoringManager
);
```


---

## Recovery Pattern Implementation

### Error Recovery Migration

**Current Problem**: Inconsistent error handling across action handlers.

**Migration Strategy**: Standardize recovery patterns using action context conventions.

### 🔄 Recovery Action Pattern

**Setup Integration**: Following [Basic Action Setup](../setup/basic-action-setup.md) error handling patterns:

```tsx
// ✅ STANDARD: Recovery actions following setup conventions
interface RecoveryActions {
  executeWithRetry: {
    operation: string;
    payload: any;
    maxRetries?: number;
    backoffStrategy?: 'linear' | 'exponential';
  };
  recordFailure: {
    operation: string;
    error: Error;
    attempt: number;
  };
  resetErrorState: {
    operation?: string; // Reset specific operation or all
  };
}

const executeWithRetryHandler = useCallback(async ({
  operation,
  payload,
  maxRetries = 3,
  backoffStrategy = 'exponential'
}) => {
  const errorTrackingStore = useMonitoringStore('errorTracking');
  const performanceStore = useMonitoringStore('performanceMetrics');
  
  let attempt = 0;
  const startTime = performance.now();
  
  while (attempt < maxRetries) {
    try {
      const result = await performOperation(operation, payload);
      
      // Track successful recovery
      const duration = performance.now() - startTime;
      performanceStore.update(prev => ({
        ...prev,
        operations: {
          ...prev.operations,
          [operation]: {
            totalCalls: (prev.operations[operation]?.totalCalls || 0) + 1,
            averageTime: duration,
            lastCall: Date.now()
          }
        }
      }));
      
      return result;
    } catch (error) {
      attempt++;
      
      // Record failure attempt
      const dispatch = useEventDispatch();
      dispatch('recordFailure', { operation, error, attempt });
      
      if (attempt >= maxRetries) {
        // Final failure - log to error tracking
        errorTrackingStore.update(prev => ({
          ...prev,
          errors: [
            ...prev.errors,
            {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              message: error.message,
              stack: error.stack,
              context: `${operation} failed after ${maxRetries} attempts`
            }
          ],
          totalCount: prev.totalCount + 1
        }));
        throw error;
      }
      
      // Calculate delay based on strategy
      const delay = backoffStrategy === 'exponential'
        ? 100 * Math.pow(2, attempt - 1)
        : 100 * attempt;
        
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}, []);

const recordFailureHandler = useCallback(async ({ operation, error, attempt }) => {
  const actionLogStore = useMonitoringStore('actionLog');
  
  actionLogStore.update(prev => ({
    ...prev,
    entries: [
      ...prev.entries.slice(-49),
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        actionType: 'RETRY_FAILURE',
        payload: {
          operation,
          error: error.message,
          attempt,
          context: 'auto-retry'
        }
      }
    ]
  }));
}, []);

// Register handlers following naming conventions
useEventHandler('executeWithRetry', executeWithRetryHandler);
useEventHandler('recordFailure', recordFailureHandler);
```


---

## Testing Infrastructure Setup

### Testing Component Integration

**Current Problem**: Manual testing without systematic stress testing capabilities.

**Migration Strategy**: Create reusable testing components following framework patterns.

### 🎯 Stress Testing Component Pattern

**Setup Integration**: Following component and action patterns:

```tsx
// ✅ STANDARD: Stress testing following framework conventions
interface StressTestingStores {
  testState: {
    isActive: boolean;
    testType: 'actions' | 'renders' | 'state-changes' | 'mixed';
    interval: number;
    actionCount: number;
    errorCount: number;
    startTime?: number;
  };
  testResults: {
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    averageResponseTime: number;
    peakMemoryUsage: number;
  };
}

const {
  Provider: StressTestStoreProvider,
  useStore: useStressTestStore,
  useStoreManager: useStressTestStoreManager
} = createStoreContext('StressTest', {
  testState: {
    initialValue: {
      isActive: false,
      testType: 'mixed' as const,
      interval: 100,
      actionCount: 0,
      errorCount: 0
    },
    strategy: 'shallow' as const
  },
  testResults: {
    initialValue: {
      totalActions: 0,
      successfulActions: 0,
      failedActions: 0,
      averageResponseTime: 0,
      peakMemoryUsage: 0
    },
    strategy: 'shallow' as const
  }
});

// Action handlers for stress testing
const startStressTestHandler = useCallback(async ({ testType, interval }) => {
  const testStateStore = useStressTestStore('testState');
  
  testStateStore.setValue({
    isActive: true,
    testType,
    interval,
    actionCount: 0,
    errorCount: 0,
    startTime: Date.now()
  });
}, []);

const executeTestActionHandler = useCallback(async ({ actionType }) => {
  const testStateStore = useStressTestStore('testState');
  const resultsStore = useStressTestStore('testResults');
  const dispatch = useEventDispatch();
  
  const startTime = performance.now();
  
  try {
    // Execute the test action
    switch (actionType) {
      case 'updateUser':
        dispatch('updateUser', { id: 'test', name: `User${Date.now()}` });
        break;
      case 'toggleModal':
        dispatch('showModal', { modalType: 'test', data: {} });
        break;
      case 'dataOperation':
        dispatch('executeWithRetry', { operation: 'testOp', payload: {} });
        break;
      default:
        dispatch('logAction', { actionType, payload: {} });
    }
    
    const duration = performance.now() - startTime;
    
    // Update test results
    resultsStore.update(prev => ({
      totalActions: prev.totalActions + 1,
      successfulActions: prev.successfulActions + 1,
      failedActions: prev.failedActions,
      averageResponseTime: (prev.averageResponseTime * prev.totalActions + duration) / (prev.totalActions + 1),
      peakMemoryUsage: Math.max(prev.peakMemoryUsage, (performance as any).memory?.usedJSHeapSize || 0)
    }));
    
    testStateStore.update(prev => ({ ...prev, actionCount: prev.actionCount + 1 }));
  } catch (error) {
    resultsStore.update(prev => ({
      ...prev,
      totalActions: prev.totalActions + 1,
      failedActions: prev.failedActions + 1
    }));
    
    testStateStore.update(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
  }
}, []);

// Register stress test handlers
useEventHandler('startStressTest', startStressTestHandler);
useEventHandler('executeTestAction', executeTestActionHandler);

// Stress testing component
function StressTestController({ children }: { children: ReactNode }) {
  const testStateStore = useStressTestStore('testState');
  const resultsStore = useStressTestStore('testResults');
  const testState = useStoreValue(testStateStore);
  const results = useStoreValue(resultsStore);
  const dispatch = useEventDispatch();
  
  useEffect(() => {
    if (!testState.isActive) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const actions = ['updateUser', 'toggleModal', 'dataOperation'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        dispatch('executeTestAction', { actionType: randomAction });
      }
    }, testState.interval);
    
    return () => clearInterval(interval);
  }, [testState.isActive, testState.interval, dispatch]);
  
  return (
    <div>
      <div>
        <button 
          onClick={() => 
            testState.isActive 
              ? testStateStore.setValue({ ...testState, isActive: false })
              : dispatch('startStressTest', { testType: 'mixed', interval: 100 })
          }
        >
          {testState.isActive ? '🛑 Stop' : '🎯 Start'} Stress Test
        </button>
        
        {testState.isActive && (
          <div>
            Actions: {testState.actionCount} | Errors: {testState.errorCount}
            | Avg Response: {results.averageResponseTime.toFixed(2)}ms
          </div>
        )}
      </div>
      
      {children}
    </div>
  );
}
```

---

## Common Scenario Solutions

### Scenario-Based Debugging Migration

**Current Problem**: Reactive debugging instead of systematic issue resolution.

**Migration Strategy**: Provide standardized debugging patterns for common scenarios.

### 🔍 Re-render Debugging Pattern

**Setup Integration**: Following store access patterns from [Basic Store Setup](../setup/basic-store-setup.md):

```tsx
// ✅ STANDARD: Debugging component following naming conventions
function RenderDebuggingComponent({ storeKey }: { storeKey: string }) {
  // Using proper store access pattern
  const debugStore = useMonitoringStore('performanceMetrics');
  const userStore = useUserStore('profile'); // From Basic Store Setup
  const userProfile = useStoreValue(userStore);
  
  // Track render cycles for debugging
  const renderCount = useRef(0);
  const lastValue = useRef(userProfile);
  
  useEffect(() => {
    renderCount.current += 1;
    
    // Log render information
    console.log(`[Render Debug] Component rendered #${renderCount.current}`);
    console.log(`[Render Debug] Value changed:`, {
      previous: lastValue.current,
      current: userProfile,
      equal: lastValue.current === userProfile,
      deepEqual: JSON.stringify(lastValue.current) === JSON.stringify(userProfile)
    });
    
    // Update debug metrics
    debugStore.update(prev => ({
      ...prev,
      renderCount: prev.renderCount + 1
    }));
    
    lastValue.current = userProfile;
  });
  
  // Test store updates with debugging
  const testStoreUpdate = useCallback(() => {
    console.log('[Store Debug] Before update:', userStore.getValue());
    
    // Update with new object reference
    const newProfile = {
      ...userStore.getValue(),
      timestamp: Date.now(),
      debugInfo: { updateSource: 'testButton', renderCount: renderCount.current }
    };
    
    userStore.setValue(newProfile);
    console.log('[Store Debug] After update:', userStore.getValue());
    
    // Verify subscription is working
    setTimeout(() => {
      console.log('[Store Debug] Subscription check:', {
        storeValue: userStore.getValue(),
        componentValue: userProfile,
        renderCount: renderCount.current
      });
    }, 0);
  }, [userStore, userProfile]);
  
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem' }}>
      <h3>Render Debug Info</h3>
      <div>Render Count: {renderCount.current}</div>
      <div>Current Profile: {JSON.stringify(userProfile)}</div>
      <div>Store Direct: {JSON.stringify(userStore.getValue())}</div>
      <button onClick={testStoreUpdate}>Test Store Update</button>
      
      <details>
        <summary>Debug Details</summary>
        <pre>{JSON.stringify({
          renderCount: renderCount.current,
          hasSubscription: !!userProfile,
          storeEquals: userProfile === userStore.getValue(),
          timestamp: Date.now()
        }, null, 2)}</pre>
      </details>
    </div>
  );
}
```

### 🔍 Action Handler Debugging Pattern

**Setup Integration**: Following [Basic Action Setup](../setup/basic-action-setup.md) handler patterns:

```tsx
// ✅ STANDARD: Action debugging following setup conventions
function ActionDebuggingComponent() {
  const actionLogStore = useMonitoringStore('actionLog');
  const errorTrackingStore = useMonitoringStore('errorTracking');
  const dispatch = useEventDispatch();
  
  // Debug action handler with comprehensive logging
  const debugTestActionHandler = useCallback(async (payload) => {
    const startTime = performance.now();
    const actionId = crypto.randomUUID();
    
    console.log(`[Action Debug] Handler started:`, {
      actionId,
      actionType: 'debugTestAction',
      payload,
      timestamp: Date.now()
    });
    
    // Log to monitoring store
    actionLogStore.update(prev => ({
      ...prev,
      entries: [
        ...prev.entries.slice(-49),
        {
          id: actionId,
          timestamp: Date.now(),
          actionType: 'DEBUG_TEST_ACTION',
          payload: { ...payload, debug: 'handler-start' }
        }
      ]
    }));
    
    try {
      // Simulate some business logic
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update some state for testing
      const userStore = useUserStore('profile');
      userStore.update(prev => ({
        ...prev,
        lastAction: {
          type: 'debugTestAction',
          timestamp: Date.now(),
          payload
        }
      }));
      
      const duration = performance.now() - startTime;
      console.log(`[Action Debug] Handler completed:`, {
        actionId,
        duration: `${duration.toFixed(2)}ms`,
        success: true
      });
      
      // Log success
      actionLogStore.update(prev => ({
        ...prev,
        entries: [
          ...prev.entries.slice(-49),
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            actionType: 'DEBUG_TEST_ACTION_SUCCESS',
            payload: { actionId, duration },
            duration
          }
        ]
      }));
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[Action Debug] Handler error:`, {
        actionId,
        duration: `${duration.toFixed(2)}ms`,
        error: error.message,
        stack: error.stack
      });
      
      // Log error to tracking store
      errorTrackingStore.update(prev => ({
        ...prev,
        errors: [
          ...prev.errors,
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            message: error.message,
            stack: error.stack,
            context: `debugTestAction handler (actionId: ${actionId})`
          }
        ],
        totalCount: prev.totalCount + 1
      }));
      
      throw error; // Re-throw to maintain error propagation
    }
  }, [actionLogStore, errorTrackingStore]);
  
  // Register the debug handler
  useEventHandler('debugTestAction', debugTestActionHandler);
  
  // Test dispatch with debugging
  const testActionDispatch = useCallback(() => {
    const dispatchPayload = {
      test: true,
      timestamp: Date.now(),
      debugInfo: {
        source: 'testButton',
        userAgent: navigator.userAgent
      }
    };
    
    console.log('[Action Debug] About to dispatch:', {
      actionType: 'debugTestAction',
      payload: dispatchPayload
    });
    
    // Log dispatch attempt
    actionLogStore.update(prev => ({
      ...prev,
      entries: [
        ...prev.entries.slice(-49),
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          actionType: 'DEBUG_DISPATCH_ATTEMPT',
          payload: { actionType: 'debugTestAction', ...dispatchPayload }
        }
      ]
    }));
    
    dispatch('debugTestAction', dispatchPayload);
  }, [dispatch, actionLogStore]);
  
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem' }}>
      <h3>Action Debug Component</h3>
      <button onClick={testActionDispatch}>Test Action Dispatch</button>
      
      <ActionLogViewer />
    </div>
  );
}

// Helper component to view action logs
function ActionLogViewer() {
  const actionLogStore = useMonitoringStore('actionLog');
  const actionLog = useStoreValue(actionLogStore);
  
  return (
    <details>
      <summary>Action Log ({actionLog.entries.length})</summary>
      <div style={{ maxHeight: '200px', overflow: 'auto', fontSize: '12px' }}>
        {actionLog.entries.slice(-10).map(entry => (
          <div key={entry.id} style={{ borderBottom: '1px solid #eee', padding: '4px' }}>
            <strong>{entry.actionType}</strong> - {new Date(entry.timestamp).toLocaleTimeString()}
            {entry.duration && <span> ({entry.duration.toFixed(2)}ms)</span>}
            <br />
            <code>{JSON.stringify(entry.payload || {})}</code>
          </div>
        ))}
      </div>
    </details>
  );
}
```

---

## Provider Setup Integration

**Complete Provider Setup**: Integrate all debugging capabilities:

```tsx
// ✅ STANDARD: Complete debugging provider setup
import { composeProviders } from '@context-action/react';

const DebugProviders = composeProviders([
  MonitoringStoreProvider,
  StressTestStoreProvider,
  EventActionProvider  // From Basic Action Setup
]);

function DebugApp() {
  return (
    <DebugProviders>
      <StressTestController>
        <RenderDebuggingComponent storeKey="profile" />
        <ActionDebuggingComponent />
        <AppContent />
      </StressTestController>
    </DebugProviders>
  );
}
```

---

## Migration Checklist

### ✅ Setup Integration (Target: 90%+ compliance)
- [ ] All debugging patterns reference established Setup guides
- [ ] Action handlers follow Basic Action Setup naming conventions
- [ ] Store patterns follow Basic Store Setup type definitions
- [ ] Provider composition uses recommended patterns
- [ ] Component naming follows framework conventions

### ✅ Type Definition Organization
- [ ] Debug-specific types moved to [Debug Store Types Proposal](../proposals/debug-store-types.md)
- [ ] Existing pattern types extended rather than redefined
- [ ] Interface consistency maintained across debugging features
- [ ] Proper TypeScript integration with framework types

### ✅ Pattern Standardization
- [ ] Consistent naming conventions (e.g., `useDebugStore`, `DebugStoreProvider`)
- [ ] Standard action payload structures following ActionPayloadMap
- [ ] Uniform error handling patterns across all handlers
- [ ] Consistent store configuration strategies

### ✅ Documentation Improvements
- [ ] Clear Prerequisites section with Setup guide references
- [ ] Migration-focused content rather than new pattern introduction
- [ ] Improved code examples following established conventions
- [ ] Better integration with existing pattern ecosystem

---

## 📚 Related Patterns

**Prerequisites (Required)**:
- **[Basic Action Setup](../setup/basic-action-setup.md)** - Foundation for debug actions
- **[Basic Store Setup](../setup/basic-store-setup.md)** - Foundation for debug state management
- **[Multi-Context Setup](../setup/multi-context-setup.md)** - Complex debugging scenarios

**Advanced Patterns**:
- **[Real-time State Access](../async/real-time-state-access.md)** - Fresh state access in debug handlers
- **[Advanced Action Patterns](../action/advanced-patterns.md)** - Complex debugging action patterns
- **[Timeout Protection](../async/timeout-protection.md)** - Debug-safe timeout handling

**Enhancement Proposals**:
- **[Debug Store Types Proposal](../proposals/debug-store-types.md)** - Advanced debugging type definitions

---

## 🔧 Framework Issue Resolution

### Memory Leak Prevention (v0.4.1+)

**Issue**: EventBus storing large DOM/React objects causing memory leaks

**Resolution**: Framework automatically detects and safely handles:
- DOM elements
- React components and synthetic events  
- Circular references
- Large object structures

```tsx
// ✅ SAFE: Framework handles automatically
function SafeEventHandling() {
  const [eventBus] = useState(() => new EventBus());
  
  const handleDOMEvent = useCallback((event: Event) => {
    // EventBus automatically extracts safe metadata
    // No memory leaks from DOM object retention
    eventBus.emit('dom-interaction', event);
  }, [eventBus]);
  
  return <div onClick={handleDOMEvent}>Safe Event Handling</div>;
}
```

### Cross-Platform Compatibility (v0.4.1+)

**Issue**: Timeout type mismatches between browser and Node.js environments

**Resolution**: Framework uses `ReturnType<typeof requestAnimationFrame>` for compatibility

```tsx
// ✅ COMPATIBLE: Works in both browser and Node.js
function useCrossPlatformOperation() {
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof requestAnimationFrame> | null>(null);
  
  const scheduleOperation = useCallback((callback: () => void) => {
    const id = requestAnimationFrame(callback);
    setTimeoutId(id);
    
    return () => {
      if (id !== null) {
        cancelAnimationFrame(id);
      }
    };
  }, []);
  
  return scheduleOperation;
}
```

### Centralized Error Handling (v0.4.1+)

**Issue**: Inconsistent error handling across modules

**Resolution**: Framework provides `ErrorHandlers` for centralized error management

```tsx
// ✅ CENTRALIZED: Framework handles all errors consistently
import { ErrorHandlers } from '@context-action/react';

function useFrameworkErrorHandling() {
  const handleError = useCallback((error: Error, context: any) => {
    // Framework automatically:
    // - Logs with proper context
    // - Tracks error statistics
    // - Provides recovery mechanisms
    // - Prevents error spamming
    
    ErrorHandlers.store('Operation failed', context, error);
  }, []);
  
  return { handleError };
}
```

## 📚 Related Troubleshooting

### Quick Issue Resolution
For immediate solutions to common problems, see:
👉 **[Troubleshooting Guide](../../troubleshooting.md)**

**Common Issues Covered**:
- Store subscription not updating
- Action handler not triggering  
- Ref not mounting properly
- Memory leaks and performance issues
- Cross-platform compatibility problems
- Error handling and debugging

### Systematic Problem Solving
For systematic debugging approaches:
👉 **[Best Practices Guide](../../best-practices.md#security--performance-guidelines)**

**Prevention Strategies**:
- Event object handling
- Memory management
- Error prevention
- Performance optimization

## 💡 Migration Success Criteria

### ✅ From Ad-hoc to Systematic (60% → 90%+)
1. **Standardized Patterns**: All debugging follows framework conventions
2. **Setup Integration**: Clear references to established setup guides
3. **Type Safety**: Comprehensive TypeScript coverage for debug features
4. **Performance**: Debug features don't impact production performance
5. **Maintainability**: Debug code follows same quality standards as application code
6. **Framework Integration**: Use built-in error handling and memory management

### ✅ Implementation Priority
1. **High Priority**: Core issue patterns (race conditions, handler registration, memory leaks)
2. **Medium Priority**: Monitoring and recovery patterns (cross-platform compatibility)
3. **Low Priority**: Stress testing and advanced debugging utilities