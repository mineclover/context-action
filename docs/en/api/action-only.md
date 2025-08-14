# Action Only Methods

Complete API reference for Action Only Pattern methods from `createActionContext`.

## Overview

The Action Only Pattern provides type-safe action dispatching without state management. This pattern is ideal for event systems, command patterns, business logic orchestration, and scenarios where you need action processing without local state.

## Core Methods

### `createActionContext<T>(contextName)`

Creates an action context for type-safe action dispatching and handler registration.

**Parameters:**
- `contextName`: Unique identifier for the action context

**Returns:**
```typescript
{
  Provider: React.ComponentType,
  useActionDispatch: () => ActionDispatcher<T>,
  useActionHandler: (actionName, handler, options?) => void
}
```

**Example:**
```typescript
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
}

const { Provider, useActionDispatch, useActionHandler } = 
  createActionContext<AppActions>('App');
```

## Action Dispatcher Methods

### `dispatch(actionName, payload)`

Dispatches an action with the specified payload to all registered handlers.

**Parameters:**
- `actionName`: Name of the action to dispatch
- `payload`: Action payload data

**Returns:** `Promise<ActionResult[]>` - Results from all handlers

```typescript
function UserComponent() {
  const dispatch = useActionDispatch();
  
  const handleUpdate = async () => {
    try {
      const results = await dispatch('updateUser', {
        id: '123',
        name: 'John Doe'
      });
      console.log('Action results:', results);
    } catch (error) {
      console.error('Action failed:', error);
    }
  };
  
  return <button onClick={handleUpdate}>Update User</button>;
}
```

### `dispatch.async(actionName, payload)`

Alias for the standard dispatch method, explicitly indicating async behavior.

**Parameters:**
- `actionName`: Name of the action to dispatch  
- `payload`: Action payload data

**Returns:** `Promise<ActionResult[]>`

```typescript
const results = await dispatch.async('processData', { data: 'example' });
```

## Handler Registration

### `useActionHandler(actionName, handler, options?)`

Registers an action handler for the specified action.

**Parameters:**
- `actionName`: Name of the action to handle
- `handler`: Handler function `(payload, controller) => Promise<any> | any`
- `options`: Optional configuration object

**Handler Function Signature:**
```typescript
type ActionHandler<TPayload> = (
  payload: TPayload,
  controller: PipelineController
) => Promise<any> | any;
```

**Options:**
```typescript
interface HandlerOptions {
  priority?: number;      // Execution priority (higher = earlier, default: 0)
  id?: string;           // Unique handler identifier
  once?: boolean;        // Execute only once then unregister
}
```

**Example:**
```typescript
function UserHandler() {
  const dispatch = useActionDispatch();
  
  useActionHandler('updateUser', useCallback(async (payload, controller) => {
    try {
      // Validate payload
      if (!payload.id) {
        controller.abort('User ID is required');
        return;
      }
      
      // Business logic
      const result = await userService.updateUser(payload.id, {
        name: payload.name
      });
      
      // Set result for other handlers
      controller.setResult({
        step: 'user-update',
        success: true,
        userId: result.id
      });
      
      return { success: true, user: result };
      
    } catch (error) {
      controller.abort(`User update failed: ${error.message}`);
    }
  }, []), { priority: 100, id: 'user-updater' });
  
  return null;
}
```

## Pipeline Controller Methods

The `controller` parameter in action handlers provides advanced pipeline control.

### `controller.abort(reason, error?)`

Aborts the action pipeline execution.

**Parameters:**
- `reason`: Reason for aborting
- `error?`: Optional error object

```typescript
useActionHandler('validateData', (payload, controller) => {
  if (!payload.data) {
    controller.abort('Data is required');
    return;
  }
  
  if (!isValid(payload.data)) {
    controller.abort('Invalid data format', new ValidationError());
    return;
  }
});
```

### `controller.modifyPayload(modifier)`

Modifies the payload for subsequent handlers in the pipeline.

**Parameters:**
- `modifier`: Function that receives current payload and returns modified payload

```typescript
useActionHandler('enrichData', (payload, controller) => {
  controller.modifyPayload(current => ({
    ...current,
    timestamp: Date.now(),
    userId: getCurrentUserId(),
    sessionId: getSessionId()
  }));
  
  return { enriched: true };
}, { priority: 100 }); // High priority to run first
```

### `controller.setResult(result)`

Sets a result that can be accessed by later handlers.

**Parameters:**
- `result`: Result object to store

```typescript
useActionHandler('processPayment', async (payload, controller) => {
  const transaction = await paymentService.process(payload);
  
  controller.setResult({
    step: 'payment',
    transactionId: transaction.id,
    amount: transaction.amount,
    success: true
  });
  
  return transaction;
}, { priority: 90 });
```

### `controller.getResults()`

Gets all results set by previous handlers.

**Returns:** Array of result objects

```typescript
useActionHandler('sendReceipt', async (payload, controller) => {
  const results = controller.getResults();
  const paymentResult = results.find(r => r.step === 'payment');
  
  if (paymentResult?.success) {
    await emailService.sendReceipt({
      transactionId: paymentResult.transactionId,
      amount: paymentResult.amount,
      email: payload.email
    });
  }
}, { priority: 80 }); // Lower priority to run after payment
```

### `controller.getPayload()`

Gets the current (possibly modified) payload.

**Returns:** Current payload object

```typescript
useActionHandler('logAction', (_, controller) => {
  const currentPayload = controller.getPayload();
  console.log('Final payload:', currentPayload);
  
  return { logged: true };
}, { priority: 10 }); // Low priority to run last
```

## Handler Patterns

### Sequential Processing

Handlers execute in priority order for sequential processing:

```typescript
function SequentialHandlers() {
  // Step 1: Validation (priority 100)
  useActionHandler('processOrder', (payload, controller) => {
    if (!validateOrder(payload)) {
      controller.abort('Invalid order');
    }
    return { step: 'validation', valid: true };
  }, { priority: 100 });
  
  // Step 2: Payment (priority 90)
  useActionHandler('processOrder', async (payload, controller) => {
    const payment = await processPayment(payload.paymentInfo);
    controller.setResult({ step: 'payment', transactionId: payment.id });
    return payment;
  }, { priority: 90 });
  
  // Step 3: Fulfillment (priority 80)
  useActionHandler('processOrder', async (payload, controller) => {
    const results = controller.getResults();
    const paymentResult = results.find(r => r.step === 'payment');
    
    if (paymentResult) {
      const order = await fulfillOrder(payload, paymentResult.transactionId);
      return { step: 'fulfillment', orderId: order.id };
    }
  }, { priority: 80 });
  
  return null;
}
```

### Parallel Processing

Multiple handlers processing the same action independently:

```typescript
function ParallelHandlers() {
  // Analytics tracking (independent)
  useActionHandler('userAction', async (payload) => {
    await analytics.track(payload.action, payload.data);
    return { provider: 'analytics', tracked: true };
  }, { id: 'analytics' });
  
  // Error monitoring (independent)
  useActionHandler('userAction', async (payload) => {
    await errorMonitor.log(payload.action, payload.context);
    return { provider: 'monitor', logged: true };
  }, { id: 'monitor' });
  
  // User feedback (independent)
  useActionHandler('userAction', (payload) => {
    showToast(`Action ${payload.action} completed`);
    return { provider: 'ui', notified: true };
  }, { id: 'ui-feedback' });
  
  return null;
}
```

### Error Recovery

Graceful error handling and recovery:

```typescript
function ErrorRecoveryHandlers() {
  // Primary handler
  useActionHandler('apiCall', async (payload, controller) => {
    try {
      const result = await primaryApi.call(payload.endpoint, payload.data);
      controller.setResult({ provider: 'primary', success: true, data: result });
      return result;
    } catch (error) {
      controller.setResult({ provider: 'primary', success: false, error });
      // Don't abort - let fallback handler try
      return { error: error.message };
    }
  }, { priority: 100, id: 'primary-api' });
  
  // Fallback handler
  useActionHandler('apiCall', async (payload, controller) => {
    const results = controller.getResults();
    const primaryFailed = results.some(r => r.provider === 'primary' && !r.success);
    
    if (primaryFailed) {
      try {
        const result = await fallbackApi.call(payload.endpoint, payload.data);
        return { success: true, data: result, fallback: true };
      } catch (error) {
        controller.abort(`All API providers failed: ${error.message}`);
      }
    }
    
    return { skipped: true, reason: 'primary-succeeded' };
  }, { priority: 90, id: 'fallback-api' });
  
  return null;
}
```

## Advanced Use Cases

### Command Pattern Implementation

```typescript
interface CommandActions extends ActionPayloadMap {
  executeCommand: {
    type: 'create' | 'update' | 'delete';
    entity: string;
    data: any;
  };
}

function CommandProcessor() {
  const dispatch = useActionDispatch();
  
  useActionHandler('executeCommand', async (payload, controller) => {
    const command = createCommand(payload.type, payload.entity, payload.data);
    
    try {
      const result = await command.execute();
      
      // Log command execution
      dispatch('trackEvent', {
        event: 'command_executed',
        data: {
          commandType: payload.type,
          entity: payload.entity,
          success: true
        }
      });
      
      return result;
    } catch (error) {
      // Log command failure
      dispatch('logError', {
        error: error.message,
        context: { command: payload },
        severity: 'high'
      });
      
      controller.abort(`Command execution failed: ${error.message}`);
    }
  }, [dispatch]);
  
  return null;
}
```

### Event Aggregation

```typescript
function EventAggregator() {
  const dispatch = useActionDispatch();
  
  useActionHandler('userInteraction', useCallback((payload, controller) => {
    // Collect interaction data
    const interactionData = {
      type: payload.type,
      element: payload.element,
      timestamp: Date.now(),
      sessionId: getSessionId()
    };
    
    // Store for batching
    addToInteractionBuffer(interactionData);
    
    // Trigger batch processing if buffer is full
    if (isBufferFull()) {
      dispatch('flushInteractions', { interactions: getBufferContents() });
      clearBuffer();
    }
    
    return { buffered: true };
  }, [dispatch]), { id: 'interaction-aggregator' });
  
  useActionHandler('flushInteractions', async (payload) => {
    await analytics.batchTrack(payload.interactions);
    return { flushed: payload.interactions.length };
  }, { id: 'interaction-flusher' });
  
  return null;
}
```

## Best Practices

### 1. Handler Organization
- Create dedicated handler components for related functionality
- Use meaningful handler IDs for debugging
- Group handlers by domain or responsibility

### 2. Priority Management
- Use high priorities (90-100) for critical setup/validation
- Use medium priorities (50-80) for business logic
- Use low priorities (10-40) for cleanup/logging

### 3. Error Handling
- Use `controller.abort()` for critical failures that should stop execution
- Return error objects for non-critical failures
- Implement fallback handlers for resilience

### 4. Performance
- Always wrap handlers with `useCallback` to prevent re-registration
- Use handler IDs to enable debugging and profiling
- Avoid complex computations in handlers - delegate to services

### 5. Testing
- Test handlers in isolation using direct action dispatch
- Mock dependencies and services
- Test error scenarios and edge cases

## Related

- **[Action Registry API](./action-registry)** - Action registration and management
- **[Pipeline Controller API](./pipeline-controller)** - Pipeline control methods
- **[Action Only Example](../examples/action-only)** - Complete usage examples