# Dispatch with Result Patterns

Advanced result collection and processing patterns for the Context-Action framework.

## Prerequisites

For complete setup instructions including type definitions, context creation, and provider configuration, see **[Basic Action Setup](../setup/basic-action-setup.md)**.

This document uses the following patterns from the setup guide:
- Type definitions → [Event Actions Pattern](../setup/basic-action-setup.md#common-action-patterns)  
- Context creation → [Single Domain Context](../setup/basic-action-setup.md#single-domain-context)
- Provider setup → [Single Provider Setup](../setup/basic-action-setup.md#single-provider-setup)

### Setup Context Hooks Used
```typescript
// From setup patterns - these hooks are available after context creation:
const useEventDispatch = EventContext.useActionDispatchWithResult; // EventActions
const useUserDispatch = UserContext.useActionDispatchWithResult;   // UserActions  
const useAPIDispatch = APIContext.useActionDispatchWithResult;     // APIActions
```

## Core Concepts

### `dispatchWithResult` vs `dispatch`

**Key Difference**: `dispatchWithResult()` **always** collects handler results in the `results` array, regardless of options.

```typescript
const { dispatch, dispatchWithResult } = useEventDispatch();

// Regular dispatch - returns void
await dispatch('analytics', { event: 'click' });

// dispatchWithResult - always returns ExecutionResult with results array
const result = await dispatchWithResult('analytics', { event: 'click' });

console.log(result.results); // Always contains handler results (even without collect: true)
console.log(result.result);  // undefined (unless collect: true is specified)
```

### Understanding `collect: true`

The `collect: true` option affects **result processing**, not result collection:

```typescript
const { dispatchWithResult } = useEventDispatch();

// Without collect: true
const result1 = await dispatchWithResult('analytics', data);
console.log(result1.results); // [result1, result2, result3] - Always collected!
console.log(result1.result);  // undefined - No processing

// With collect: true  
const result2 = await dispatchWithResult('analytics', data, {
  result: { collect: true, strategy: 'first' }
});
console.log(result2.results); // [result1, result2, result3] - Same as above
console.log(result2.result);  // result1 - Processed using 'first' strategy
```

## Basic Result Collection

Every `dispatchWithResult()` call provides comprehensive execution metadata:

```typescript
const { dispatchWithResult } = useEventDispatch();

const result = await dispatchWithResult('analytics', {
  event: 'user-interaction',
  data: { timestamp: Date.now() }
});

// Always available - execution metadata
console.log('Success:', result.success);
console.log('Duration:', result.execution.duration + 'ms');
console.log('Handlers executed:', result.execution.handlersExecuted);
console.log('Total results:', result.results.length);

// Always available - raw results from all handlers
result.results.forEach((handlerResult, index) => {
  console.log(`Handler ${index} result:`, handlerResult);
});

// Only available with collect: true - processed result
console.log('Processed result:', result.result); // undefined without collect: true
```

## Result Collection Strategies

Strategies control how the `result` field is processed from the raw `results` array.

### Strategy Overview

```typescript
const { dispatchWithResult } = useUserDispatch();

// Register multiple handlers
register.register('updateProfile', () => ({ step: 'validation', success: true }), { priority: 30 });
register.register('updateProfile', () => ({ step: 'database', id: 123 }), { priority: 20 });
register.register('updateProfile', () => ({ step: 'notification', sent: true }), { priority: 10 });

const result = await dispatchWithResult('updateProfile', userData, {
  result: { collect: true, strategy: 'first' }
});

console.log(result.results); // Always contains all 3 results
console.log(result.result);  // Only first result (due to 'first' strategy)
```

### First Strategy

Get the result from the highest priority handler:

```typescript
const result = await dispatchWithResult('updateProfile', userData, {
  result: { collect: true, strategy: 'first' }
});

console.log(result.result); // { step: 'validation', success: true } (highest priority)
```

### Last Strategy

Get the result from the lowest priority handler:

```typescript
const result = await dispatchWithResult('updateProfile', userData, {
  result: { collect: true, strategy: 'last' }
});

console.log(result.result); // { step: 'notification', sent: true } (lowest priority)
```

### All Strategy (Default)

Get all handler results as an array:

```typescript
const result = await dispatchWithResult('updateProfile', userData, {
  result: { collect: true, strategy: 'all' }
});

console.log(result.result); // Array of all 3 results
```

### Merge Strategy

Combine results using a custom merger function:

```typescript
const result = await dispatchWithResult('updateProfile', userData, {
  result: {
    collect: true,
    strategy: 'merge',
    merger: (results) => results.reduce((acc, curr) => ({ ...acc, ...curr }), {})
  }
});

console.log(result.result); 
// { step: 'notification', success: true, id: 123, sent: true } (merged object)
```

### Custom Strategy

Apply custom processing logic:

```typescript
const result = await dispatchWithResult('analytics', eventData, {
  result: {
    collect: true,
    strategy: 'custom',
    merger: (results) => {
      const successful = results.filter(r => r?.success);
      const failed = results.filter(r => r?.error);
      
      return {
        summary: `${successful.length}/${results.length} successful`,
        successful,
        failed,
        totalDuration: results.reduce((sum, r) => sum + (r?.duration || 0), 0)
      };
    }
  }
});
```

## Result Limits and Filtering

### Understanding `maxResults`

**Important**: `maxResults` only affects the processed `result` field, not the raw `results` array.

```typescript
// Register 5 handlers
for (let i = 1; i <= 5; i++) {
  register.register('fetchData', () => ({ handler: i, data: `result-${i}` }), 
    { priority: 50 - i * 5 });
}

const result = await dispatchWithResult('fetchData', params, {
  result: { collect: true, maxResults: 3, strategy: 'all' }
});

console.log(result.results.length);    // 5 - Always contains ALL handler results
console.log(result.result.length);     // 3 - Limited by maxResults for processing
console.log(result.results);           // [result1, result2, result3, result4, result5]
console.log(result.result);            // [result1, result2, result3] - First 3 only
```

### Error Handling with `includeErrors`

Control whether errors are included in result processing:

```typescript
// Register handlers that may fail
register.register('riskyOperation', () => { throw new Error('Handler failed'); });
register.register('riskyOperation', () => ({ success: true }));

const result = await dispatchWithResult('riskyOperation', data, {
  result: { 
    collect: true, 
    includeErrors: true,  // Include errors in processing
    strategy: 'all' 
  }
});

console.log(result.success);         // false (pipeline failed)
console.log(result.results.length);  // 2 (error + success result)
console.log(result.errors.length);   // 1 (error details)
```

## Pipeline Controller Integration

### Using `controller.setResult()`

Add results during handler execution without returning them:

```typescript
register.register('dataProcessor', (payload, controller) => {
  // Set intermediate results
  controller.setResult({ step: 'validation', completed: true });
  controller.setResult({ step: 'processing', data: processedData });
  
  // Return final result
  return { step: 'complete', success: true };
});

const result = await dispatchWithResult('dataProcessor', data);

console.log(result.results.length); // 3 - two setResult() calls + return value
```

### Early Termination with `controller.return()`

Terminate pipeline early with a specific result:

```typescript
register.register('validator', (payload, controller) => {
  if (!payload.isValid) {
    controller.return({ error: 'Invalid data', code: 400 });
    return { unreachable: true }; // This won't be collected
  }
  return { validated: true };
}, { priority: 20 });

register.register('processor', () => {
  return { processed: true }; // This won't execute if validation fails
}, { priority: 10 });

const result = await dispatchWithResult('processData', invalidData, {
  result: { collect: true }
});

console.log(result.terminated);      // true
console.log(result.result);          // { error: 'Invalid data', code: 400 }
console.log(result.results.length);  // 0 - no results collected when terminated early
```

### Abort Handling with `controller.abort()`

Abort pipeline execution while preserving collected results:

```typescript
register.register('processor', (payload, controller) => {
  controller.setResult({ progress: 'started' });
  
  if (payload.shouldAbort) {
    controller.abort('User requested abort');
    return { completed: false }; // This still gets collected
  }
  
  return { completed: true };
});

const result = await dispatchWithResult('processData', { shouldAbort: true });

console.log(result.success);         // false (aborted)
console.log(result.aborted);         // true
console.log(result.abortReason);     // 'User requested abort'
console.log(result.results.length);  // 2 - setResult() + return value both collected
```

## Execution Metadata

Access detailed execution information.

### Basic Metadata

```typescript
const { dispatchWithResult } = useEventDispatch();

const result = await dispatchWithResult('trackInteraction', {
  type: 'button_click',
  metadata: { component: 'header', section: 'navigation' }
});

// Always available execution metadata
console.log('Execution metadata:', {
  success: result.success,                              // true/false
  duration: result.execution.duration,                 // milliseconds
  handlersExecuted: result.execution.handlersExecuted, // number
  handlersSkipped: result.execution.handlersSkipped,   // number  
  handlersFailed: result.execution.handlersFailed,     // number
  startTime: result.execution.startTime,               // timestamp
  endTime: result.execution.endTime                    // timestamp
});
```

### Async Handler Execution

Async handlers are properly awaited and their results collected:

```typescript
// Register both sync and async handlers
register.register('processData', async (payload) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return { async: true, processed: payload };
}, { priority: 20 });

register.register('processData', (payload) => {
  return { sync: true, immediate: true };
}, { priority: 10 });

const result = await dispatchWithResult('processData', data);

console.log(result.results.length); // 2 - both sync and async results
console.log(result.success);        // true - both handlers completed successfully

// Results are collected in execution order (priority-based)
result.results.forEach((handlerResult, index) => {
  console.log(`Handler ${index}:`, handlerResult);
  // Handler 0: { async: true, processed: data }
  // Handler 1: { sync: true, immediate: true }
});
```

### Error Handling in Async Context

Non-blocking async errors don't fail the pipeline:

```typescript
// Mix of blocking and non-blocking handlers
register.register('riskyAsync', async () => {
  throw new Error('Async failure');
}, { blocking: false }); // Non-blocking

register.register('safeSync', () => {
  return { success: true };
}, { blocking: true }); // Blocking

const result = await dispatchWithResult('mixedOperation', data, {
  result: { collect: true, includeErrors: true }
});

console.log(result.success);        // true - non-blocking errors don't fail pipeline
console.log(result.errors.length);  // 1 - async error is collected
console.log(result.results.length); // 1 - only successful results in results array
```

## Advanced Usage Patterns

### Performance Monitoring

Track execution performance and identify bottlenecks:

```typescript
const { dispatchWithResult } = useAPIDispatch();

const result = await dispatchWithResult('complexOperation', data);

// Performance analysis
if (result.execution.duration > 1000) {
  console.warn('Slow operation detected:', {
    duration: result.execution.duration,
    handlersExecuted: result.execution.handlersExecuted,
    avgHandlerTime: result.execution.duration / result.execution.handlersExecuted
  });
}

// Success rate tracking
const isSuccess = result.success && result.execution.handlersFailed === 0;
console.log(`Operation success: ${isSuccess ? 'OK' : 'FAILED'}`);
```

### Validation Pipeline Pattern

Sequential validation with early failure detection:

```typescript
const { dispatchWithResult } = useUserDispatch();

// Register validators in priority order
register.register('validateUser', (userData, controller) => {
  if (!userData.email) {
    controller.return({ valid: false, error: 'Email required' });
  }
  return { emailValid: true };
}, { priority: 30 });

register.register('validateUser', (userData, controller) => {
  if (userData.age < 18) {
    controller.return({ valid: false, error: 'Must be 18+' });
  }
  return { ageValid: true };
}, { priority: 20 });

const result = await dispatchWithResult('validateUser', userData, {
  executionMode: 'sequential',
  result: { collect: true, strategy: 'first' }
});

if (result.terminated) {
  throw new ValidationError('Validation failed', result.result);
}

console.log('All validations passed:', result.results);
```

### Data Processing Chain

Transform data through multiple processing stages:

```typescript
const { dispatchWithResult } = useAPIDispatch();

// Each handler transforms the data
register.register('processOrder', (order) => {
  return { ...order, priceCalculated: order.price * order.quantity };
}, { priority: 30 });

register.register('processOrder', (order) => {
  return { ...order, taxApplied: order.priceCalculated * 1.1 };
}, { priority: 20 });

register.register('processOrder', (order) => {
  return { ...order, formatted: `$${order.taxApplied.toFixed(2)}` };
}, { priority: 10 });

const result = await dispatchWithResult('processOrder', rawOrder, {
  executionMode: 'sequential',
  result: { collect: true, strategy: 'last' }
});

console.log('Final processed order:', result.result);
```

### Batch Processing with Results

Handle large datasets with partial success tracking:

```typescript
const { dispatchWithResult } = useAPIDispatch();

const batchItems = Array.from({ length: 100 }, (_, i) => ({ id: i, data: `item-${i}` }));

const result = await dispatchWithResult('processBatch', batchItems, {
  result: {
    collect: true,
    includeErrors: true,
    strategy: 'custom',
    merger: (results) => {
      const successful = results.filter(r => r && !r.error);
      const failed = results.filter(r => r && r.error);
      
      return {
        processed: successful.length,
        failed: failed.length,
        total: results.length,
        successRate: (successful.length / results.length * 100).toFixed(2) + '%',
        errors: failed.map(r => r.error)
      };
    }
  }
});

console.log('Batch processing summary:', result.result);
```

### Real-time Analytics Collection

Collect and aggregate analytics from multiple handlers:

```typescript
const { dispatchWithResult } = useEventDispatch();

// Multiple analytics handlers
register.register('trackEvent', (event) => ({ platform: 'web', event }));
register.register('trackEvent', (event) => ({ database: 'logged', timestamp: Date.now() }));
register.register('trackEvent', (event) => ({ cache: 'updated', key: event.type }));

const result = await dispatchWithResult('trackEvent', eventData, {
  executionMode: 'parallel',
  result: {
    collect: true,
    strategy: 'custom',
    merger: (results) => ({
      handlers: results.length,
      platforms: results.map(r => r.platform).filter(Boolean),
      timestamps: results.map(r => r.timestamp).filter(Boolean),
      analytics: results.reduce((acc, r) => ({ ...acc, ...r }), {})
    })
  }
});

console.log('Analytics collected:', result.result);
```

### Error Recovery and Fallbacks

Implement graceful error handling with fallback results:

```typescript
const { dispatchWithResult } = useAPIDispatch();

// Primary + fallback handlers
register.register('fetchUserData', async (userId) => {
  try {
    return await primaryDataSource.getUser(userId);
  } catch (error) {
    throw new Error('Primary source failed');
  }
}, { priority: 20 });

register.register('fetchUserData', async (userId) => {
  // Fallback to cache
  return await cacheService.getUser(userId) || { id: userId, cached: true };
}, { priority: 10 });

const result = await dispatchWithResult('fetchUserData', userId, {
  result: { collect: true, strategy: 'first', includeErrors: false }
});

// Always get a result (primary or fallback)
console.log('User data:', result.result);
console.log('Source:', result.errors.length > 0 ? 'fallback' : 'primary');
```

### Testing and Debugging

Debug handler execution and results:

```typescript
const { dispatchWithResult } = useEventDispatch();

const result = await dispatchWithResult('debugAction', testData);

// Comprehensive debugging info
console.log('Execution Summary:', {
  success: result.success,
  duration: `${result.execution.duration}ms`,
  handlers: `${result.execution.handlersExecuted}/${result.results.length}`,
  results: result.results.map((r, i) => ({ index: i, type: typeof r, value: r })),
  errors: result.errors.map(e => ({ handler: e.handlerId, message: e.error.message }))
});

// Individual result analysis
result.results.forEach((handlerResult, index) => {
  console.log(`Handler ${index} result:`, {
    hasResult: handlerResult !== undefined,
    type: typeof handlerResult,
    keys: handlerResult ? Object.keys(handlerResult) : [],
    value: handlerResult
  });
});
```

## Best Practices

### 1. Use `collect: true` for Result Processing
```typescript
// Good: Use collect when you need processed results
const result = await dispatchWithResult('action', data, {
  result: { collect: true, strategy: 'merge' }
});
console.log(result.result); // Processed result

// Also good: Access raw results without collect
const result2 = await dispatchWithResult('action', data);
console.log(result2.results); // All handler results
```

### 2. Choose Appropriate Strategies
```typescript
// Use 'first' for validation (early exit)
result: { collect: true, strategy: 'first' }

// Use 'merge' for aggregation
result: { collect: true, strategy: 'merge', merger: combineResults }

// Use 'all' for collecting everything
result: { collect: true, strategy: 'all' }
```

### 3. Handle Async Properly
```typescript
// Mix blocking and non-blocking appropriately
register.register('critical', criticalHandler, { blocking: true });
register.register('optional', optionalHandler, { blocking: false });
```

### 4. Monitor Performance
```typescript
const result = await dispatchWithResult('action', data);
if (result.execution.duration > 1000) {
  console.warn('Slow action:', result.execution);
}
```

## Related Patterns

- [Dispatch Patterns](./dispatch-patterns.md) - Basic dispatching patterns
- [Register Patterns](./register-patterns.md) - Handler registration patterns  
- [Pipeline Flow Control](../../pipeline/flow-control.md) - Advanced pipeline control
- [Type System](./type-system.md) - TypeScript integration
- [Action Basic Usage](./basic-usage.md) - Fundamental patterns