# Register Patterns

Handler registration patterns and advanced configuration options for the Context-Action framework.

## Prerequisites

This pattern guide assumes you have a basic action context setup. If not, refer to [Basic Action Setup](../setup/basic-action-setup.md) first.

## Import
```typescript
import { 
  ActionRegister,
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig
} from '@context-action/core';
import { 
  createActionContext,
  useActionHandler,
  useActionRegister
} from '@context-action/react';
import { useEffect, useRef, useState, useCallback } from 'react';
```

## Setup Patterns

### Basic Action Context Setup
```typescript
// Define action types
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string };
  deleteUser: { id: string };
  validateData: { data: any };
  saveData: { data: any };
  resetState: void;
}

// Create action context
const {
  Provider: AppActionProvider,
  useActionDispatch: useAppDispatch,
  useActionHandler: useAppHandler,
  useActionRegister: useAppRegister
} = createActionContext<AppActions>('App');

// Provider setup
function App() {
  return (
    <AppActionProvider>
      <AppContent />
    </AppActionProvider>
  );
}
```

### Action Register Access
```typescript
// Component with handler registration
function HandlerSetup() {
  const register = useAppRegister();
  
  // Register handlers using useActionHandler hook (recommended)
  useAppHandler('updateUser', async (payload, controller) => {
    const user = await userService.update(payload.id, payload);
    controller.setResult(user);
  });
  
  // Or register directly with the register instance
  useEffect(() => {
    const unregister = register.register('deleteUser', async (payload, controller) => {
      await userService.delete(payload.id);
      controller.setResult({ deleted: true });
    });
    
    return unregister; // Cleanup on unmount
  }, [register]);
  
  return <div>Handlers registered</div>;
}
```

## Basic Handler Registration

Register action handlers with type safety and configuration options.

### Simple Handler Registration
```typescript
// Using useActionHandler hook (recommended)
function UserComponent() {
  // Direct handler registration with useActionHandler
  useAppHandler('updateUser', async (payload, controller) => {
    const user = await userService.update(payload.id, payload);
    controller.setResult(user);
  });
  
  return <div>User Management Component</div>;
}
```

### Handler with Configuration
```typescript
// Using direct register access for configuration options
function ConfiguredHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    // Handler with priority and tags
    const unregister = register.register('updateUser', async (payload, controller) => {
      const user = await userService.update(payload.id, payload);
      controller.setResult(user);
    }, {
      priority: 100,
      tags: ['user', 'crud']
    });
    
    return unregister;
  }, [register]);
  
  return <div>Configured handlers registered</div>;
}
```

## Handler Configuration Options

### Priority and Execution Order

```typescript
function PriorityHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    // Higher priority handlers execute first
    const unregisterValidation = register.register('validateUser', async (payload, controller) => {
      const isValid = await userService.validate(payload);
      if (!isValid) {
        controller.abort('Validation failed');
        return;
      }
      controller.setResult({ validated: true });
    }, {
      priority: 100,  // High priority - executes first
      tags: ['validation']
    });
    
    const unregisterSave = register.register('saveUser', async (payload, controller) => {
      const user = await userService.save(payload);
      controller.setResult(user);
    }, {
      priority: 50,   // Lower priority - executes after validation
      tags: ['persistence']
    });
    
    return () => {
      unregisterValidation();
      unregisterSave();
    };
  }, [register]);
  
  return <div>Priority handlers registered</div>;
}
```

### Performance Optimization

```typescript
function PerformanceHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    // Debounce search input (wait for pause)
    const unregisterSearch = register.register('searchUsers', async (payload, controller) => {
      const results = await userService.search(payload.query);
      controller.setResult(results);
    }, {
      debounce: 300,  // Wait 300ms after last call
      tags: ['search', 'user-input']
    });
    
    // Throttle scroll events (limit frequency)
    const unregisterScroll = register.register('updateScrollPosition', async (payload, controller) => {
      // Update scroll position in store or analytics
      scrollService.updatePosition(payload.position);
      controller.setResult({ updated: true });
    }, {
      throttle: 100,  // Max once per 100ms
      tags: ['scroll', 'performance']
    });
    
    return () => {
      unregisterSearch();
      unregisterScroll();
    };
  }, [register]);
  
  return <div>Performance-optimized handlers registered</div>;
}
```

### Conditional Handlers

```typescript
function ConditionalHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    // Conditional handler based on user subscription
    const unregisterPremium = register.register('premiumFeature', async (payload, controller) => {
      const result = await premiumService.executePremiumFeature(payload);
      controller.setResult(result);
    }, {
      condition: (payload, context) => {
        return context.user?.subscription === 'premium';
      },
      tags: ['premium', 'conditional']
    });
    
    // Environment-specific handlers
    const unregisterDebug = register.register('debugAction', async (payload, controller) => {
      console.log('Debug action:', payload);
      debugService.log(payload);
      controller.setResult({ debugged: true });
    }, {
      environment: 'development',
      tags: ['debug', 'development']
    });
    
    const unregisterAnalytics = register.register('analyticsTrack', async (payload, controller) => {
      await analyticsService.track(payload.event, payload.data);
      controller.setResult({ tracked: true });
    }, {
      environment: 'production',
      tags: ['analytics', 'production']
    });
    
    return () => {
      unregisterPremium();
      unregisterDebug();
      unregisterAnalytics();
    };
  }, [register]);
  
  return <div>Conditional handlers registered</div>;
}
```

### One-Time Handlers

```typescript
function OneTimeHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    // Handler executes once then auto-removes
    const unregister = register.register('initializeApp', async (payload, controller) => {
      await appService.initialize();
      controller.setResult({ initialized: true });
    }, {
      once: true,
      priority: 1000,
      tags: ['initialization']
    });
    
    // No need to call unregister for one-time handlers
    // They auto-remove after execution
    return unregister;
  }, [register]);
  
  return <div>One-time handler registered</div>;
}
```

## Advanced Configuration

### Comprehensive Configuration

```typescript
function FullConfigurationSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    const unregister = register.register('fullConfigHandler', async (payload, controller) => {
      // Core business logic implementation
      const result = await businessService.processData(payload);
      controller.setResult(result);
    }, {
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
    });
    
    return unregister;
  }, [register]);
  
  return <div>Fully configured handler registered</div>;
}
```

### Handler Dependencies

```typescript
function DependencyHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    // Handler that depends on other handlers
    const unregisterDependent = register.register('dependentHandler', async (payload, controller) => {
      // This handler runs after validationHandler and authHandler
      const processedData = await dataService.process(payload);
      controller.setResult(processedData);
    }, {
      dependencies: ['validationHandler', 'authHandler'],
      priority: 50,
      tags: ['dependent']
    });
    
    // Conflicting handlers (only one will execute)
    const unregisterModern = register.register('modernHandler', async (payload, controller) => {
      const result = await modernService.process(payload);
      controller.setResult(result);
    }, {
      conflicts: ['legacyHandler'],
      priority: 100,
      tags: ['modern']
    });
    
    return () => {
      unregisterDependent();
      unregisterModern();
    };
  }, [register]);
  
  return <div>Dependency handlers registered</div>;
}
```

## Error Handling in Handlers

### Graceful Error Recovery

```typescript
function ErrorRecoveryHandlerSetup() {
  // Using useActionHandler hook for simple error recovery
  useAppHandler('resilientOperation', async (payload, controller) => {
    try {
      const result = await riskyOperation(payload);
      controller.setResult(result);
    } catch (error) {
      // Log error but don't abort pipeline
      console.error('Operation failed:', error);
      controller.setResult({ error: error.message, fallback: true });
    }
  });
  
  return <div>Resilient handler registered</div>;
}
```

### Circuit Breaker Pattern

```typescript
function CircuitBreakerHandlerSetup() {
  const register = useAppRegister();
  
  // Circuit breaker state (in real apps, use external state management)
  const circuitState = useRef({
    failureCount: 0,
    MAX_FAILURES: 3
  });
  
  useEffect(() => {
    const unregister = register.register('externalAPI', async (payload, controller) => {
      if (circuitState.current.failureCount >= circuitState.current.MAX_FAILURES) {
        controller.abort('Circuit breaker open');
        return;
      }
      
      try {
        const result = await externalAPI.call(payload);
        circuitState.current.failureCount = 0;  // Reset on success
        controller.setResult(result);
      } catch (error) {
        circuitState.current.failureCount++;
        throw error;
      }
    }, {
      tags: ['external', 'api'],
      timeout: 5000
    });
    
    return unregister;
  }, [register]);
  
  return <div>Circuit breaker handler registered</div>;
}
```

### Validation Handlers

```typescript
function ValidationHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    const unregister = register.register('validateInput', async (payload, controller) => {
      const errors = [];
      
      if (!payload.email?.includes('@')) {
        errors.push('Invalid email format');
      }
      
      if (!payload.name?.trim()) {
        errors.push('Name is required');
      }
      
      if (errors.length > 0) {
        controller.abort('Validation failed', { errors });
        return;
      }
      
      // Modify payload for subsequent handlers
      controller.modifyPayload(p => ({
        ...p,
        email: p.email.toLowerCase(),
        name: p.name.trim()
      }));
    }, {
      priority: 1000,  // Execute first
      tags: ['validation']
    });
    
    return unregister;
  }, [register]);
  
  return <div>Validation handler registered</div>;
}
```

## Handler Lifecycle Management

### Dynamic Handler Registration

```typescript
function DynamicHandlerSetup() {
  const register = useAppRegister();
  const [userRole, setUserRole] = useState<string>('guest');
  
  // Register handlers dynamically based on conditions
  const registerUserHandlers = useCallback((role: string) => {
    const unregisterFunctions: (() => void)[] = [];
    
    if (role === 'admin') {
      const unregister = register.register('adminAction', async (payload, controller) => {
        const result = await adminService.executeAction(payload);
        controller.setResult(result);
      }, {
        tags: ['admin', 'privileged']
      });
      unregisterFunctions.push(unregister);
    }
    
    if (role === 'moderator') {
      const unregister = register.register('moderateContent', async (payload, controller) => {
        const result = await moderationService.moderate(payload);
        controller.setResult(result);
      }, {
        tags: ['moderation']
      });
      unregisterFunctions.push(unregister);
    }
    
    return () => {
      unregisterFunctions.forEach(fn => fn());
    };
  }, [register]);
  
  useEffect(() => {
    return registerUserHandlers(userRole);
  }, [userRole, registerUserHandlers]);
  
  return (
    <div>
      <div>Dynamic handlers for role: {userRole}</div>
      <button onClick={() => setUserRole('admin')}>Set Admin</button>
      <button onClick={() => setUserRole('moderator')}>Set Moderator</button>
    </div>
  );
}
```

### Handler Cleanup

```typescript
function HandlerCleanupSetup() {
  const register = useAppRegister();
  const unregisterFunctionsRef = useRef(new Set<() => void>());
  
  useEffect(() => {
    // Store unregister functions for cleanup tracking
    const unregisterFunctions = unregisterFunctionsRef.current;
    
    // Register with cleanup tracking
    const unregister = register.register('temporaryHandler', async (payload, controller) => {
      // Temporary handler logic
      const result = await tempService.process(payload);
      controller.setResult(result);
    }, {
      tags: ['temporary']
    });
    
    unregisterFunctions.add(unregister);
    
    // Cleanup function
    return () => {
      unregisterFunctions.forEach(fn => fn());
      unregisterFunctions.clear();
    };
  }, [register]);
  
  // Manual cleanup function (if needed)
  const cleanupAllHandlers = useCallback(() => {
    unregisterFunctionsRef.current.forEach(fn => fn());
    unregisterFunctionsRef.current.clear();
  }, []);
  
  return (
    <div>
      <div>Temporary handlers with cleanup tracking</div>
      <button onClick={cleanupAllHandlers}>Manual Cleanup</button>
    </div>
  );
}
```

### Bulk Registration

```typescript
function BulkRegistrationSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    // Define handlers configuration
    const handlersConfig = {
      validateUser: { 
        handler: async (payload: any, controller: any) => {
          const isValid = await userService.validate(payload);
          controller.setResult({ isValid });
        }, 
        priority: 100 
      },
      saveUser: { 
        handler: async (payload: any, controller: any) => {
          const user = await userService.save(payload);
          controller.setResult(user);
        }, 
        priority: 50 
      },
      notifyUser: { 
        handler: async (payload: any, controller: any) => {
          await notificationService.send(payload);
          controller.setResult({ notified: true });
        }, 
        priority: 10 
      }
    };
    
    // Register multiple handlers at once
    const unregisterFunctions = Object.entries(handlersConfig).map(([action, config]) => {
      return register.register(action as any, config.handler, {
        priority: config.priority,
        tags: ['user', 'bulk-registered']
      });
    });
    
    // Cleanup all registered handlers
    return () => {
      unregisterFunctions.forEach(fn => fn());
    };
  }, [register]);
  
  return <div>Bulk handlers registered</div>;
}
```

## Metadata and Monitoring

### Handler Metrics

```typescript
function MetricsHandlerSetup() {
  const register = useAppRegister();
  
  useEffect(() => {
    const unregister = register.register('monitoredHandler', async (payload, controller) => {
      const result = await businessService.processWithMetrics(payload);
      controller.setResult(result);
    }, {
      metrics: {
        collectTiming: true,
        collectErrors: true,
        customMetrics: {
          businessMetric: (payload: any, result: any) => result.userCount || 0
        }
      },
      tags: ['monitored']
    });
    
    return unregister;
  }, [register]);
  
  return <div>Monitored handler registered</div>;
}
```

### Registry Information

```typescript
function RegistryInfoComponent() {
  const register = useAppRegister();
  const [registryInfo, setRegistryInfo] = useState<any>(null);
  
  const getRegistryStats = useCallback(() => {
    // Get registry statistics
    const info = register.getRegistryInfo();
    setRegistryInfo(info);
    console.log('Registry stats:', {
      totalActions: info.totalActions,
      totalHandlers: info.totalHandlers,
      registeredActions: info.registeredActions
    });
  }, [register]);
  
  useEffect(() => {
    getRegistryStats();
  }, [getRegistryStats]);
  
  return (
    <div>
      <h3>Registry Information</h3>
      {registryInfo && (
        <div>
          <p>Total Actions: {registryInfo.totalActions}</p>
          <p>Total Handlers: {registryInfo.totalHandlers}</p>
          <p>Registered Actions: {registryInfo.registeredActions?.join(', ')}</p>
        </div>
      )}
      <button onClick={getRegistryStats}>Refresh Stats</button>
    </div>
  );
}
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