# Action Pipeline Guide: ActionPayloadMap & ActionRegister

Complete guide to building type-safe action pipelines with Context-Action framework.

## Table of Contents

- [Overview](#overview)
- [ActionPayloadMap: Type Foundation](#actionpayloadmap-type-foundation)
- [ActionRegister: Pipeline Engine](#actionregister-pipeline-engine)
- [Handler Registration Patterns](#handler-registration-patterns)
- [Pipeline Execution Strategies](#pipeline-execution-strategies)
- [Advanced Pipeline Patterns](#advanced-pipeline-patterns)
- [Real-world Examples](#real-world-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Context-Action framework's action pipeline system provides type-safe, scalable business logic management through two core components:

- **ActionPayloadMap**: TypeScript interface defining action-to-payload type mappings
- **ActionRegister**: Central pipeline engine managing handler registration and execution

```typescript
// The complete pipeline flow
ActionPayloadMap → ActionRegister → Handler Registration → Pipeline Execution
```

## ActionPayloadMap: Type Foundation

### Basic Concept

ActionPayloadMap is a TypeScript interface that maps action names to their payload types, providing compile-time type safety throughout the pipeline.

```typescript
import { ActionPayloadMap } from '@context-action/core';

// Define your application's actions
interface AppActions extends ActionPayloadMap {
  // Action with object payload
  updateUser: { id: string; name: string; email?: string };
  
  // Action with primitive payload
  setTheme: 'light' | 'dark';
  
  // Action without payload
  logout: void;
  
  // Action with complex payload
  submitOrder: {
    items: Array<{ id: string; quantity: number; price: number }>;
    shipping: { address: string; method: 'standard' | 'express' };
    payment: { method: 'card' | 'paypal'; token: string };
  };
  
  // Action with union types
  showNotification: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  };
}
```

### Advanced Type Patterns

#### Generic Payload Types

```typescript
interface CrudActions<T> extends ActionPayloadMap {
  create: T;
  update: { id: string } & Partial<T>;
  delete: { id: string };
  fetch: { id: string };
  list: { 
    filters?: Record<string, any>;
    pagination?: { page: number; limit: number };
  };
}

// Usage with specific types
interface UserActions extends CrudActions<User> {
  // Inherits: create: User, update: { id: string } & Partial<User>, etc.
  
  // Additional user-specific actions
  changePassword: { oldPassword: string; newPassword: string };
  uploadAvatar: { file: File };
}
```

#### Conditional Payload Types

```typescript
interface ConditionalActions extends ActionPayloadMap {
  // Payload type depends on mode
  saveData: {
    mode: 'auto';
  } | {
    mode: 'manual';
    data: any;
    validation: boolean;
  };
  
  // Optional payload based on context
  refresh: {
    force?: boolean;
    scope?: 'all' | 'current' | string[];
  } | void;
}
```

### Type Safety Benefits

1. **Compile-time Validation**: TypeScript ensures correct payload types
2. **IntelliSense Support**: Auto-completion for action names and payload properties
3. **Refactoring Safety**: Renaming actions or changing payload structure is type-checked
4. **Documentation**: Types serve as living documentation of your API

## ActionRegister: Pipeline Engine

### Core Architecture

ActionRegister is the central orchestrator that manages the action pipeline lifecycle:

```typescript
import { ActionRegister, ActionRegisterConfig } from '@context-action/core';

// Create typed ActionRegister
const actionRegister = new ActionRegister<AppActions>({
  logLevel: LogLevel.DEBUG,
  name: 'AppActionRegister',
  debug: true,
  defaultExecutionMode: 'sequential'
});
```

### Configuration Options

```typescript
interface ActionRegisterConfig {
  logger?: Logger;              // Custom logger instance
  logLevel?: LogLevel;          // Logging level (0-5)
  name?: string;                // Register name for debugging
  debug?: boolean;              // Enable debug mode
  defaultExecutionMode?: ExecutionMode; // 'sequential' | 'parallel' | 'race'
}
```

### Pipeline Lifecycle

```typescript
// 1. Handler Registration Phase
actionRegister.register('updateUser', handler, config);

// 2. Pipeline Dispatch Phase  
await actionRegister.dispatch('updateUser', payload);

// 3. Pipeline Execution Phase (internal)
//    - Priority sorting
//    - Condition evaluation
//    - Handler execution
//    - Flow control
//    - Cleanup
```

## Handler Registration Patterns

### Basic Handler Registration

```typescript
// Simple handler
const unregisterUpdateUser = actionRegister.register(
  'updateUser',
  async (payload, controller) => {
    console.log('Updating user:', payload);
    // Business logic here
    controller.next();
  }
);

// Handler with configuration
const unregisterValidation = actionRegister.register(
  'updateUser',
  async (payload, controller) => {
    if (!payload.email?.includes('@')) {
      controller.abort('Invalid email format');
      return;
    }
    
    controller.next();
  },
  {
    priority: 100,           // Higher priority runs first
    id: 'email-validator',   // Unique identifier
    blocking: true,          // Wait for completion
    condition: () => isLoggedIn(), // Conditional execution
  }
);
```

### Multi-Store Coordination

```typescript
interface StoreMap {
  user: UserStore;
  settings: SettingsStore;
  notifications: NotificationStore;
}

actionRegister.register('updateUser', async (payload, controller) => {
  // Access multiple stores
  const userStore = storeRegistry.getStore<UserStore>('user');
  const settingsStore = storeRegistry.getStore<SettingsStore>('settings');
  const notificationStore = storeRegistry.getStore<NotificationStore>('notifications');
  
  // Read current state
  const currentUser = userStore.getValue();
  const settings = settingsStore.getValue();
  
  // Business logic with cross-store coordination
  if (settings.requireEmailVerification && payload.email !== currentUser.email) {
    // Send verification email
    await sendVerificationEmail(payload.email);
    
    // Update user with pending status
    userStore.setValue({
      ...currentUser,
      ...payload,
      emailVerificationPending: true
    });
    
    // Show notification
    notificationStore.setValue({
      type: 'info',
      message: 'Verification email sent to new address',
      duration: 5000
    });
  } else {
    // Direct update
    userStore.setValue({
      ...currentUser,
      ...payload,
      updatedAt: Date.now()
    });
  }
  
  controller.next();
}, { priority: 10, blocking: true });
```

### Async Operations with Error Handling

```typescript
actionRegister.register('submitOrder', async (payload, controller) => {
  try {
    // Set loading state
    loadingStore.setValue({ isSubmittingOrder: true });
    
    // Validate inventory
    const inventoryCheck = await validateInventory(payload.items);
    if (!inventoryCheck.valid) {
      throw new Error(`Insufficient inventory: ${inventoryCheck.missing.join(', ')}`);
    }
    
    // Process payment
    const paymentResult = await processPayment(payload.payment);
    if (!paymentResult.success) {
      throw new Error(`Payment failed: ${paymentResult.error}`);
    }
    
    // Create order
    const order = await createOrder({
      ...payload,
      paymentId: paymentResult.id,
      status: 'confirmed'
    });
    
    // Update stores
    ordersStore.update(orders => [...orders, order]);
    cartStore.setValue({ items: [] }); // Clear cart
    
    // Success notification
    notificationStore.setValue({
      type: 'success',
      message: `Order ${order.id} submitted successfully!`,
      duration: 3000
    });
    
    controller.next();
    
  } catch (error) {
    // Error handling
    console.error('Order submission failed:', error);
    
    notificationStore.setValue({
      type: 'error',
      message: error.message || 'Order submission failed',
      duration: 5000
    });
    
    controller.abort('Order submission failed', error);
  } finally {
    // Always clear loading state
    loadingStore.setValue({ isSubmittingOrder: false });
  }
}, {
  priority: 10,
  blocking: true,
  debounce: 1000, // Prevent double-submission
});
```

## Pipeline Execution Strategies

### Sequential Execution (Default)

Handlers execute in priority order, waiting for each to complete:

```typescript
// Configure sequential execution
actionRegister.setExecutionMode('updateUser', 'sequential');

// Handlers execute in this order:
// 1. Validation (priority: 100)
// 2. Business logic (priority: 50) 
// 3. Logging (priority: 10)
// 4. Analytics (priority: 0)
```

### Parallel Execution

All handlers execute simultaneously:

```typescript
actionRegister.setExecutionMode('logAnalytics', 'parallel');

// Good for independent operations:
// - Logging
// - Analytics tracking
// - Cache updates
// - Notifications
```

### Race Execution

First completed handler wins:

```typescript
actionRegister.setExecutionMode('fetchUserData', 'race');

// Useful for:
// - Cache vs API race
// - Multiple data sources
// - Timeout scenarios
```

## Advanced Pipeline Patterns

### Priority-based Validation Pipeline

```typescript
// Validation chain with priorities
actionRegister.register('updateUser', validateRequired, { priority: 100 });
actionRegister.register('updateUser', validateEmail, { priority: 90 });
actionRegister.register('updateUser', validatePassword, { priority: 80 });
actionRegister.register('updateUser', sanitizeInput, { priority: 70 });
actionRegister.register('updateUser', businessLogic, { priority: 50 });
actionRegister.register('updateUser', audit, { priority: 10 });
```

### Conditional Handler Execution

```typescript
actionRegister.register('updateUser', adminOnlyHandler, {
  condition: () => currentUser.role === 'admin',
  priority: 60
});

actionRegister.register('updateUser', premiumFeatureHandler, {
  condition: () => currentUser.subscription === 'premium',
  priority: 55
});
```

### Dynamic Handler Registration

```typescript
// Feature flag based registration
if (featureFlags.newUserValidation) {
  actionRegister.register('updateUser', newValidationHandler, {
    priority: 95,
    id: 'feature-new-validation'
  });
}

// Plugin-based registration
plugins.forEach(plugin => {
  if (plugin.supports('updateUser')) {
    actionRegister.register('updateUser', 
      plugin.getHandler('updateUser'), 
      plugin.getConfig('updateUser')
    );
  }
});
```

### Pipeline Middleware Pattern

```typescript
// Create reusable middleware
const createAuthMiddleware = (requiredRole: string) => 
  async (payload: any, controller: PipelineController) => {
    if (!isAuthenticated() || !hasRole(requiredRole)) {
      controller.abort('Authentication required');
      return;
    }
    controller.next();
  };

const createLoggingMiddleware = (actionName: string) =>
  async (payload: any, controller: PipelineController) => {
    console.log(`[${actionName}] Started:`, payload);
    const start = Date.now();
    
    // Continue pipeline
    controller.next();
    
    // Note: In real middleware, you'd need event listeners for completion
    console.log(`[${actionName}] Completed in ${Date.now() - start}ms`);
  };

// Apply middleware to actions
actionRegister.register('updateUser', createAuthMiddleware('user'), { priority: 200 });
actionRegister.register('updateUser', createLoggingMiddleware('updateUser'), { priority: 190 });
```

## Real-world Examples

### E-commerce Order Processing

```typescript
interface EcommerceActions extends ActionPayloadMap {
  addToCart: { productId: string; quantity: number; options?: Record<string, any> };
  removeFromCart: { itemId: string };
  updateCartItem: { itemId: string; quantity: number };
  applyDiscount: { code: string };
  submitOrder: {
    items: CartItem[];
    shipping: ShippingInfo;
    payment: PaymentInfo;
    notes?: string;
  };
  processPayment: { orderId: string; paymentMethod: PaymentMethod };
  fulfillOrder: { orderId: string; trackingNumber?: string };
}

const ecommerceRegister = new ActionRegister<EcommerceActions>({
  name: 'EcommerceRegister',
  logLevel: LogLevel.INFO
});

// Order submission pipeline
ecommerceRegister.register('submitOrder', validateOrderItems, { priority: 100 });
ecommerceRegister.register('submitOrder', checkInventory, { priority: 90 });
ecommerceRegister.register('submitOrder', calculatePricing, { priority: 80 });
ecommerceRegister.register('submitOrder', validateShipping, { priority: 70 });
ecommerceRegister.register('submitOrder', createOrderRecord, { priority: 60 });
ecommerceRegister.register('submitOrder', reserveInventory, { priority: 50 });
ecommerceRegister.register('submitOrder', processPaymentAction, { priority: 40 });
ecommerceRegister.register('submitOrder', sendConfirmationEmail, { priority: 30 });
ecommerceRegister.register('submitOrder', updateAnalytics, { priority: 10 });

// Parallel post-processing
ecommerceRegister.setExecutionMode('submitOrder', 'sequential'); // Main flow
ecommerceRegister.register('orderConfirmed', updateRecommendations, { priority: 10 });
ecommerceRegister.register('orderConfirmed', notifyWarehouse, { priority: 10 });
ecommerceRegister.register('orderConfirmed', updateLoyaltyPoints, { priority: 10 });
ecommerceRegister.setExecutionMode('orderConfirmed', 'parallel'); // Post-processing
```

### User Management System

```typescript
interface UserManagementActions extends ActionPayloadMap {
  registerUser: {
    email: string;
    password: string;
    profile: UserProfile;
    terms: boolean;
  };
  verifyEmail: { token: string };
  resetPassword: { email: string };
  updateProfile: { userId: string; changes: Partial<UserProfile> };
  deactivateUser: { userId: string; reason: string };
}

const userRegister = new ActionRegister<UserManagementActions>({
  name: 'UserManagement',
  logLevel: LogLevel.DEBUG
});

// User registration pipeline
userRegister.register('registerUser', async (payload, controller) => {
  // Validation
  if (!payload.terms) {
    controller.abort('Terms acceptance required');
    return;
  }
  
  if (!isValidEmail(payload.email)) {
    controller.abort('Invalid email format');
    return;
  }
  
  // Check existing user
  const existingUser = await findUserByEmail(payload.email);
  if (existingUser) {
    controller.abort('Email already registered');
    return;
  }
  
  controller.next();
}, { priority: 100, id: 'validation' });

userRegister.register('registerUser', async (payload, controller) => {
  // Create user account
  const hashedPassword = await hashPassword(payload.password);
  const user = await createUser({
    email: payload.email,
    password: hashedPassword,
    profile: payload.profile,
    status: 'pending_verification'
  });
  
  // Update payload for next handlers
  controller.modifyPayload(current => ({
    ...current,
    userId: user.id
  }));
  
  controller.next();
}, { priority: 50, id: 'account-creation', blocking: true });

userRegister.register('registerUser', async (payload, controller) => {
  // Send verification email
  const verificationToken = generateVerificationToken();
  await sendVerificationEmail(payload.email, verificationToken);
  
  // Store token
  await storeVerificationToken(payload.userId, verificationToken);
  
  controller.next();
}, { priority: 40, id: 'email-verification' });

userRegister.register('registerUser', async (payload, controller) => {
  // Analytics tracking
  trackUserRegistration({
    userId: payload.userId,
    source: payload.source || 'direct',
    timestamp: Date.now()
  });
  
  controller.next();
}, { priority: 10, id: 'analytics' });
```

## Best Practices

### 1. Type Safety

```typescript
// ✅ DO: Use specific, well-defined types
interface OrderActions extends ActionPayloadMap {
  updateOrderStatus: {
    orderId: string;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    timestamp?: number;
    notes?: string;
  };
}

// ❌ DON'T: Use overly generic types
interface BadActions extends ActionPayloadMap {
  update: any; // Too generic
  process: object; // Not specific enough
}
```

### 2. Handler Organization

```typescript
// ✅ DO: Organize handlers by concern
const validationHandlers = {
  validateEmail: (payload, controller) => { /* ... */ },
  validatePassword: (payload, controller) => { /* ... */ },
  validateProfile: (payload, controller) => { /* ... */ }
};

const businessHandlers = {
  createUser: (payload, controller) => { /* ... */ },
  sendWelcomeEmail: (payload, controller) => { /* ... */ },
  setupDefaults: (payload, controller) => { /* ... */ }
};

// Register with clear priorities
Object.entries(validationHandlers).forEach(([name, handler], index) => {
  actionRegister.register('registerUser', handler, {
    id: name,
    priority: 100 - index
  });
});
```

### 3. Error Handling

```typescript
// ✅ DO: Comprehensive error handling
actionRegister.register('processPayment', async (payload, controller) => {
  try {
    const result = await paymentService.charge(payload);
    
    if (!result.success) {
      // Business logic error
      controller.abort(`Payment declined: ${result.reason}`);
      return;
    }
    
    // Update stores
    paymentStore.setValue(result.payment);
    orderStore.update(order => ({ 
      ...order, 
      paymentStatus: 'completed',
      paymentId: result.payment.id 
    }));
    
    controller.next();
    
  } catch (error) {
    // System error
    console.error('Payment processing failed:', error);
    
    // Rollback any partial changes
    await rollbackPayment(payload.orderId);
    
    controller.abort('Payment system unavailable', error);
  }
}, { priority: 50, blocking: true });
```

### 4. Performance Optimization

```typescript
// ✅ DO: Use appropriate execution modes
actionRegister.setExecutionMode('trackAnalytics', 'parallel'); // Independent operations
actionRegister.setExecutionMode('validateOrder', 'sequential'); // Dependent validations

// ✅ DO: Use debouncing for user input
actionRegister.register('searchUsers', searchHandler, {
  debounce: 300, // Wait 300ms after last input
  priority: 10
});

// ✅ DO: Use throttling for frequent events
actionRegister.register('trackMouseMovement', trackingHandler, {
  throttle: 100, // Max once per 100ms
  priority: 0
});
```

### 5. Memory Management

```typescript
// ✅ DO: Clean up handlers when components unmount
useEffect(() => {
  const unregisterHandlers = [
    actionRegister.register('updateUser', userHandler),
    actionRegister.register('deleteUser', deleteHandler),
    actionRegister.register('refreshUser', refreshHandler)
  ];
  
  return () => {
    // Clean up all handlers
    unregisterHandlers.forEach(unregister => unregister());
  };
}, []);

// ✅ DO: Use once: true for one-time handlers
actionRegister.register('appInitialized', initHandler, {
  once: true, // Automatically unregistered after first execution
  priority: 100
});
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Type Errors

```typescript
// ❌ Problem: Type mismatch
dispatch('updateUser', { invalidField: true }); // Type error

// ✅ Solution: Check ActionPayloadMap definition
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string }; // Only these fields allowed
}

dispatch('updateUser', { id: '1', name: 'John' }); // ✅ Correct
```

#### 2. Handler Not Executing

```typescript
// ❌ Problem: Handler registered but not executing
actionRegister.register('myAction', handler, {
  condition: () => false // Always false!
});

// ✅ Solution: Check condition logic
actionRegister.register('myAction', handler, {
  condition: () => isFeatureEnabled('myFeature') // Proper condition
});
```

#### 3. Pipeline Stalling

```typescript
// ❌ Problem: Pipeline gets stuck
actionRegister.register('processData', async (payload, controller) => {
  await processData(payload);
  // Missing controller.next()!
});

// ✅ Solution: Always call controller.next() or controller.abort()
actionRegister.register('processData', async (payload, controller) => {
  try {
    await processData(payload);
    controller.next(); // ✅ Continue pipeline
  } catch (error) {
    controller.abort('Processing failed', error); // ✅ Or abort
  }
});
```

#### 4. Memory Leaks

```typescript
// ❌ Problem: Handlers not cleaned up
function BadComponent() {
  useEffect(() => {
    actionRegister.register('action', handler);
    // No cleanup!
  }, []);
}

// ✅ Solution: Always return cleanup function
function GoodComponent() {
  useEffect(() => {
    const unregister = actionRegister.register('action', handler);
    return unregister; // ✅ Cleanup on unmount
  }, []);
}
```

### Debug Tools

#### 1. Enable Debug Logging

```typescript
const actionRegister = new ActionRegister<AppActions>({
  debug: true,
  logLevel: LogLevel.TRACE, // Most verbose
  name: 'DebugRegister'
});
```

#### 2. Monitor Pipeline Events

```typescript
// Listen to pipeline events
actionRegister.on('handlerRegistered', (event) => {
  console.log('Handler registered:', event);
});

actionRegister.on('actionDispatched', (event) => {
  console.log('Action dispatched:', event);
});

actionRegister.on('pipelineCompleted', (event) => {
  console.log('Pipeline completed:', event);
});

actionRegister.on('error', (event) => {
  console.error('Pipeline error:', event);
});
```

#### 3. Handler Performance Monitoring

```typescript
const performanceTracker = async (payload: any, controller: PipelineController) => {
  const startTime = performance.now();
  const actionName = controller.getPayload()?.actionName || 'unknown';
  
  console.log(`[${actionName}] Handler started`);
  
  // Continue to next handler
  controller.next();
  
  // Note: This is simplified - real implementation would need event listeners
  const endTime = performance.now();
  console.log(`[${actionName}] Handler completed in ${endTime - startTime}ms`);
};

// Add to all actions for monitoring
actionRegister.register('updateUser', performanceTracker, { priority: 1000 });
actionRegister.register('deleteUser', performanceTracker, { priority: 1000 });
```

---

## Conclusion

The ActionPayloadMap and ActionRegister system provides a powerful, type-safe foundation for building scalable business logic pipelines. By following the patterns and best practices outlined in this guide, you can create maintainable, robust applications with clear separation of concerns and excellent developer experience.

Key takeaways:

1. **Type Safety First**: Always define clear ActionPayloadMap interfaces
2. **Handler Organization**: Group handlers by concern and use appropriate priorities
3. **Error Handling**: Implement comprehensive error handling and rollback strategies
4. **Performance**: Choose appropriate execution modes and use debouncing/throttling
5. **Memory Management**: Always clean up handlers to prevent memory leaks
6. **Debugging**: Use logging and event monitoring for troubleshooting

For more advanced patterns and integration examples, see the [Context-Action Framework Documentation](../README.md).