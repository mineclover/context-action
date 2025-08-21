# Dispatch Patterns

Core action dispatching patterns for the Context-Action framework, including execution modes, filtering, and performance optimization.

## Basic Dispatch

Simple action dispatching without result collection.

```typescript
// Basic action dispatch
await register.dispatch('updateUser', { id: '123', name: 'John' })

// Dispatch with execution options
await register.dispatch('processOrder', orderData, {
  executionMode: 'parallel',
  timeout: 5000
})
```

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

### Timeout Control

```typescript
// Set timeout for action execution
await register.dispatch('slowOperation', data, {
  timeout: 10000  // 10 second timeout
})
```

### Priority-Based Execution

```typescript
// Execute only high-priority handlers
await register.dispatch('criticalAction', payload, {
  filter: {
    custom: (config) => config.priority >= 80
  }
})
```

## Error Handling

### Basic Error Handling

```typescript
try {
  await register.dispatch('riskyAction', payload)
} catch (error) {
  console.error('Action failed:', error)
}
```

### Silent Failures

```typescript
// Continue execution even if some handlers fail
await register.dispatch('bestEffortAction', payload, {
  continueOnError: true
})
```

## Real-World Examples

- [Search Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/SearchPage.tsx) - Debounced search with filtering
- [Scroll Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/ScrollPage.tsx) - Performance-optimized scroll handling
- [Priority Demo](https://github.com/mineclover/context-action/tree/main/example/src/pages/actionguard/priority-performance) - Priority-based execution patterns

## Related Patterns

- [Action Basic Usage](./basic-usage.md) - Fundamental action patterns
- [Dispatch with Result](./dispatch-with-result.md) - Result collection patterns
- [Register Patterns](./register-patterns.md) - Handler registration patterns
- [Type System](./type-system.md) - TypeScript integration