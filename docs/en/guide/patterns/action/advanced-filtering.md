# Advanced Filtering Patterns

Advanced handler filtering strategies for precise control over action pipeline execution.

## Import
```typescript
import { createActionContext, ActionPayloadMap } from '@context-action/react';
```

## Prerequisites

For complete setup instructions including type definitions, context creation, and provider configuration, see **[Basic Action Setup](../setup/basic-action-setup.md)**.

This document demonstrates advanced filtering capabilities using practical examples with various handler types and filtering strategies.

## Overview

The Context-Action framework provides sophisticated filtering mechanisms that allow you to precisely control which handlers execute for each action dispatch. This enables optimized execution paths, conditional logic, and fine-grained control over complex workflows.

### Filtering Capabilities

- **Handler ID Filtering** - Execute specific handlers by their unique identifiers
- **Priority Range Filtering** - Filter handlers based on priority thresholds
- **Custom Logic Filtering** - Apply complex conditional logic for handler selection
- **Combined Filtering** - Combine multiple filter types for precise control
- **Exclude Filtering** - Exclude specific handlers while running others

## Setup Pattern

All examples use this standardized setup pattern:

```typescript
interface ProcessActions extends ActionPayloadMap {
  processData: { userId: string; data: any };
}

const {
  Provider: ProcessActionProvider,
  useActionDispatch: useProcessDispatch,
  useActionHandler: useProcessHandler,
  useActionRegister: useProcessRegister
} = createActionContext<ProcessActions>('DataProcess');

// Provider setup
function App() {
  return (
    <ProcessActionProvider>
      <ProcessingComponent />
    </ProcessActionProvider>
  );
}
```

## Handler Registration Patterns

### Priority-Based Handler Registration

Register handlers with different priorities and characteristics:

```typescript
function HandlerRegistration() {
  const register = useProcessRegister();
  
  useEffect(() => {
    // High priority security validation (blocking)
    const unregisterSecurity = register('processData', 
      async (payload, controller) => {
        console.log('🔐 Security validation for:', payload.userId);
        // Simulate validation logic
        if (!payload.userId) {
          controller.abort('Invalid user ID');
          return;
        }
        return { security: 'validated' };
      }, 
      { 
        id: 'security-check', 
        priority: 100, 
        blocking: true 
      }
    );

    // Medium priority analytics (non-blocking)
    const unregisterAnalytics = register('processData',
      async (payload, controller) => {
        console.log('📊 Analytics tracking for:', payload.userId);
        return { analytics: 'tracked' };
      },
      { 
        id: 'analytics', 
        priority: 80, 
        blocking: false 
      }
    );

    // Medium priority database save (blocking)
    const unregisterDatabase = register('processData',
      async (payload, controller) => {
        console.log('💾 Database save for:', payload.userId);
        // Simulate database operation
        await new Promise(resolve => setTimeout(resolve, 100));
        return { database: 'saved' };
      },
      { 
        id: 'database-save', 
        priority: 60, 
        blocking: true 
      }
    );

    // Low priority notification (non-blocking)
    const unregisterNotification = register('processData',
      async (payload, controller) => {
        console.log('🔔 Notification sent for:', payload.userId);
        return { notification: 'sent' };
      },
      { 
        id: 'notification', 
        priority: 40, 
        blocking: false 
      }
    );

    // Lowest priority audit log (non-blocking)
    const unregisterAudit = register('processData',
      async (payload, controller) => {
        console.log('📝 Audit log for:', payload.userId);
        return { audit: 'logged' };
      },
      { 
        id: 'audit-log', 
        priority: 20, 
        blocking: false 
      }
    );

    // Cleanup function
    return () => {
      unregisterSecurity();
      unregisterAnalytics();
      unregisterDatabase();
      unregisterNotification();
      unregisterAudit();
    };
  }, [register]);

  return null;
}
```

## Filtering Patterns

### 1. Handler ID Filtering

Execute only specific handlers by their unique identifiers:

```typescript
function ProcessingComponent() {
  const dispatch = useProcessDispatch();
  
  const handleCriticalOperation = async () => {
    // Only execute security and database handlers
    const result = await dispatch('processData', 
      { userId: 'user-123', data: { action: 'critical' } },
      {
        filter: {
          handlerIds: ['security-check', 'database-save']
        },
        result: { collect: true, strategy: 'all' }
      }
    );
    
    console.log('Critical operation results:', result.results);
  };
  
  return (
    <button onClick={handleCriticalOperation}>
      Critical Operation (Security + Database Only)
    </button>
  );
}
```

**Use Cases:**
- Emergency operations requiring only essential handlers
- Testing specific handler combinations
- Conditional workflows based on user permissions

### 2. Priority Range Filtering

Filter handlers based on priority thresholds:

```typescript
function ProcessingComponent() {
  const dispatch = useProcessDispatch();
  
  const handleHighPriorityOperation = async () => {
    // Execute only high-priority handlers (>= 80)
    const result = await dispatch('processData',
      { userId: 'user-456', data: { action: 'urgent' } },
      {
        filter: {
          priority: { min: 80 }
        },
        result: { collect: true, strategy: 'all' }
      }
    );
    
    console.log('High priority results:', result.results);
  };
  
  const handleMediumPriorityRange = async () => {
    // Execute handlers in priority range 50-90
    const result = await dispatch('processData',
      { userId: 'user-789', data: { action: 'standard' } },
      {
        filter: {
          priority: { min: 50, max: 90 }
        },
        result: { collect: true, strategy: 'all' }
      }
    );
    
    console.log('Medium priority range results:', result.results);
  };
  
  return (
    <div>
      <button onClick={handleHighPriorityOperation}>
        High Priority Only (≥80)
      </button>
      <button onClick={handleMediumPriorityRange}>
        Medium Priority Range (50-90)
      </button>
    </div>
  );
}
```

**Use Cases:**
- Performance optimization by skipping low-priority handlers
- Tiered processing based on operation criticality
- Load management during high-traffic periods

### 3. Custom Logic Filtering

Apply complex conditional logic for handler selection:

```typescript
function ProcessingComponent() {
  const dispatch = useProcessDispatch();
  
  const handleBlockingOnlyOperation = async () => {
    // Execute only blocking handlers
    const result = await dispatch('processData',
      { userId: 'user-321', data: { action: 'blocking-only' } },
      {
        filter: {
          custom: (config) => config.blocking === true
        },
        result: { collect: true, strategy: 'all' }
      }
    );
    
    console.log('Blocking handlers results:', result.results);
  };
  
  const handleComplexFiltering = async () => {
    // Complex filtering logic
    const result = await dispatch('processData',
      { userId: 'user-654', data: { action: 'complex' } },
      {
        filter: {
          custom: (config) => {
            // Only high-priority, non-blocking handlers
            return config.priority >= 70 && config.blocking === false;
          }
        },
        result: { collect: true, strategy: 'all' }
      }
    );
    
    console.log('Complex filter results:', result.results);
  };
  
  return (
    <div>
      <button onClick={handleBlockingOnlyOperation}>
        Blocking Handlers Only
      </button>
      <button onClick={handleComplexFiltering}>
        High Priority + Non-blocking
      </button>
    </div>
  );
}
```

**Use Cases:**
- Dynamic handler selection based on runtime conditions
- Advanced business logic implementation
- Performance-critical filtering scenarios

### 4. Combined Filtering

Combine multiple filter types for precise control:

```typescript
function ProcessingComponent() {
  const dispatch = useProcessDispatch();
  
  const handleCombinedFiltering = async () => {
    // Combined filtering: priority >= 50, exclude analytics, only non-blocking
    const result = await dispatch('processData',
      { userId: 'user-987', data: { action: 'combined' } },
      {
        filter: {
          priority: { min: 50 },
          excludeHandlerIds: ['analytics'],
          custom: (config) => config.blocking === false
        },
        result: { collect: true, strategy: 'all' }
      }
    );
    
    console.log('Combined filter results:', result.results);
  };
  
  const handleAdvancedCombined = async () => {
    // Advanced combined filtering
    const result = await dispatch('processData',
      { userId: 'user-111', data: { action: 'advanced' } },
      {
        filter: {
          handlerIds: ['security-check', 'database-save', 'notification'],
          priority: { min: 30 },
          custom: (config) => {
            // Additional validation logic
            return config.id !== 'security-check' || config.priority === 100;
          }
        },
        result: { collect: true, strategy: 'all' }
      }
    );
    
    console.log('Advanced combined results:', result.results);
  };
  
  return (
    <div>
      <button onClick={handleCombinedFiltering}>
        Priority ≥50 + No Analytics + Non-blocking
      </button>
      <button onClick={handleAdvancedCombined}>
        Advanced Combined Filtering
      </button>
    </div>
  );
}
```

**Use Cases:**
- Sophisticated workflow control
- Multi-criteria handler selection
- Complex business rule implementation

### 5. Exclude Filtering

Exclude specific handlers while running others:

```typescript
function ProcessingComponent() {
  const dispatch = useProcessDispatch();
  
  const handleSkipAnalytics = async () => {
    // Run all handlers except analytics
    const result = await dispatch('processData',
      { userId: 'user-555', data: { action: 'no-analytics' } },
      {
        filter: {
          excludeHandlerIds: ['analytics']
        },
        result: { collect: true, strategy: 'all' }
      }
    );
    
    console.log('No analytics results:', result.results);
  };
  
  const handleSkipMultiple = async () => {
    // Exclude multiple handlers
    const result = await dispatch('processData',
      { userId: 'user-777', data: { action: 'minimal' } },
      {
        filter: {
          excludeHandlerIds: ['analytics', 'audit-log', 'notification']
        },
        result: { collect: true, strategy: 'all' }
      }
    );
    
    console.log('Essential handlers only:', result.results);
  };
  
  return (
    <div>
      <button onClick={handleSkipAnalytics}>
        Skip Analytics
      </button>
      <button onClick={handleSkipMultiple}>
        Essential Handlers Only
      </button>
    </div>
  );
}
```

**Use Cases:**
- Privacy-compliant operations (skip tracking)
- Testing scenarios (exclude specific handlers)
- Performance optimization (skip non-essential operations)

## Complete Example

Full component demonstrating all filtering patterns:

```typescript
function FilteringDemo() {
  return (
    <ProcessActionProvider>
      <HandlerRegistration />
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2>Advanced Filtering Demo</h2>
        
        <ProcessingComponent />
        
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p>Check the console to see which handlers execute for each filtering pattern.</p>
          <p>Each button demonstrates different filtering strategies:</p>
          <ul>
            <li><strong>Handler ID:</strong> Execute specific handlers only</li>
            <li><strong>Priority Range:</strong> Filter by priority thresholds</li>
            <li><strong>Custom Logic:</strong> Apply complex conditional logic</li>
            <li><strong>Combined:</strong> Multiple filter types together</li>
            <li><strong>Exclude:</strong> Skip specific handlers</li>
          </ul>
        </div>
      </div>
    </ProcessActionProvider>
  );
}
```

## Performance Considerations

### Filtering Performance

- **Handler ID filtering** is the fastest (O(1) lookup)
- **Priority range filtering** is very efficient (O(1) comparison)
- **Custom logic filtering** performance depends on complexity
- **Combined filtering** evaluates all conditions (use judiciously)

### Best Practices

1. **Use Handler ID filtering** for known, specific handler combinations
2. **Priority ranges** are excellent for tiered processing
3. **Custom logic** should be lightweight and fast
4. **Cache filter functions** when possible to avoid recreation
5. **Profile complex filters** to ensure acceptable performance

## Real-World Use Cases

### 1. Emergency Mode Operation
```typescript
// Only execute critical security and data handlers
filter: {
  handlerIds: ['security-check', 'database-save'],
  priority: { min: 80 }
}
```

### 2. Privacy-Compliant Processing
```typescript
// Skip all tracking and analytics handlers
filter: {
  excludeHandlerIds: ['analytics', 'tracking', 'user-behavior'],
  custom: (config) => !config.tags?.includes('privacy-sensitive')
}
```

### 3. Performance-Optimized Path
```typescript
// Only high-priority, non-blocking handlers for fast response
filter: {
  priority: { min: 70 },
  custom: (config) => config.blocking === false
}
```

### 4. Testing and Development
```typescript
// Test specific handler combinations
filter: {
  handlerIds: ['validation', 'business-logic'],
  excludeHandlerIds: ['external-api', 'slow-operations']
}
```

## Related Patterns

- **[Dispatch Patterns](./dispatch-patterns.md)** - Basic filtering and execution modes
- **[Dispatch with Result](./dispatch-with-result.md)** - Result collection with filtering
- **[Register Patterns](./register-patterns.md)** - Handler registration strategies
- **[Basic Action Setup](../setup/basic-action-setup.md)** - Setup patterns and configurations

## Next Steps

1. **Start Simple**: Begin with Handler ID filtering for specific use cases
2. **Add Priority Ranges**: Implement tiered processing with priority filtering
3. **Custom Logic**: Apply complex business rules with custom filtering
4. **Combine Strategies**: Use multiple filter types for sophisticated control
5. **Performance Testing**: Profile filtering performance in your specific use cases