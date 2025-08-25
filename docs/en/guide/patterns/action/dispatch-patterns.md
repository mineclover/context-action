# Dispatch Patterns

Core action dispatching patterns for the Context-Action framework, including execution modes, filtering, and performance optimization.

## Import
```typescript
import { createActionContext, ActionPayloadMap } from '@context-action/react';
```

## Prerequisites

For complete setup instructions including type definitions, context creation, and provider configuration, see **[Basic Action Setup](../setup/basic-action-setup.md)**.

This document uses the `AppActions` pattern from the setup guide:
- Type definitions → [Extended Action Interface](../setup/basic-action-setup.md#extended-action-interface)
- Context creation → [Single Domain Context](../setup/basic-action-setup.md#single-domain-context)
- Provider setup → [Single Provider Setup](../setup/basic-action-setup.md#single-provider-setup)

The examples assume you have configured the following context:
```typescript
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string };
  processOrder: { orderId: string; items: any[]; total: number };
  broadcastEvent: { event: string; data: any };
  fastestResponse: { query: string };
  sensitiveOperation: { token: string; data: any };
  dynamicAction: { type: string; payload: any };
  slowOperation: { complexData: any };
  criticalAction: { priority: number; data: any };
  riskyAction: { operation: string };
  bestEffortAction: { data: any };
}

const {
  Provider: AppActionProvider,
  useActionDispatch: useAppDispatch,
  useActionHandler: useAppHandler,
  useActionRegister: useAppRegister
} = createActionContext<AppActions>('App');
```

## Basic Dispatch

Simple action dispatching without result collection.

```typescript
function UserComponent() {
  const dispatch = useAppDispatch();
  
  const handleUserUpdate = async () => {
    // Basic action dispatch
    await dispatch('updateUser', { id: '123', name: 'John', email: 'john@example.com' });
  };
  
  const handleOrderProcess = async (orderData) => {
    // Dispatch with execution options
    await dispatch('processOrder', orderData, {
      executionMode: 'parallel',
      timeout: 5000
    });
  };
  
  return (
    <div>
      <button onClick={handleUserUpdate}>Update User</button>
      <button onClick={() => handleOrderProcess(orderData)}>Process Order</button>
    </div>
  );
}
```

## Execution Modes

Control how multiple handlers for the same action are executed.

### Sequential Execution (Default)

```typescript
function OrderComponent() {
  const dispatch = useAppDispatch();
  
  const handleProcessOrder = async (orderData) => {
    // Handlers execute one after another in priority order
    await dispatch('processOrder', orderData, {
      executionMode: 'sequential'
    });
  };
  
  return <button onClick={() => handleProcessOrder(orderData)}>Process Order</button>;
}
```

Handlers execute in sequence, allowing early handlers to modify payload for later ones.

### Parallel Execution

```typescript
function EventComponent() {
  const dispatch = useAppDispatch();
  
  const handleBroadcast = async (eventData) => {
    // All handlers execute simultaneously
    await dispatch('broadcastEvent', eventData, {
      executionMode: 'parallel'
    });
  };
  
  return <button onClick={() => handleBroadcast(eventData)}>Broadcast Event</button>;
}
```

Best for independent operations like analytics, logging, and notifications.

### Race Execution

```typescript
function SearchComponent() {
  const dispatch = useAppDispatch();
  
  const handleFastSearch = async (queryData) => {
    // First completed handler wins
    await dispatch('fastestResponse', queryData, {
      executionMode: 'race'
    });
  };
  
  return <button onClick={() => handleFastSearch(queryData)}>Fast Search</button>;
}
```

Useful for fallback mechanisms and performance-critical operations.

## Handler Filtering

Fine-grained control over which handlers execute.

### Tag-Based Filtering

```typescript
function UserManagementComponent() {
  const dispatch = useAppDispatch();
  
  const handleUserUpdate = async (payload) => {
    await dispatch('updateUser', payload, {
      filter: {
        tags: ['validation', 'business-logic'],
        excludeTags: ['analytics', 'logging']
      }
    });
  };
  
  return <button onClick={() => handleUserUpdate(userData)}>Update User</button>;
}
```

### Category Filtering

```typescript
function SecurityComponent() {
  const dispatch = useAppDispatch();
  
  const handleSensitiveOperation = async (data) => {
    // Only execute security-related handlers
    await dispatch('sensitiveOperation', data, {
      filter: {
        category: 'security',
        excludeCategory: 'analytics'
      }
    });
  };
  
  return <button onClick={() => handleSensitiveOperation(secureData)}>Secure Operation</button>;
}
```

### Custom Handler Filtering

```typescript
function DynamicActionComponent() {
  const dispatch = useAppDispatch();
  
  const handleDynamicAction = async (payload) => {
    await dispatch('dynamicAction', payload, {
      filter: {
        custom: (config) => {
          // Complex filtering logic
          return config.priority > 50 && 
                 config.tags.includes('critical') &&
                 config.environment === 'production';
        }
      }
    });
  };
  
  return <button onClick={() => handleDynamicAction(dynamicData)}>Dynamic Action</button>;
}
```

## Performance Optimization

### Timeout Control

```typescript
function SlowOperationComponent() {
  const dispatch = useAppDispatch();
  
  const handleSlowOperation = async (data) => {
    // Set timeout for action execution
    await dispatch('slowOperation', data, {
      timeout: 10000  // 10 second timeout
    });
  };
  
  return <button onClick={() => handleSlowOperation(complexData)}>Start Slow Operation</button>;
}
```

### Priority-Based Execution

```typescript
function CriticalActionComponent() {
  const dispatch = useAppDispatch();
  
  const handleCriticalAction = async (payload) => {
    // Execute only high-priority handlers
    await dispatch('criticalAction', payload, {
      filter: {
        custom: (config) => config.priority >= 80
      }
    });
  };
  
  return <button onClick={() => handleCriticalAction(criticalData)}>Critical Action</button>;
}
```

## Error Handling

### Basic Error Handling

```typescript
function RiskyActionComponent() {
  const dispatch = useAppDispatch();
  
  const handleRiskyAction = async (payload) => {
    try {
      await dispatch('riskyAction', payload);
    } catch (error) {
      console.error('Action failed:', error);
    }
  };
  
  return <button onClick={() => handleRiskyAction(riskyData)}>Risky Action</button>;
}
```

### Silent Failures

```typescript
function BestEffortComponent() {
  const dispatch = useAppDispatch();
  
  const handleBestEffortAction = async (payload) => {
    // Continue execution even if some handlers fail
    await dispatch('bestEffortAction', payload, {
      continueOnError: true
    });
  };
  
  return <button onClick={() => handleBestEffortAction(effortData)}>Best Effort Action</button>;
}
```

## Real-World Examples

- [Search Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/SearchPage.tsx) - Debounced search with filtering
- [Scroll Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/ScrollPage.tsx) - Performance-optimized scroll handling
- [Priority Demo](https://github.com/mineclover/context-action/tree/main/example/src/pages/actionguard/priority-performance) - Priority-based execution patterns

## Related Patterns

- **[Action Basic Usage](./basic-usage.md)** - Fundamental action patterns
- **[Dispatch with Result](./dispatch-with-result.md)** - Result collection patterns
- **[Register Patterns](./register-patterns.md)** - Handler registration patterns
- **[Type System](./type-system.md)** - TypeScript integration
- **[Basic Action Setup](../setup/basic-action-setup.md)** - Setup patterns and type definitions