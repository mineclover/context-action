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
  name: 'AppActionRegister',
  registry: {
    debug: true,
    autoCleanup: true,
    maxHandlers: 50,
    defaultExecutionMode: 'sequential'
  }
});
```

### Configuration Options

```typescript
interface ActionRegisterConfig {
  /** Name identifier for this ActionRegister instance */
  name?: string;
  
  /** Registry-specific configuration options */
  registry?: {
    /** Debug mode for registry operations */
    debug?: boolean;
    
    /** Auto-cleanup configuration for one-time handlers */
    autoCleanup?: boolean;
    
    /** Maximum number of handlers per action */
    maxHandlers?: number;
    
    /** Default execution mode for actions */
    defaultExecutionMode?: ExecutionMode;
  };
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
    // Handler automatically continues to next handler
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
    
    // Handler automatically continues to next handler
  },
  {
    priority: 100,           // Higher priority runs first
    id: 'email-validator',   // Unique identifier
    blocking: true,          // Wait for completion
    condition: () => isLoggedIn(), // Conditional execution
    tags: ['validation', 'email'], // Handler tags
    category: 'validation',  // Handler category
    description: 'Validates email format for user updates',
    version: '1.0.0',       // Handler version
    timeout: 5000,          // Handler timeout
    environment: 'production', // Target environment
    metrics: {
      collectTiming: true,
      collectErrors: true
    }
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
  
  // Handler automatically continues to next handler
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
    
    // Handler automatically continues to next handler
    
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
actionRegister.setActionExecutionMode('updateUser', 'sequential');

// Handlers execute in this order:
// 1. Validation (priority: 100)
// 2. Business logic (priority: 50) 
// 3. Logging (priority: 10)
// 4. Analytics (priority: 0)
```

### Parallel Execution

All handlers execute simultaneously:

```typescript
actionRegister.setActionExecutionMode('logAnalytics', 'parallel');

// Good for independent operations:
// - Logging
// - Analytics tracking
// - Cache updates
// - Notifications
```

### Race Execution

First completed handler wins:

```typescript
actionRegister.setActionExecutionMode('fetchUserData', 'race');

// Useful for:
// - Cache vs API race
// - Multiple data sources
// - Timeout scenarios
```

## Advanced Pipeline Patterns

### Handler Filtering System (New)

The ActionRegister now supports advanced handler filtering during dispatch:

```typescript
// Filter handlers by tags
await actionRegister.dispatch('updateUser', payload, {
  filter: {
    tags: ['validation', 'business'],     // Only validation and business handlers
    excludeTags: ['logging', 'analytics'], // Exclude logging handlers
    category: 'critical',                  // Only critical category handlers
    environment: 'production',             // Only production handlers
    feature: 'newUserFlow',               // Only handlers with this feature flag
    handlerIds: ['validator-1', 'saver-2'], // Specific handler IDs
    excludeHandlerIds: ['debug-logger'],   // Exclude specific handlers
    custom: (config) => config.priority > 50 // Custom filter function
  }
});
```

### Result Collection and Processing (New)

Collect and process results from multiple handlers:

```typescript
// Dispatch with result collection
const result = await actionRegister.dispatchWithResult('processOrder', orderData, {
  result: {
    collect: true,                    // Enable result collection
    strategy: 'all',                  // Collect all results
    maxResults: 10,                   // Limit to 10 results
    timeout: 5000,                    // 5 second timeout
    merger: (results) => {            // Custom result merger
      return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    }
  }
});

console.log('Execution successful:', result.success);
console.log('Results:', result.results);
console.log('Execution duration:', result.execution.duration);
console.log('Handlers executed:', result.execution.handlersExecuted);
```

### Auto AbortController Management (New)

Automatic AbortController creation and management:

```typescript
let createdController: AbortController | undefined;

await actionRegister.dispatch('longRunningTask', payload, {
  autoAbort: {
    enabled: true,                    // Auto-create AbortController
    allowHandlerAbort: true,          // Handlers can trigger abort
    onControllerCreated: (controller) => {
      createdController = controller; // Access the created controller
      
      // Set up timeout
      setTimeout(() => controller.abort('Timeout'), 10000);
    }
  }
});
```

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

### Handler Execution Flow (Updated)

ActionRegister handlers follow a natural execution flow without explicit continuation calls:

#### Handler Termination Patterns

```typescript
actionRegister.register('processData', async (payload, controller) => {
  // Pattern 1: Natural completion - handler continues to next
  if (payload.isValid) {
    await processValidData(payload);
    // Handler naturally completes, pipeline continues to next handler
  }
  
  // Pattern 2: Early return - stops current handler, continues pipeline
  if (!payload.shouldProcess) {
    console.log('Skipping processing');
    return; // Early return, pipeline continues to next handler
  }
  
  // Pattern 3: Explicit abort - stops entire pipeline
  if (payload.hasError) {
    controller.abort('Critical error encountered');
    return; // Pipeline execution stops here
  }
  
  // Pattern 4: Conditional processing with natural flow
  const result = await someAsyncOperation(payload);
  if (result.success) {
    // Process success case
    updateStore(result.data);
  } else {
    // Process error case  
    logError(result.error);
  }
  // Handler completes naturally, continues to next handler
});
```

#### Three Ways to End Handler Execution

1. **Natural Completion**: Handler finishes all statements, automatically continues
2. **Early Return**: Use `return` to exit handler early, pipeline continues
3. **Pipeline Abort**: Use `controller.abort()` to stop entire pipeline execution

### Enhanced PipelineController API (Updated)

The PipelineController now provides extensive control over pipeline execution:

```typescript
actionRegister.register('processData', async (payload, controller) => {
  // 1. Abort pipeline with reason
  if (!payload.isValid) {
    controller.abort('Invalid payload data');
    return;
  }
  
  // 2. Get current payload (might be modified by previous handlers)
  const currentPayload = controller.getPayload();
  
  // 3. Modify payload for next handlers
  controller.modifyPayload(data => ({
    ...data,
    processed: true,
    processedAt: Date.now(),
    processingId: Math.random().toString(36)
  }));
  
  // 4. Set result for collection (pipeline continues)
  const processedResult = await processData(currentPayload);
  controller.setResult(processedResult);
  
  // 5. Get all previous results
  const allResults = controller.getResults();
  console.log('Results so far:', allResults.length);
  
  // 6. Merge current result with previous ones
  controller.mergeResult((previousResults, currentResult) => {
    return {
      combined: previousResults,
      current: currentResult,
      total: previousResults.length + 1
    };
  });
  
  // 7. Jump to specific priority (skip intermediate handlers)
  if (payload.urgent) {
    controller.jumpToPriority(10); // Jump to priority 10
  }
  
  // 8. Terminate pipeline early with final result
  if (payload.shouldTerminate) {
    controller.return({
      terminated: true,
      reason: 'Early termination requested',
      result: processedResult
    });
    return; // Pipeline stops here
  }
  
  // 9. Handler automatically continues to next handler
  // No explicit next() call needed - handlers continue automatically
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
    // Handler automatically continues to next handler
  };

const createLoggingMiddleware = (actionName: string) =>
  async (payload: any, controller: PipelineController) => {
    console.log(`[${actionName}] Started:`, payload);
    const start = Date.now();
    
    // Handler automatically continues to next handler
    
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
  
  // Handler automatically continues to next handler
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
  
  // Handler automatically continues to next handler
}, { priority: 50, id: 'account-creation', blocking: true });

userRegister.register('registerUser', async (payload, controller) => {
  // Send verification email
  const verificationToken = generateVerificationToken();
  await sendVerificationEmail(payload.email, verificationToken);
  
  // Store token
  await storeVerificationToken(payload.userId, verificationToken);
  
  // Handler automatically continues to next handler
}, { priority: 40, id: 'email-verification' });

userRegister.register('registerUser', async (payload, controller) => {
  // Analytics tracking
  trackUserRegistration({
    userId: payload.userId,
    source: payload.source || 'direct',
    timestamp: Date.now()
  });
  
  // Handler automatically continues to next handler
}, { priority: 10, id: 'analytics' });
```

## Registry Management & Statistics (New)

### Registry Information

Get comprehensive information about your ActionRegister:

```typescript
// Get registry overview
const registryInfo = actionRegister.getRegistryInfo();
console.log('Registry name:', registryInfo.name);
console.log('Total actions:', registryInfo.totalActions);
console.log('Total handlers:', registryInfo.totalHandlers);
console.log('Registered actions:', registryInfo.registeredActions);
console.log('Default execution mode:', registryInfo.defaultExecutionMode);
```

### Action Statistics

Monitor individual action performance:

```typescript
// Get detailed statistics for a specific action
const userStats = actionRegister.getActionStats('updateUser');
if (userStats) {
  console.log('Handler count:', userStats.handlerCount);
  console.log('Handlers by priority:', userStats.handlersByPriority);
  
  if (userStats.executionStats) {
    console.log('Total executions:', userStats.executionStats.totalExecutions);
    console.log('Average duration:', userStats.executionStats.averageDuration);
    console.log('Success rate:', userStats.executionStats.successRate);
    console.log('Error count:', userStats.executionStats.errorCount);
  }
}

// Get statistics for all actions
const allStats = actionRegister.getAllActionStats();
allStats.forEach(stats => {
  console.log(`Action: ${stats.action}, Handlers: ${stats.handlerCount}`);
});
```

### Handler Discovery

Find handlers by tags or categories:

```typescript
// Find all validation handlers across actions
const validationHandlers = actionRegister.getHandlersByTag('validation');
for (const [action, handlers] of validationHandlers) {
  console.log(`Action ${action} has ${handlers.length} validation handlers`);
}

// Find all critical handlers
const criticalHandlers = actionRegister.getHandlersByCategory('critical');
for (const [action, handlers] of criticalHandlers) {
  console.log(`Action ${action} has ${handlers.length} critical handlers`);
}
```

### Execution Mode Management

Advanced execution mode control:

```typescript
// Set execution mode for specific action
actionRegister.setActionExecutionMode('processPayment', 'sequential');

// Get current execution mode
const mode = actionRegister.getActionExecutionMode('processPayment');
console.log('Payment processing mode:', mode);

// Remove override (revert to default)
actionRegister.removeActionExecutionMode('processPayment');
```

### Statistics Management

Control execution statistics:

```typescript
// Clear all statistics
actionRegister.clearExecutionStats();

// Clear statistics for specific action
actionRegister.clearActionExecutionStats('updateUser');

// Check if debug mode is enabled
if (actionRegister.isDebugEnabled()) {
  console.log('Debug mode is active');
}
```

### ExecutionResult Interface (New)

The `dispatchWithResult` method returns comprehensive execution information:

```typescript
interface ExecutionResult<R = void> {
  success: boolean;        // Whether execution completed successfully
  aborted: boolean;        // Whether execution was aborted
  abortReason?: string;    // Reason for abortion if aborted
  terminated: boolean;     // Whether terminated early via controller.return()
  result?: R;             // Final processed result based on strategy
  results: R[];           // All individual handler results
  execution: {
    duration: number;           // Total execution time in ms
    handlersExecuted: number;   // Number of handlers that ran
    handlersSkipped: number;    // Number of handlers that were skipped
    handlersFailed: number;     // Number of handlers that failed
    startTime: number;          // Execution start timestamp
    endTime: number;            // Execution end timestamp
  };
  handlers: Array<{         // Detailed handler information
    id: string;             // Handler unique identifier
    executed: boolean;      // Whether this handler ran
    duration?: number;      // Handler execution time
    result?: R;            // Handler result
    error?: Error;         // Handler error if any
    metadata?: Record<string, any>; // Custom handler metadata
  }>;
  errors: Array<{          // All errors that occurred
    handlerId: string;     // Handler that caused the error
    error: Error;          // The error object
    timestamp: number;     // When the error occurred
  }>;
}

// Usage example
async function processOrderWithDetails(orderData: OrderData) {
  const result = await actionRegister.dispatchWithResult('processOrder', orderData, {
    result: {
      collect: true,         // Enable result collection
      strategy: 'merge',     // Merge all results
      timeout: 10000,        // 10 second timeout
      maxResults: 20,        // Limit results
      merger: (results) => { // Custom merger function
        return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      }
    },
    filter: {
      tags: ['validation', 'business'], // Only these handlers
      excludeTags: ['logging']          // Exclude logging
    }
  });
  
  // Check execution status
  if (!result.success) {
    if (result.aborted) {
      console.error('Order processing aborted:', result.abortReason);
    } else {
      console.error('Order processing failed:', result.errors.length, 'errors');
    }
    return null;
  }
  
  // Log execution metrics
  console.log(`Order processed in ${result.execution.duration}ms`);
  console.log(`Executed ${result.execution.handlersExecuted}/${result.execution.handlersExecuted + result.execution.handlersSkipped} handlers`);
  
  // Check for early termination
  if (result.terminated) {
    console.log('Pipeline was terminated early');
  }
  
  return result.result; // Final processed result
}
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
    
    // Handler automatically continues to next handler
    
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

### 6. Handler Organization (New)

```typescript
// ✅ DO: Use tags and categories for organization
actionRegister.register('processPayment', validatePayment, {
  priority: 100,
  tags: ['validation', 'payment', 'critical'],
  category: 'validation',
  description: 'Validates payment information before processing',
  environment: 'production'
});

// ✅ DO: Use meaningful handler IDs
actionRegister.register('processPayment', processPaymentLogic, {
  id: 'payment-processor-v2',
  priority: 50,
  tags: ['business', 'payment'],
  category: 'core-logic',
  version: '2.1.0'
});
```

### 7. Handler Termination Patterns (New)

```typescript
// ✅ DO: Use natural completion for normal flow
actionRegister.register('processUser', async (payload, controller) => {
  const user = await fetchUser(payload.id);
  userStore.setValue(user);
  // Natural completion - continues to next handler
});

// ✅ DO: Use early return for conditional logic
actionRegister.register('validateUser', (payload, controller) => {
  if (!payload.email) {
    logError('Email is required');
    return; // Early return - pipeline continues
  }
  
  if (!isValidEmail(payload.email)) {
    logError('Invalid email format');
    return; // Early return - pipeline continues
  }
  
  // Validation passed - natural completion
});

// ✅ DO: Use abort for critical errors
actionRegister.register('securityCheck', (payload, controller) => {
  if (isSuspiciousActivity(payload)) {
    controller.abort('Security violation detected');
    return; // Pipeline stops completely
  }
  
  // Security check passed - natural completion
});

// ❌ DON'T: Forget to return after abort
actionRegister.register('badHandler', (payload, controller) => {
  if (error) {
    controller.abort('Error occurred');
    // ❌ Missing return - code continues executing
    doSomethingElse(); // This will still run!
  }
});
```

### 8. Result Handling (New)

```typescript
// ✅ DO: Use appropriate result strategies
const result = await actionRegister.dispatchWithResult('collectData', payload, {
  result: {
    strategy: 'merge',     // Combine all results
    collect: true,
    maxResults: 10,
    merger: (results) => {
      // Smart merging logic
      return results.reduce((acc, curr) => {
        return { ...acc, ...curr, timestamp: Date.now() };
      }, {});
    }
  }
});

// ✅ DO: Handle execution results properly
if (!result.success) {
  if (result.aborted) {
    console.warn('Operation was aborted:', result.abortReason);
  } else if (result.errors.length > 0) {
    console.error('Operation failed:', result.errors);
  }
  return;
}
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

#### 3. Handler Termination Issues

```typescript
// ❌ Problem: Handler continues executing after abort
actionRegister.register('processData', async (payload, controller) => {
  if (payload.invalid) {
    controller.abort('Invalid data');
    // ❌ Missing return - code continues!
    await processData(payload); // This still executes
  }
});

// ✅ Solution: Always return after abort
actionRegister.register('processData', async (payload, controller) => {
  if (payload.invalid) {
    controller.abort('Invalid data');
    return; // ✅ Stop handler execution
  }
  
  try {
    await processData(payload);
    // Natural completion - continues to next handler
  } catch (error) {
    controller.abort('Processing failed', error);
    return; // ✅ Stop on error
  }
});

// ✅ Alternative: Use early returns for flow control
actionRegister.register('validateAndProcess', async (payload, controller) => {
  // Validation with early return
  if (!payload.email) {
    logError('Email required');
    return; // Skip processing, continue pipeline
  }
  
  if (!payload.name) {
    logError('Name required');
    return; // Skip processing, continue pipeline
  }
  
  // All valid - process normally
  await processValidData(payload);
  // Natural completion
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
  name: 'DebugRegister',
  registry: {
    debug: true,        // Enable debug mode (development only)
    maxHandlers: 100,   // Increase if needed for debugging
    autoCleanup: true   // Auto-cleanup for easier debugging
  }
});
```

#### 2. Registry Information for Debugging

```typescript
// Get comprehensive registry information
const registryInfo = actionRegister.getRegistryInfo();
console.log('Registry Debug Info:', {
  name: registryInfo.name,
  totalActions: registryInfo.totalActions,
  totalHandlers: registryInfo.totalHandlers,
  actions: registryInfo.registeredActions,
  defaultExecutionMode: registryInfo.defaultExecutionMode
});

// Check specific action details
const actionStats = actionRegister.getActionStats('updateUser');
if (actionStats) {
  console.log('Action Debug Info:', {
    handlerCount: actionStats.handlerCount,
    handlersByPriority: actionStats.handlersByPriority,
    executionStats: actionStats.executionStats
  });
}
```

#### 3. Handler Performance Monitoring

```typescript
// Use dispatchWithResult for comprehensive monitoring
async function debugDispatch(action: string, payload: any) {
  const result = await actionRegister.dispatchWithResult(action, payload);
  
  console.log(`[${action}] Execution Summary:`, {
    success: result.success,
    duration: `${result.execution.duration}ms`,
    handlersExecuted: result.execution.handlersExecuted,
    handlersSkipped: result.execution.handlersSkipped,
    handlersFailed: result.execution.handlersFailed,
    aborted: result.aborted,
    abortReason: result.abortReason,
    terminated: result.terminated
  });
  
  // Log individual handler performance
  result.handlers.forEach(handler => {
    if (handler.executed) {
      console.log(`  Handler ${handler.id}: ${handler.duration}ms`);
    } else {
      console.log(`  Handler ${handler.id}: skipped`);
    }
    
    if (handler.error) {
      console.error(`  Handler ${handler.id} error:`, handler.error);
    }
  });
  
  return result;
}

// Enable metrics collection for specific handlers
actionRegister.register('updateUser', userHandler, {
  priority: 50,
  metrics: {
    collectTiming: true,
    collectErrors: true,
    customMetrics: { trackUserUpdates: true }
  }
});
```

---

## Conclusion

The ActionPayloadMap and ActionRegister system provides a powerful, type-safe foundation for building scalable business logic pipelines. With the latest enhancements, you now have comprehensive control over pipeline execution, advanced filtering capabilities, result collection, and detailed monitoring.

### Key takeaways:

1. **Type Safety First**: Always define clear ActionPayloadMap interfaces
2. **Natural Handler Flow**: Use natural completion, early returns, and explicit aborts for clean handler termination
3. **Advanced Configuration**: Leverage the new registry configuration options for better control
4. **Handler Organization**: Use tags, categories, and metadata for better organization
5. **Result Management**: Take advantage of the new result collection and processing system
6. **Performance Monitoring**: Use ExecutionResult and statistics APIs for comprehensive monitoring
7. **Filtering & Control**: Utilize advanced filtering options for precise handler execution
8. **Error Handling**: Always return after controller.abort() to prevent continued execution
9. **Memory Management**: Always clean up handlers and use auto-cleanup features
10. **Debugging**: Use registry information and debug modes for troubleshooting

### Latest Features Summary:

- **Enhanced HandlerConfig** with tags, categories, metadata, and environment controls
- **Advanced Filtering System** for selective handler execution  
- **Result Collection & Processing** with multiple strategies and custom mergers
- **Auto AbortController Management** for better cancellation control
- **Comprehensive ExecutionResult** with detailed execution information
- **Registry Management APIs** for monitoring and statistics
- **Performance Metrics** with timing and error collection

For more advanced patterns and integration examples, see the [Context-Action Framework Documentation](../README.md) and other concept guides in this directory.