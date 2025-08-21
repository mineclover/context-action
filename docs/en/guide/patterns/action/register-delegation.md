# Register Delegation Pattern

Advanced pattern for passing ActionRegister to external functions for modular handler organization.

## Overview

Register delegation allows you to organize action handlers in separate modules and register them programmatically, perfect for large applications with complex handler logic.

## Using useActionRegister Hook

```tsx
// External registration function
function setupAnalyticsHandlers(register: ActionRegister<EventActions>) {
  // Register handlers outside of React components
  register.registerHandler('analytics', async (payload, controller) => {
    await analyticsAPI.track(payload.event, payload.data);
  }, {
    priority: 100,
    id: 'analytics-handler'
  });
  
  register.registerHandler('userClick', async (payload, controller) => {
    await analyticsAPI.trackClick(payload.x, payload.y);
  }, {
    priority: 90,
    id: 'click-tracker'
  });
}

// Component that delegates registration
function AnalyticsSetup() {
  const register = useActionRegister(); // Get raw ActionRegister
  
  useEffect(() => {
    // Delegate registration to external function
    setupAnalyticsHandlers(register);
    
    // Cleanup on unmount
    return () => {
      register.unregisterHandler('analytics');
      register.unregisterHandler('userClick');
    };
  }, [register]);
  
  return null; // Setup component
}
```

## Modular Handler Registration

```tsx
// utils/handlers/userHandlers.ts
export function registerUserHandlers(register: ActionRegister<AppActions>) {
  register.registerHandler('updateProfile', async (payload, controller) => {
    try {
      await userAPI.updateProfile(payload);
      controller.setResult({ success: true });
    } catch (error) {
      controller.abort('Profile update failed', error);
    }
  });
  
  register.registerHandler('deleteAccount', async (payload, controller) => {
    const confirmed = await confirmDeletion(payload.confirmationCode);
    if (!confirmed) {
      controller.abort('Account deletion not confirmed');
      return;
    }
    
    await userAPI.deleteAccount(payload.confirmationCode);
  });
}

// utils/handlers/paymentHandlers.ts
export function registerPaymentHandlers(register: ActionRegister<AppActions>) {
  register.registerHandler('processPayment', async (payload, controller) => {
    // Payment processing logic
  });
  
  register.registerHandler('refundPayment', async (payload, controller) => {
    // Refund logic
  });
}

// Component that coordinates multiple handler modules
function AppHandlerSetup() {
  const register = useActionRegister();
  
  useEffect(() => {
    // Register handlers from different modules
    registerUserHandlers(register);
    registerPaymentHandlers(register);
    registerAnalyticsHandlers(register);
    
    // Cleanup all handlers on unmount
    return () => {
      register.clearHandlers(); // Clear all handlers
    };
  }, [register]);
  
  return null;
}
```

## Dynamic Handler Registration

```tsx
// Dynamic handler setup based on configuration
function DynamicHandlerSetup() {
  const register = useActionRegister();
  const config = useStoreValue(configStore);
  
  useEffect(() => {
    // Register handlers based on current configuration
    if (config.enableAnalytics) {
      setupAnalyticsHandlers(register);
    }
    
    if (config.enableNotifications) {
      setupNotificationHandlers(register);
    }
    
    if (config.debugMode) {
      setupDebugHandlers(register);
    }
    
    // Return cleanup function
    return () => {
      register.clearHandlers();
    };
  }, [register, config.enableAnalytics, config.enableNotifications, config.debugMode]);
  
  return null;
}
```

## Team-Based Handler Organization

```tsx
// Team-specific handler modules
// team-auth/handlers.ts
export function registerAuthHandlers(register: ActionRegister<AppActions>) {
  register.registerHandler('login', authLoginHandler);
  register.registerHandler('logout', authLogoutHandler);
  register.registerHandler('refreshToken', authRefreshHandler);
}

// team-products/handlers.ts
export function registerProductHandlers(register: ActionRegister<AppActions>) {
  register.registerHandler('loadProducts', productLoadHandler);
  register.registerHandler('searchProducts', productSearchHandler);
  register.registerHandler('updateInventory', inventoryUpdateHandler);
}

// team-orders/handlers.ts
export function registerOrderHandlers(register: ActionRegister<AppActions>) {
  register.registerHandler('createOrder', orderCreationHandler);
  register.registerHandler('processPayment', paymentProcessingHandler);
  register.registerHandler('trackShipment', shipmentTrackingHandler);
}

// Main application handler coordination
function TeamHandlerCoordinator() {
  const register = useActionRegister();
  
  useEffect(() => {
    // Each team registers their handlers
    registerAuthHandlers(register);
    registerProductHandlers(register);
    registerOrderHandlers(register);
    
    return () => {
      register.clearHandlers();
    };
  }, [register]);
  
  return null;
}
```

## Best Practices

1. **Module Organization**: Group related handlers in separate modules
2. **Cleanup Management**: Always unregister handlers on unmount
3. **Type Safety**: Pass typed ActionRegister to maintain type safety
4. **Configuration-Driven**: Use config to conditionally register handlers
5. **Error Handling**: Handle registration errors gracefully
6. **Performance**: Register handlers once, not on every render
7. **Team Boundaries**: Organize handlers by team or feature ownership
8. **Handler IDs**: Use descriptive IDs for easier debugging and management

## When to Use Register Delegation

- **Large Applications**: Complex handler logic across multiple modules
- **Team Development**: Different teams owning different handlers
- **Dynamic Configuration**: Handlers registered based on runtime config
- **Plugin Architecture**: Modular handler registration system
- **Testing**: Easier to mock and test individual handler modules