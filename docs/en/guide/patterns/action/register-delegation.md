# Register Delegation Pattern

Advanced pattern for organizing action handlers in separate modules using external functions and `useActionRegister()` hook.

## Overview

Register delegation enables modular handler organization by separating handler logic into external modules. This pattern is essential for large applications with complex business logic, team-based development, and plugin architectures.

## Basic Delegation Pattern

```tsx
import { createActionContext } from '@context-action/react'

// Create action context with renaming pattern
const {
  Provider: AppActionProvider,
  useActionRegister: useAppActionRegister
} = createActionContext<EventActions>('App')

// External registration function
function setupAnalyticsHandlers(register: ActionRegister<EventActions>) {
  // Register handlers outside of React components
  register.register('analytics', async (payload, controller) => {
    await analyticsAPI.track(payload.event, payload.data);
  }, {
    priority: 100,
    tags: ['analytics']
  });
  
  register.register('userClick', async (payload, controller) => {
    await analyticsAPI.trackClick(payload.x, payload.y);
  }, {
    priority: 90,
    tags: ['analytics', 'interaction']
  });
}

// Component that delegates registration
function AnalyticsSetup() {
  const register = useAppActionRegister()
  
  useEffect(() => {
    if (!register) return
    
    // Delegate registration to external function
    setupAnalyticsHandlers(register)
    
    // Cleanup on unmount
    return () => {
      register.unregisterByTags(['analytics'])
    }
  }, [register])
  
  return null // Setup component
}
```

## Modular Handler Registration

```tsx
// utils/handlers/userHandlers.ts - User domain handlers
export function registerUserHandlers(register: ActionRegister<AppActions>) {
  register.register('updateProfile', async (payload, controller) => {
    try {
      await userAPI.updateProfile(payload)
      controller.setResult({ success: true })
    } catch (error) {
      controller.abort('Profile update failed', error)
    }
  }, { tags: ['user', 'profile'] })
  
  register.register('deleteAccount', async (payload, controller) => {
    const confirmed = await confirmDeletion(payload.confirmationCode)
    if (!confirmed) {
      controller.abort('Account deletion not confirmed')
      return
    }
    
    await userAPI.deleteAccount(payload.confirmationCode)
  }, { tags: ['user', 'critical'] })
}

// utils/handlers/paymentHandlers.ts - Payment domain handlers
export function registerPaymentHandlers(register: ActionRegister<AppActions>) {
  register.register('processPayment', async (payload, controller) => {
    // Payment processing logic
    const result = await paymentService.process(payload)
    controller.setResult(result)
  }, { tags: ['payment', 'financial'] })
  
  register.register('refundPayment', async (payload, controller) => {
    // Refund logic
    const refund = await paymentService.refund(payload)
    controller.setResult(refund)
  }, { tags: ['payment', 'refund'] })
}

// Component that coordinates multiple handler modules
function AppHandlerSetup() {
  const register = useAppActionRegister()
  
  useEffect(() => {
    if (!register) return
    
    // Register handlers from different modules
    registerUserHandlers(register)
    registerPaymentHandlers(register)
    registerAnalyticsHandlers(register)
    
    // Cleanup by module tags on unmount
    return () => {
      register.unregisterByTags(['user'])
      register.unregisterByTags(['payment'])
      register.unregisterByTags(['analytics'])
    }
  }, [register])
  
  return null
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