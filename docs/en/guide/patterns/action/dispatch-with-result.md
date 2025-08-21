# Dispatch with Result Patterns

Advanced result collection and processing patterns for the Context-Action framework.

## Basic Result Collection

Collect execution results and metadata from action dispatches.

```typescript
const result = await register.dispatchWithResult('updateUser', payload)

if (result.success) {
  console.log(`Executed ${result.execution.handlersExecuted} handlers`)
  console.log(`Duration: ${result.execution.duration}ms`)
  console.log('Final result:', result.results)
}
```

## Result Collection Strategies

### Merge Strategy

```typescript
const result = await register.dispatchWithResult('processOrder', order, {
  result: {
    collect: true,
    strategy: 'merge',
    maxResults: 5,
    merger: (results) => results.reduce((acc, curr) => ({ ...acc, ...curr }), {})
  }
})

console.log('Merged results:', result.results)
```

### Array Strategy

```typescript
const result = await register.dispatchWithResult('collectData', payload, {
  result: {
    collect: true,
    strategy: 'array',
    maxResults: 10
  }
})

// results is an array of all handler results
result.results.forEach((handlerResult, index) => {
  console.log(`Handler ${index} result:`, handlerResult)
})
```

### Custom Strategy

```typescript
// Custom result processing
const result = await register.dispatchWithResult('complexOperation', data, {
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
      }
    }
  }
})
```

## Execution Metadata

Access detailed execution information.

### Basic Metadata

```typescript
const result = await register.dispatchWithResult('trackingAction', payload)

console.log('Execution metadata:', {
  duration: result.execution.duration,
  handlersExecuted: result.execution.handlersExecuted,
  totalHandlers: result.execution.totalHandlers,
  success: result.success
})
```

### Handler-Level Metadata

```typescript
const result = await register.dispatchWithResult('detailedAction', payload, {
  result: {
    collect: true,
    includeMetadata: true
  }
})

result.results.forEach((handlerResult, index) => {
  console.log(`Handler ${index}:`, {
    result: handlerResult.value,
    duration: handlerResult.metadata.duration,
    priority: handlerResult.metadata.priority,
    tags: handlerResult.metadata.tags
  })
})
```

## Performance Monitoring

### Timing Analysis

```typescript
const result = await register.dispatchWithResult('performanceAction', payload)

if (result.execution.duration > 1000) {
  console.warn('Slow action detected:', {
    action: 'performanceAction',
    duration: result.execution.duration,
    handlers: result.execution.handlersExecuted
  })
}
```

### Success Rate Tracking

```typescript
const results = []

for (let i = 0; i < 100; i++) {
  const result = await register.dispatchWithResult('reliabilityTest', { attempt: i })
  results.push(result.success)
}

const successRate = results.filter(Boolean).length / results.length
console.log(`Success rate: ${(successRate * 100).toFixed(2)}%`)
```

## Business Logic Patterns

### Validation Pipeline

```typescript
const result = await register.dispatchWithResult('validateUser', userData, {
  executionMode: 'sequential',
  result: {
    collect: true,
    strategy: 'merge'
  }
})

if (!result.success) {
  // Collect all validation errors
  const validationErrors = result.results.errors || []
  throw new ValidationError('User validation failed', validationErrors)
}
```

### Data Processing Pipeline

```typescript
const result = await register.dispatchWithResult('processDataPipeline', rawData, {
  executionMode: 'sequential',
  result: {
    collect: true,
    strategy: 'custom',
    merger: (results) => {
      // Each handler transforms the data
      return results.reduce((data, handlerResult) => {
        return handlerResult.transformedData || data
      }, rawData)
    }
  }
})

console.log('Processed data:', result.results)
```

### Aggregation Patterns

```typescript
const result = await register.dispatchWithResult('aggregateMetrics', query, {
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
})
```

## Error Result Handling

### Partial Success Handling

```typescript
const result = await register.dispatchWithResult('batchOperation', items, {
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
})

console.log(`Processed ${result.results.successful.length}/${result.results.total} items`)
```

### Retry with Results

```typescript
async function dispatchWithRetry(action, payload, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await register.dispatchWithResult(action, payload)
    
    if (result.success) {
      return result
    }
    
    if (attempt === maxRetries) {
      throw new Error(`Action failed after ${maxRetries} attempts`)
    }
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, attempt * 1000))
  }
}
```

## Related Patterns

- [Dispatch Patterns](./dispatch-patterns.md) - Basic dispatching patterns
- [Register Patterns](./register-patterns.md) - Handler registration patterns
- [Type System](./type-system.md) - TypeScript integration
- [Action Basic Usage](./basic-usage.md) - Fundamental patterns