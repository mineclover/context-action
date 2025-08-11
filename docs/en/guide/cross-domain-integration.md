# Cross-Domain Integration (When Needed)

While domain isolation is preferred, sometimes cross-domain interaction is necessary. This guide shows how to safely integrate multiple domains while maintaining clear boundaries and type safety.

## When to Use Cross-Domain Integration

### ✅ Good Use Cases

- **User Authentication + Cart**: User login affects cart persistence
- **Profile + Preferences**: User settings span multiple feature areas  
- **Order + Inventory**: Order placement updates inventory counts
- **Analytics + All Domains**: Tracking events across domains

### ❌ Avoid When

- **Simple Data Sharing**: Use shared utilities instead
- **Tight Coupling**: Consider merging domains
- **Circular Dependencies**: Redesign domain boundaries

## Integration Patterns

### 1. Logic Fit Hooks Pattern (Recommended)

Create integration hooks that combine multiple domains:

```typescript
// hooks/useUserCartIntegration.ts
export function useUserCartIntegration() {
  // Access multiple domains
  const userProfile = useUserStore('profile');
  const cartItems = useCartStore('items');
  const userAction = useUserAction();
  const cartAction = useCartAction();
  
  const profile = useStoreValue(userProfile);
  const items = useStoreValue(cartItems);
  
  // Combined business logic
  const processCheckout = useCallback(async () => {
    // Cross-domain validation
    if (!profile.id) {
      await userAction('requireLogin', {});
      return;
    }
    
    if (items.length === 0) {
      throw new Error('Cart is empty');
    }
    
    // Cross-domain coordination
    try {
      // Start checkout process
      await cartAction('startCheckout', { userId: profile.id });
      
      // Process payment with user info
      await cartAction('processPayment', {
        userId: profile.id,
        email: profile.email,
        items: items
      });
      
      // Update user's order history
      await userAction('addOrderToHistory', {
        orderId: generateOrderId(),
        items: items,
        total: calculateTotal(items)
      });
      
    } catch (error) {
      // Rollback on failure
      await cartAction('cancelCheckout', {});
      throw error;
    }
  }, [profile.id, profile.email, items, userAction, cartAction]);
  
  const canCheckout = useMemo(() => {
    return profile.id && items.length > 0;
  }, [profile.id, items.length]);
  
  return {
    processCheckout,
    canCheckout,
    userProfile: profile,
    cartItems: items
  };
}
```

### 2. Event-Driven Integration

Use actions to communicate between domains:

```typescript
// User domain handlers
function useUserHandlers() {
  const register = useUserActionRegister();
  const registry = useUserRegistry();
  
  const loginHandler = useCallback(async (payload, controller) => {
    const profileStore = registry.getStore('profile');
    
    // Authenticate user
    const user = await authenticateUser(payload);
    profileStore.setValue(user);
    
    // Notify other domains about login
    // This triggers cart domain handlers
    await dispatchGlobalEvent('user:logged_in', {
      userId: user.id,
      email: user.email
    });
    
    return { success: true, user };
  }, [registry]);
  
  // Register handler...
}

// Cart domain handlers
function useCartHandlers() {
  const register = useCartActionRegister();
  const registry = useCartRegistry();
  
  // Listen for user login events
  const handleUserLogin = useCallback(async (payload, controller) => {
    const cartStore = registry.getStore('items');
    
    // Restore user's saved cart
    const savedCart = await loadSavedCart(payload.userId);
    if (savedCart) {
      cartStore.setValue(savedCart.items);
    }
    
    // Merge with current session cart
    const sessionCart = getSessionCart();
    if (sessionCart.length > 0) {
      const mergedCart = mergeCartItems(savedCart?.items || [], sessionCart);
      cartStore.setValue(mergedCart);
    }
  }, [registry]);
  
  // Register for user events
  useEffect(() => {
    if (!register) return;
    
    const unregister = register('user:logged_in', handleUserLogin, {
      priority: 80,
      blocking: true
    });
    
    return unregister;
  }, [register, handleUserLogin]);
}
```

### 3. Shared Service Pattern

Create shared services that multiple domains can use:

```typescript
// services/analyticsService.ts
class AnalyticsService {
  private events: Array<{ domain: string; event: string; data: any; timestamp: number }> = [];
  
  track(domain: string, event: string, data: any = {}) {
    const eventData = {
      domain,
      event,
      data,
      timestamp: Date.now()
    };
    
    this.events.push(eventData);
    
    // Send to analytics provider
    this.sendToProvider(eventData);
  }
  
  private async sendToProvider(eventData: any) {
    // Implementation for external analytics service
    await analyticsProvider.track(eventData);
  }
  
  getEvents(domain?: string) {
    return domain 
      ? this.events.filter(e => e.domain === domain)
      : this.events;
  }
}

export const analyticsService = new AnalyticsService();

// Use in domain handlers
function useUserHandlers() {
  const loginHandler = useCallback(async (payload, controller) => {
    // Business logic
    const result = await performLogin(payload);
    
    // Analytics tracking
    analyticsService.track('user', 'login_success', {
      userId: result.user.id,
      method: payload.method
    });
    
    return result;
  }, []);
}

function useCartHandlers() {
  const addItemHandler = useCallback(async (payload, controller) => {
    // Business logic
    const result = await addItemToCart(payload);
    
    // Analytics tracking
    analyticsService.track('cart', 'item_added', {
      productId: payload.productId,
      quantity: payload.quantity,
      cartTotal: result.cartTotal
    });
    
    return result;
  }, []);
}
```

### 4. Cross-Domain Data Dependencies

Handle data that spans multiple domains:

```typescript
// hooks/useUserPreferences.ts
export function useUserPreferences() {
  // User domain - core profile data
  const userProfile = useUserStore('profile');
  const profile = useStoreValue(userProfile);
  
  // Settings domain - UI preferences  
  const settingsStore = useSettingsStore('ui');
  const uiSettings = useStoreValue(settingsStore);
  
  // Theme domain - appearance settings
  const themeStore = useThemeStore('current');
  const theme = useStoreValue(themeStore);
  
  // Combined preferences object
  const preferences = useMemo(() => ({
    // From user domain
    language: profile.language,
    timezone: profile.timezone,
    
    // From settings domain
    notifications: uiSettings.notifications,
    layout: uiSettings.layout,
    
    // From theme domain
    theme: theme.name,
    colors: theme.colors
  }), [profile, uiSettings, theme]);
  
  // Update preferences across domains
  const updatePreferences = useCallback(async (updates: Partial<typeof preferences>) => {
    const userAction = useUserAction();
    const settingsAction = useSettingsAction();
    const themeAction = useThemeAction();
    
    // Update relevant domains
    if ('language' in updates || 'timezone' in updates) {
      await userAction('updateProfile', {
        data: {
          language: updates.language,
          timezone: updates.timezone
        }
      });
    }
    
    if ('notifications' in updates || 'layout' in updates) {
      await settingsAction('updateUI', {
        notifications: updates.notifications,
        layout: updates.layout
      });
    }
    
    if ('theme' in updates) {
      await themeAction('setTheme', {
        themeName: updates.theme
      });
    }
  }, []);
  
  return {
    preferences,
    updatePreferences
  };
}
```

## Advanced Integration Patterns

### 1. Cross-Domain Transactions

Implement atomic operations across multiple domains:

```typescript
// hooks/useTransactionalOperations.ts
export function useTransactionalOperations() {
  const userRegistry = useUserRegistry();
  const cartRegistry = useCartRegistry();
  const orderRegistry = useOrderRegistry();
  
  const processOrder = useCallback(async (orderData: OrderData) => {
    // Start transaction
    const transaction = createTransaction();
    
    try {
      // Step 1: Validate user
      const userStore = userRegistry.getStore('profile');
      const user = userStore.getValue();
      
      if (!user.id) {
        throw new Error('User not authenticated');
      }
      
      // Step 2: Reserve inventory
      const cartStore = cartRegistry.getStore('items');
      const items = cartStore.getValue();
      
      const reservationResult = await reserveInventory(items);
      transaction.addRollback(() => releaseInventory(reservationResult.reservationId));
      
      // Step 3: Process payment
      const paymentResult = await processPayment({
        userId: user.id,
        amount: orderData.total,
        items: items
      });
      transaction.addRollback(() => refundPayment(paymentResult.transactionId));
      
      // Step 4: Create order
      const orderStore = orderRegistry.getStore('current');
      const order = {
        id: generateOrderId(),
        userId: user.id,
        items: items,
        paymentId: paymentResult.transactionId,
        status: 'completed',
        createdAt: Date.now()
      };
      
      orderStore.setValue(order);
      transaction.addRollback(() => orderStore.setValue(null));
      
      // Step 5: Clear cart
      cartStore.setValue([]);
      transaction.addRollback(() => cartStore.setValue(items));
      
      // Step 6: Update user order history
      const userOrderHistory = userRegistry.getStore('orderHistory');
      const currentHistory = userOrderHistory.getValue();
      userOrderHistory.setValue([...currentHistory, order]);
      
      // Commit transaction
      await transaction.commit();
      
      return { success: true, order };
      
    } catch (error) {
      // Rollback all changes
      await transaction.rollback();
      throw error;
    }
  }, [userRegistry, cartRegistry, orderRegistry]);
  
  return { processOrder };
}

// Simple transaction helper
function createTransaction() {
  const rollbackOperations: Array<() => void | Promise<void>> = [];
  
  return {
    addRollback(operation: () => void | Promise<void>) {
      rollbackOperations.push(operation);
    },
    
    async commit() {
      // Transaction is complete, clear rollback operations
      rollbackOperations.length = 0;
    },
    
    async rollback() {
      // Execute rollback operations in reverse order
      for (const operation of rollbackOperations.reverse()) {
        try {
          await operation();
        } catch (error) {
          console.error('Rollback operation failed:', error);
        }
      }
    }
  };
}
```

### 2. Cross-Domain State Synchronization

Keep related state synchronized across domains:

```typescript
// hooks/useStateSynchronization.ts
export function useStateSynchronization() {
  const userProfile = useUserStore('profile');
  const userPreferences = useUserStore('preferences');
  const themeStore = useThemeStore('current');
  const settingsStore = useSettingsStore('ui');
  
  const profile = useStoreValue(userProfile);
  const preferences = useStoreValue(userPreferences);
  const theme = useStoreValue(themeStore);
  const settings = useStoreValue(settingsStore);
  
  // Sync user language changes to settings
  useEffect(() => {
    if (profile.language && settings.language !== profile.language) {
      const settingsAction = useSettingsAction();
      settingsAction('updateLanguage', { 
        language: profile.language 
      });
    }
  }, [profile.language, settings.language]);
  
  // Sync theme changes to user preferences
  useEffect(() => {
    if (theme.name && preferences.theme !== theme.name) {
      const userAction = useUserAction();
      userAction('updatePreferences', {
        data: { theme: theme.name }
      });
    }
  }, [theme.name, preferences.theme]);
  
  // Sync timezone changes across domains
  useEffect(() => {
    if (profile.timezone) {
      // Update all time-sensitive domains
      const calendarAction = useCalendarAction();
      const notificationAction = useNotificationAction();
      
      calendarAction('setTimezone', { timezone: profile.timezone });
      notificationAction('setTimezone', { timezone: profile.timezone });
    }
  }, [profile.timezone]);
}
```

### 3. Cross-Domain Error Handling

Handle errors that affect multiple domains:

```typescript
// hooks/useGlobalErrorHandling.ts
export function useGlobalErrorHandling() {
  const userAction = useUserAction();
  const cartAction = useCartAction();
  const orderAction = useOrderAction();
  
  const handleAuthenticationError = useCallback(async (error: AuthError) => {
    // Clear user session
    await userAction('logout', {});
    
    // Clear sensitive cart data
    await cartAction('clearSensitiveData', {});
    
    // Cancel pending orders
    await orderAction('cancelPendingOrders', {});
    
    // Redirect to login
    redirectToLogin();
  }, [userAction, cartAction, orderAction]);
  
  const handleNetworkError = useCallback(async (error: NetworkError) => {
    // Put all domains in offline mode
    await userAction('setOfflineMode', { offline: true });
    await cartAction('setOfflineMode', { offline: true });
    await orderAction('setOfflineMode', { offline: true });
    
    // Queue operations for when network returns
    queueOfflineOperations();
  }, [userAction, cartAction, orderAction]);
  
  const handlePaymentError = useCallback(async (error: PaymentError) => {
    // Rollback cart state
    await cartAction('rollbackToCheckout', {});
    
    // Update order status
    await orderAction('markPaymentFailed', {
      orderId: error.orderId,
      reason: error.reason
    });
    
    // Notify user
    await userAction('addNotification', {
      type: 'error',
      message: 'Payment failed. Please try again.',
      actions: ['retry', 'change_method']
    });
  }, [cartAction, orderAction, userAction]);
  
  return {
    handleAuthenticationError,
    handleNetworkError,
    handlePaymentError
  };
}
```

## Best Practices for Cross-Domain Integration

### 1. Keep Integration Logic Separate

```typescript
// ✅ Good: Separate integration logic
function useUserCartIntegration() {
  // Integration-specific logic only
}

// ✅ Good: Domain-specific logic stays in domain
function useUserHandlers() {
  // User domain logic only
}

// ❌ Bad: Mixing integration in domain handlers
function useUserHandlers() {
  // User logic mixed with cart concerns
}
```

### 2. Use Explicit Dependencies

```typescript
// ✅ Good: Explicit dependencies
function useOrderProcessing() {
  const userAction = useUserAction();   // Explicit
  const cartAction = useCartAction();   // Explicit
  const paymentService = usePaymentService(); // Explicit
  
  // Clear dependencies
}

// ❌ Bad: Hidden dependencies
function useOrderProcessing() {
  // Hidden global state access
  const user = getCurrentUser(); // Where does this come from?
}
```

### 3. Minimize Cross-Domain Surface Area

```typescript
// ✅ Good: Minimal interface
interface CrossDomainAPI {
  getUserId(): string | null;
  isAuthenticated(): boolean;
}

// ❌ Bad: Exposing entire domain
interface CrossDomainAPI {
  user: CompleteUserState;      // Too much exposure
  profile: UserProfile;         // Implementation details
  session: SessionState;        // Internal state
}
```

### 4. Handle Failures Gracefully

```typescript
// ✅ Good: Graceful degradation
function useIntegration() {
  const processCheckout = useCallback(async () => {
    try {
      // Attempt cross-domain operation
      return await fullCheckoutProcess();
    } catch (error) {
      // Fallback to single-domain operation
      return await basicCheckoutProcess();
    }
  }, []);
}

// ❌ Bad: All-or-nothing
function useIntegration() {
  const processCheckout = useCallback(async () => {
    // Fails completely if any domain fails
    await updateUser();
    await updateCart(); 
    await updateOrder(); // If this fails, everything fails
  }, []);
}
```

---

## Summary

Cross-domain integration in the Context-Action framework should be:

- **Purposeful**: Only when business logic truly spans domains
- **Explicit**: Clear dependencies and interfaces
- **Resilient**: Graceful error handling and fallbacks  
- **Minimal**: Keep integration surface area small
- **Separated**: Integration logic separate from domain logic

Use Logic Fit Hooks as the primary pattern for cross-domain integration, supplemented by event-driven communication and shared services when appropriate.

---

::: tip Next Steps
- Learn [Logic Fit Hooks](./logic-fit-hooks) for combining business and UI logic
- Explore [Performance Optimization](./performance) for multi-domain applications
- See [Error Handling Patterns](./error-handling) for robust cross-domain error management
:::