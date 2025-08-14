# Action Registry API

Complete API reference for the Action Registry system that manages action registration, execution, and pipeline control.

## Overview

The Action Registry is the core system that manages action handlers, executes action pipelines, and provides advanced control flow. It's the foundation of the Action Only Pattern and handles all action dispatching logic.

## Core Registry Methods

### `actionRegistry.register(actionName, handler, options?)`

Registers an action handler with the specified options.

**Parameters:**
- `actionName`: Name of the action to handle
- `handler`: Handler function
- `options`: Handler configuration options

**Returns:** Unregister function

```typescript
// Low-level registration (typically done through useActionHandler)
const unregister = actionRegistry.register('updateUser', 
  async (payload, controller) => {
    // Handler logic
    return { success: true };
  },
  { priority: 100, id: 'user-updater' }
);

// Cleanup
unregister();
```

### `actionRegistry.unregister(actionName, handlerId)`

Unregisters a specific handler for an action.

**Parameters:**
- `actionName`: Name of the action
- `handlerId`: ID of the handler to remove

**Returns:** `boolean` - Success status

```typescript
const success = actionRegistry.unregister('updateUser', 'user-updater');
console.log('Handler removed:', success);
```

### `actionRegistry.dispatch(actionName, payload)`

Dispatches an action to all registered handlers.

**Parameters:**
- `actionName`: Name of the action to dispatch
- `payload`: Action payload data

**Returns:** `Promise<ActionResult[]>`

```typescript
// Direct dispatch (typically done through useActionDispatch)
const results = await actionRegistry.dispatch('updateUser', {
  id: '123',
  name: 'John Doe'
});
```

## Handler Management

### `actionRegistry.getHandlers(actionName)`

Gets all handlers registered for a specific action.

**Parameters:**
- `actionName`: Name of the action

**Returns:** Array of handler information

```typescript
function HandlerInspector() {
  const dispatch = useActionDispatch();
  
  const inspectHandlers = () => {
    const handlers = actionRegistry.getHandlers('updateUser');
    console.log('Registered handlers:', handlers.map(h => ({
      id: h.id,
      priority: h.priority
    })));
  };
  
  return <button onClick={inspectHandlers}>Inspect Handlers</button>;
}
```

### `actionRegistry.getActionNames()`

Gets all registered action names.

**Returns:** `string[]`

```typescript
function ActionList() {
  const actionNames = actionRegistry.getActionNames();
  
  return (
    <div>
      <h3>Available Actions:</h3>
      <ul>
        {actionNames.map(name => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### `actionRegistry.hasAction(actionName)`

Checks if an action has any registered handlers.

**Parameters:**
- `actionName`: Name of the action to check

**Returns:** `boolean`

```typescript
function ActionChecker() {
  const checkAction = (actionName: string) => {
    const hasHandlers = actionRegistry.hasAction(actionName);
    console.log(`Action ${actionName} ${hasHandlers ? 'has' : 'has no'} handlers`);
  };
  
  return (
    <div>
      <button onClick={() => checkAction('updateUser')}>
        Check updateUser
      </button>
    </div>
  );
}
```

## Pipeline Execution

### `actionRegistry.executePipeline(actionName, payload, options?)`

Executes the complete action pipeline with advanced options.

**Parameters:**
- `actionName`: Name of the action
- `payload`: Action payload
- `options`: Execution options

**Options:**
```typescript
interface ExecutionOptions {
  timeout?: number;           // Pipeline timeout in ms
  abortOnError?: boolean;     // Stop on first error
  collectResults?: boolean;   // Collect all handler results
  metadata?: any;            // Additional execution metadata
}
```

**Returns:** `Promise<PipelineResult>`

```typescript
// Advanced pipeline execution
const result = await actionRegistry.executePipeline('complexAction', payload, {
  timeout: 5000,
  abortOnError: false,
  collectResults: true,
  metadata: { source: 'admin-panel' }
});

console.log('Pipeline result:', result);
```

### `actionRegistry.createPipelineController(actionName, payload)`

Creates a pipeline controller for manual pipeline management.

**Parameters:**
- `actionName`: Name of the action
- `payload`: Initial payload

**Returns:** `PipelineController` instance

```typescript
// Manual pipeline control
const controller = actionRegistry.createPipelineController('updateUser', {
  id: '123',
  name: 'John'
});

// Modify payload before execution
controller.modifyPayload(current => ({
  ...current,
  timestamp: Date.now()
}));

// Execute with custom controller
const results = await actionRegistry.executeWithController(controller);
```

## Registry Statistics

### `actionRegistry.getStatistics()`

Gets registry statistics and performance metrics.

**Returns:** Registry statistics object

```typescript
function RegistryStats() {
  const getStats = () => {
    const stats = actionRegistry.getStatistics();
    console.log('Registry Statistics:', {
      totalActions: stats.totalActions,
      totalHandlers: stats.totalHandlers,
      executionCount: stats.executionCount,
      averageExecutionTime: stats.averageExecutionTime,
      errorRate: stats.errorRate
    });
  };
  
  return <button onClick={getStats}>Show Registry Stats</button>;
}
```

### `actionRegistry.getPerformanceMetrics(actionName?)`

Gets performance metrics for actions.

**Parameters:**
- `actionName?`: Optional specific action name

**Returns:** Performance metrics

```typescript
function PerformanceMonitor() {
  const showMetrics = () => {
    const allMetrics = actionRegistry.getPerformanceMetrics();
    const userMetrics = actionRegistry.getPerformanceMetrics('updateUser');
    
    console.log('All actions metrics:', allMetrics);
    console.log('updateUser metrics:', userMetrics);
  };
  
  return <button onClick={showMetrics}>Show Performance</button>;
}
```

## Advanced Handler Options

### Handler Configuration

```typescript
interface AdvancedHandlerOptions {
  priority: number;           // Execution priority (0-1000)
  id: string;                // Unique handler identifier
  once: boolean;             // Execute only once
  condition?: (payload: any) => boolean;  // Conditional execution
  timeout?: number;          // Handler timeout
  retries?: number;          // Retry attempts on failure
  retryDelay?: number;       // Delay between retries
  metadata?: any;            // Handler metadata
}
```

### Conditional Handlers

```typescript
function ConditionalHandlers() {
  // Handler only executes for admin users
  useActionHandler('adminAction', async (payload) => {
    await performAdminOperation(payload);
    return { success: true };
  }, {
    priority: 100,
    id: 'admin-handler',
    condition: (payload) => payload.userRole === 'admin'
  });
  
  // Handler with retry logic
  useActionHandler('unreliableAction', async (payload) => {
    return await unreliableService.call(payload);
  }, {
    priority: 90,
    id: 'unreliable-handler',
    retries: 3,
    retryDelay: 1000
  });
  
  return null;
}
```

## Registry Events

### `actionRegistry.onHandlerError(callback)`

Registers a callback for handler errors.

**Parameters:**
- `callback`: Error handling callback

**Returns:** Unregister function

```typescript
function GlobalErrorHandler() {
  useEffect(() => {
    const unsubscribe = actionRegistry.onHandlerError((error, context) => {
      console.error('Handler error:', error);
      console.error('Context:', context);
      
      // Send to error reporting service
      errorReporter.captureException(error, {
        extra: context,
        tags: { source: 'action-handler' }
      });
    });
    
    return unsubscribe;
  }, []);
  
  return null;
}
```

### `actionRegistry.onActionExecuted(callback)`

Registers a callback for completed action executions.

**Parameters:**
- `callback`: Execution completion callback

**Returns:** Unregister function

```typescript
function ActionAuditor() {
  useEffect(() => {
    const unsubscribe = actionRegistry.onActionExecuted((actionName, result) => {
      // Audit log
      auditLogger.log({
        action: actionName,
        timestamp: Date.now(),
        success: result.success,
        duration: result.duration,
        handlerCount: result.handlerResults.length
      });
    });
    
    return unsubscribe;
  }, []);
  
  return null;
}
```

## Registry Configuration

### Global Configuration

```typescript
// Configure registry behavior
actionRegistry.configure({
  defaultTimeout: 10000,        // Default handler timeout
  maxConcurrentActions: 10,     // Max concurrent action executions
  enableMetrics: true,          // Collect performance metrics
  enableLogging: true,          // Enable debug logging
  errorReporting: true          // Enable error reporting
});
```

### Development Tools

```typescript
function RegistryDevTools() {
  const enableDebugMode = () => {
    actionRegistry.setDebugMode(true);
    console.log('Action registry debug mode enabled');
  };
  
  const clearMetrics = () => {
    actionRegistry.clearMetrics();
    console.log('Performance metrics cleared');
  };
  
  const dumpRegistry = () => {
    const dump = actionRegistry.dumpState();
    console.log('Registry state dump:', dump);
  };
  
  return (
    <div className="dev-tools">
      <h3>Registry Dev Tools</h3>
      <button onClick={enableDebugMode}>Enable Debug</button>
      <button onClick={clearMetrics}>Clear Metrics</button>
      <button onClick={dumpRegistry}>Dump State</button>
    </div>
  );
}
```

## Testing Support

### Registry Mocking

```typescript
// Test utilities for action registry
export class MockActionRegistry {
  private handlers = new Map();
  private results = new Map();
  
  register(actionName: string, handler: Function, options?: any) {
    if (!this.handlers.has(actionName)) {
      this.handlers.set(actionName, []);
    }
    this.handlers.get(actionName).push({ handler, options });
    
    return () => this.unregister(actionName, options?.id);
  }
  
  async dispatch(actionName: string, payload: any) {
    const handlers = this.handlers.get(actionName) || [];
    const results = [];
    
    for (const { handler } of handlers) {
      try {
        const result = await handler(payload, createMockController());
        results.push(result);
      } catch (error) {
        results.push({ error: error.message });
      }
    }
    
    this.results.set(actionName, results);
    return results;
  }
  
  getLastResults(actionName: string) {
    return this.results.get(actionName) || [];
  }
}
```

### Handler Testing

```typescript
// Test individual handlers
describe('User Action Handlers', () => {
  let mockRegistry: MockActionRegistry;
  
  beforeEach(() => {
    mockRegistry = new MockActionRegistry();
  });
  
  test('updateUser handler processes payload correctly', async () => {
    const handler = (payload: any, controller: any) => {
      if (!payload.id) {
        controller.abort('ID required');
        return;
      }
      return { success: true, userId: payload.id };
    };
    
    mockRegistry.register('updateUser', handler);
    
    const results = await mockRegistry.dispatch('updateUser', {
      id: '123',
      name: 'John'
    });
    
    expect(results[0]).toEqual({ success: true, userId: '123' });
  });
});
```

## Best Practices

### 1. Handler Registration
- Use meaningful handler IDs for debugging
- Set appropriate priorities for execution order
- Always use `useCallback` to prevent re-registration

### 2. Error Management
- Implement global error handlers for monitoring
- Use registry events for centralized error handling
- Set up proper error reporting and metrics

### 3. Performance Monitoring
- Monitor registry performance metrics
- Set appropriate timeouts for handlers
- Use performance data to optimize handler priorities

### 4. Testing
- Mock the registry for unit tests
- Test handlers in isolation
- Verify error handling and edge cases

### 5. Development
- Use debug mode during development
- Monitor registry health in production
- Implement proper logging and metrics

## Related

- **[Action Only Methods](./action-only)** - Action dispatching and handler registration
- **[Pipeline Controller API](./pipeline-controller)** - Pipeline control methods
- **[Action Only Example](../examples/action-only)** - Complete usage examples