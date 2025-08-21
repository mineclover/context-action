# Abort Mechanisms

Stop pipeline execution when critical conditions are not met or errors occur.

## Basic Abort

### controller.abort()

Stop pipeline execution immediately with an optional reason:

```typescript
actionRegister.register('authenticate', (payload, controller) => {
  if (!payload.username) {
    controller.abort('Username is required');
    return; // Handler exits, subsequent handlers don't execute
  }
  
  if (!payload.password) {
    controller.abort('Password is required');
    return;
  }
  
  // Continue with authentication logic
  return { step: 'validation', success: true };
});
```

### Abort with Context

Provide detailed abort information:

```typescript
actionRegister.register('processPayment', async (payload, controller) => {
  const user = await getUserById(payload.userId);
  
  if (!user) {
    controller.abort('User not found', {
      userId: payload.userId,
      timestamp: Date.now(),
      action: 'processPayment'
    });
    return;
  }
  
  if (user.status === 'suspended') {
    controller.abort('User account suspended', {
      userId: payload.userId,
      suspensionReason: user.suspensionReason,
      suspendedAt: user.suspendedAt
    });
    return;
  }
  
  // Process payment
  return { step: 'payment', success: true };
});
```

## Abort Scenarios

### Input Validation Abort

```typescript
interface DataActions extends ActionPayloadMap {
  processData: { 
    data: any; 
    schema: string;
    options?: ProcessingOptions;
  };
}

actionRegister.register('processData', (payload, controller) => {
  // Validate required fields
  if (!payload.data) {
    controller.abort('Data is required');
    return;
  }
  
  if (!payload.schema) {
    controller.abort('Schema is required');
    return;
  }
  
  // Validate data against schema
  const validation = validateSchema(payload.data, payload.schema);
  
  if (!validation.valid) {
    controller.abort('Schema validation failed', {
      schema: payload.schema,
      errors: validation.errors,
      data: payload.data
    });
    return;
  }
  
  return { step: 'validation', success: true };
}, { priority: 100, id: 'validator' });
```

### Security Abort

```typescript
actionRegister.register('sensitiveOperation', async (payload, controller) => {
  // Check user permissions
  const user = await getCurrentUser();
  
  if (!user) {
    controller.abort('Authentication required');
    return;
  }
  
  if (!user.permissions.includes('sensitive_operations')) {
    controller.abort('Insufficient permissions', {
      userId: user.id,
      requiredPermission: 'sensitive_operations',
      userPermissions: user.permissions
    });
    return;
  }
  
  // Check rate limiting
  const rateLimiter = getRateLimiter(user.id);
  
  if (!rateLimiter.isAllowed()) {
    controller.abort('Rate limit exceeded', {
      userId: user.id,
      limit: rateLimiter.getLimit(),
      resetTime: rateLimiter.getResetTime()
    });
    return;
  }
  
  // Proceed with sensitive operation
  return { step: 'security-cleared', userId: user.id };
}, { priority: 100, id: 'security-guard' });
```

### Business Logic Abort

```typescript
actionRegister.register('placeOrder', async (payload, controller) => {
  const { items, userId } = payload;
  
  // Check inventory availability
  for (const item of items) {
    const inventory = await getInventory(item.productId);
    
    if (inventory.quantity < item.quantity) {
      controller.abort('Insufficient inventory', {
        productId: item.productId,
        requested: item.quantity,
        available: inventory.quantity
      });
      return;
    }
  }
  
  // Check user credit limit
  const user = await getUser(userId);
  const orderTotal = calculateTotal(items);
  
  if (orderTotal > user.creditLimit) {
    controller.abort('Credit limit exceeded', {
      userId,
      orderTotal,
      creditLimit: user.creditLimit,
      deficit: orderTotal - user.creditLimit
    });
    return;
  }
  
  return { step: 'business-validation', orderTotal, approved: true };
}, { priority: 90, id: 'business-validator' });
```

## Abort Result Handling

### Handling Aborted Dispatch

```typescript
const result = await actionRegister.dispatchWithResult('processData', 
  { data: 'invalid-data' },
  { result: { collect: true } }
);

if (result.aborted) {
  console.log('Pipeline was aborted');
  console.log('Reason:', result.abortReason);
  console.log('Aborted by handler:', result.abortedBy);
  console.log('Results before abort:', result.results);
  
  // Handle different abort scenarios
  switch (result.abortReason) {
    case 'Username is required':
      showValidationError('Please enter a username');
      break;
      
    case 'Rate limit exceeded':
      showRateLimitError('Too many requests, please try again later');
      break;
      
    case 'Insufficient permissions':
      redirectToLogin();
      break;
      
    default:
      showGenericError('Operation failed');
  }
}
```

### React Error Boundaries with Abort

```typescript
function SafeActionComponent() {
  const { dispatchWithResult } = useActionDispatchWithResult();
  const [error, setError] = useState<string | null>(null);
  
  const handleSafeAction = async () => {
    setError(null);
    
    try {
      const result = await dispatchWithResult('sensitiveAction', 
        { data: 'user-input' },
        { result: { collect: true } }
      );
      
      if (result.aborted) {
        setError(result.abortReason);
        return;
      }
      
      if (result.success) {
        setError(null);
        // Handle success
      }
      
    } catch (error) {
      setError('Unexpected error occurred');
      console.error(error);
    }
  };
  
  return (
    <div>
      <button onClick={handleSafeAction}>Safe Action</button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

## Abort vs Throw Error

### Use Abort For
- ✅ Business logic violations
- ✅ Validation failures
- ✅ Permission denied
- ✅ Rate limiting
- ✅ Graceful operation termination

### Use Throw Error For
- ❌ Unexpected system errors
- ❌ Network failures
- ❌ Programming errors
- ❌ Infrastructure issues

```typescript
// ✅ Good - abort for business logic
actionRegister.register('transfer', (payload, controller) => {
  if (payload.amount > user.balance) {
    controller.abort('Insufficient funds'); // Business rule violation
    return;
  }
});

// ❌ Avoid - throw for business logic
actionRegister.register('transfer', (payload) => {
  if (payload.amount > user.balance) {
    throw new Error('Insufficient funds'); // Should use abort instead
  }
});

// ✅ Good - throw for system errors
actionRegister.register('transfer', async (payload) => {
  try {
    await processTransfer(payload);
  } catch (error) {
    // Network or system error - let it throw
    throw error;
  }
});
```

## Early Abort Patterns

### Guard Handlers

```typescript
// High-priority guard that aborts early
actionRegister.register('secureOperation', (payload, controller) => {
  const user = getCurrentUser();
  
  // Early abort if no user
  if (!user) {
    controller.abort('Authentication required');
    return;
  }
  
  // Early abort if insufficient permissions
  if (!hasPermission(user, 'secure_operations')) {
    controller.abort('Access denied');
    return;
  }
  
  // Set user context for subsequent handlers
  controller.modifyPayload(current => ({
    ...current,
    user: { id: user.id, permissions: user.permissions }
  }));
  
  return { step: 'authorization', authorized: true };
}, { priority: 100, id: 'auth-guard' });

// This handler only runs if guard passes
actionRegister.register('secureOperation', async (payload) => {
  // payload.user is guaranteed to exist
  const result = await performSecureOperation(payload.data, payload.user);
  return { step: 'operation', result };
}, { priority: 80, id: 'operator' });
```

### Validation Chain

```typescript
// Chain of validation handlers that can abort at any step
actionRegister.register('submitForm', (payload, controller) => {
  if (!payload.formData) {
    controller.abort('Form data is required');
    return;
  }
  return { step: 'presence-validation', success: true };
}, { priority: 100, id: 'presence-validator' });

actionRegister.register('submitForm', (payload, controller) => {
  const validation = validateFormSchema(payload.formData);
  if (!validation.valid) {
    controller.abort('Invalid form data', validation.errors);
    return;
  }
  return { step: 'schema-validation', success: true };
}, { priority: 90, id: 'schema-validator' });

actionRegister.register('submitForm', async (payload, controller) => {
  const businessValidation = await validateBusinessRules(payload.formData);
  if (!businessValidation.valid) {
    controller.abort('Business rule violation', businessValidation.violations);
    return;
  }
  return { step: 'business-validation', success: true };
}, { priority: 80, id: 'business-validator' });

// Only runs if all validations pass
actionRegister.register('submitForm', async (payload) => {
  const result = await saveFormData(payload.formData);
  return { step: 'save', success: true, id: result.id };
}, { priority: 70, id: 'saver' });
```

## Live Example: Abortable Search

See a comprehensive abort implementation in the [Enhanced Abortable Search Demo](https://mineclover.github.io/context-action/example/examples/enhanced-search):

```typescript
// Search handler with automatic abort on new queries
const handleSearch = async (searchQuery: string) => {
  // Reset abort scope to cancel previous search
  resetAbortScope();
  
  try {
    const result = await dispatchWithResult('search', { query: searchQuery });
    
    if (result.aborted) {
      console.log('Search cancelled for:', searchQuery);
    } else {
      setResults(result.result || []);
    }
  } catch (err) {
    setError(err.message);
  }
};
```

This example demonstrates automatic search cancellation, component unmount cleanup, and graceful abort handling in real search scenarios.

## Related

- **[Priority System](./priority.md)** - Priority-based execution order  
- **[Blocking Operations](./blocking.md)** - Control execution flow
- **[Result Handling](./result-handling.md)** - Collect and use abort information
- **[Dispatch Methods](./dispatch.md)** - Handle aborted dispatches