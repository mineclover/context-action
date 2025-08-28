# Advanced Filtering System

Powerful handler filtering capabilities for precise action execution control.

## 🎯 Overview

The Advanced Filtering System allows you to execute only specific handlers based on priority, ID, or custom logic. This enables precise control over which handlers run for each action dispatch.

## 🔧 Filter Types

### Priority Range Filtering

Filter handlers by priority range to control execution scope:

```typescript
// Execute only high-priority handlers (50-100)
await actions.dispatch('processData', data, {
  filter: {
    priority: { min: 50, max: 100 }
  }
});

// Execute only handlers above priority 20
await actions.dispatch('validateInput', input, {
  filter: {
    priority: { min: 20 }
  }
});

// Execute only handlers below priority 10 (background tasks)
await actions.dispatch('backgroundSync', data, {
  filter: {
    priority: { max: 10 }
  }
});
```

### Handler ID Filtering

Target specific handlers by their IDs:

```typescript
// Execute only specific handlers
await actions.dispatch('securityCheck', userData, {
  filter: {
    handlerIds: ['validation', 'authorization', 'logging']
  }
});

// Execute all handlers except specific ones
await actions.dispatch('processPayment', paymentData, {
  filter: {
    excludeHandlerIds: ['analytics', 'debugging']
  }
});

// Combine inclusion and exclusion
await actions.dispatch('dataProcessing', data, {
  filter: {
    handlerIds: ['core-processing', 'validation'],
    excludeHandlerIds: ['optional-analytics']
  }
});
```

### Custom Logic Filtering

Implement complex filtering logic with custom functions:

```typescript
// Filter by handler configuration properties
await actions.dispatch('criticalOperation', data, {
  filter: {
    custom: (config) => config.blocking === true
  }
});

// Filter by handler metadata
await actions.dispatch('conditionalTask', data, {
  filter: {
    custom: (config) => {
      // Only execute handlers for production environment
      return !config.id?.includes('dev') && !config.id?.includes('test');
    }
  }
});

// Complex business logic filtering
await actions.dispatch('userAction', userData, {
  filter: {
    custom: (config) => {
      // Execute different handlers based on user role
      if (userData.role === 'admin') {
        return config.priority >= 50; // Admin gets full access
      } else {
        return config.priority <= 30; // Regular users limited access
      }
    }
  }
});
```

## 🏗️ Combined Filtering

Combine multiple filter types for sophisticated control:

```typescript
await actions.dispatch('complexWorkflow', data, {
  filter: {
    // Priority range
    priority: { min: 10, max: 50 },
    
    // Exclude specific handlers
    excludeHandlerIds: ['debug-handler', 'test-handler'],
    
    // Custom logic
    custom: (config) => {
      // Additional business logic
      return config.blocking === true && !config.id?.includes('optional');
    }
  }
});
```

## 🚀 Performance Optimization

### Efficient Filter Patterns

```typescript
// ✅ FAST: Priority filtering (optimized)
await actions.dispatch('task', data, {
  filter: { priority: { min: 20 } }
});

// ✅ FAST: Handler ID filtering with Set lookup
const excludedIds = new Set(['analytics', 'debug']);
await actions.dispatch('task', data, {
  filter: {
    custom: (config) => !excludedIds.has(config.id || '')
  }
});

// ❌ SLOW: Complex regex in custom filter
await actions.dispatch('task', data, {
  filter: {
    custom: (config) => /^(core|essential)/.test(config.id || '')
  }
});
```

### Filter Caching

```typescript
// Cache filter functions for repeated use
const productionFilter = (config: HandlerConfig) => 
  !config.id?.includes('dev') && !config.id?.includes('test');

const criticalFilter = { 
  priority: { min: 80 }, 
  custom: productionFilter 
};

// Reuse cached filter
await actions.dispatch('operation1', data1, { filter: criticalFilter });
await actions.dispatch('operation2', data2, { filter: criticalFilter });
```

## 🎯 Common Use Cases

### Environment-Based Execution

```typescript
// Development: Include debug handlers
const devFilter = process.env.NODE_ENV === 'development' 
  ? {} // No filtering in development
  : { excludeHandlerIds: ['debug', 'dev-tools', 'mock'] };

await actions.dispatch('userLogin', credentials, {
  filter: devFilter
});
```

### User Role-Based Filtering

```typescript
function getUserRoleFilter(userRole: string) {
  return {
    custom: (config: HandlerConfig) => {
      switch (userRole) {
        case 'admin':
          return true; // Admin can execute all handlers
        case 'user':
          return config.priority <= 50; // Limited access
        case 'guest':
          return config.priority <= 20; // Very limited access
        default:
          return false; // No access
      }
    }
  };
}

await actions.dispatch('accessResource', resourceData, {
  filter: getUserRoleFilter(currentUser.role)
});
```

### Feature Flag Integration

```typescript
const featureFilter = {
  custom: (config: HandlerConfig) => {
    // Check feature flags
    if (config.id?.includes('beta') && !featureFlags.betaFeatures) {
      return false;
    }
    if (config.id?.includes('experimental') && !featureFlags.experimental) {
      return false;
    }
    return true;
  }
};

await actions.dispatch('newFeature', data, { filter: featureFilter });
```

## 🚨 Error Handling

Filter validation and error handling:

```typescript
try {
  await actions.dispatch('myAction', payload, {
    filter: {
      handlerIds: ['nonexistent-handler'] // No matching handlers
    }
  });
} catch (error) {
  console.error('No handlers matched the filter criteria');
}

// Safe filtering with fallback
const result = await actions.dispatchWithResult('myAction', payload, {
  filter: {
    priority: { min: 50 }
  }
});

if (result.execution.handlersExecuted === 0) {
  console.warn('No handlers executed - filter too restrictive');
  // Retry with broader filter or default execution
}
```

## 📊 Filter Debugging

Monitor filter effectiveness:

```typescript
const result = await actions.dispatchWithResult('myAction', payload, {
  filter: {
    priority: { min: 20 },
    custom: (config) => config.blocking === true
  },
  result: { collect: true }
});

console.log('Filter Results:', {
  totalHandlers: actions.getHandlerCount('myAction'),
  executedHandlers: result.execution.handlersExecuted,
  filterEfficiency: result.execution.handlersExecuted / actions.getHandlerCount('myAction'),
  duration: result.execution.duration
});
```

## 📋 Best Practices

### Filter Design Guidelines

1. **Performance First**: Use priority filters over complex custom logic
2. **Cache Filters**: Store reusable filter objects
3. **Validation**: Always check that some handlers will execute
4. **Documentation**: Document filter logic for team understanding
5. **Testing**: Test filter combinations thoroughly

### Filter Composition Patterns

```typescript
// Composable filter factory
function createFilter(options: {
  environment?: 'dev' | 'staging' | 'prod';
  userRole?: 'admin' | 'user' | 'guest';
  priority?: { min?: number; max?: number };
}) {
  return {
    priority: options.priority,
    custom: (config: HandlerConfig) => {
      // Environment filtering
      if (options.environment === 'prod' && config.id?.includes('dev')) {
        return false;
      }
      
      // Role-based filtering
      if (options.userRole === 'guest' && (config.priority || 0) > 20) {
        return false;
      }
      
      return true;
    }
  };
}

// Usage
const filter = createFilter({ 
  environment: 'prod', 
  userRole: 'user',
  priority: { min: 10, max: 50 }
});

await actions.dispatch('userAction', data, { filter });
```

## ⚠️ Important Considerations

### Filter Safety

- **Empty Results**: Always verify that filters don't exclude all handlers
- **Performance**: Complex custom filters can impact dispatch performance
- **Debugging**: Use `dispatchWithResult` to monitor filter effectiveness
- **Testing**: Test all filter combinations in your test suite

### Migration from Conditional Logic

```typescript
// Before: Manual conditional logic in handlers
actions.register('processData', async (payload) => {
  if (process.env.NODE_ENV === 'development') {
    // Only run in development
    await debugProcessor(payload);
  }
});

// After: Use filtering system
actions.register('processData', debugProcessor, { 
  id: 'debug-processor' 
});

await actions.dispatch('processData', payload, {
  filter: {
    custom: () => process.env.NODE_ENV === 'development'
  }
});
```

This Advanced Filtering System provides unprecedented control over action execution, enabling sophisticated workflows while maintaining performance and type safety.