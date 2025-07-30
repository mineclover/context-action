# Handler Configuration

Handler configuration allows you to control how action handlers behave within the pipeline, including execution priority, async behavior, and identification.

## Configuration Options

The `HandlerConfig` interface provides several options to customize handler behavior:

```typescript
interface HandlerConfig {
  /** Priority level (higher numbers execute first). Default: 0 */
  priority?: number;
  
  /** Unique identifier for the handler. Auto-generated if not provided */
  id?: string;
  
  /** Whether to wait for async handlers to complete. Default: false */
  blocking?: boolean;
}
```

## Priority System

### Understanding Priority

Handlers execute in **descending priority order** (highest to lowest). This allows you to control the sequence of operations in your action pipeline.

```typescript
// These handlers will execute in this order:
useActionHandler('saveData', validateData, { priority: 100 }); // 1st
useActionHandler('saveData', transformData, { priority: 50 });  // 2nd  
useActionHandler('saveData', persistData, { priority: 25 });    // 3rd
useActionHandler('saveData', logAction);                        // 4th (default priority: 0)
useActionHandler('saveData', sendNotification, { priority: -10 }); // 5th
```

### Priority Best Practices

#### Common Priority Ranges

- **1000+**: Global middleware, logging, monitoring
- **900-999**: Authentication, authorization
- **800-899**: Input validation, sanitization  
- **700-799**: Rate limiting, security checks
- **100-699**: Business logic (higher = more critical)
- **50-99**: Data persistence, external API calls
- **1-49**: Notifications, analytics, cleanup
- **0**: Default priority for standard operations
- **Negative**: Background tasks, optional operations

```typescript
interface UserActions extends ActionPayloadMap {
  createUser: { email: string; password: string; name: string };
}

// Global request logging (highest priority)
useActionHandler('createUser', (userData) => {
  logger.info('User creation started', { email: userData.email });
}, { priority: 1000 });

// Authentication check
useActionHandler('createUser', (userData, controller) => {
  if (!isAuthenticated()) {
    controller.abort('Authentication required');
    return;
  }
  controller.next();
}, { priority: 900 });

// Input validation
useActionHandler('createUser', (userData, controller) => {
  const errors = validateUserData(userData);
  if (errors.length > 0) {
    controller.abort(`Validation failed: ${errors.join(', ')}`);
    return;
  }
  controller.next();
}, { priority: 800 });

// Rate limiting
useActionHandler('createUser', async (userData, controller) => {
  const allowed = await rateLimiter.check(userData.email);
  if (!allowed) {
    controller.abort('Rate limit exceeded');
    return;
  }
  controller.next();
}, { priority: 700 });

// Core business logic
useActionHandler('createUser', async (userData, controller) => {
  const user = await userService.createUser(userData);
  controller.modifyPayload(payload => ({
    ...payload,
    userId: user.id,
    createdAt: user.createdAt
  }));
  controller.next();
}, { priority: 200, blocking: true });

// Send welcome email (lower priority)
useActionHandler('createUser', async (userData) => {
  await emailService.sendWelcomeEmail(userData.email, userData.name);
}, { priority: 50 });

// Analytics tracking (lowest priority)
useActionHandler('createUser', (userData) => {
  analytics.track('user_created', {
    email: userData.email,
    timestamp: userData.createdAt
  });
}, { priority: 10 });
```

### Dynamic Priority

You can compute priority dynamically based on conditions:

```typescript
function getHandlerPriority(userRole: string): number {
  switch (userRole) {
    case 'admin': return 100;
    case 'moderator': return 50;
    case 'user': return 25;
    default: return 0;
  }
}

function UserRoleHandler({ userRole }: { userRole: string }) {
  useActionHandler('performAction', (payload) => {
    // Handle based on user role
    console.log(`Action performed by ${userRole}`);
  }, { 
    priority: getHandlerPriority(userRole),
    id: `role-handler-${userRole}`
  });
  
  return null;
}
```

## Handler Identification

### Automatic ID Generation

By default, handlers receive auto-generated IDs to prevent duplicate registrations:

```typescript
useActionHandler('myAction', handleMyAction); 
// Auto-generated ID: "handler_1640995200000_0.123456789"
```

### Custom IDs

Provide custom IDs for better control and debugging:

```typescript
useActionHandler('saveUser', validateUser, { 
  id: 'user-validator',
  priority: 100 
});

useActionHandler('saveUser', persistUser, { 
  id: 'user-persister',
  priority: 50 
});

useActionHandler('saveUser', notifyUser, { 
  id: 'user-notifier',
  priority: 10 
});
```

### Benefits of Custom IDs

- **Debugging**: Easier to identify handlers in logs and debugging tools
- **Replacement**: Replace specific handlers by registering with the same ID
- **Conditional Logic**: Enable/disable specific handlers based on configuration

```typescript
// Replace a handler conditionally
function UserHandlers({ enableEmailNotifications }: { enableEmailNotifications: boolean }) {
  // Core user creation (always present)
  useActionHandler('createUser', createUserInDatabase, {
    id: 'create-user-db',
    priority: 100
  });
  
  // Conditional email notification
  useActionHandler('createUser', enableEmailNotifications 
    ? sendWelcomeEmail 
    : () => console.log('Email notifications disabled'), {
    id: 'create-user-email',
    priority: 50
  });
  
  return null;
}
```

## Blocking vs Non-Blocking Handlers

### Blocking Handlers (`blocking: true`)

Wait for async handlers to complete before proceeding to the next handler:

```typescript
useActionHandler('processOrder', async (order, controller) => {
  // Payment must complete before inventory reservation
  const paymentResult = await paymentService.charge(order);
  
  if (!paymentResult.success) {
    controller.abort('Payment failed');
    return;
  }
  
  controller.modifyPayload(payload => ({
    ...payload,
    paymentId: paymentResult.id
  }));
  
  controller.next();
}, { blocking: true, priority: 100 });

useActionHandler('processOrder', async (order) => {
  // This only runs after payment succeeds
  await inventoryService.reserve(order.items);
}, { blocking: true, priority: 50 });
```

### Non-Blocking Handlers (`blocking: false`)

Execute concurrently without waiting for completion:

```typescript
useActionHandler('userLogin', async (loginData) => {
  // These all run in parallel
  analytics.track('login', loginData);
}, { blocking: false });

useActionHandler('userLogin', async (loginData) => {
  await auditLogger.log('user_login', loginData);
}, { blocking: false });

useActionHandler('userLogin', async (loginData) => {
  await updateLastSeenTimestamp(loginData.userId);
}, { blocking: false });
```

### Mixed Blocking Modes

Combine blocking and non-blocking handlers strategically:

```typescript
// Critical validation (blocking)
useActionHandler('submitForm', async (formData, controller) => {
  const isValid = await validateFormData(formData);
  if (!isValid) {
    controller.abort('Form validation failed');
    return;
  }
  controller.next();
}, { blocking: true, priority: 100 });

// Data persistence (blocking)
useActionHandler('submitForm', async (formData, controller) => {
  const result = await database.save(formData);
  controller.modifyPayload(payload => ({
    ...payload,
    recordId: result.id
  }));
  controller.next();
}, { blocking: true, priority: 50 });

// Analytics (non-blocking)
useActionHandler('submitForm', async (formData) => {
  analytics.track('form_submitted', formData);
}, { blocking: false, priority: 10 });

// Email notification (non-blocking)
useActionHandler('submitForm', async (formData) => {
  await emailService.sendConfirmation(formData.email);
}, { blocking: false, priority: 10 });
```

## Advanced Configuration Patterns

### Conditional Handler Registration

Register handlers based on runtime conditions:

```typescript
function ConditionalHandlers({ feature }: { feature: string }) {
  // Always register core handler
  useActionHandler('processData', coreDataProcessor, {
    id: 'core-processor',
    priority: 100
  });
  
  // Conditionally register feature-specific handlers
  if (feature === 'analytics') {
    useActionHandler('processData', analyticsProcessor, {
      id: 'analytics-processor',
      priority: 50
    });
  }
  
  if (feature === 'monitoring') {
    useActionHandler('processData', monitoringProcessor, {
      id: 'monitoring-processor', 
      priority: 75
    });
  }
  
  return null;
}
```

### Environment-Based Configuration

Different configurations for different environments:

```typescript
const getHandlerConfig = (env: string): HandlerConfig => {
  const baseConfig = { priority: 50 };
  
  switch (env) {
    case 'development':
      return { ...baseConfig, id: 'dev-handler' };
    case 'staging':
      return { ...baseConfig, id: 'staging-handler', blocking: true };
    case 'production':
      return { ...baseConfig, id: 'prod-handler', blocking: true, priority: 100 };
    default:
      return baseConfig;
  }
};

function EnvironmentHandlers() {
  const config = getHandlerConfig(process.env.NODE_ENV);
  
  useActionHandler('apiCall', apiHandler, config);
  
  return null;
}
```

### Handler Factory Pattern

Create reusable handler configurations:

```typescript
interface HandlerFactoryOptions {
  retries?: number;
  timeout?: number;
  priority?: number;
  blocking?: boolean;
}

const createApiHandler = (
  endpoint: string, 
  options: HandlerFactoryOptions = {}
) => {
  const { retries = 3, timeout = 5000, priority = 50, blocking = true } = options;
  
  return {
    handler: async (payload: any, controller: PipelineController) => {
      let attempt = 0;
      
      while (attempt <= retries) {
        try {
          const result = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(timeout)
          });
          
          const data = await result.json();
          controller.modifyPayload(payload => ({ ...payload, response: data }));
          controller.next();
          return;
        } catch (error) {
          attempt++;
          if (attempt > retries) {
            controller.abort(`API call failed after ${retries} retries`);
            return;
          }
          
          // Exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    },
    config: {
      id: `api-handler-${endpoint.replace(/\W/g, '-')}`,
      priority,
      blocking
    }
  };
};

// Usage
function ApiHandlers() {
  const userHandler = createApiHandler('/api/users', { 
    priority: 100, 
    retries: 5 
  });
  
  const notificationHandler = createApiHandler('/api/notifications', { 
    priority: 10, 
    blocking: false 
  });
  
  useActionHandler('createUser', userHandler.handler, userHandler.config);
  useActionHandler('createUser', notificationHandler.handler, notificationHandler.config);
  
  return null;
}
```

## Performance Optimization

### Handler Memoization

Prevent unnecessary re-registrations:

```typescript
function OptimizedHandlers({ userId, settings }) {
  // Memoize handler function
  const handleUserAction = useCallback((payload) => {
    processUserAction(payload, userId, settings);
  }, [userId, settings]);
  
  // Memoize config object
  const handlerConfig = useMemo(() => ({
    id: `user-handler-${userId}`,
    priority: settings.priority || 50,
    blocking: settings.blocking || false
  }), [userId, settings.priority, settings.blocking]);
  
  useActionHandler('userAction', handleUserAction, handlerConfig);
  
  return null;
}
```

### Lazy Handler Registration

Register handlers only when needed:

```typescript
function LazyHandlers({ shouldRegister }: { shouldRegister: boolean }) {
  const handlerConfig = useMemo(() => ({
    id: 'expensive-handler',
    priority: 100,
    blocking: true
  }), []);
  
  // Only register when necessary
  useActionHandler(
    'expensiveOperation',
    shouldRegister ? expensiveHandler : undefined,
    handlerConfig
  );
  
  return null;
}
```

## Testing Handler Configuration

### Testing Priority Order

```typescript
describe('Handler priority', () => {
  it('should execute handlers in priority order', async () => {
    const actionRegister = new ActionRegister<TestActions>();
    const executionOrder: string[] = [];
    
    actionRegister.register('test', () => {
      executionOrder.push('low');
    }, { priority: 10 });
    
    actionRegister.register('test', () => {
      executionOrder.push('high');
    }, { priority: 100 });
    
    actionRegister.register('test', () => {
      executionOrder.push('medium');
    }, { priority: 50 });
    
    await actionRegister.dispatch('test');
    
    expect(executionOrder).toEqual(['high', 'medium', 'low']);
  });
});
```

### Testing Blocking Behavior

```typescript
describe('Blocking handlers', () => {
  it('should wait for blocking handlers', async () => {
    const actionRegister = new ActionRegister<TestActions>();
    const events: string[] = [];
    
    actionRegister.register('test', async () => {
      events.push('start-blocking');
      await new Promise(resolve => setTimeout(resolve, 100));
      events.push('end-blocking');
    }, { blocking: true, priority: 100 });
    
    actionRegister.register('test', () => {
      events.push('non-blocking');
    }, { priority: 50 });
    
    await actionRegister.dispatch('test');
    
    expect(events).toEqual(['start-blocking', 'end-blocking', 'non-blocking']);
  });
});
```

## Configuration Best Practices

1. **Use semantic priorities**: Choose priority values that make sense in your domain
2. **Document priority ranges**: Establish team conventions for priority values
3. **Prefer custom IDs**: Use meaningful IDs for easier debugging
4. **Choose blocking wisely**: Only use blocking for operations that must complete sequentially
5. **Test configurations**: Write tests for priority order and blocking behavior
6. **Monitor performance**: Profile handler execution in production
7. **Keep configs simple**: Avoid overly complex configuration logic
8. **Use factories**: Create reusable configuration patterns

## Common Pitfalls

### Priority Gaps

```typescript
// ❌ Avoid large gaps that waste priority space
useActionHandler('action', handler1, { priority: 1000 });
useActionHandler('action', handler2, { priority: 10 });

// ✅ Use reasonable gaps for future insertions
useActionHandler('action', handler1, { priority: 100 });
useActionHandler('action', handler2, { priority: 50 });
```

### Blocking Overuse

```typescript
// ❌ Don't make everything blocking
useActionHandler('logEvent', async () => {
  await analytics.track(event);
}, { blocking: true }); // Unnecessary blocking

// ✅ Use blocking only when order matters
useActionHandler('processPayment', async () => {
  await paymentService.charge();
}, { blocking: true }); // Payment must complete first
```

### Config Object Recreation

```typescript
// ❌ Creates new config object on every render
useActionHandler('action', handler, { 
  priority: someProp,
  blocking: otherProp
});

// ✅ Memoize config object
const config = useMemo(() => ({
  priority: someProp,
  blocking: otherProp
}), [someProp, otherProp]);

useActionHandler('action', handler, config);
```

## Next Steps

- Learn about [Action Pipeline](/guide/action-pipeline) concepts
- Explore [Advanced Usage](/guide/advanced) patterns
- Check out [Examples](/examples/) for real-world configurations
- Browse the [API Reference](/api/) for detailed documentation