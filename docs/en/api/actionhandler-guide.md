# ActionHandler Type Guide

Handler function type for processing actions in the pipeline.

## Type Signature
```typescript
type ActionHandler<T = any, R = void> = (
  payload: T,
  controller: PipelineController<T, R>
) => R | Promise<R> | void | Promise<void>
```

## Purpose
Defines business logic functions that process specific actions following the Store Integration Pattern.

## Parameters

### payload: T
- **Type**: Action payload data (inferred from ActionPayloadMap)
- **Usage**: Input data for the handler operation
- **Validation**: Automatically typed based on action definition

### controller: PipelineController<T, R>
- **Type**: Pipeline control interface
- **Usage**: Flow control, payload modification, result management
- **Features**: abort(), modifyPayload(), setResult(), etc.

## Return Types

### Synchronous Handlers
```typescript
// Void return (most common)
const simpleHandler: ActionHandler<UserData> = (payload, controller) => {
  userStore.setValue(payload);
  controller.setResult({ success: true });
};

// Direct return value
const calculationHandler: ActionHandler<NumberInput, number> = (payload) => {
  return payload.a + payload.b;
};
```

### Asynchronous Handlers
```typescript
// Promise<void> (async operations)
const asyncHandler: ActionHandler<SaveData> = async (payload, controller) => {
  await saveToDatabase(payload);
  controller.setResult({ saved: true });
};

// Promise<R> (async with return)
const fetchHandler: ActionHandler<FetchRequest, ApiResponse> = async (payload) => {
  const response = await api.get(payload.url);
  return response.data;
};
```

## Usage Patterns

### Store Integration Pattern (Recommended)
```typescript
const updateUserHandler: ActionHandler<UpdateUserPayload> = async (payload, controller) => {
  // 1. Read current state from stores
  const currentUser = userStore.getValue();
  const settings = settingsStore.getValue();
  
  // 2. Execute business logic
  if (!settings.allowUpdates) {
    controller.abort('Updates are disabled');
    return;
  }
  
  const updatedUser = {
    ...currentUser,
    ...payload,
    updatedAt: new Date()
  };
  
  try {
    // API call with current state
    await userApi.update(updatedUser);
    
    // 3. Update stores with new state
    userStore.setValue(updatedUser);
    controller.setResult({ success: true, user: updatedUser });
    
  } catch (error) {
    controller.setResult({ success: false, error: error.message });
  }
};
```

### Validation Handlers
```typescript
const validateUserHandler: ActionHandler<UserInput> = (payload, controller) => {
  const errors: string[] = [];
  
  if (!payload.email?.includes('@')) {
    errors.push('Invalid email format');
  }
  
  if (!payload.name?.trim()) {
    errors.push('Name is required');
  }
  
  if (errors.length > 0) {
    controller.abort(`Validation failed: ${errors.join(', ')}`);
    return;
  }
  
  // Normalize data for next handlers
  controller.modifyPayload(data => ({
    ...data,
    email: data.email.toLowerCase(),
    name: data.name.trim()
  }));
};
```

### Side Effect Handlers
```typescript
const trackingHandler: ActionHandler<UserAction> = async (payload, controller) => {
  // Analytics tracking
  await analytics.track(payload.eventName, {
    userId: payload.userId,
    timestamp: Date.now(),
    metadata: payload.metadata
  });
  
  // Logging
  console.log(`User action: ${payload.eventName}`, payload);
  
  // Don't interfere with other handlers
  controller.setResult({ tracked: true });
};
```

### Caching Handlers
```typescript
const cacheHandler: ActionHandler<DataRequest, CachedData> = async (payload, controller) => {
  const cacheKey = `data:${payload.id}`;
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    // Return cached data, skip expensive handlers
    controller.return({
      data: cached,
      source: 'cache',
      timestamp: cached.timestamp
    });
    return;
  }
  
  // Cache miss - continue to data fetching handlers
  controller.setResult({ cache: 'miss' });
};
```

### Error Recovery Handlers
```typescript
const retryHandler: ActionHandler<ApiRequest> = async (payload, controller) => {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const result = await api.request(payload);
      controller.setResult({ success: true, data: result, attempt });
      return;
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        controller.abort(`Failed after ${maxRetries} attempts: ${error.message}`);
        return;
      }
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
};
```

### Conditional Processing
```typescript
const conditionalHandler: ActionHandler<ProcessRequest> = async (payload, controller) => {
  // Get user permissions
  const user = userStore.getValue();
  
  if (user.role === 'admin') {
    // Admin processing - full access
    const result = await processWithFullAccess(payload);
    controller.setResult({ level: 'admin', result });
  } else if (user.role === 'user') {
    // Regular user - limited processing
    const result = await processWithLimitedAccess(payload);
    controller.setResult({ level: 'user', result });
  } else {
    // Guest - abort
    controller.abort('Authentication required');
    return;
  }
};
```

### Result Aggregation
```typescript
const aggregateHandler: ActionHandler<AggregateRequest> = async (payload, controller) => {
  // Get previous results from other handlers
  const previousResults = controller.getResults();
  
  // Process aggregation
  const aggregated = previousResults.reduce((acc, result) => {
    if (result.data) {
      acc.items.push(...result.data);
      acc.count += result.data.length;
    }
    return acc;
  }, { items: [], count: 0 });
  
  // Add current processing
  const currentData = await processData(payload);
  aggregated.items.push(...currentData);
  aggregated.count += currentData.length;
  
  controller.setResult({
    aggregated,
    sources: previousResults.length + 1,
    totalItems: aggregated.count
  });
};
```

## Type Safety Benefits

### Automatic Type Inference
```typescript
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string };
  deleteUser: { id: string };
  notifyUser: { message: string; type: 'info' | 'warning' | 'error' };
}

// Payload types automatically inferred
register.register('updateUser', (payload, controller) => {
  // payload is typed as { id: string; name: string; email: string }
  console.log(payload.id);    // ✅ TypeScript knows this exists
  console.log(payload.name);  // ✅ TypeScript knows this exists
  console.log(payload.age);   // ❌ TypeScript error - doesn't exist
});

register.register('notifyUser', (payload, controller) => {
  // payload is typed as { message: string; type: 'info' | 'warning' | 'error' }
  if (payload.type === 'error') { // ✅ Type narrowing works
    console.error(payload.message);
  }
});
```

### Generic Type Usage
```typescript
// Explicit typing for complex scenarios
const typedHandler: ActionHandler<
  { data: Array<{ id: string; value: number }> },
  { processed: number; total: number }
> = async (payload, controller) => {
  const processed = payload.data.filter(item => item.value > 0);
  
  return {
    processed: processed.length,
    total: payload.data.length
  };
};
```

## Best Practices

### Handler Organization
```typescript
// Separate concerns with multiple handlers
register.register('processOrder', validateOrderHandler, { priority: 100 });
register.register('processOrder', calculateTotalsHandler, { priority: 200 });
register.register('processOrder', saveOrderHandler, { priority: 300 });
register.register('processOrder', sendNotificationHandler, { priority: 400 });
```

### Error Handling
```typescript
const safeHandler: ActionHandler<RiskyOperation> = async (payload, controller) => {
  try {
    const result = await riskyOperation(payload);
    controller.setResult({ success: true, data: result });
  } catch (error) {
    // Log error but don't crash pipeline
    console.error('Handler error:', error);
    controller.setResult({ 
      success: false, 
      error: error.message,
      timestamp: Date.now() 
    });
  }
};
```

### Resource Cleanup
```typescript
const resourceHandler: ActionHandler<FileOperation> = async (payload, controller) => {
  let fileHandle;
  
  try {
    fileHandle = await openFile(payload.path);
    const result = await processFile(fileHandle, payload.options);
    controller.setResult({ success: true, result });
  } catch (error) {
    controller.abort(`File operation failed: ${error.message}`);
  } finally {
    if (fileHandle) {
      await closeFile(fileHandle);
    }
  }
};
```

## Integration

- **ActionRegister**: Primary usage in `register()` method
- **createActionContext**: React hook integration
- **PipelineController**: Execution control interface
- **Store Integration**: Reactive state management pattern

## Links

- **TypeDoc**: [ActionHandler.md](./core/src/type-aliases/ActionHandler.md)
- **Pipeline Control**: [PipelineController Guide](./pipelinecontroller-guide.md)
- **Store Integration**: [Store Patterns](/en/guide/patterns/store/)