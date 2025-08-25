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

## Basic Result Collection

Collect execution results and metadata from action dispatches.

```typescript
// Using EventActions from the setup pattern
const dispatch = useEventDispatch();

const result = await dispatch.dispatchWithResult('analytics', {
  event: 'user-interaction',
  data: { timestamp: Date.now() }
});

if (result.success) {
  console.log(`Executed ${result.execution.handlersExecuted} handlers`);
  console.log(`Duration: ${result.execution.duration}ms`);
  console.log('Final result:', result.results);
}
```

## Result Collection Strategies

### Merge Strategy

```typescript
// Using UserActions from the setup pattern  
const dispatch = useUserDispatch();

const result = await dispatch.dispatchWithResult('updateProfile', {
  name: 'John Doe',
  email: 'john@example.com'
}, {
  result: {
    collect: true,
    strategy: 'merge',
    maxResults: 5,
    merger: (results) => results.reduce((acc, curr) => ({ ...acc, ...curr }), {})
  }
});

console.log('Merged results:', result.results);
```

### Array Strategy

```typescript
// Using APIActions from the setup pattern
const dispatch = useAPIDispatch();

const result = await dispatch.dispatchWithResult('fetchData', {
  endpoint: '/api/users',
  params: { limit: 10 }
}, {
  result: {
    collect: true,
    strategy: 'array',
    maxResults: 10
  }
});

// results is an array of all handler results
result.results.forEach((handlerResult, index) => {
  console.log(`Handler ${index} result:`, handlerResult);
});
```

### Custom Strategy

```typescript
// Using EventActions for complex analytics processing
const dispatch = useEventDispatch();

const result = await dispatch.dispatchWithResult('analytics', {
  event: 'complex-operation',
  data: { userId: 123, feature: 'dashboard' }
}, {
  result: {
    collect: true,
    strategy: 'custom',
    merger: (results) => {
      // Custom business logic for result aggregation
      return {
        summary: results.length,
        errors: results.filter(r => r.error),
        success: results.filter(r => r.success),
        data: results.map(r => r.data).filter(Boolean)
      };
    }
  }
});
```

## Execution Metadata

Access detailed execution information.

### Basic Metadata

```typescript
// Using EventActions for tracking
const dispatch = useEventDispatch();

const result = await dispatch.dispatchWithResult('trackInteraction', {
  type: 'button_click',
  metadata: { component: 'header', section: 'navigation' }
});

console.log('Execution metadata:', {
  duration: result.execution.duration,
  handlersExecuted: result.execution.handlersExecuted,
  totalHandlers: result.execution.totalHandlers,
  success: result.success
});
```

### Handler-Level Metadata

```typescript
// Using EventActions for detailed analytics
const dispatch = useEventDispatch();

const result = await dispatch.dispatchWithResult('analytics', {
  event: 'detailed-operation',
  data: { timestamp: Date.now(), userId: 'user123' }
}, {
  result: {
    collect: true,
    includeMetadata: true
  }
});

result.results.forEach((handlerResult, index) => {
  console.log(`Handler ${index}:`, {
    result: handlerResult.value,
    duration: handlerResult.metadata.duration,
    priority: handlerResult.metadata.priority,
    tags: handlerResult.metadata.tags
  });
});
```

## Performance Monitoring

### Timing Analysis

```typescript
// Using APIActions for performance monitoring
const dispatch = useAPIDispatch();

const result = await dispatch.dispatchWithResult('fetchData', {
  endpoint: '/api/performance-test',
  params: { size: 'large' }
});

if (result.execution.duration > 1000) {
  console.warn('Slow action detected:', {
    action: 'fetchData',
    duration: result.execution.duration,
    handlers: result.execution.handlersExecuted
  });
}
```

### Success Rate Tracking

```typescript
// Using APIActions for reliability testing
const dispatch = useAPIDispatch();
const results = [];

for (let i = 0; i < 100; i++) {
  const result = await dispatch.dispatchWithResult('fetchData', {
    endpoint: '/api/reliability-test',
    params: { attempt: i }
  });
  results.push(result.success);
}

const successRate = results.filter(Boolean).length / results.length;
console.log(`Success rate: ${(successRate * 100).toFixed(2)}%`);
```

## Business Logic Patterns

### Validation Pipeline

```typescript
// Using UserActions for profile validation
const dispatch = useUserDispatch();

const result = await dispatch.dispatchWithResult('updateProfile', {
  name: 'John Doe',
  email: 'john@example.com'
}, {
  executionMode: 'sequential',
  result: {
    collect: true,
    strategy: 'merge'
  }
});

if (!result.success) {
  // Collect all validation errors
  const validationErrors = result.results.errors || [];
  throw new ValidationError('User validation failed', validationErrors);
}
```

### Data Processing Pipeline

```typescript
// Using APIActions for data transformation
const dispatch = useAPIDispatch();

const result = await dispatch.dispatchWithResult('postData', {
  endpoint: '/api/process-pipeline',
  data: rawData
}, {
  executionMode: 'sequential',
  result: {
    collect: true,
    strategy: 'custom',
    merger: (results) => {
      // Each handler transforms the data
      return results.reduce((data, handlerResult) => {
        return handlerResult.transformedData || data;
      }, rawData);
    }
  }
});

console.log('Processed data:', result.results);
```

### Aggregation Patterns

```typescript
// Using APIActions for metrics aggregation
const dispatch = useAPIDispatch();

const result = await dispatch.dispatchWithResult('fetchData', {
  endpoint: '/api/metrics-aggregate',
  params: { period: 'monthly', includeDetails: true }
}, {
  executionMode: 'parallel',
  result: {
    collect: true,
    strategy: 'custom',
    merger: (results) => ({
      totalUsers: results.reduce((sum, r) => sum + (r.userCount || 0), 0),
      totalRevenue: results.reduce((sum, r) => sum + (r.revenue || 0), 0),
      averageScore: results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length
    })
  }
});
```

## Error Result Handling

### Partial Success Handling

```typescript
// Using APIActions for batch processing
const dispatch = useAPIDispatch();

const result = await dispatch.dispatchWithResult('postData', {
  endpoint: '/api/batch-process',
  data: items
}, {
  continueOnError: true,
  result: {
    collect: true,
    strategy: 'custom',
    merger: (results) => ({
      successful: results.filter(r => r.success),
      failed: results.filter(r => r.error),
      total: results.length
    })
  }
});

console.log(`Processed ${result.results.successful.length}/${result.results.total} items`);
```

### Retry with Results

```typescript
// Using APIActions with retry pattern
const dispatch = useAPIDispatch();

async function fetchDataWithRetry(endpoint: string, params: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await dispatch.dispatchWithResult('fetchData', {
      endpoint,
      params
    });
    
    if (result.success) {
      return result;
    }
    
    if (attempt === maxRetries) {
      throw new Error(`API call failed after ${maxRetries} attempts`);
    }
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
  }
}
```

## Related Patterns

- [Dispatch Patterns](./dispatch-patterns.md) - Basic dispatching patterns
- [Register Patterns](./register-patterns.md) - Handler registration patterns
- [Type System](./type-system.md) - TypeScript integration
- [Action Basic Usage](./basic-usage.md) - Fundamental patterns