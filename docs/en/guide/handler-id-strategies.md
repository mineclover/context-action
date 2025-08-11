# Handler ID Strategies

Handler IDs are crucial for debugging, monitoring, and managing action handlers in complex applications. Learn effective strategies for naming, organizing, and using handler IDs.

## Why Handler IDs Matter

Handler IDs provide several benefits:

- **Debugging**: Quickly identify which handler is causing issues
- **Monitoring**: Track handler performance and execution
- **Testing**: Target specific handlers in tests
- **Documentation**: Self-documenting handler purposes
- **Maintenance**: Easy handler management and updates

## ID Naming Strategies

### 1. Descriptive Action-Based IDs

```typescript
// Pattern: {action}-{purpose}
addHandler('updateProfile', handler, { 
  id: 'updateProfile-validation' 
});

addHandler('updateProfile', handler, { 
  id: 'updateProfile-persistence' 
});

addHandler('updateProfile', handler, { 
  id: 'updateProfile-notification' 
});
```

### 2. Domain-Scoped IDs

```typescript
// Pattern: {domain}-{action}-{purpose}
addHandler('updateProfile', handler, { 
  id: 'user-updateProfile-validator' 
});

addHandler('clearCart', handler, { 
  id: 'cart-clearCart-analytics' 
});

addHandler('processPayment', handler, { 
  id: 'payment-processPayment-gateway' 
});
```

### 3. Priority-Based IDs

```typescript
// Pattern: {priority}-{action}-{description}
addHandler('processOrder', handler, { 
  id: '100-processOrder-validation',
  priority: 100 
});

addHandler('processOrder', handler, { 
  id: '090-processOrder-inventory',
  priority: 90 
});

addHandler('processOrder', handler, { 
  id: '080-processOrder-payment',
  priority: 80 
});
```

### 4. Feature-Based IDs

```typescript
// Pattern: {feature}-{action}-{component}
addHandler('login', handler, { 
  id: 'auth-login-ldap' 
});

addHandler('login', handler, { 
  id: 'auth-login-session' 
});

addHandler('login', handler, { 
  id: 'analytics-login-tracking' 
});
```

## ID Organization Patterns

### 1. Hierarchical ID Structure

```typescript
// Create ID hierarchy for complex domains
const createUserHandlerID = (action: string, purpose: string) => 
  `user.profile.${action}.${purpose}`;

const createCartHandlerID = (action: string, purpose: string) => 
  `cart.items.${action}.${purpose}`;

// Usage
addHandler('updateProfile', handler, { 
  id: createUserHandlerID('update', 'validator') // user.profile.update.validator
});

addHandler('addItem', handler, { 
  id: createCartHandlerID('add', 'inventory') // cart.items.add.inventory
});
```

### 2. Namespace-Based IDs

```typescript
// Define namespaces for different concerns
const HandlerNamespaces = {
  VALIDATION: 'validation',
  BUSINESS: 'business', 
  PERSISTENCE: 'persistence',
  ANALYTICS: 'analytics',
  NOTIFICATION: 'notification'
} as const;

// Usage with namespace
addHandler('updateProfile', validationHandler, {
  id: `${HandlerNamespaces.VALIDATION}.updateProfile.schema`
});

addHandler('updateProfile', businessHandler, {
  id: `${HandlerNamespaces.BUSINESS}.updateProfile.rules`
});

addHandler('updateProfile', persistenceHandler, {
  id: `${HandlerNamespaces.PERSISTENCE}.updateProfile.database`
});
```

### 3. Component-Instance IDs

```typescript
// For component-specific handlers
function TodoItem({ todoId }: { todoId: string }) {
  const componentId = useId(); // React's unique ID
  const addHandler = useTodoActionRegister();
  
  const handler = useCallback(async (payload) => {
    // Handler logic specific to this instance
  }, [todoId]);
  
  useEffect(() => {
    if (!addHandler) return;
    
    // Unique ID per component instance
    const unaddHandler = addHandler('updateTodo', handler, {
      id: `todo-${componentId}-${todoId}`, // Unique per instance
      tags: ['component-instance'],
      cleanup: true
    });
    
    return unaddHandler;
  }, [addHandler, handler, componentId, todoId]);
}
```

## Advanced ID Strategies

### 1. Dynamic ID Generation

```typescript
// Dynamic IDs based on runtime conditions
function useUserHandlers(userRole: 'admin' | 'user' | 'guest') {
  const addHandler = useUserActionRegister();
  
  const generateHandlerID = useCallback((action: string, purpose: string) => {
    return `${userRole}.${action}.${purpose}`;
  }, [userRole]);
  
  useEffect(() => {
    if (!addHandler) return;
    
    const unaddHandlerUpdate = addHandler('updateProfile', handler, {
      id: generateHandlerID('updateProfile', 'authorization'),
      priority: userRole === 'admin' ? 100 : 50 // Different priorities by role
    });
    
    return unaddHandlerUpdate;
  }, [addHandler, userRole, generateHandlerID]);
}
```

### 2. Version-Based IDs

```typescript
// Version handlers for A/B testing or gradual rollouts
const HANDLER_VERSIONS = {
  V1: 'v1',
  V2: 'v2',
  BETA: 'beta'
} as const;

function usePaymentHandlers(version: keyof typeof HANDLER_VERSIONS = 'V1') {
  const addHandler = usePaymentActionRegister();
  
  useEffect(() => {
    if (!addHandler) return;
    
    const handlerVersion = HANDLER_VERSIONS[version];
    
    const unaddHandler = addHandler('processPayment', handler, {
      id: `payment.process.${handlerVersion}`,
      tags: ['versioned', handlerVersion],
      priority: version === 'V2' ? 100 : 90 // Newer version higher priority
    });
    
    return unaddHandler;
  }, [addHandler, version]);
}
```

### 3. Environment-Based IDs

```typescript
// Different handlers for different environments
function useAnalyticsHandlers() {
  const addHandler = useAnalyticsActionRegister();
  const environment = process.env.NODE_ENV;
  
  useEffect(() => {
    if (!addHandler) return;
    
    const handlers = [];
    
    // Production analytics
    if (environment === 'production') {
      handlers.push(addHandler('trackEvent', productionHandler, {
        id: 'analytics.track.production',
        tags: ['production']
      }));
    }
    
    // Development debugging
    if (environment === 'development') {
      handlers.push(addHandler('trackEvent', debugHandler, {
        id: 'analytics.track.debug',
        tags: ['development', 'debug']
      }));
    }
    
    // Test mock handlers
    if (environment === 'test') {
      handlers.push(addHandler('trackEvent', mockHandler, {
        id: 'analytics.track.mock',
        tags: ['test', 'mock']
      }));
    }
    
    return () => handlers.forEach(unaddHandler => unaddHandler?.());
  }, [addHandler, environment]);
}
```

## ID-Based Handler Management

### 1. Handler Registry Pattern

```typescript
// Central handler stores for management
class HandlerRegistry {
  private handlers = new Map<string, {
    id: string;
    action: string;
    priority: number;
    tags: string[];
    addHandleredAt: Date;
  }>();
  
  addHandler(action: string, handler: Function, config: { id: string; priority?: number; tags?: string[] }) {
    this.handlers.set(config.id, {
      id: config.id,
      action,
      priority: config.priority || 0,
      tags: config.tags || [],
      addHandleredAt: new Date()
    });
    
    // Actual registration logic here
    const unaddHandler = actualRegister(action, handler, config);
    
    return () => {
      this.handlers.delete(config.id);
      unaddHandler();
    };
  }
  
  getHandlersByAction(action: string) {
    return Array.from(this.handlers.values())
      .filter(h => h.action === action)
      .sort((a, b) => b.priority - a.priority);
  }
  
  getHandlersByTag(tag: string) {
    return Array.from(this.handlers.values())
      .filter(h => h.tags.includes(tag));
  }
  
  getHandlerInfo(id: string) {
    return this.handlers.get(id);
  }
  
  getAllHandlers() {
    return Array.from(this.handlers.values());
  }
}
```

### 2. Handler Debugging Tools

```typescript
// Debug tools using handler IDs
export function useHandlerDebugger(actionType?: string) {
  const [debugInfo, setDebugInfo] = useState<any[]>([]);
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    // Hook into handler execution to collect debug info
    const debugInterceptor = (handlerId: string, action: string, payload: any, result: any) => {
      setDebugInfo(prev => [...prev, {
        id: handlerId,
        action,
        payload,
        result,
        timestamp: Date.now()
      }]);
    };
    
    // Register debug interceptor
    return addHandlerDebugInterceptor(debugInterceptor, actionType);
  }, [actionType]);
  
  const clearDebugInfo = useCallback(() => {
    setDebugInfo([]);
  }, []);
  
  return { debugInfo, clearDebugInfo };
}

// Usage
function DebugPanel() {
  const { debugInfo, clearDebugInfo } = useHandlerDebugger('updateProfile');
  
  return (
    <div>
      <h3>Handler Debug Info</h3>
      <button onClick={clearDebugInfo}>Clear</button>
      {debugInfo.map(info => (
        <div key={info.timestamp}>
          <strong>{info.id}</strong> - {info.action}
          <pre>{JSON.stringify(info.payload, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}
```

### 3. Conditional Handler Registration

```typescript
// Register handlers based on feature flags or conditions
function useConditionalHandlers() {
  const addHandler = useUserActionRegister();
  const featureFlags = useFeatureFlags();
  
  useEffect(() => {
    if (!addHandler) return;
    
    const unaddHandlerFunctions: Array<() => void> = [];
    
    // Always addHandler core handlers
    unaddHandlerFunctions.push(
      addHandler('updateProfile', coreHandler, {
        id: 'user.updateProfile.core',
        priority: 100
      })
    );
    
    // Conditionally addHandler advanced features
    if (featureFlags.advancedValidation) {
      unaddHandlerFunctions.push(
        addHandler('updateProfile', advancedValidationHandler, {
          id: 'user.updateProfile.advancedValidation',
          priority: 110, // Higher priority than core
          tags: ['feature-flag', 'advanced-validation']
        })
      );
    }
    
    if (featureFlags.auditLogging) {
      unaddHandlerFunctions.push(
        addHandler('updateProfile', auditHandler, {
          id: 'user.updateProfile.audit',
          priority: 80, // Lower priority, runs after main logic
          tags: ['feature-flag', 'audit']
        })
      );
    }
    
    return () => {
      unaddHandlerFunctions.forEach(unaddHandler => unaddHandler());
    };
  }, [addHandler, featureFlags]);
}
```

## Testing with Handler IDs

### 1. ID-Based Test Utilities

```typescript
// Test utilities that use handler IDs
export function createTestHandlerSpy(handlerIds: string[]) {
  const spies = new Map<string, jest.SpyFunction>();
  
  handlerIds.forEach(id => {
    spies.set(id, jest.fn());
  });
  
  return {
    getSpyForHandler: (id: string) => spies.get(id),
    getAllSpies: () => Array.from(spies.values()),
    verifyHandlerCalled: (id: string, times = 1) => {
      const spy = spies.get(id);
      expect(spy).toHaveBeenCalledTimes(times);
    },
    verifyHandlerNotCalled: (id: string) => {
      const spy = spies.get(id);
      expect(spy).not.toHaveBeenCalled();
    }
  };
}

// Usage in tests
describe('User Profile Handlers', () => {
  it('should execute handlers in correct order', async () => {
    const spy = createTestHandlerSpy([
      'user.updateProfile.validation',
      'user.updateProfile.business',
      'user.updateProfile.persistence'
    ]);
    
    // Execute action
    await dispatch('updateProfile', { name: 'John' });
    
    // Verify execution order and calls
    spy.verifyHandlerCalled('user.updateProfile.validation', 1);
    spy.verifyHandlerCalled('user.updateProfile.business', 1);
    spy.verifyHandlerCalled('user.updateProfile.persistence', 1);
  });
});
```

## Best Practices

### ✅ Do

- **Use consistent naming conventions**: Establish patterns and stick to them
- **Include context in IDs**: Domain, action, and purpose should be clear
- **Use hierarchical structure**: Organize IDs with namespacing
- **Document ID conventions**: Maintain team documentation for ID patterns
- **Consider future maintenance**: Use IDs that will make sense months later

### ❌ Don't

- **Use generic IDs**: Avoid 'handler1', 'temp', or non-descriptive names
- **Make IDs too long**: Balance descriptiveness with readability
- **Hardcode environment-specific IDs**: Use dynamic generation when needed
- **Forget to clean up**: Always provide cleanup for addHandlered handlers
- **Ignore ID collisions**: Ensure IDs are unique within their scope

## Common ID Patterns

### Business Logic Handlers
```typescript
// Pattern: {domain}.{action}.{concern}
'user.login.authentication'
'user.login.session'
'user.login.analytics'

'cart.addItem.inventory'
'cart.addItem.pricing'
'cart.addItem.recommendations'
```

### Validation Handlers
```typescript
// Pattern: validation.{action}.{rule}
'validation.updateProfile.required'
'validation.updateProfile.format'
'validation.updateProfile.business'
```

### Integration Handlers
```typescript
// Pattern: integration.{source}.{target}.{action}
'integration.user.cart.login'
'integration.cart.inventory.addItem'
'integration.payment.order.process'
```

---

## Summary

Effective handler ID strategies provide:

- **Clear Identification**: Easy debugging and maintenance
- **Organized Structure**: Consistent patterns for team development
- **Runtime Management**: Dynamic handler registration and management
- **Testing Support**: Targeted testing and verification
- **Documentation**: Self-documenting handler purposes

Choose ID strategies that fit your team's needs and maintain consistency across your application.

---

::: tip Next Steps
- Learn [Performance Optimization](./performance) for efficient handler execution
- Explore [Error Handling Patterns](./error-handling) for robust handler implementation
- See [Testing Strategies](./testing) for comprehensive handler testing
:::