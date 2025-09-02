# PipelineController Interface Guide

Execution control interface for action handlers in the pipeline.

## Purpose
Provides handlers with powerful control over pipeline execution, payload modification, result management, and flow control.

## Core Methods

### abort()
```typescript
abort(reason?: string): void
```
- **Purpose**: Stop pipeline execution immediately
- **Usage**: Validation failures, error conditions, early termination
- **Effect**: No subsequent handlers execute

### modifyPayload()
```typescript
modifyPayload(modifier: (payload: T) => T): void
```
- **Purpose**: Transform payload for subsequent handlers
- **Usage**: Data normalization, enrichment, preprocessing
- **Effect**: Next handlers receive modified payload

### getPayload()
```typescript
getPayload(): T
```
- **Purpose**: Access current payload state
- **Usage**: Read current payload after modifications
- **Returns**: Current payload (may be modified by previous handlers)

## Flow Control

### jumpToPriority()
```typescript
jumpToPriority(priority: number): void
```
- **Purpose**: Skip to handlers at specific priority level
- **Usage**: Conditional routing, security escalation
- **Effect**: Skips handlers between current and target priority

### return()
```typescript
return(result: R): void
```
- **Purpose**: Return result and terminate pipeline
- **Usage**: Early return with data, cache hits, short-circuit patterns
- **Effect**: Pipeline stops, returns this result

## Result Management

### setResult()
```typescript
setResult(result: R): void
```
- **Purpose**: Set result but continue pipeline
- **Usage**: Intermediate results, step-by-step processing
- **Effect**: Result collected, pipeline continues

### getResults()
```typescript
getResults(): R[]
```
- **Purpose**: Access all previous handler results
- **Usage**: Aggregation, dependency on previous results
- **Returns**: Array of results from executed handlers

### mergeResult()
```typescript
mergeResult(merger: (previousResults: R[], currentResult: R) => R): void
```
- **Purpose**: Custom result merging logic
- **Usage**: Complex result aggregation, custom merge strategies
- **Effect**: Merges current result with previous results

## Usage Patterns

### Validation & Early Abort
```typescript
register.register('validateUser', async (payload, controller) => {
  // Input validation
  if (!payload.email?.includes('@')) {
    controller.abort('Invalid email format');
    return; // Pipeline stops here
  }
  
  if (!payload.id) {
    controller.abort('User ID required');
    return;
  }
  
  // Continue to next handler if validation passes
});
```

### Payload Transformation
```typescript
register.register('normalizeData', async (payload, controller) => {
  controller.modifyPayload(data => ({
    ...data,
    email: data.email.toLowerCase().trim(),
    name: data.name.trim(),
    timestamp: Date.now(),
    processed: true
  }));
  
  // Next handlers receive normalized payload
});
```

### Caching & Early Return
```typescript
register.register('checkCache', async (payload, controller) => {
  const cached = await cache.get(payload.key);
  
  if (cached) {
    // Return cached data, skip expensive handlers
    controller.return({ 
      data: cached, 
      source: 'cache',
      timestamp: cached.timestamp 
    });
    return; // Pipeline terminates with this result
  }
  
  // Cache miss - continue to data fetching handlers
});
```

### Conditional Routing
```typescript
register.register('routeRequest', async (payload, controller) => {
  if (payload.requiresElevatedPermissions) {
    // Jump to high-priority security handlers
    controller.jumpToPriority(1000);
  } else if (payload.isBatchOperation) {
    // Jump to batch processing handlers  
    controller.jumpToPriority(500);
  }
  
  // Otherwise continue with normal flow
}, { priority: 100 });
```

### Result Aggregation
```typescript
register.register('collectResults', async (payload, controller) => {
  // Get all previous results
  const previousResults = controller.getResults();
  
  // Process and aggregate
  const aggregated = previousResults.reduce((acc, result) => ({
    ...acc,
    ...result,
    count: acc.count + 1
  }), { count: 0 });
  
  controller.setResult(aggregated);
});
```

### Advanced Result Merging
```typescript
register.register('mergeData', async (payload, controller) => {
  const currentResult = await processData(payload);
  
  // Custom merge strategy
  controller.mergeResult((previousResults, current) => {
    const allData = previousResults.flatMap(r => r.data || []);
    return {
      data: [...allData, ...current.data],
      totalCount: allData.length + current.data.length,
      sources: [...new Set([...previousResults.map(r => r.source), current.source])]
    };
  });
});
```

### Multi-Step Processing
```typescript
register.register('step1-authenticate', async (payload, controller) => {
  const user = await authenticate(payload.token);
  
  controller.modifyPayload(data => ({ ...data, user }));
  controller.setResult({ step: 1, authenticated: true });
}, { priority: 100 });

register.register('step2-authorize', async (payload, controller) => {
  const currentPayload = controller.getPayload();
  const permissions = await authorize(currentPayload.user, payload.action);
  
  if (!permissions.allowed) {
    controller.abort('Insufficient permissions');
    return;
  }
  
  controller.modifyPayload(data => ({ ...data, permissions }));
  controller.setResult({ step: 2, authorized: true });
}, { priority: 200 });

register.register('step3-execute', async (payload, controller) => {
  const currentPayload = controller.getPayload();
  const result = await executeAction(currentPayload);
  
  const previousResults = controller.getResults();
  controller.setResult({ 
    step: 3, 
    result, 
    pipeline: { steps: previousResults.length + 1 }
  });
}, { priority: 300 });
```

## Best Practices

### Error Handling
```typescript
register.register('safeHandler', async (payload, controller) => {
  try {
    const result = await riskyOperation(payload);
    controller.setResult(result);
  } catch (error) {
    // Don't abort - let error handling middleware deal with it
    controller.setResult({ 
      error: true, 
      message: error.message,
      timestamp: Date.now() 
    });
  }
});
```

### Conditional Logic
```typescript
register.register('conditionalProcessor', async (payload, controller) => {
  if (payload.skipProcessing) {
    // Skip this handler but continue pipeline
    return;
  }
  
  if (payload.fastTrack) {
    // Fast track - skip intermediate handlers
    const result = await quickProcess(payload);
    controller.return(result);
    return;
  }
  
  // Normal processing
  const result = await normalProcess(payload);
  controller.setResult(result);
});
```

### Payload Validation Chain
```typescript
// Chain of validation handlers
register.register('validateRequired', async (payload, controller) => {
  const required = ['id', 'email', 'name'];
  const missing = required.filter(field => !payload[field]);
  
  if (missing.length > 0) {
    controller.abort(`Missing required fields: ${missing.join(', ')}`);
    return;
  }
}, { priority: 10 });

register.register('validateFormat', async (payload, controller) => {
  if (payload.email && !isValidEmail(payload.email)) {
    controller.abort('Invalid email format');
    return;
  }
  
  // Normalize for next handlers
  controller.modifyPayload(data => ({
    ...data,
    email: data.email.toLowerCase()
  }));
}, { priority: 20 });
```

## Integration

- **ActionRegister**: Provided as second parameter to handlers
- **Handler Functions**: Primary interface for business logic
- **Type Safety**: Generic types `<T, R>` for payload and result
- **Pipeline Control**: Core mechanism for advanced action patterns

## Links

- **TypeDoc**: [PipelineController.md](./core/src/interfaces/PipelineController.md)  
- **Action Handlers**: [ActionHandler Guide](./actionhandler-guide.md)
- **Usage Examples**: [Action Patterns](/en/guide/patterns/action/)