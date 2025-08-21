# Advanced Action Patterns

Advanced patterns and techniques for the Context-Action framework, including execution modes, result collection strategies, and performance optimization.

## Execution Modes

Control how multiple handlers for the same action are executed.

### Sequential Execution (Default)

```typescript
// Handlers execute one after another in priority order
await register.dispatch('processOrder', orderData, {
  executionMode: 'sequential'
})
```

Handlers execute in sequence, allowing early handlers to modify payload for later ones.

### Parallel Execution

```typescript
// All handlers execute simultaneously
await register.dispatch('broadcastEvent', eventData, {
  executionMode: 'parallel'
})
```

Best for independent operations like analytics, logging, and notifications.

### Race Execution

```typescript
// First completed handler wins
await register.dispatch('fastestResponse', queryData, {
  executionMode: 'race'
})
```

Useful for fallback mechanisms and performance-critical operations.

## Result Collection Strategies

Advanced result handling for complex business logic.

### Basic Result Collection

```typescript
const result = await register.dispatchWithResult('updateUser', payload)

if (result.success) {
  console.log(`Executed ${result.execution.handlersExecuted} handlers`)
  console.log(`Duration: ${result.execution.duration}ms`)
}
```

### Advanced Result Processing

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

### Custom Result Strategies

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
        success: results.filter(r => r.success)
      }
    }
  }
})
```

## Handler Filtering

Fine-grained control over which handlers execute.

### Tag-Based Filtering

```typescript
await register.dispatch('updateUser', payload, {
  filter: {
    tags: ['validation', 'business-logic'],
    excludeTags: ['analytics', 'logging']
  }
})
```

### Category Filtering

```typescript
// Only execute security-related handlers
await register.dispatch('sensitiveOperation', data, {
  filter: {
    category: 'security',
    excludeCategory: 'analytics'
  }
})
```

### Custom Handler Filtering

```typescript
await register.dispatch('dynamicAction', payload, {
  filter: {
    custom: (config) => {
      // Complex filtering logic
      return config.priority > 50 && 
             config.tags.includes('critical') &&
             config.environment === 'production'
    }
  }
})
```

## Performance Optimization

### Debouncing and Throttling

```typescript
// Debounce search input (wait for pause)
register.register('searchUsers', searchHandler, {
  debounce: 300,  // Wait 300ms after last call
  tags: ['search', 'user-input']
})

// Throttle scroll events (limit frequency)
register.register('updateScrollPosition', scrollHandler, {
  throttle: 100,  // Max once per 100ms
  tags: ['scroll', 'performance']
})
```

### Conditional Handlers

```typescript
register.register('premiumFeature', handler, {
  condition: (payload, context) => {
    return context.user?.subscription === 'premium'
  },
  tags: ['premium', 'conditional']
})
```

### One-Time Handlers

```typescript
// Handler executes once then auto-removes
register.register('initializeApp', initHandler, {
  once: true,
  priority: 1000,
  tags: ['initialization']
})
```

## Error Handling Patterns

### Graceful Error Recovery

```typescript
register.register('resilientOperation', async (payload, controller) => {
  try {
    const result = await riskyOperation(payload)
    controller.setResult(result)
  } catch (error) {
    // Log error but don't abort pipeline
    console.error('Operation failed:', error)
    controller.setResult({ error: error.message, fallback: true })
  }
})
```

### Circuit Breaker Pattern

```typescript
let failureCount = 0
const MAX_FAILURES = 3

register.register('externalAPI', async (payload, controller) => {
  if (failureCount >= MAX_FAILURES) {
    controller.abort('Circuit breaker open')
    return
  }
  
  try {
    const result = await externalAPI.call(payload)
    failureCount = 0  // Reset on success
    controller.setResult(result)
  } catch (error) {
    failureCount++
    throw error
  }
})
```

## Handler Configuration Options

### Comprehensive Configuration

```typescript
register.register('fullConfigHandler', handler, {
  priority: 100,           // Execution priority
  tags: ['business', 'critical'],
  category: 'core-logic',
  once: false,            // Can execute multiple times
  timeout: 5000,          // 5 second timeout
  debounce: 200,          // Debounce calls
  throttle: 1000,         // Throttle execution
  environment: 'production',
  feature: 'advanced-features',
  condition: (payload) => payload.enabled === true
})
```

### Development vs Production

```typescript
// Development-only handler
register.register('debugAction', debugHandler, {
  environment: 'development',
  tags: ['debug', 'development']
})

// Production-only handler
register.register('analyticsTrack', analyticsHandler, {
  environment: 'production',
  tags: ['analytics', 'production']
})
```

## Real-World Examples

- [Priority Performance Demo](https://github.com/mineclover/context-action/tree/main/example/src/pages/actionguard/priority-performance) - Priority-based handler execution
- [Search Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/SearchPage.tsx) - Debounced search implementation
- [Scroll Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/ScrollPage.tsx) - Throttled scroll handling

## Related Patterns

- [Action Basic Usage](./basic-usage.md) - Fundamental action patterns
- [Type System](./type-system.md) - TypeScript integration
- [Register Delegation](./register-delegation.md) - Modular handler organization