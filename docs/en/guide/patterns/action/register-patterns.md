# Register Patterns

Handler registration patterns and advanced configuration options for the Context-Action framework.

## Basic Handler Registration

Register action handlers with type safety and configuration options.

```typescript
// Simple handler registration
register.register('updateUser', async (payload, controller) => {
  const user = await userService.update(payload.id, payload)
  controller.setResult(user)
})

// Handler with configuration
register.register('updateUser', userHandler, {
  priority: 100,
  tags: ['user', 'crud']
})
```

## Handler Configuration Options

### Priority and Execution Order

```typescript
// Higher priority handlers execute first
register.register('validateUser', validationHandler, {
  priority: 100,  // High priority - executes first
  tags: ['validation']
})

register.register('saveUser', saveHandler, {
  priority: 50,   // Lower priority - executes after validation
  tags: ['persistence']
})
```

### Performance Optimization

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

// Environment-specific handlers
register.register('debugAction', debugHandler, {
  environment: 'development',
  tags: ['debug', 'development']
})

register.register('analyticsTrack', analyticsHandler, {
  environment: 'production',
  tags: ['analytics', 'production']
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

## Advanced Configuration

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
  condition: (payload) => payload.enabled === true,
  description: 'Core business logic handler',
  version: '1.0.0',
  dependencies: ['validateHandler'],
  conflicts: ['legacyHandler']
})
```

### Handler Dependencies

```typescript
// Handler that depends on other handlers
register.register('dependentHandler', handler, {
  dependencies: ['validationHandler', 'authHandler'],
  priority: 50,
  tags: ['dependent']
})

// Conflicting handlers (only one will execute)
register.register('modernHandler', modernHandler, {
  conflicts: ['legacyHandler'],
  priority: 100,
  tags: ['modern']
})
```

## Error Handling in Handlers

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
}, {
  tags: ['external', 'api'],
  timeout: 5000
})
```

### Validation Handlers

```typescript
register.register('validateInput', async (payload, controller) => {
  const errors = []
  
  if (!payload.email?.includes('@')) {
    errors.push('Invalid email format')
  }
  
  if (!payload.name?.trim()) {
    errors.push('Name is required')
  }
  
  if (errors.length > 0) {
    controller.abort('Validation failed', { errors })
    return
  }
  
  // Modify payload for subsequent handlers
  controller.modifyPayload(p => ({
    ...p,
    email: p.email.toLowerCase(),
    name: p.name.trim()
  }))
}, {
  priority: 1000,  // Execute first
  tags: ['validation']
})
```

## Handler Lifecycle Management

### Dynamic Handler Registration

```typescript
// Register handlers dynamically based on conditions
function registerUserHandlers(userRole: string) {
  if (userRole === 'admin') {
    register.register('adminAction', adminHandler, {
      tags: ['admin', 'privileged']
    })
  }
  
  if (userRole === 'moderator') {
    register.register('moderateContent', moderationHandler, {
      tags: ['moderation']
    })
  }
}
```

### Handler Cleanup

```typescript
// Store unregister functions for cleanup
const unregisterFunctions = new Set<() => void>()

// Register with cleanup tracking
const unregister = register.register('temporaryHandler', handler, {
  tags: ['temporary']
})
unregisterFunctions.add(unregister)

// Cleanup all temporary handlers
function cleanup() {
  unregisterFunctions.forEach(fn => fn())
  unregisterFunctions.clear()
}
```

### Bulk Registration

```typescript
// Register multiple handlers at once
const handlers = {
  validateUser: { handler: validateHandler, priority: 100 },
  saveUser: { handler: saveHandler, priority: 50 },
  notifyUser: { handler: notifyHandler, priority: 10 }
}

Object.entries(handlers).forEach(([action, config]) => {
  register.register(action as any, config.handler, {
    priority: config.priority,
    tags: ['user', 'bulk-registered']
  })
})
```

## Metadata and Monitoring

### Handler Metrics

```typescript
register.register('monitoredHandler', handler, {
  metrics: {
    collectTiming: true,
    collectErrors: true,
    customMetrics: {
      businessMetric: (payload, result) => result.userCount || 0
    }
  },
  tags: ['monitored']
})
```

### Registry Information

```typescript
// Get registry statistics
const info = register.getRegistryInfo()
console.log('Registry stats:', {
  totalActions: info.totalActions,
  totalHandlers: info.totalHandlers,
  registeredActions: info.registeredActions
})
```

## Real-World Examples

- [Todo List Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx) - Complex handler registration
- [Chat Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx) - Real-time handler patterns
- [User Profile Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx) - User management handlers

## Related Patterns

- [Dispatch Patterns](./dispatch-patterns.md) - Basic dispatching patterns
- [Dispatch with Result](./dispatch-with-result.md) - Result collection patterns
- [Type System](./type-system.md) - TypeScript integration
- [Action Basic Usage](./basic-usage.md) - Fundamental patterns