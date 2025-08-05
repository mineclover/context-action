# React Integration Guide

## Overview

This guide covers how to integrate the Context-Action framework with React applications, focusing on context-based patterns and practical implementation details.

## Context-Based Provider Setup

### Multiple Nested Contexts

```typescript
// Multiple contexts for different domains
function App() {
  return (
    <StoreProvider>
      {/* Authentication Domain */}
      <AuthContext.Provider>
        {/* Cart Domain nested within */}
        <CartContext.Provider>
          {/* User Profile Domain */}
          <UserContext.Provider>
            <Application />
          </UserContext.Provider>
        </CartContext.Provider>
      </AuthContext.Provider>
    </StoreProvider>
  );
}
```

### Separate Domain Boundaries

```typescript
// Alternative: Separate domain boundaries
function App() {
  return (
    <div>
      {/* Auth section with its own context */}
      <AuthContext.Provider>
        <StoreProvider registryId="auth">
          <AuthSection />
        </StoreProvider>
      </AuthContext.Provider>
      
      {/* Shopping section with its own context */}
      <CartContext.Provider>
        <StoreProvider registryId="cart">
          <ShoppingSection />
        </StoreProvider>
      </CartContext.Provider>
    </div>
  );
}
```

## Context-Scoped Component Usage

### Single Context Components

```typescript
// First, create the contexts and extract their hooks
const {
  Provider: AuthProvider,
  useAction: useAuthAction,
  useActionHandler: useAuthHandler
} = createActionContext<AuthActions>({ name: 'AuthDomain' });

const {
  Provider: UserProvider,
  useAction: useUserAction,
  useActionHandler: useUserHandler
} = createActionContext<UserActions>({ name: 'UserDomain' });

// Component within Auth context
function LoginComponent() {
  // Uses auth context's dispatch - type-safe and scoped
  const dispatch = useAuthAction();
  const authState = useStoreValue(authStore);

  const handleLogin = (username: string, password: string) => {
    // Only 'login' actions available in AuthContext
    dispatch('login', { username, password });
  };

  return (
    <div>
      <h1>Authentication Status: {authState.status}</h1>
      <button onClick={() => handleLogin('user', 'pass')}>
        Login
      </button>
    </div>
  );
}

// Component within User context
function UserProfile() {
  // Uses user context's dispatch - different from AuthContext
  const dispatch = useUserAction();
  const user = useStoreValue(userStore);

  const updateName = (name: string) => {
    // Only 'updateUser' actions available in UserContext
    dispatch('updateUser', { id: user.id, name });
  };

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => updateName('New Name')}>
        Update Name
      </button>
    </div>
  );
}
```

### Multi-Context Components

```typescript
// First create cart context
const {
  Provider: CartProvider,
  useAction: useCartAction,
  useActionHandler: useCartHandler
} = createActionContext<CartActions>({ name: 'CartDomain' });

// Component using multiple contexts (explicit cross-context access)
function DashboardComponent() {
  const authDispatch = useAuthAction();
  const userDispatch = useUserAction();
  const cartDispatch = useCartAction();
  
  const handleLogout = async () => {
    // Coordinate across multiple contexts
    await cartDispatch('clearCart', undefined);
    await userDispatch('resetUser', undefined);
    await authDispatch('logout', undefined);
  };

  return (
    <button onClick={handleLogout}>
      Complete Logout
    </button>
  );
}
```

## Context-Scoped Action Handler Registration

### Basic Handler Registration

```typescript
// Handler registration within specific context
function useUserActions() {
  const registry = useStoreRegistry();

  // Create handler with useCallback to prevent infinite loops
  const updateUserHandler = useCallback(
    async (payload, controller) => {
      // Access stores within UserContext boundary
      const userStore = registry.getStore('user');
      const settingsStore = registry.getStore('settings');
      
      const user = userStore.getValue();
      const settings = settingsStore.getValue();

      // Domain-specific business logic
      if (settings.validateNames && !isValidName(payload.name)) {
        controller.abort('Invalid name');
        return;
      }

      userStore.setValue({
        ...user,
        ...payload,
        updatedAt: Date.now()
      });
    },
    [registry] // Dependencies for useCallback
  );

  // Register handler with options
  useUserHandler('updateUser', updateUserHandler, { priority: 10, blocking: true });
}
```

### Cross-Context Handler Coordination

```typescript
// Cross-context handler coordination
function useCrossContextHandlers() {
  // Get dispatch functions from each context
  const userDispatch = useUserAction();
  const registry = useStoreRegistry();
  
  // Register handlers in different contexts that coordinate
  
  // Auth context handler - wrapped with useCallback
  const loginHandler = useCallback(async (payload, controller) => {
    const authStore = registry.getStore('auth');
    const authResult = await authenticateUser(payload);
    authStore.setValue(authResult);
    
    // Signal to other contexts (via event or direct call)
    window.dispatchEvent(new CustomEvent('auth:login', { 
      detail: { userId: authResult.userId } 
    }));
  }, [registry]);

  // User context handler responding to auth events - wrapped with useCallback
  const loadUserDataHandler = useCallback(async (payload, controller) => {
    const userStore = registry.getStore('user');
    const userData = await fetchUserData(payload.userId);
    userStore.setValue(userData);
  }, [registry]);

  // Register handlers
  useAuthHandler('login', loginHandler);
  useUserHandler('loadUserData', loadUserDataHandler);

  // Listen for cross-context events
  useEffect(() => {
    const handleAuthLogin = (event) => {
      userDispatch('loadUserData', { userId: event.detail.userId });
    };

    window.addEventListener('auth:login', handleAuthLogin);
    return () => window.removeEventListener('auth:login', handleAuthLogin);
  }, [userDispatch]);
}
```

## Context Creation Patterns

### Simple Context Creation

```typescript
// Define domain-specific actions
interface AuthActions extends ActionPayloadMap {
  login: { username: string; password: string };
  logout: void;
  refreshToken: { token: string };
  validateSession: { userId: string };
}

// Create context and get all necessary components
const {
  Provider: AuthProvider,
  useAction: useAuthAction,
  useActionHandler: useAuthHandler,
  useActionContext: useAuthContext
} = createActionContext<AuthActions>({
  name: 'AuthDomain'
});

// Use Provider directly from createActionContext
function App() {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
```

### Advanced Context Configuration

```typescript
// Context with custom configuration
const {
  Provider: PaymentProvider,
  useAction: usePaymentAction,
  useActionHandler: usePaymentHandler,
  useActionContext: usePaymentContext
} = createActionContext<PaymentActions>({
  name: 'PaymentDomain',
  defaultExecutionMode: 'sequential'
});

// Custom provider with initialization logic
function PaymentDomainProvider({ children }) {
  // Initialize payment handlers
  usePaymentHandlers();
  
  // Initialize payment stores
  usePaymentStores();

  return (
    <PaymentProvider>
      <StoreProvider registryId="payment">
        {children}
      </StoreProvider>
    </PaymentProvider>
  );
}
```

## Hook Patterns

### Context-Specific Hooks

```typescript
// Custom hook for auth operations
function useAuth() {
  const dispatch = useAuthAction();
  const authState = useStoreValue(authStore);

  const login = useCallback((credentials) => {
    return dispatch('login', credentials);
  }, [dispatch]);

  const logout = useCallback(() => {
    return dispatch('logout', undefined);
  }, [dispatch]);

  const isAuthenticated = authState?.status === 'authenticated';

  return {
    login,
    logout,
    isAuthenticated,
    user: authState?.user
  };
}

// Custom hook for cart operations
function useCart() {
  const dispatch = useCartAction();
  const cart = useStoreValue(cartStore);

  const addItem = useCallback((product, quantity = 1) => {
    return dispatch('addItem', { productId: product.id, quantity });
  }, [dispatch]);

  const removeItem = useCallback((itemId) => {
    return dispatch('removeItem', { itemId });
  }, [dispatch]);

  return {
    items: cart?.items || [],
    total: cart?.total || 0,
    addItem,
    removeItem
  };
}
```

### Cross-Context Hooks

```typescript
// First create order context
const {
  Provider: OrderProvider,
  useAction: useOrderAction,
  useActionHandler: useOrderHandler
} = createActionContext<OrderActions>({ name: 'OrderDomain' });

// Hook that coordinates multiple contexts
function useCheckout() {
  const authDispatch = useAuthAction();
  const cartDispatch = useCartAction();
  const orderDispatch = useOrderAction();
  
  const checkout = useCallback(async (paymentInfo) => {
    try {
      // Validate authentication
      await authDispatch('validateSession', {});
      
      // Process cart
      const cartData = await cartDispatch('calculateTotal', {});
      
      // Create order
      await orderDispatch('createOrder', {
        ...cartData,
        payment: paymentInfo
      });
      
      // Clear cart
      await cartDispatch('clearCart', {});
      
    } catch (error) {
      console.error('Checkout failed:', error);
      throw error;
    }
  }, [authDispatch, cartDispatch, orderDispatch]);

  return { checkout };
}
```

## Error Handling Patterns

### Context-Scoped Error Handling

```typescript
function useErrorHandling() {
  const registry = useStoreRegistry();
  
  // Error boundary for specific context
  useUserHandler('handleError', async (payload, controller) => {
    const errorStore = registry.getStore('errors');
    
    errorStore.update(errors => [...errors, {
      id: Date.now(),
      message: payload.message,
      context: 'UserContext',
      timestamp: new Date()
    }]);
  });
}

// Error boundary component
function ContextErrorBoundary({ children, contextName }) {
  return (
    <ErrorBoundary
      fallback={<ErrorFallback contextName={contextName} />}
      onError={(error, errorInfo) => {
        console.error(`Error in ${contextName}:`, error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### Cross-Context Error Propagation

```typescript
// First create notification context
const {
  Provider: NotificationProvider,
  useAction: useNotificationAction,
  useActionHandler: useNotificationHandler
} = createActionContext<NotificationActions>({ name: 'NotificationDomain' });

function useCrossContextErrorHandling() {
  const notificationDispatch = useNotificationAction();

  // Handle errors from any context
  const handleError = useCallback(async (error, contextName) => {
    await notificationDispatch('showError', {
      message: `Error in ${contextName}: ${error.message}`,
      duration: 5000
    });
  }, [notificationDispatch]);

  // Register error handlers in each context
  useEffect(() => {
    const unregisterAuth = useAuthHandler('error', 
      async (error) => handleError(error, 'Auth')
    );
    
    const unregisterUser = useUserHandler('error',
      async (error) => handleError(error, 'User')
    );

    return () => {
      unregisterAuth();
      unregisterUser();
    };
  }, [handleError]);
}
```

## Testing Patterns

### Context Testing

```typescript
// Test utilities for context
function createTestContext<T extends ActionPayloadMap>(
  actions: T,
  mockStores: Record<string, any> = {}
) {
  const TestContext = createActionContext<T>({ name: 'TestContext' });
  
  const TestProvider = ({ children }) => (
    <TestContext.Provider>
      <MockStoreProvider stores={mockStores}>
        {children}
      </MockStoreProvider>
    </TestContext.Provider>
  );

  return { TestContext, TestProvider };
}

// Usage in tests
describe('UserContext', () => {
  it('should handle user updates', async () => {
    const mockUserStore = createMockStore({ id: '1', name: 'John' });
    const { TestContext, TestProvider } = createTestContext(
      UserActions,
      { user: mockUserStore }
    );

    // Extract hooks from test context
    const { useAction: useTestAction } = TestContext;

    const TestComponent = () => {
      const dispatch = useTestAction();
      
      useEffect(() => {
        dispatch('updateUser', { id: '1', name: 'Jane' });
      }, [dispatch]);

      return null;
    };

    render(
      <TestProvider>
        <TestComponent />
      </TestProvider>
    );

    expect(mockUserStore.getValue().name).toBe('Jane');
  });
});
```

## Next Steps

- **Advanced Patterns**: Explore complex integration scenarios in [patterns.md](./patterns.md)
- **Best Practices**: Learn optimization techniques in [best-practices.md](./best-practices.md)
- **Visual Reference**: See architectural diagrams in [diagrams.md](./diagrams.md)