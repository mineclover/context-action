# Action Pipeline

The action pipeline is the core concept of Context Action that enables powerful, flexible, and composable action handling with multiple handlers executing in a controlled sequence.

## What is an Action Pipeline?

An action pipeline is a sequence of handlers that execute when an action is dispatched. Each handler can:

- Process the action payload
- Transform data for subsequent handlers
- Control pipeline flow (continue, abort, or modify)
- Execute synchronously or asynchronously

```typescript
// Multiple handlers for the same action
useActionHandler('saveUser', validateUser, { priority: 100 });
useActionHandler('saveUser', sendToDatabase, { priority: 50 });
useActionHandler('saveUser', logUserAction, { priority: 10 });
useActionHandler('saveUser', sendNotification, { priority: 0 });

// When 'saveUser' is dispatched, handlers execute in priority order:
// 1. validateUser (priority: 100)
// 2. sendToDatabase (priority: 50)
// 3. logUserAction (priority: 10)
// 4. sendNotification (priority: 0)
```

## Pipeline Execution Model

### Priority-Based Ordering

Handlers execute in descending priority order (highest to lowest):

```typescript
interface UserActions extends ActionPayloadMap {
  registerUser: { email: string; password: string; name: string };
}

// Validation (highest priority)
useActionHandler('registerUser', (userData, controller) => {
  if (!isValidEmail(userData.email)) {
    controller.abort('Invalid email format');
    return;
  }
  
  if (userData.password.length < 8) {
    controller.abort('Password too short');
    return;
  }
  
  controller.next();
}, { priority: 100 });

// Database operation (medium priority)
useActionHandler('registerUser', async (userData, controller) => {
  try {
    const user = await database.createUser(userData);
    
    // Add user ID to payload for subsequent handlers
    controller.modifyPayload(payload => ({
      ...payload,
      userId: user.id,
      createdAt: user.createdAt
    }));
    
    controller.next();
  } catch (error) {
    controller.abort(`Database error: ${error.message}`);
  }
}, { priority: 50, blocking: true });

// Notification (lower priority)
useActionHandler('registerUser', async (userData) => {
  await emailService.sendWelcomeEmail(userData.email, userData.name);
}, { priority: 10 });

// Analytics (lowest priority)
useActionHandler('registerUser', (userData) => {
  analytics.track('user_registered', {
    email: userData.email,
    timestamp: userData.createdAt
  });
}, { priority: 1 });
```

### Async Execution Modes

#### Blocking Handlers

Wait for completion before proceeding to the next handler:

```typescript
useActionHandler('processOrder', async (order, controller) => {
  // This must complete before next handler runs
  const paymentResult = await paymentService.charge(order.total);
  
  if (!paymentResult.success) {
    controller.abort('Payment failed');
    return;
  }
  
  controller.modifyPayload(payload => ({
    ...payload,
    paymentId: paymentResult.id,
    paidAt: new Date()
  }));
  
  controller.next();
}, { blocking: true, priority: 100 });

useActionHandler('processOrder', async (order) => {
  // This runs only after payment succeeds
  await inventoryService.reserveItems(order.items);
  await shippingService.createShipment(order);
}, { blocking: true, priority: 50 });
```

#### Non-blocking Handlers

Execute concurrently without waiting:

```typescript
useActionHandler('userLogin', async (loginData) => {
  // These run concurrently, don't block each other
  analytics.track('user_login', loginData);
}, { blocking: false });

useActionHandler('userLogin', async (loginData) => {
  await auditLog.record('login_attempt', loginData);
}, { blocking: false });

useActionHandler('userLogin', async (loginData) => {
  await notificationService.sendLoginAlert(loginData.userId);
}, { blocking: false });
```

## Pipeline Control

### Controller API

Every handler receives a `PipelineController` with methods to control execution:

```typescript
type PipelineController<T> = {
  next: () => void;                              // Continue to next handler
  abort: (reason?: string) => void;              // Stop pipeline execution
  modifyPayload: (modifier: (payload: T) => T) => void; // Transform payload
};
```

### Flow Control Examples

#### Conditional Execution

```typescript
useActionHandler('processPayment', (payment, controller) => {
  if (payment.amount <= 0) {
    controller.abort('Invalid payment amount');
    return;
  }
  
  if (payment.amount > 10000) {
    // Require additional verification for large amounts
    controller.modifyPayload(payload => ({
      ...payload,
      requiresVerification: true
    }));
  }
  
  controller.next();
}, { priority: 100 });

useActionHandler('processPayment', async (payment, controller) => {
  if (payment.requiresVerification) {
    const verified = await fraudService.verify(payment);
    if (!verified) {
      controller.abort('Payment failed verification');
      return;
    }
  }
  
  // Process payment...
  controller.next();
}, { priority: 50 });
```

#### Data Transformation

```typescript
useActionHandler('submitForm', (formData, controller) => {
  // Sanitize input data
  const sanitized = {
    name: formData.name.trim(),
    email: formData.email.toLowerCase().trim(),
    phone: formData.phone.replace(/\D/g, ''), // Remove non-digits
    message: formData.message.slice(0, 1000) // Limit length
  };
  
  controller.modifyPayload(() => sanitized);
  controller.next();
}, { priority: 100 });

useActionHandler('submitForm', (formData, controller) => {
  // Validate sanitized data
  if (!formData.name || !formData.email) {
    controller.abort('Required fields missing');
    return;
  }
  
  // Add metadata
  controller.modifyPayload(payload => ({
    ...payload,
    submittedAt: new Date().toISOString(),
    source: 'web_form'
  }));
  
  controller.next();
}, { priority: 90 });
```

## Advanced Pipeline Patterns

### Middleware Pattern

Create reusable middleware functions:

```typescript
// Generic logging middleware
const createLogger = (action: string) => (payload: any, controller: PipelineController) => {
  console.log(`[${action}] Starting with payload:`, payload);
  
  const originalNext = controller.next;
  controller.next = () => {
    console.log(`[${action}] Completed successfully`);
    originalNext();
  };
  
  const originalAbort = controller.abort;
  controller.abort = (reason?: string) => {
    console.log(`[${action}] Aborted: ${reason}`);
    originalAbort(reason);
  };
  
  controller.next();
};

// Generic validation middleware
const createValidator = <T>(rules: (payload: T) => string | null) => 
  (payload: T, controller: PipelineController<T>) => {
    const error = rules(payload);
    if (error) {
      controller.abort(error);
      return;
    }
    controller.next();
  };

// Usage
useActionHandler('createUser', createLogger('createUser'), { priority: 1000 });
useActionHandler('createUser', createValidator(userData => {
  if (!userData.email) return 'Email is required';
  if (!userData.password) return 'Password is required';
  return null;
}), { priority: 900 });
```

### Circuit Breaker Pattern

Prevent cascading failures:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  isOpen(): boolean {
    return this.failures >= this.threshold && 
           (Date.now() - this.lastFailureTime) < this.timeout;
  }

  recordSuccess(): void {
    this.failures = 0;
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
}

const paymentCircuitBreaker = new CircuitBreaker();

useActionHandler('processPayment', async (payment, controller) => {
  if (paymentCircuitBreaker.isOpen()) {
    controller.abort('Payment service temporarily unavailable');
    return;
  }

  try {
    const result = await paymentService.process(payment);
    paymentCircuitBreaker.recordSuccess();
    
    controller.modifyPayload(payload => ({
      ...payload,
      paymentResult: result
    }));
    
    controller.next();
  } catch (error) {
    paymentCircuitBreaker.recordFailure();
    controller.abort(`Payment failed: ${error.message}`);
  }
}, { priority: 50, blocking: true });
```

### Retry Pattern

Automatic retry with exponential backoff:

```typescript
const createRetryHandler = <T>(
  handler: (payload: T, controller: PipelineController<T>) => Promise<void>,
  maxRetries = 3,
  baseDelay = 1000
) => async (payload: T, controller: PipelineController<T>) => {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      await handler(payload, controller);
      return; // Success
    } catch (error) {
      attempt++;
      
      if (attempt > maxRetries) {
        controller.abort(`Failed after ${maxRetries} retries: ${error.message}`);
        return;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

useActionHandler('sendEmail', createRetryHandler(async (emailData, controller) => {
  await emailService.send(emailData);
  controller.next();
}, 3, 1000), { priority: 50 });
```

## Performance Considerations

### Handler Registration

- Register handlers once during component mount
- Use `useCallback` for handler functions to prevent re-registration
- Clean up handlers when components unmount (automatic with `useActionHandler`)

```typescript
function MyComponent() {
  // ✅ Good: Stable handler reference
  const handleUserAction = useCallback((userData) => {
    processUserData(userData);
  }, []);
  
  useActionHandler('userAction', handleUserAction);
  
  // ❌ Avoid: Handler re-registered on every render
  useActionHandler('userAction', (userData) => {
    processUserData(userData);
  });
}
```

### Memory Management

- Avoid memory leaks by properly cleaning up handlers
- Use weak references for large objects in closures
- Implement cleanup logic for long-running operations

```typescript
function DataProcessor() {
  const processDataRef = useRef<AbortController>();
  
  useActionHandler('processLargeDataset', async (dataset, controller) => {
    // Create abort controller for this operation
    const abortController = new AbortController();
    processDataRef.current = abortController;
    
    try {
      await processInChunks(dataset, {
        signal: abortController.signal,
        onProgress: (progress) => {
          controller.modifyPayload(payload => ({
            ...payload,
            progress
          }));
        }
      });
      
      controller.next();
    } catch (error) {
      if (error.name !== 'AbortError') {
        controller.abort(error.message);
      }
    }
  });
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      processDataRef.current?.abort();
    };
  }, []);
}
```

## Error Handling Strategies

### Global Error Boundary

```typescript
function ErrorBoundaryHandler() {
  useActionHandler('*', (payload, controller) => {
    // This runs for every action as a catch-all
    const originalNext = controller.next;
    const originalAbort = controller.abort;
    
    controller.next = () => {
      try {
        originalNext();
      } catch (error) {
        console.error('Pipeline error:', error);
        errorReporting.captureException(error);
        controller.abort(`Unexpected error: ${error.message}`);
      }
    };
  }, { priority: Number.MAX_SAFE_INTEGER });
}
```

### Action-Specific Error Handling

```typescript
useActionHandler('criticalOperation', async (payload, controller) => {
  try {
    await performCriticalTask(payload);
    controller.next();
  } catch (error) {
    // Log error
    logger.error('Critical operation failed', { payload, error });
    
    // Send to error tracking
    errorTracker.captureException(error, {
      context: 'criticalOperation',
      payload
    });
    
    // Attempt recovery
    try {
      await rollbackChanges(payload);
      controller.abort('Operation failed but rollback successful');
    } catch (rollbackError) {
      controller.abort('Operation and rollback both failed');
    }
  }
});
```

## Testing Pipeline Behavior

### Unit Testing Handlers

```typescript
import { ActionRegister } from '@context-action/core';

describe('User registration pipeline', () => {
  let actionRegister: ActionRegister<UserActions>;
  
  beforeEach(() => {
    actionRegister = new ActionRegister<UserActions>();
  });
  
  it('should validate user data before saving', async () => {
    const mockSave = jest.fn();
    let validationRan = false;
    
    // Register validation handler
    actionRegister.register('registerUser', (userData, controller) => {
      validationRan = true;
      if (!userData.email) {
        controller.abort('Email required');
        return;
      }
      controller.next();
    }, { priority: 100 });
    
    // Register save handler
    actionRegister.register('registerUser', mockSave, { priority: 50 });
    
    // Test invalid data
    await actionRegister.dispatch('registerUser', { 
      email: '', 
      password: 'test123' 
    });
    
    expect(validationRan).toBe(true);
    expect(mockSave).not.toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react';

describe('Registration flow integration', () => {
  it('should complete full registration pipeline', async () => {
    const mockApi = {
      createUser: jest.fn().mockResolvedValue({ id: '123' }),
      sendWelcomeEmail: jest.fn().mockResolvedValue(true)
    };
    
    const { getByText, getByLabelText } = render(
      <Provider>
        <RegistrationForm />
        <RegistrationHandlers api={mockApi} />
      </Provider>
    );
    
    // Fill form
    fireEvent.change(getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    // Submit
    fireEvent.click(getByText(/register/i));
    
    // Verify pipeline execution
    await waitFor(() => {
      expect(mockApi.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    await waitFor(() => {
      expect(mockApi.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
    });
  });
});
```

## Best Practices

1. **Keep handlers focused**: Each handler should have a single responsibility
2. **Use appropriate priorities**: Reserve high priorities for validation and critical operations
3. **Handle errors gracefully**: Always provide meaningful error messages
4. **Minimize side effects**: Prefer pure functions where possible
5. **Document complex pipelines**: Use comments to explain handler relationships
6. **Test thoroughly**: Test both individual handlers and complete pipelines
7. **Monitor performance**: Profile pipeline execution in production
8. **Use TypeScript**: Leverage type safety for payload validation

## Next Steps

- Learn about [Handler Configuration](/guide/handler-configuration) options
- Explore [Advanced Usage](/guide/advanced) patterns
- Check out [Examples](/examples/) for real-world implementations
- Browse the [API Reference](/api/) for detailed documentation