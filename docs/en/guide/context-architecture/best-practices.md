# Context-Based Best Practices

## Overview

This guide provides comprehensive best practices for developing, optimizing, and maintaining Context-Action applications with a focus on context-based architecture patterns.

## Context-Based Architecture Benefits

### Domain Isolation Benefits
1. **Domain Isolation**: Each context maintains complete independence with its own action pipeline and stores
2. **Clear Separation**: Business logic in actions, state in stores, UI in components, all scoped within context boundaries
3. **Modular Reusability**: Actions can be reused across components within the same context, and contexts can be reused across applications
4. **Isolated Testability**: Each context can be tested independently without affecting other domains

### Technical Benefits
5. **Context-Scoped Type Safety**: Full TypeScript support with compile-time checking within domain boundaries
6. **Optimized Performance**: Only components within the same context that use changed stores re-render
7. **Domain-Specific Debugging**: Clear action flow with pipeline tracing within each context boundary  
8. **Horizontal Scalability**: Easy to add new contexts/domains without affecting existing functionality

### Organizational Benefits
9. **Team Scalability**: Different teams can work on different contexts independently
10. **Deployment Flexibility**: Contexts can be deployed as separate modules or micro-frontends

## Context Design Best Practices

### 1. Domain-Focused Contexts

```typescript
// ✅ Good: Domain-focused contexts
const AuthContext = createActionContext<AuthActions>({ name: 'Authentication' });
const ShoppingContext = createActionContext<ShoppingActions>({ name: 'Shopping' });
const UserProfileContext = createActionContext<UserProfileActions>({ name: 'UserProfile' });

// ❌ Bad: Technology-focused contexts
const APIContext = createActionContext<APIActions>({ name: 'API' });
const UIContext = createActionContext<UIActions>({ name: 'UI' });
const DatabaseContext = createActionContext<DatabaseActions>({ name: 'Database' });
```

### 2. Context Boundaries

```typescript
// ✅ Good: Clear domain boundaries
interface AuthActions extends ActionPayloadMap {
  login: { username: string; password: string };
  logout: void;
  refreshToken: { token: string };
  validateSession: { userId: string };
}

interface ShoppingActions extends ActionPayloadMap {
  addToCart: { productId: string; quantity: number };
  removeFromCart: { itemId: string };
  updateQuantity: { itemId: string; quantity: number };
  calculateTotals: void;
}

// ❌ Bad: Mixed domain concerns
interface MixedActions extends ActionPayloadMap {
  login: { username: string; password: string };
  addToCart: { productId: string; quantity: number };
  updateUserProfile: { name: string; email: string };
  processPayment: { amount: number; method: string };
}
```

### 3. Context Size Balance

```typescript
// ✅ Good: Balanced context size
const UserProfileContext = createActionContext<UserProfileActions>({ 
  name: 'UserProfile' 
});
const UserPreferencesContext = createActionContext<UserPreferencesActions>({ 
  name: 'UserPreferences' 
});

// ❌ Bad: Too granular (complexity overhead)
const UserNameContext = createActionContext<{ updateName: { name: string } }>({ 
  name: 'UserName' 
});
const UserEmailContext = createActionContext<{ updateEmail: { email: string } }>({ 
  name: 'UserEmail' 
});

// ❌ Bad: Too broad (coupling issues)
const EntireAppContext = createActionContext<AllAppActions>({ 
  name: 'EntireApp' 
});
```

## Action Design Best Practices

### 4. Context-Scoped Actions

```typescript
// ✅ Good: Actions scoped to their domain
function useShoppingHandlers() {
  ShoppingContext.useActionHandler('addToCart', async (payload, controller) => {
    const cartStore = registry.getStore('cart');
    const inventoryStore = registry.getStore('inventory');
    
    // Domain-specific validation
    const inventory = inventoryStore.getValue();
    if (inventory[payload.productId] < payload.quantity) {
      controller.abort('Insufficient inventory');
      return;
    }
    
    // Domain-specific logic
    cartStore.update(cart => addItemToCart(cart, payload));
  });
}

// ❌ Bad: Actions that span multiple domains
function useMixedHandlers() {
  GlobalContext.useActionHandler('addToCartAndUpdateProfile', async (payload, controller) => {
    // This violates domain boundaries
    cartStore.update(cart => addItemToCart(cart, payload.cartItem));
    userStore.update(user => updateLastActivity(user, Date.now()));
    authStore.update(auth => updateSessionActivity(auth));
  });
}
```

### 5. Priority-Based Handler Execution

```typescript
// ✅ Good: Using priorities for dependent operations
function useOrderedHandlers() {
  ShoppingContext.useActionHandler('processCheckout', async (payload, controller) => {
    // Validation happens first
  }, { priority: 100 });

  ShoppingContext.useActionHandler('processCheckout', async (payload, controller) => {
    // Payment processing happens second
  }, { priority: 50 });

  ShoppingContext.useActionHandler('processCheckout', async (payload, controller) => {
    // Order creation happens last
  }, { priority: 10 });
}
```

### 6. Cross-Context Coordination

```typescript
// ✅ Good: Explicit cross-context communication
function useExplicitCrossContext() {
  const authDispatch = AuthContext.useAction();
  const userDispatch = UserContext.useAction();
  const shoppingDispatch = ShoppingContext.useAction();

  const handleUserLogin = async (credentials) => {
    // Step 1: Authenticate
    await authDispatch('login', credentials);
    
    // Step 2: Load user profile
    await userDispatch('loadProfile', { userId: credentials.userId });
    
    // Step 3: Load user's cart
    await shoppingDispatch('loadUserCart', { userId: credentials.userId });
  };

  return { handleUserLogin };
}

// ❌ Bad: Implicit cross-context dependencies
function useImplicitCrossContext() {
  AuthContext.useActionHandler('login', async (payload, controller) => {
    // This creates hidden dependencies
    await userStore.setValue(await fetchUser(payload.userId));
    await cartStore.setValue(await fetchCart(payload.userId));
  });
}
```

### 7. Error Handling

```typescript
// ✅ Good: Context-specific error handling
function useContextErrorHandling() {
  const registry = useStoreRegistry();
  
  const processPaymentHandler = useCallback(async (payload, controller) => {
    try {
      const paymentStore = registry.getStore('payment');
      const errorStore = registry.getStore('error');
      
      const result = await paymentService.process(payload);
      paymentStore.setValue(result);
    } catch (error) {
      // Context-specific error handling
      const errorStore = registry.getStore('error');
      errorStore.setValue({
        type: 'payment_error',
        message: error.message,
        context: 'Shopping',
        timestamp: Date.now()
      });
      
      controller.abort(`Payment failed: ${error.message}`);
    }
  }, [registry]);
  
  useShoppingHandler('processPayment', processPaymentHandler);
}
```

## Handler Registration Best Practices

### 8. Wrap with useCallback
Always wrap handler functions with useCallback to prevent infinite re-registration loops.

```typescript
// ✅ Good: Handler wrapped with useCallback
function useAuthHandlers() {
  const registry = useStoreRegistry();
  
  const loginHandler = useCallback(async (payload, controller) => {
    const authStore = registry.getStore('auth');
    // Handler logic here
  }, [registry]); // Include dependencies
  
  useAuthHandler('login', loginHandler);
}

// ❌ Bad: Raw handler causes infinite loops
function useAuthHandlersBad() {
  // This will cause infinite re-registration!
  useAuthHandler('login', async (payload, controller) => {
    // Handler logic
  });
}
```

### 9. Include Dependencies
Add necessary dependencies to useCallback (like registry, dispatch functions).

```typescript
function useComplexHandler() {
  const registry = useStoreRegistry();
  const userDispatch = useUserAction();
  const config = useConfig();
  
  const handler = useCallback(async (payload, controller) => {
    const store = registry.getStore('data');
    // Use registry, userDispatch, config
  }, [registry, userDispatch, config]); // All dependencies included
  
  useDataHandler('process', handler);
}
```

### 10. Alternative Pattern
For complex handlers, consider using useEffect with ActionRegister directly.

```typescript
function useAuthHandlersAlt() {
  const { actionRegisterRef } = useAuthContext();
  
  useEffect(() => {
    const register = actionRegisterRef.current;
    if (!register) return;
    
    // Register handlers directly
    const unregisterLogin = register.register('login', async (payload, controller) => {
      const authState = authStore.getValue();
      // Business logic here
    });
    
    const unregisterLogout = register.register('logout', async (payload, controller) => {
      authStore.setValue(null);
      sessionStore.clear();
    });
    
    // Cleanup
    return () => {
      unregisterLogin();
      unregisterLogout();
    };
  }, []); // Dependencies here
}
```

### 11. Handler Lifecycle
Remember that handlers are registered/unregistered based on component lifecycle.

```typescript
function FeatureComponent() {
  // Handler is registered when component mounts
  const handler = useCallback(async (payload, controller) => {
    // Handler logic
  }, []);
  
  useFeatureHandler('action', handler);
  
  // Handler is automatically unregistered when component unmounts
  return <div>Feature UI</div>;
}
```

## Store Management Best Practices

### 12. Context-Scoped Stores

```typescript
// ✅ Good: Stores scoped to appropriate contexts
function useShoppingStores() {
  const registry = useStoreRegistry();
  
  // Stores clearly belong to shopping domain
  const cartStore = registry.getStore('cart');
  const inventoryStore = registry.getStore('inventory');
  const checkoutStore = registry.getStore('checkout');
  
  return { cartStore, inventoryStore, checkoutStore };
}

// ❌ Bad: Stores accessed across inappropriate contexts
function useMixedStores() {
  const registry = useStoreRegistry();
  
  // Accessing user stores from shopping context
  const cartStore = registry.getStore('cart');
  const userProfileStore = registry.getStore('userProfile'); // Wrong context
  const authTokenStore = registry.getStore('authToken'); // Wrong context
}
```

### 13. Predictable Store Updates

```typescript
// ✅ Good: Predictable updates within context
ShoppingContext.useActionHandler('updateCart', async (payload, controller) => {
  const cartStore = registry.getStore('cart');
  
  cartStore.update(cart => ({
    ...cart,
    items: cart.items.map(item => 
      item.id === payload.itemId 
        ? { ...item, quantity: payload.quantity }
        : item
    ),
    updatedAt: Date.now()
  }));
});

// ❌ Bad: Side effects outside context scope
ShoppingContext.useActionHandler('updateCart', async (payload, controller) => {
  const cartStore = registry.getStore('cart');
  
  cartStore.update(cart => updateCartWithSideEffects(cart, payload));
  
  // Unexpected side effect
  analyticsService.track('cart_updated', payload); // Should be explicit
  localStorage.setItem('cart', JSON.stringify(cart)); // Should be explicit
});
```

### 14. Store Naming Conventions

```typescript
// ✅ Good: Context-prefixed store names
const shoppingStores = {
  'shopping:cart': createStore(initialCartState),
  'shopping:inventory': createStore(initialInventoryState),
  'shopping:checkout': createStore(initialCheckoutState)
};

const userStores = {
  'user:profile': createStore(initialProfileState),
  'user:preferences': createStore(initialPreferencesState),
  'user:activity': createStore(initialActivityState)
};

// ❌ Bad: Generic store names that could conflict
const stores = {
  'cart': createStore(initialCartState),
  'user': createStore(initialUserState),
  'data': createStore(initialDataState) // Too generic
};
```

## Type Safety Best Practices

### 15. Context-Specific Types

```typescript
// ✅ Good: Domain-specific type definitions
namespace Shopping {
  export interface CartItem {
    id: string;
    productId: string;
    quantity: number;
    price: number;
  }

  export interface Actions extends ActionPayloadMap {
    addToCart: { productId: string; quantity: number };
    removeFromCart: { itemId: string };
    updateQuantity: { itemId: string; quantity: number };
  }
}

namespace User {
  export interface Profile {
    id: string;
    name: string;
    email: string;
  }

  export interface Actions extends ActionPayloadMap {
    updateProfile: Partial<Profile>;
    deleteProfile: { id: string };
  }
}
```

### 16. Cross-Context Type Interfaces

```typescript
// ✅ Good: Explicit cross-context communication types
interface CrossContextEvents {
  'auth:loginSuccess': { userId: string; sessionToken: string };
  'user:profileUpdated': { userId: string; profile: User.Profile };
  'shopping:orderCompleted': { orderId: string; userId: string };
}

interface CrossContextBridge {
  publishEvent<K extends keyof CrossContextEvents>(
    event: K, 
    data: CrossContextEvents[K]
  ): void;
  
  subscribeToEvent<K extends keyof CrossContextEvents>(
    event: K, 
    handler: (data: CrossContextEvents[K]) => void
  ): () => void;
}
```

## Testing Best Practices

### 17. Context Isolation Testing

```typescript
// ✅ Good: Test contexts in isolation
describe('ShoppingContext', () => {
  let mockCartStore: MockStore<CartState>;
  let mockInventoryStore: MockStore<InventoryState>;
  let TestProvider: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    mockCartStore = createMockStore(initialCartState);
    mockInventoryStore = createMockStore(initialInventoryState);
    
    TestProvider = ({ children }) => (
      <ShoppingContext.Provider>
        <MockStoreProvider stores={{
          'shopping:cart': mockCartStore,
          'shopping:inventory': mockInventoryStore
        }}>
          {children}
        </MockStoreProvider>
      </ShoppingContext.Provider>
    );
  });

  it('should add item to cart', async () => {
    const dispatch = ShoppingContext.useAction();
    
    await dispatch('addToCart', { productId: 'p1', quantity: 2 });
    
    const cartState = mockCartStore.getValue();
    expect(cartState.items).toHaveLength(1);
    expect(cartState.items[0].productId).toBe('p1');
  });
});
```

### 18. Cross-Context Integration Testing

```typescript
// ✅ Good: Test cross-context integration explicitly
describe('Cross-Context Integration', () => {
  it('should coordinate login across contexts', async () => {
    const authDispatch = AuthContext.useAction();
    const userDispatch = UserContext.useAction();
    const shoppingDispatch = ShoppingContext.useAction();

    // Mock the coordination function
    const handleLogin = async (credentials) => {
      await authDispatch('login', credentials);
      await userDispatch('loadProfile', { userId: credentials.userId });
      await shoppingDispatch('loadUserCart', { userId: credentials.userId });
    };

    await handleLogin({ userId: 'u1', username: 'test', password: 'pass' });

    // Verify each context was updated appropriately
    expect(authStore.getValue().isAuthenticated).toBe(true);
    expect(userStore.getValue().profile).toBeDefined();
    expect(cartStore.getValue().items).toBeDefined();
  });
});
```

### 19. Mock Context Providers

```typescript
// ✅ Good: Reusable mock context providers
function createMockContextProvider<T extends ActionPayloadMap>(
  Context: ActionContextReturn<T>,
  mockStores: Record<string, MockStore<any>> = {}
) {
  return ({ children }: { children: React.ReactNode }) => (
    <Context.Provider>
      <MockStoreProvider stores={mockStores}>
        {children}
      </MockStoreProvider>
    </Context.Provider>
  );
}

// Usage in tests
const MockShoppingProvider = createMockContextProvider(ShoppingContext, {
  'shopping:cart': mockCartStore,
  'shopping:inventory': mockInventoryStore
});
```

## Performance Best Practices

### 20. Context Scope Optimization

```typescript
// ✅ Good: Subscribe only to relevant context stores
function ShoppingCartComponent() {
  // Only subscribes to shopping context stores
  const cartState = useStoreValue(shoppingCartStore);
  const dispatch = ShoppingContext.useAction();

  return (
    <div>
      {cartState.items.map(item => (
        <CartItem key={item.id} item={item} />
      ))}
    </div>
  );
}

// ❌ Bad: Subscribing to irrelevant stores
function BadShoppingCartComponent() {
  const cartState = useStoreValue(shoppingCartStore);
  const userState = useStoreValue(userProfileStore); // Unnecessary subscription
  const authState = useStoreValue(authStore); // Unnecessary subscription
  
  return <div>{cartState.items.length} items</div>;
}
```

### 21. Lazy Context Loading

```typescript
// ✅ Good: Load contexts when needed
const LazyShoppingContext = lazy(() => import('./contexts/ShoppingContext'));

function App() {
  const [showShopping, setShowShopping] = useState(false);

  return (
    <AuthContext.Provider>
      <UserContext.Provider>
        <MainContent />
        {showShopping && (
          <Suspense fallback={<ShoppingLoader />}>
            <LazyShoppingContext.Provider>
              <ShoppingSection />
            </LazyShoppingContext.Provider>
          </Suspense>
        )}
      </UserContext.Provider>
    </AuthContext.Provider>
  );
}
```

### 22. Context Memory Management

```typescript
// ✅ Good: Proper cleanup on unmount
function useShoppingContextCleanup() {
  const registry = useStoreRegistry();

  useEffect(() => {
    return () => {
      // Clear context-specific stores
      registry.getStore('shopping:cart')?.clear();
      registry.getStore('shopping:checkout')?.clear();
      
      // Remove event listeners
      window.removeEventListener('shopping:cartUpdate', handleCartUpdate);
      
      // Cancel pending operations
      pendingOperations.forEach(operation => operation.cancel());
    };
  }, [registry]);
}
```

## Development Workflow Best Practices

### 23. Context-First Development

```typescript
// ✅ Good: Design contexts before implementing features
// 1. Define domain boundaries
const domains = ['Auth', 'User', 'Shopping', 'Payment', 'Notification'];

// 2. Define actions for each domain
interface AuthDomain {
  actions: AuthActions;
  stores: ['auth', 'session'];
  components: ['LoginForm', 'LogoutButton'];
}

// 3. Define cross-domain interactions
interface CrossDomainFlows {
  'user-login': ['Auth', 'User', 'Shopping'];
  'checkout': ['Shopping', 'Payment', 'User'];
}

// 4. Implement contexts based on design
```

### 24. Team Ownership

```typescript
// ✅ Good: Clear context ownership
/*
 * Context Ownership:
 * - AuthContext: Security Team
 * - UserContext: User Experience Team  
 * - ShoppingContext: E-commerce Team
 * - PaymentContext: Payment Team
 * - NotificationContext: UI/UX Team
 */

// Each team maintains their context independently
// Cross-context integration requires coordination
```

### 25. Context Documentation

```typescript
// ✅ Good: Document context boundaries and responsibilities
/**
 * ShoppingContext
 * 
 * Responsibilities:
 * - Cart management (add, remove, update items)
 * - Inventory tracking
 * - Price calculations
 * - Checkout process initiation
 * 
 * Boundaries:
 * - Does NOT handle user authentication (AuthContext)
 * - Does NOT handle payment processing (PaymentContext)  
 * - Does NOT handle user profile data (UserContext)
 * 
 * Cross-Context Dependencies:
 * - Requires AuthContext for user session validation
 * - Coordinates with PaymentContext for checkout
 * - May trigger NotificationContext for user feedback
 * 
 * Stores:
 * - shopping:cart - Current cart state
 * - shopping:inventory - Product availability
 * - shopping:checkout - Checkout process state
 */
```

## Common Anti-Patterns to Avoid

### ❌ Context Leakage
```typescript
// Don't access stores from wrong contexts
ShoppingContext.useActionHandler('addToCart', async (payload, controller) => {
  const userStore = registry.getStore('user'); // Wrong context!
  // ... 
});
```

### ❌ Implicit Cross-Context Dependencies
```typescript
// Don't create hidden dependencies between contexts
AuthContext.useActionHandler('login', async (payload, controller) => {
  // Hidden dependency on shopping context
  await ShoppingContext.useAction()('loadUserCart', payload); // Implicit!
});
```

### ❌ Over-Granular Contexts
```typescript
// Don't create too many tiny contexts
const UserNameContext = createActionContext<{ setName: { name: string } }>();
const UserEmailContext = createActionContext<{ setEmail: { email: string } }>();
// Better: Single UserProfileContext
```

### ❌ Monolithic Contexts
```typescript
// Don't put everything in one context
const EverythingContext = createActionContext<{
  login: AuthPayload;
  updateProfile: UserPayload;
  addToCart: CartPayload;
  processPayment: PaymentPayload;
  // ... too much!
}>();
```

## Next Steps

- **Visual Reference**: See these practices illustrated in [diagrams.md](./diagrams.md)
- **Implementation Examples**: Return to [patterns.md](./patterns.md) for detailed examples
- **Integration Details**: Review [integration.md](./integration.md) for React-specific implementation