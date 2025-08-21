# Blocking Operations

Control pipeline execution flow with blocking and non-blocking handler configurations.

## Blocking vs Non-Blocking

### Blocking Handlers (Default)

Blocking handlers **wait for completion** before proceeding to the next handler:

```typescript
// ✅ Blocking handler - waits for async completion
actionRegister.register('processData', async (payload) => {
  await heavyProcessing(payload.data);  // Pipeline waits
  return { step: 'processing', completed: true };
}, { 
  priority: 80,
  blocking: true  // Default behavior
});
```

### Non-Blocking Handlers

Non-blocking handlers execute **in the background** without stopping the pipeline:

```typescript
// ⚡ Non-blocking handler - fires and forgets
actionRegister.register('processData', async (payload) => {
  // This runs in background, pipeline continues immediately
  await sendAnalyticsInBackground(payload.data);
  return { step: 'analytics', sent: true };
}, { 
  priority: 30,
  blocking: false  // Explicitly non-blocking
});
```

## Blocking Configuration

### Handler-Level Blocking

Configure blocking behavior per handler:

```typescript
interface OrderActions extends ActionPayloadMap {
  processOrder: { orderId: string; items: Item[] };
}

const orderRegister = new ActionRegister<OrderActions>();

// Blocking: Critical operations that must complete
orderRegister.register('processOrder', validateOrder, { 
  priority: 100, 
  blocking: true   // Wait for validation
});

orderRegister.register('processOrder', chargePayment, { 
  priority: 90, 
  blocking: true   // Wait for payment
});

orderRegister.register('processOrder', updateInventory, { 
  priority: 80, 
  blocking: true   // Wait for inventory update
});

// Non-blocking: Optional operations
orderRegister.register('processOrder', sendConfirmationEmail, { 
  priority: 40, 
  blocking: false  // Don't wait for email
});

orderRegister.register('processOrder', trackAnalytics, { 
  priority: 30, 
  blocking: false  // Don't wait for analytics
});

orderRegister.register('processOrder', auditLog, { 
  priority: 20, 
  blocking: false  // Don't wait for logging
});
```

### Registry-Level Default

Set default blocking behavior for the entire registry:

```typescript
const actionRegister = new ActionRegister<MyActions>({
  name: 'MyApp',
  registry: {
    defaultBlocking: false,  // All handlers non-blocking by default
    defaultExecutionMode: 'sequential'
  }
});

// Override default for specific handlers
actionRegister.register('criticalAction', handler, { 
  blocking: true  // Override registry default
});
```

## Execution Flow Examples

### Example 1: Mixed Blocking/Non-Blocking

```typescript
const executionLog: string[] = [];

// Blocking handlers
actionRegister.register('mixedOperation', () => {
  executionLog.push('Handler A start');
  return new Promise(resolve => {
    setTimeout(() => {
      executionLog.push('Handler A complete');
      resolve({ step: 'A', duration: 100 });
    }, 100);
  });
}, { priority: 100, blocking: true });

actionRegister.register('mixedOperation', () => {
  executionLog.push('Handler B start');
  return new Promise(resolve => {
    setTimeout(() => {
      executionLog.push('Handler B complete');
      resolve({ step: 'B', duration: 50 });
    }, 50);
  });
}, { priority: 90, blocking: true });

// Non-blocking handler
actionRegister.register('mixedOperation', () => {
  executionLog.push('Handler C start');
  return new Promise(resolve => {
    setTimeout(() => {
      executionLog.push('Handler C complete');
      resolve({ step: 'C', duration: 200 });
    }, 200);
  });
}, { priority: 80, blocking: false });

actionRegister.register('mixedOperation', () => {
  executionLog.push('Handler D start');
  return { step: 'D', immediate: true };
}, { priority: 70, blocking: true });

await actionRegister.dispatch('mixedOperation', {});

console.log(executionLog);
// Result:
// [
//   'Handler A start',
//   'Handler A complete',    // A completes before B starts
//   'Handler B start', 
//   'Handler B complete',    // B completes before C starts
//   'Handler C start',       // C starts but doesn't block
//   'Handler D start',       // D starts immediately after C starts
//   'Handler C complete'     // C completes in background
// ]
```

### Example 2: Performance Critical Pipeline

```typescript
interface PerformanceActions extends ActionPayloadMap {
  optimizedOperation: { data: LargeDataSet };
}

const perfRegister = new ActionRegister<PerformanceActions>();

// Critical path - all blocking
perfRegister.register('optimizedOperation', validateData, { 
  priority: 100, 
  blocking: true   // Must validate before processing
});

perfRegister.register('optimizedOperation', processData, { 
  priority: 90, 
  blocking: true   // Must process before returning
});

perfRegister.register('optimizedOperation', cacheResult, { 
  priority: 80, 
  blocking: true   // Must cache before response
});

// Performance monitoring - non-blocking
perfRegister.register('optimizedOperation', trackPerformance, { 
  priority: 30, 
  blocking: false  // Don't delay response for metrics
});

perfRegister.register('optimizedOperation', updateStatistics, { 
  priority: 20, 
  blocking: false  // Background statistics update
});

// Result: Critical operations complete first, monitoring runs in background
```

## Advanced Blocking Patterns

### Conditional Blocking

```typescript
actionRegister.register('conditionalOperation', async (payload, controller) => {
  const results = controller.getResults();
  const needsBlocking = shouldBlock(payload, results);
  
  if (needsBlocking) {
    // Synchronous operation
    const result = await processSync(payload.data);
    return { step: 'conditional', mode: 'sync', result };
  } else {
    // Fire and forget
    processAsync(payload.data);
    return { step: 'conditional', mode: 'async', started: true };
  }
}, { 
  priority: 70,
  blocking: true  // Handler itself is blocking, but internal logic varies
});
```

### Dynamic Blocking with Configuration

```typescript
interface ConfigurableActions extends ActionPayloadMap {
  flexibleOperation: { 
    data: any; 
    config: { 
      waitForCompletion: boolean;
      timeoutMs?: number;
    };
  };
}

actionRegister.register('flexibleOperation', async (payload, controller) => {
  const operation = performOperation(payload.data);
  
  if (payload.config.waitForCompletion) {
    // Wait for completion
    const result = await operation;
    return { step: 'flexible', mode: 'waited', result };
  } else {
    // Continue immediately
    operation.then(result => {
      // Handle result in background
      controller.setResult({ step: 'background', result });
    });
    return { step: 'flexible', mode: 'background', started: true };
  }
}, { 
  priority: 70,
  blocking: true  // Handler waits based on payload config
});
```

## Performance Considerations

### When to Use Blocking

✅ **Use blocking for:**
- Critical validation that affects subsequent handlers
- Security checks that must complete
- Data transformations needed by later handlers  
- Operations where order matters
- Error-prone operations that need immediate feedback

### When to Use Non-Blocking

⚡ **Use non-blocking for:**
- Analytics and tracking
- Audit logging
- Performance monitoring
- Email notifications
- Background cleanup
- Optional enhancements

### Performance Impact

```typescript
// Blocking pipeline - total execution time is sum of all handlers
const blockingDuration = handler1Time + handler2Time + handler3Time;

// Non-blocking pipeline - execution time is longest blocking handler
const nonBlockingDuration = Math.max(
  blockingHandler1Time + blockingHandler2Time,  // Sequential blocking
  nonBlockingHandler1Time,                      // Parallel non-blocking
  nonBlockingHandler2Time                       // Parallel non-blocking
);
```

## Error Handling with Blocking

### Blocking Handler Errors

```typescript
actionRegister.register('sensitiveOperation', async (payload, controller) => {
  try {
    await criticalOperation(payload.data);
    return { step: 'critical', success: true };
  } catch (error) {
    // Blocking handler error stops pipeline
    controller.abort(`Critical operation failed: ${error.message}`);
  }
}, { priority: 100, blocking: true });
```

### Non-Blocking Handler Errors

```typescript
actionRegister.register('sensitiveOperation', async (payload) => {
  try {
    await backgroundOperation(payload.data);
    return { step: 'background', success: true };
  } catch (error) {
    // Non-blocking handler error doesn't stop pipeline
    console.error('Background operation failed:', error);
    return { step: 'background', success: false, error: error.message };
  }
}, { priority: 30, blocking: false });
```

## Live Example: API Blocking Demo

See a comprehensive implementation of blocking operations in the [API Blocking Demo](https://mineclover.github.io/context-action/example/actionguard/api-blocking):

```typescript
// Blocking rate limiter that must complete before API calls
useApiActionHandler('rateLimit', rateLimitHandler, { 
  priority: 100, 
  blocking: true 
});

// Blocking API call that waits for rate limit clearance
useApiActionHandler('apiCall', apiHandler, { 
  priority: 80, 
  blocking: true 
});

// Non-blocking analytics that runs in background
useApiActionHandler('trackMetrics', metricsHandler, { 
  priority: 20, 
  blocking: false 
});
```

This example shows real-world rate limiting with blocking vs non-blocking patterns for optimal API management.

## Related

- **[Priority System](./priority.md)** - Priority-based execution order
- **[Abort Mechanisms](./abort.md)** - Stop pipeline execution when needed
- **[Result Handling](./result-handling.md)** - Collect and use handler results
- **[Dispatch Methods](./dispatch.md)** - Different ways to trigger pipelines