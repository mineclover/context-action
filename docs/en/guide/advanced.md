# Advanced Usage

This guide covers advanced patterns and techniques for using Context Action in complex applications.

## Handler Priorities

Control the execution order of action handlers using priorities.

```typescript
interface AppActions {
  save: { data: any };
  validate: { data: any };
}

function MyComponent() {
  // Higher priority handlers run first
  useActionHandler('save', (data) => {
    console.log('Validating data...');
    // Validation logic
  }, { priority: 100 });

  useActionHandler('save', (data) => {
    console.log('Saving data...');
    // Save logic
  }, { priority: 50 });

  useActionHandler('save', (data) => {
    console.log('Logging save action...');
    // Logging logic
  }, { priority: 1 });
}
```

## Async Action Handling

Handle asynchronous operations with proper error handling and loading states.

### Basic Async Actions

```typescript
interface AppActions {
  fetchUser: { id: string };
  uploadFile: { file: File };
}

function UserManager() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useActionHandler('fetchUser', async ({ id }) => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await api.getUser(id);
      // Handle successful response
      console.log('User loaded:', user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  });

  // Component UI...
}
```

### Async with AbortController

```typescript
function DataFetcher() {
  useActionHandler('fetchData', async (payload, { signal }) => {
    try {
      const response = await fetch('/api/data', { signal });
      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }
      throw error;
    }
  });

  const action = useAction();

  const handleFetch = async () => {
    try {
      const result = await action.dispatch('fetchData', {});
      console.log('Data:', result);
    } catch (error) {
      console.error('Failed to fetch:', error);
    }
  };

  // Cancel ongoing requests
  const handleCancel = () => {
    action.abort('fetchData');
  };
}
```

## Error Handling Patterns

### Global Error Boundary

```typescript
interface AppActions {
  globalError: { error: Error; context?: string };
}

function ErrorBoundaryProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);

  useActionHandler('globalError', ({ error, context }) => {
    console.error(`Error in ${context}:`, error);
    setError(error);
    
    // Send to error reporting service
    errorReporting.captureException(error, { context });
  });

  if (error) {
    return <ErrorFallback error={error} onReset={() => setError(null)} />;
  }

  return <>{children}</>;
}

// Usage in components
function SomeComponent() {
  const action = useAction();

  const handleRiskyOperation = async () => {
    try {
      await riskyApiCall();
    } catch (error) {
      action.dispatch('globalError', { 
        error, 
        context: 'SomeComponent.handleRiskyOperation' 
      });
    }
  };
}
```

### Handler-Level Error Handling

```typescript
function ComponentWithErrorHandling() {
  useActionHandler('processData', async (data) => {
    try {
      return await processData(data);
    } catch (error) {
      // Handle specific errors
      if (error instanceof ValidationError) {
        // Show validation messages
        showToast(error.message, 'warning');
        return;
      }
      
      if (error instanceof NetworkError) {
        // Retry logic
        console.log('Network error, retrying...');
        throw error; // Re-throw to trigger retry
      }
      
      // Unknown error
      console.error('Unexpected error:', error);
      throw error;
    }
  });
}
```

## Action Pipeline Patterns

### Middleware Pattern

```typescript
interface AppActions {
  userAction: { type: string; payload: any };
}

function MiddlewareProvider({ children }: { children: ReactNode }) {
  // Logging middleware
  useActionHandler('userAction', (action) => {
    console.log('Action dispatched:', action);
    analytics.track('user_action', action);
  }, { priority: 1000 });

  // Validation middleware
  useActionHandler('userAction', (action) => {
    if (!action.payload) {
      throw new Error('Action payload is required');
    }
  }, { priority: 900 });

  // Authentication middleware
  useActionHandler('userAction', (action) => {
    if (action.type === 'restricted' && !isAuthenticated()) {
      throw new Error('Authentication required');
    }
  }, { priority: 800 });

  return <>{children}</>;
}
```

### State Management Integration

```typescript
// Integration with external state management
function StateManagerIntegration() {
  const dispatch = useAppDispatch(); // Redux/Zustand dispatch
  
  useActionHandler('syncToStore', (data) => {
    // Sync action data to external store
    dispatch(updateStore(data));
  });

  useActionHandler('storeAction', async (action) => {
    // Dispatch to external store and wait for completion
    await dispatch(asyncAction(action));
  });
}
```

## Performance Optimization

### Handler Memoization

```typescript
function OptimizedComponent({ userId }: { userId: string }) {
  // Memoize expensive handlers
  const expensiveHandler = useCallback(async (data: any) => {
    const result = await expensiveOperation(data, userId);
    return result;
  }, [userId]);

  useActionHandler('expensiveAction', expensiveHandler);
}
```

### Conditional Handler Registration

```typescript
function ConditionalHandlers({ feature }: { feature: string }) {
  // Only register handlers when needed
  useActionHandler('featureA', (data) => {
    // Handle feature A
  }, { 
    enabled: feature === 'A'
  });

  useActionHandler('featureB', (data) => {
    // Handle feature B  
  }, {
    enabled: feature === 'B'
  });
}
```

### Debounced Actions

```typescript
import { debounce } from 'lodash-es';

function SearchComponent() {
  const debouncedSearch = useMemo(
    () => debounce(async (query: string) => {
      const results = await searchApi(query);
      setResults(results);
    }, 300),
    []
  );

  useActionHandler('search', debouncedSearch);

  const action = useAction();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    action.dispatch('search', e.target.value);
  };
}
```

## Testing Strategies

### Unit Testing Handlers

```typescript
import { renderHook } from '@testing-library/react';
import { createActionContext } from '@context-action/react';

describe('Action Handlers', () => {
  it('should handle user registration', async () => {
    const { Provider, useAction, useActionHandler } = createActionContext<{
      registerUser: { email: string; password: string };
    }>();

    const mockApi = jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' });
    
    function TestComponent() {
      useActionHandler('registerUser', async ({ email, password }) => {
        return await mockApi({ email, password });
      });
      
      return useAction();
    }

    const { result } = renderHook(() => TestComponent(), {
      wrapper: Provider
    });

    const user = await result.current.dispatch('registerUser', {
      email: 'test@example.com',
      password: 'password123'
    });

    expect(mockApi).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(user).toEqual({ id: 1, email: 'test@example.com' });
  });
});
```

### Integration Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

function TestApp() {
  return (
    <ActionProvider>
      <UserRegistration />
      <UserList />
    </ActionProvider>
  );
}

describe('User Management Integration', () => {
  it('should register user and update list', async () => {
    render(<TestApp />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Verify user appears in list
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });
});
```

## Architecture Patterns

### Feature-Based Organization

```typescript
// features/user/actions.ts
export interface UserActions {
  loginUser: { email: string; password: string };
  logoutUser: void;
  updateProfile: { name: string; avatar?: string };
}

// features/user/handlers.tsx
export function UserHandlers() {
  useActionHandler('loginUser', async ({ email, password }) => {
    const user = await authApi.login(email, password);
    return user;
  });

  useActionHandler('logoutUser', async () => {
    await authApi.logout();
  });

  useActionHandler('updateProfile', async (profile) => {
    const updatedUser = await userApi.updateProfile(profile);
    return updatedUser;  
  });

  return null;
}

// features/user/index.tsx
export function UserProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <UserHandlers />
      {children}
    </>
  );
}
```

### Domain-Driven Design

```typescript
// domains/order/types.ts
export interface OrderDomain {
  createOrder: { items: CartItem[]; shippingAddress: Address };
  updateOrderStatus: { orderId: string; status: OrderStatus };
  cancelOrder: { orderId: string; reason: string };
  trackOrder: { orderId: string };
}

// domains/order/handlers.tsx
export function OrderDomainHandlers() {
  const orderService = useOrderService();
  
  useActionHandler('createOrder', async ({ items, shippingAddress }) => {
    return await orderService.create({ items, shippingAddress });
  });

  useActionHandler('updateOrderStatus', async ({ orderId, status }) => {
    return await orderService.updateStatus(orderId, status);
  });

  // ... other handlers
  return null;
}
```

### Hexagonal Architecture

```typescript
// ports/notification.port.ts
export interface NotificationPort {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendPush(userId: string, message: string): Promise<void>;
}

// adapters/notification.adapter.ts  
export class EmailNotificationAdapter implements NotificationPort {
  async sendEmail(to: string, subject: string, body: string) {
    // Email service implementation
  }
  
  async sendPush(userId: string, message: string) {
    // Push notification implementation
  }
}

// Application layer
function NotificationHandlers() {
  const notificationService = useNotificationService();
  
  useActionHandler('sendNotification', async ({ type, recipient, message }) => {
    switch (type) {
      case 'email':
        await notificationService.sendEmail(recipient, 'Alert', message);
        break;
      case 'push':
        await notificationService.sendPush(recipient, message);
        break;
    }
  });
}
```

## Best Practices

### 1. Action Design

- **Be Specific**: Create specific action types rather than generic ones
- **Include Context**: Add relevant context data to action payloads
- **Version Actions**: Consider versioning for breaking changes

```typescript
// Good
interface AppActions {
  submitContactForm: { 
    name: string; 
    email: string; 
    message: string;
    source: 'homepage' | 'contact-page';
  };
  updateUserProfile: { 
    userId: string; 
    changes: Partial<UserProfile>;
    version: 'v1' | 'v2';
  };
}

// Avoid
interface AppActions {
  submit: any; // Too generic
  update: any; // No context
}
```

### 2. Handler Organization

- **Colocation**: Keep handlers close to the components that use them
- **Single Responsibility**: Each handler should have one clear purpose
- **Error Boundaries**: Always handle errors appropriately

### 3. Performance Considerations

- **Avoid Over-Subscription**: Don't register unnecessary handlers
- **Use Priorities Wisely**: Set appropriate priorities for handler execution
- **Clean Up**: Remove handlers when components unmount (automatic with hooks)

### 4. Type Safety

- **Strict Types**: Use strict TypeScript configurations
- **Action Validation**: Validate action payloads at runtime when needed
- **Generic Constraints**: Use generic constraints for reusable patterns

## Common Pitfalls

### 1. Handler Side Effects

```typescript
// ❌ Don't mutate external state directly
useActionHandler('updateUser', (user) => {
  globalUserState.current = user; // Avoid this
});

// ✅ Use proper state management
useActionHandler('updateUser', (user) => {
  setUser(user); // React state
  // or dispatch to your store
});
```

### 2. Async Handler Errors

```typescript
// ❌ Unhandled promise rejections
useActionHandler('fetchData', async () => {
  await api.getData(); // If this fails, error is unhandled
});

// ✅ Proper error handling
useActionHandler('fetchData', async () => {
  try {
    return await api.getData();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error; // Re-throw if you want caller to handle
  }
});
```

### 3. Memory Leaks

```typescript
// ❌ Creating new functions on every render
function MyComponent() {
  useActionHandler('action', () => {
    // This creates a new function every render
    doSomething();
  });
}

// ✅ Stable references
function MyComponent() {
  const handler = useCallback(() => {
    doSomething();
  }, []);
  
  useActionHandler('action', handler);
}
```

By following these advanced patterns and best practices, you can build robust, maintainable applications with Context Action that scale effectively as your application grows.