# Action Handlers

Action handlers contain the business logic of your application. Learn how to implement, register, and manage handlers effectively for scalable, maintainable applications.

## Handler Implementation Pattern

### Best Practice: useActionHandler Pattern

The recommended pattern for handler registration uses `useActionHandler` + `useEffect` for optimal performance and proper cleanup:

```typescript
import React, { useEffect, useCallback } from 'react';
import { useUserActionHandler, useUserStores } from '@/stores/user.store';

function useUserHandlers() {
  const addHandler = useUserActionHandler();
  const stores = useUserStores();
  
  // Wrap handler with useCallback to prevent re-registration
  const updateProfileHandler = useCallback(async (payload, controller) => {
    // Lazy evaluation using stores for current state
    const profileStore = stores.getStore('profile');
    const currentProfile = profileStore.getValue();
    
    // Validation
    if (payload.validate && !isValidEmail(payload.data.email)) {
      controller.abort('Invalid email format');
      return;
    }
    
    // Business logic
    const updatedProfile = {
      ...currentProfile,
      ...payload.data,
      updatedAt: Date.now()
    };
    
    // Update store
    profileStore.setValue(updatedProfile);
    
    // Return result for collection
    return { success: true, profile: updatedProfile };
  }, [stores]);
  
  // Register handler with cleanup
  useEffect(() => {
    if (!addHandler) return;
    
    // Register returns unregister function
    const unregister = addHandler('updateProfile', updateProfileHandler, {
      priority: 100,      // Higher priority executes first
      blocking: true,     // Wait for async completion in sequential mode
      tags: ['business'], // For filtering
      id: 'profile-updater' // Explicit ID for debugging
    });
    
    // Critical: Return unregister for memory cleanup on unmount
    return unregister;
  }, [addHandler, updateProfileHandler]);
}
```

## Handler Configuration Options

```typescript
interface HandlerConfig {
  priority?: number;        // Execution order (higher = first)
  blocking?: boolean;       // Wait for async completion
  tags?: string[];         // For filtering and categorization
  id?: string;            // Explicit handler ID
  category?: string;      // Handler category
  returnType?: 'value';   // Enable return value collection
}
```

## Handler Execution Flow

1. **Sequential Mode** (default): Handlers run in priority order
2. **Parallel Mode**: All handlers execute simultaneously
3. **Race Mode**: First handler to complete wins

```typescript
// Sequential with blocking
addHandler('processOrder', handler1, { priority: 100, blocking: true });
addHandler('processOrder', handler2, { priority: 90, blocking: true });
addHandler('processOrder', handler3, { priority: 80, blocking: true });
// Execution: handler1 → waits → handler2 → waits → handler3

// Parallel execution
dispatch('processOrder', payload, { executionMode: 'parallel' });
```

## Controller Methods

The controller provides methods to manage handler execution flow:

```typescript
const handler = async (payload, controller) => {
  // Abort pipeline
  if (error) controller.abort('Error message');
  
  // Jump to specific priority
  if (urgent) controller.jumpToPriority(90);
  
  // Set result for collection
  controller.setResult(computedValue);
  
  // Terminate pipeline with result
  if (canFinishEarly) controller.return(finalResult);
};
```

## Advanced Handler Patterns

### Error Handling

```typescript
const robustHandler = useCallback(async (payload, controller) => {
  const store = stores.getStore('data');
  
  try {
    // Risky operation
    const result = await performRiskyOperation(payload);
    store.setValue(result);
    
    return { success: true, data: result };
  } catch (error) {
    // Proper error handling with context
    controller.abort(`Operation failed: ${error.message}`, {
      operation: 'performRiskyOperation',
      payload,
      timestamp: Date.now(),
      error: error.stack
    });
    
    return { success: false, error: error.message };
  }
}, [stores]);
```

### Validation Handlers

```typescript
const validationHandler = useCallback(async (payload, controller) => {
  // Input validation
  const errors = validatePayload(payload);
  if (errors.length > 0) {
    controller.abort('Validation failed', { errors });
    return { success: false, errors };
  }
  
  // Business rule validation
  const store = stores.getStore('state');
  const currentState = store.getValue();
  
  if (!canPerformAction(currentState, payload)) {
    controller.abort('Action not allowed in current state');
    return { success: false, error: 'INVALID_STATE' };
  }
  
  return { success: true };
}, [stores]);
```

### Side Effects Handlers

```typescript
const sideEffectsHandler = useCallback(async (payload, controller) => {
  const store = stores.getStore('data');
  
  // Main operation
  const result = await mainOperation(payload);
  store.setValue(result);
  
  // Side effects (fire and forget)
  scheduleCleanup(result.id);
  sendAnalytics('operation_completed', { id: result.id });
  logActivity('user_action', { action: 'update', userId: payload.userId });
  
  // Optional: Set result for collection
  controller.setResult(result);
  
  return result;
}, [stores]);
```

## Result Collection

Collect results from multiple handlers:

```typescript
function useOrderProcessing() {
  const dispatchWithResult = useUserActionWithResult();
  
  const processOrder = async (orderData) => {
    const result = await dispatchWithResult('processOrder', orderData, {
      result: {
        collect: true,         // Enable collection
        strategy: 'all',       // Collect all results
        timeout: 5000,         // 5 second timeout
        maxResults: 10         // Limit results
      },
      filter: {
        tags: ['validation', 'business'], // Only these handlers
        excludeTags: ['logging']          // Exclude logging
      }
    });
    
    if (result.success) {
      console.log('Results:', result.results);
      console.log('Duration:', result.execution.duration);
    }
    
    return result.result;
  };
}
```

## Handler Organization Patterns

### Domain-Specific Handler Files

```typescript
// hooks/handlers/useUserBusinessHandlers.ts
export function useUserBusinessHandlers() {
  const addHandler = useUserActionHandler();
  const stores = useUserStores();
  
  // Profile handlers
  const updateProfileHandler = useCallback(/* ... */, [stores]);
  const deleteProfileHandler = useCallback(/* ... */, [stores]);
  
  // Authentication handlers  
  const loginHandler = useCallback(/* ... */, [stores]);
  const logoutHandler = useCallback(/* ... */, [stores]);
  
  // Register all handlers
  useEffect(() => {
    if (!addHandler) return;
    
    const unregisterUpdate = addHandler('updateProfile', updateProfileHandler, {
      priority: 100, blocking: true, id: 'update-profile'
    });
    
    const unregisterDelete = addHandler('deleteProfile', deleteProfileHandler, {
      priority: 100, blocking: true, id: 'delete-profile'
    });
    
    const unregisterLogin = addHandler('login', loginHandler, {
      priority: 100, blocking: true, id: 'user-login'
    });
    
    const unregisterLogout = addHandler('logout', logoutHandler, {
      priority: 100, blocking: true, id: 'user-logout'
    });
    
    return () => {
      unregisterUpdate();
      unregisterDelete();
      unregisterLogin();
      unregisterLogout();
    };
  }, [addHandler, updateProfileHandler, deleteProfileHandler, loginHandler, logoutHandler]);
}
```

### Handler Composition

```typescript
// Compose multiple handler hooks
function useAllHandlers() {
  useUserBusinessHandlers();
  useUserUIHandlers();
  useCartHandlers();
  useOrderHandlers();
  // All handlers registered in one place
}
```

## Testing Handlers

### Unit Testing

```typescript
// __tests__/userHandlers.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useUserHandlers } from '@/hooks/handlers/useUserHandlers';
import { createMockRegistry, createMockController } from '@/test-utils';

describe('User Handlers', () => {
  let mockRegistry;
  let mockController;
  
  beforeEach(() => {
    mockRegistry = createMockRegistry();
    mockController = createMockController();
  });
  
  it('should validate email in update profile handler', async () => {
    const { result } = renderHook(() => useUserHandlers());
    
    const handler = result.current.updateProfileHandler;
    
    await handler(
      { data: { email: 'invalid-email' }, validate: true },
      mockController
    );
    
    expect(mockController.abort).toHaveBeenCalledWith('Invalid email format');
  });
  
  it('should update profile store on success', async () => {
    const mockProfileStore = {
      getValue: jest.fn(() => ({ id: '1', name: 'John' })),
      setValue: jest.fn()
    };
    
    mockRegistry.getStore.mockReturnValue(mockProfileStore);
    
    const { result } = renderHook(() => useUserHandlers());
    
    await result.current.updateProfileHandler(
      { data: { name: 'Jane' } },
      mockController
    );
    
    expect(mockProfileStore.setValue).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Jane',
        updatedAt: expect.any(Number)
      })
    );
  });
});
```

## Performance Considerations

### Handler Optimization

```typescript
// ✅ Good: Stable handler with minimal dependencies
const optimizedHandler = useCallback(async (payload, controller) => {
  const store = registry.getStore('data');
  // Handler logic
}, [registry]); // Only registry dependency

// ❌ Bad: Handler recreated every render
const unoptimizedHandler = async (payload, controller) => {
  // New function every render
};
```

### Lazy Loading

```typescript
// Conditionally register expensive handlers
function useConditionalHandlers(userRole: string) {
  const addHandler = useActionHandler();
  
  useEffect(() => {
    if (!addHandler) return;
    
    const handlers = [];
    
    // Always register basic handlers
    handlers.push(addHandler('basic', basicHandler));
    
    // Only register admin handlers for admins
    if (userRole === 'admin') {
      handlers.push(addHandler('admin', adminHandler));
    }
    
    return () => handlers.forEach(unregister => unregister());
  }, [addHandler, userRole]);
}
```

## Common Handler Anti-Patterns

### ❌ Missing Cleanup

```typescript
// Wrong - Memory leak
useEffect(() => {
  addHandler('action', handler);
}, []); // No cleanup
```

### ❌ Stale Closures

```typescript
// Wrong - Using stale values
const data = store.getValue();
const handler = useCallback(() => {
  console.log(data); // Stale value
}, [data]);
```

### ❌ Missing Error Handling

```typescript
// Wrong - Silent failures
const handler = async (payload, controller) => {
  await riskyOperation(); // No error handling
};
```

## Summary

Effective action handler implementation requires:

- **Proper Registration**: Use `useActionHandler` + `useEffect` pattern
- **Memory Management**: Always return cleanup functions
- **Error Handling**: Robust error handling with meaningful messages
- **Performance**: Stable handlers with `useCallback`
- **Testing**: Isolated unit tests for business logic
- **Organization**: Domain-specific handler files

Action handlers are the heart of your business logic - implement them correctly for maintainable, scalable applications.

---

::: tip Next Steps
- Learn [Store Management](./store-management) for effective state handling
- Explore [Cross-Domain Integration](./cross-domain-integration) for multi-domain handlers
- See [Testing Guide](./testing) for comprehensive handler testing strategies
:::