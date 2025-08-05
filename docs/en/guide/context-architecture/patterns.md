# Advanced Context Patterns

## Overview

This guide explores advanced patterns for using the Context-Action framework in complex scenarios, including sophisticated coordination patterns, performance optimization techniques, and real-world use cases.

## Intra-Context Store Coordination

### Single Context Multi-Store Operations

```typescript
// Create checkout context
const {
  Provider: CheckoutProvider,
  useAction: useCheckoutAction,
  useActionHandler: useCheckoutHandler,
  useActionContext: useCheckoutContext
} = createActionContext<CheckoutActions>({ name: 'CheckoutDomain' });

// Within a single context, coordinate multiple stores
function useCheckoutHandlers() {
  const registry = useStoreRegistry();
  
  // Wrap handler to prevent re-registration
  const processCheckoutHandler = useCallback(async (payload, controller) => {
    // All stores are within CheckoutContext boundary
    const cartStore = registry.getStore('cart');
    const inventoryStore = registry.getStore('inventory');
    const orderStore = registry.getStore('order');
    
    const cart = cartStore.getValue();
    const inventory = inventoryStore.getValue();

    // Validate inventory within context
    const unavailable = cart.items.filter(item =>
      inventory[item.id] < item.quantity
    );

    if (unavailable.length > 0) {
      controller.abort('Items unavailable');
      return;
    }

    // Atomic updates within context boundary
    orderStore.setValue({ ...payload, status: 'processing' });
    cartStore.setValue({ items: [] });
    inventoryStore.update(inv => updateInventory(inv, cart.items));
  }, [registry]); // Dependencies for useCallback
  
  // Register the handler
  useCheckoutHandler('processCheckout', processCheckoutHandler);
}
```

### Transaction-like Operations

```typescript
// Implement transaction-like behavior within context
function useTransactionalOperations() {
  const registry = useStoreRegistry();

  const transactionalCheckoutHandler = useCallback(async (payload, controller) => {
    const stores = {
      cart: registry.getStore('cart'),
      inventory: registry.getStore('inventory'),
      order: registry.getStore('order'),
      payment: registry.getStore('payment')
    };

    // Save current state for rollback
    const snapshot = {
      cart: stores.cart.getValue(),
      inventory: stores.inventory.getValue(),
      order: stores.order.getValue(),
      payment: stores.payment.getValue()
    };

    try {
      // Step 1: Validate and reserve inventory
      await stores.inventory.update(inv => reserveItems(inv, payload.items));
      
      // Step 2: Process payment
      const paymentResult = await processPayment(payload.payment);
      stores.payment.setValue(paymentResult);
      
      // Step 3: Create order
      stores.order.setValue({
        id: generateOrderId(),
        items: payload.items,
        payment: paymentResult,
        status: 'confirmed'
      });
      
      // Step 4: Clear cart
      stores.cart.setValue({ items: [] });

    } catch (error) {
      // Rollback all changes
      stores.cart.setValue(snapshot.cart);
      stores.inventory.setValue(snapshot.inventory);
      stores.order.setValue(snapshot.order);
      stores.payment.setValue(snapshot.payment);
      
      controller.abort(`Transaction failed: ${error.message}`);
    }
  }, [registry]);
  
  useCheckoutHandler('transactionalCheckout', transactionalCheckoutHandler);
}
```

## Cross-Context Coordination

### Orchestrated Multi-Domain Operations

```typescript
// Create contexts for different domains
const {
  Provider: PaymentProvider,
  useAction: usePaymentAction,
  useActionHandler: usePaymentHandler
} = createActionContext<PaymentActions>({ name: 'PaymentDomain' });

const {
  Provider: UserProvider,
  useAction: useUserAction,
  useActionHandler: useUserHandler
} = createActionContext<UserActions>({ name: 'UserDomain' });

const {
  Provider: NotificationProvider,
  useAction: useNotificationAction,
  useActionHandler: useNotificationHandler
} = createActionContext<NotificationActions>({ name: 'NotificationDomain' });

// Coordinate actions across different contexts
function useMultiDomainCheckout() {
  const checkoutDispatch = useCheckoutAction();
  const paymentDispatch = usePaymentAction();
  const userDispatch = useUserAction();
  const notificationDispatch = useNotificationAction();
  
  const handleCompleteCheckout = async (checkoutData) => {
    try {
      // Step 1: Process checkout in CheckoutContext
      await checkoutDispatch('processCheckout', checkoutData);
      
      // Step 2: Process payment in PaymentContext  
      const paymentResult = await paymentDispatch('processPayment', {
        amount: checkoutData.total,
        method: checkoutData.paymentMethod
      });
      
      // Step 3: Update user activity in UserContext
      await userDispatch('addPurchaseHistory', {
        orderId: checkoutData.orderId,
        amount: checkoutData.total,
        timestamp: Date.now()
      });

      // Step 4: Show success notification
      await notificationDispatch('showSuccess', {
        message: 'Order completed successfully!',
        orderId: checkoutData.orderId
      });
      
    } catch (error) {
      // Rollback and error handling across contexts
      await notificationDispatch('showError', {
        message: 'Checkout failed. Please try again.',
        error: error.message
      });
      
      // Attempt rollback if possible
      if (error.stage === 'payment') {
        await checkoutDispatch('rollbackCheckout', { orderId: checkoutData.orderId });
      }
    }
  };
  
  return handleCompleteCheckout;
}
```

### Event-Driven Cross-Context Communication

```typescript
// Create auth and cart contexts
const {
  Provider: AuthProvider,
  useAction: useAuthAction,
  useActionHandler: useAuthHandler
} = createActionContext<AuthActions>({ name: 'AuthDomain' });

const {
  Provider: CartProvider,
  useAction: useCartAction,
  useActionHandler: useCartHandler
} = createActionContext<CartActions>({ name: 'CartDomain' });

// Event-driven pattern for loose coupling
function useEventDrivenCommunication() {
  // Central event bus
  const eventBus = useEventBus();
  const registry = useStoreRegistry();

  // Publisher context - wrapped with useCallback
  const loginHandler = useCallback(async (payload, controller) => {
    const authStore = registry.getStore('auth');
    const authResult = await authenticateUser(payload);
    authStore.setValue(authResult);
    
    // Publish event instead of direct calls
    eventBus.publish('auth:loginSuccess', {
      userId: authResult.userId,
      sessionToken: authResult.token
    });
  }, [eventBus, registry]);
  
  useAuthHandler('login', loginHandler);

  // Subscriber contexts
  const userDispatch = useUserAction();
  const cartDispatch = useCartAction();
  
  const onAuthLoginUserHandler = useCallback(async (payload, controller) => {
    // Listen for auth events
    eventBus.subscribe('auth:loginSuccess', async (event) => {
      await userDispatch('loadUserProfile', {
        userId: event.userId
      });
    });
  }, [eventBus, userDispatch]);
  
  useUserHandler('onAuthLogin', onAuthLoginUserHandler);

  const onAuthLoginCartHandler = useCallback(async (payload, controller) => {
    eventBus.subscribe('auth:loginSuccess', async (event) => {
      await cartDispatch('loadUserCart', {
        userId: event.userId,
        sessionToken: event.sessionToken
      });
    });
  }, [eventBus, cartDispatch]);
  
  useCartHandler('onAuthLogin', onAuthLoginCartHandler);
}
```

## Context-Scoped Computed Values

### Complex Calculations Within Context

```typescript
// Create calculation context
const {
  Provider: CalculationProvider,
  useAction: useCalculationAction,
  useActionHandler: useCalculationHandler
} = createActionContext<CalculationActions>({ name: 'CalculationDomain' });

// Computed values within context boundary
function useCalculationHandlers() {
  const registry = useStoreRegistry();
  
  const calculateTotalsHandler = useCallback(async (payload, controller) => {
    // All stores are within CalculationContext
    const cartStore = registry.getStore('cart');
    const promoStore = registry.getStore('promos');
    const taxStore = registry.getStore('tax');
    const totalsStore = registry.getStore('totals');
    
    const cart = cartStore.getValue();
    const promos = promoStore.getValue();
    const taxRules = taxStore.getValue();

    // Complex calculation within context scope
    const subtotal = calculateSubtotal(cart.items);
    const discount = calculateDiscount(promos, subtotal);
    const tax = calculateTax(taxRules, subtotal - discount);

    // Update context-scoped totals store
    totalsStore.setValue({
      subtotal,
      discount,
      tax,
      total: subtotal - discount + tax,
      calculatedAt: Date.now()
    });
  }, [registry]); // Dependencies
  
  // Register the handler
  useCalculationHandler('calculateTotals', calculateTotalsHandler);
}

// Cross-context computed values
function useCrossContextCalculations() {
  const calculationDispatch = useCalculationAction();
  const userDispatch = useUserAction();
  
  const handleUserSpecificCalculation = async (userId: string) => {
    // Get user data from UserContext
    const userData = await new Promise(resolve => {
      useUserHandler('getUserData', async (payload, controller) => {
        const user = userStore.getValue();
        resolve(user);
      });
      userDispatch('getUserData', { userId });
    });
    
    // Use user data for calculation in CalculationContext
    await calculationDispatch('calculateTotals', { 
      userLocation: userData.location,
      membershipLevel: userData.membership,
      userId 
    });
  };

  return handleUserSpecificCalculation;
}
```

### Reactive Computed Values

```typescript
// Reactive calculations that update automatically
function useReactiveCalculations() {
  const registry = useStoreRegistry();

  // Set up reactive calculation chain
  useEffect(() => {
    const cartStore = registry.getStore('cart');
    const promoStore = registry.getStore('promos');
    const totalsStore = registry.getStore('totals');

    // Get dispatch function
    const calculationDispatch = useCalculationAction();
    
    // Create reactive subscription
    const unsubscribeCart = cartStore.subscribe((cart) => {
      calculationDispatch('recalculateTotals', { cart });
    });

    const unsubscribePromos = promoStore.subscribe((promos) => {
      calculationDispatch('recalculateTotals', { promos });
    });

    return () => {
      unsubscribeCart();
      unsubscribePromos();
    };
  }, [registry]);

  const recalculateTotalsHandler = useCallback(async (payload, controller) => {
    const cartStore = registry.getStore('cart');
    const promoStore = registry.getStore('promos');
    const totalsStore = registry.getStore('totals');

    const cart = payload.cart || cartStore.getValue();
    const promos = payload.promos || promoStore.getValue();

    const newTotals = calculateTotals(cart, promos);
    totalsStore.setValue(newTotals);
  }, [registry]);
  
  useCalculationHandler('recalculateTotals', recalculateTotalsHandler);
}
```

## Context-Scoped Async Operations

### Complex Async Workflows

```typescript
// Create data context
const {
  Provider: DataProvider,
  useAction: useDataAction,
  useActionHandler: useDataHandler
} = createActionContext<DataActions>({ name: 'DataDomain' });

// Async operations within context boundary
function useDataFetchingHandlers() {
  const registry = useStoreRegistry();
  
  const fetchUserDataHandler = useCallback(async (payload, controller) => {
    // All state updates are scoped to DataContext
    const uiStore = registry.getStore('ui');
    const userStore = registry.getStore('user');
    const preferencesStore = registry.getStore('preferences');
    const errorStore = registry.getStore('error');

    // Set loading state within context
    uiStore.update(ui => ({ ...ui, loading: true }));

    try {
      // Parallel data fetching
      const [userResponse, preferencesResponse] = await Promise.all([
        api.getUser(payload.userId),
        api.getUserPreferences(payload.userId)
      ]);

      // Update stores within context boundary
      userStore.setValue(userResponse.user);
      preferencesStore.setValue(preferencesResponse.preferences);

      // Clear any previous errors
      errorStore.setValue(null);

    } catch (error) {
      // Error handling within context
      errorStore.setValue({
        message: 'Failed to fetch user data',
        error,
        context: 'DataContext',
        timestamp: Date.now()
      });
      controller.abort('API error');

    } finally {
      // Always clear loading state
      uiStore.update(ui => ({ ...ui, loading: false }));
    }
  }, [registry]); // Dependencies
  
  // Register the handler
  useDataHandler('fetchUserData', fetchUserDataHandler);
}
```

### Cross-Context Async Coordination

```typescript
// Cross-context async coordination with proper error handling
function useCrossContextAsyncFlow() {
  const authDispatch = useAuthAction();
  const dataDispatch = useDataAction();
  const notificationDispatch = useNotificationAction();
  
  const handleCompleteUserLoad = async (userId: string) => {
    const operationId = generateOperationId();
    
    try {
      // Step 1: Authenticate in AuthContext
      await notificationDispatch('showLoading', { 
        message: 'Authenticating...', 
        operationId 
      });
      
      await authDispatch('validateSession', { userId });
      
      // Step 2: Fetch data in DataContext
      await notificationDispatch('updateLoading', { 
        message: 'Loading user data...', 
        operationId 
      });
      
      await dataDispatch('fetchUserData', { userId });
      
      // Step 3: Show success notification
      await notificationDispatch('showSuccess', {
        message: 'User data loaded successfully',
        operationId
      });
      
    } catch (error) {
      // Handle cross-context error with detailed context
      await notificationDispatch('showError', {
        message: 'Failed to load user data',
        error: error.message,
        context: error.context || 'Unknown',
        operationId
      });
      
      // Cleanup on error
      await authDispatch('clearSession', {});
      await dataDispatch('clearUserData', {});
      
    } finally {
      await notificationDispatch('hideLoading', { operationId });
    }
  };

  return handleCompleteUserLoad;
}
```

## Advanced Context Patterns

### Context Composition Pattern

```typescript
// Compose multiple contexts into a higher-order component
function createComposedProvider(...contexts) {
  return function ComposedProvider({ children }) {
    return contexts.reduceRight(
      (acc, Context) => (
        <Context.Provider>
          {acc}
        </Context.Provider>
      ),
      children
    );
  };
}

// Usage
const ECommerceProvider = createComposedProvider(
  AuthContext,
  UserContext,
  CartContext,
  PaymentContext,
  NotificationContext
);

function App() {
  return (
    <ECommerceProvider>
      <ShoppingApp />
    </ECommerceProvider>
  );
}
```

### Context Factory Pattern

```typescript
// Factory for creating domain-specific contexts
function createDomainContext<T extends ActionPayloadMap>(
  domainName: string,
  actions: T,
  storeDefinitions: StoreDefinition[]
) {
  const {
    Provider: ContextProvider,
    useAction,
    useActionHandler,
    useActionContext
  } = createActionContext<T>({ name: domainName });
  
  const Provider = ({ children }) => {
    // Initialize domain-specific stores
    const stores = useInitializeStores(storeDefinitions);
    
    // Register domain-specific handlers using the hook
    useDomainHandlers(useActionHandler, stores);
    
    return (
      <ContextProvider>
        <StoreProvider stores={stores} registryId={domainName}>
          {children}
        </StoreProvider>
      </ContextProvider>
    );
  };

  const useDomain = () => {
    const dispatch = useAction();
    const stores = useStoreRegistry();
    
    return { dispatch, stores };
  };

  return { 
    Provider, 
    useDomain,
    useAction,
    useActionHandler,
    useActionContext
  };
}

// Usage
const { 
  Provider: ShoppingProvider,
  useDomain: useShopping,
  useAction: useShoppingAction,
  useActionHandler: useShoppingHandler
} = createDomainContext(
  'Shopping',
  ShoppingActions,
  [cartStoreDefinition, inventoryStoreDefinition]
);
```

### Context Middleware Pattern

```typescript
// Middleware for cross-cutting concerns
function useContextMiddleware() {
  // Logging middleware
  const loggingMiddleware = (context: string) => (
    next: Function
  ) => async (action: string, payload: any) => {
    console.log(`[${context}] Action: ${action}`, payload);
    const start = performance.now();
    
    try {
      const result = await next(action, payload);
      const duration = performance.now() - start;
      console.log(`[${context}] Completed: ${action} (${duration.toFixed(2)}ms)`);
      return result;
    } catch (error) {
      console.error(`[${context}] Error in ${action}:`, error);
      throw error;
    }
  };

  // Note: Middleware pattern would need to be implemented
  // as createActionContext doesn't provide a .use() method
  // This is a conceptual pattern that could be added
}
```

## Performance Optimization Patterns

### Lazy Context Loading

```typescript
// Load contexts only when needed
const LazyShoppingContext = lazy(async () => {
  const { ShoppingContext } = await import('./ShoppingContext');
  return { default: ShoppingContext };
});

function App() {
  const [showShopping, setShowShopping] = useState(false);

  return (
    <div>
      <AuthContext.Provider>
        <MainApp />
        {showShopping && (
          <Suspense fallback={<ShoppingLoader />}>
            <LazyShoppingContext.Provider>
              <ShoppingSection />
            </LazyShoppingContext.Provider>
          </Suspense>
        )}
      </AuthContext.Provider>
    </div>
  );
}
```

### Context Splitting for Performance

```typescript
// Split large contexts into smaller, focused ones
// Instead of one large UserContext:
const UserProfileContext = createActionContext<UserProfileActions>({ 
  name: 'UserProfile' 
});
const UserPreferencesContext = createActionContext<UserPreferencesActions>({ 
  name: 'UserPreferences' 
});
const UserActivityContext = createActionContext<UserActivityActions>({ 
  name: 'UserActivity' 
});

// Extract hooks from each context
const { useAction: useProfileAction } = UserProfileContext;
const { useAction: usePreferencesAction } = UserPreferencesContext;

// Components only subscribe to what they need
function UserProfileComponent() {
  // Only subscribes to profile changes
  const dispatch = useProfileAction();
  const profile = useStoreValue(userProfileStore);
  
  return <div>{profile.name}</div>;
}

function UserSettingsComponent() {
  // Only subscribes to preferences changes
  const dispatch = usePreferencesAction();
  const preferences = useStoreValue(userPreferencesStore);
  
  return <div>{preferences.theme}</div>;
}
```

## Next Steps

- **Best Practices**: Learn optimization and development guidelines in [best-practices.md](./best-practices.md)
- **Visual Reference**: See these patterns illustrated in [diagrams.md](./diagrams.md)
- **Implementation**: Return to [integration.md](./integration.md) for implementation details