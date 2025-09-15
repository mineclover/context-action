# Pipeline Concurrency Control

Advanced concurrency control mechanisms for Context-Action pipelines, ensuring thread safety and preventing race conditions through intelligent queuing systems.

## Overview

The Context-Action framework provides sophisticated concurrency control to prevent race conditions and ensure predictable pipeline execution. By default, all ActionRegister instances use an **OperationQueue** system that serializes operations, guaranteeing that only one pipeline executes at a time per register.

## Core Problem

Without concurrency control, multiple simultaneous action dispatches can cause:

- **Race Conditions**: Competing pipeline executions modifying shared state
- **Inconsistent Results**: Unpredictable execution order affecting outcomes
- **Memory Corruption**: Concurrent access to internal data structures
- **Performance Degradation**: Excessive resource contention

```typescript
// ❌ Without concurrency control - race conditions possible
register.dispatch('updateUser', { id: '123', name: 'John' });
register.dispatch('updateUser', { id: '123', name: 'Jane' }); // Which wins?
register.dispatch('updateUser', { id: '123', name: 'Bob' });  // Unpredictable order
```

## 🚦 OperationQueue System

### Architecture

The **OperationQueue** provides thread-safe pipeline execution through:

1. **Serialization**: All operations queued and executed sequentially
2. **Priority Support**: Higher priority operations execute first
3. **Memory Management**: Automatic cleanup of completed operations
4. **Concurrency Control**: Configurable `maxConcurrency` limits

```typescript
interface QueuedOperation<T = any> {
  id: string;                          // Unique operation identifier
  operation: () => T | Promise<T>;     // The actual pipeline execution
  resolve: (value: T) => void;         // Promise resolution callback
  reject: (error: unknown) => void;    // Error handling callback
  priority?: number;                   // Execution priority (higher = first)
  timestamp: number;                   // Creation time for debugging
}
```

### Default Behavior

```typescript
// ✅ With concurrency control (default) - guaranteed order
const register = new ActionRegister<UserActions>({
  name: 'UserManager',
  registry: {
    useConcurrencyQueue: true  // Default: true
  }
});

// These execute in queue order, preventing race conditions
await register.dispatch('updateUser', { id: '123', name: 'John' });  // 1st
await register.dispatch('updateUser', { id: '123', name: 'Jane' });  // 2nd
await register.dispatch('updateUser', { id: '123', name: 'Bob' });   // 3rd
```

## Configuration Options

### Basic Concurrency Control

```typescript
interface UserActions extends ActionPayloadMap {
  updateProfile: { userId: string; data: UserProfile };
  deleteAccount: { userId: string };
}

// Safe concurrent execution (default)
const safeRegister = new ActionRegister<UserActions>({
  name: 'SafeUserManager',
  registry: {
    useConcurrencyQueue: true,        // Enable queue system (default)
    maxHandlersPerAction: 1000,       // Memory protection
    defaultExecutionMode: 'sequential' // Handler execution mode
  }
});
```

### High-Performance Configuration

```typescript
// Disable concurrency control for maximum performance
const performanceRegister = new ActionRegister<UserActions>({
  name: 'HighPerformanceManager',
  registry: {
    useConcurrencyQueue: false,       // ⚠️ Disable queue - use with caution
    defaultExecutionMode: 'parallel'  // Parallel handler execution
  }
});

// ⚠️ WARNING: Without queue, concurrent dispatches may cause race conditions
// Only use when you can guarantee no concurrent access or when handlers are pure
```

### Memory-Optimized Configuration

```typescript
// Balanced configuration for resource-constrained environments
const optimizedRegister = new ActionRegister<UserActions>({
  name: 'OptimizedManager',
  registry: {
    useConcurrencyQueue: true,
    maxHandlersPerAction: 100,        // Lower memory footprint
    autoCleanup: true,                // Aggressive cleanup
    defaultExecutionMode: 'sequential'
  }
});
```

## 🎛️ ActionGuard Integration

The concurrency system integrates with **ActionGuard** for advanced execution control:

### Debouncing Support

```typescript
// Prevent rapid-fire executions with debouncing
register.register('searchUsers', async (payload) => {
  return await searchDatabase(payload.query);
}, {
  priority: 80,
  debounce: 300,    // Wait 300ms after last call
  id: 'user-search'
});

// Multiple rapid calls → only last one executes after 300ms pause
register.dispatch('searchUsers', { query: 'john' });
register.dispatch('searchUsers', { query: 'jane' });  // Cancels previous
register.dispatch('searchUsers', { query: 'bob' });   // Only this executes
```

### Throttling Support

```typescript
// Limit execution frequency with throttling
register.register('updateUI', async (payload) => {
  return await refreshUserInterface(payload.data);
}, {
  priority: 60,
  throttle: 1000,   // Maximum once per second
  id: 'ui-updater'
});

// Rapid calls → maximum once per second
register.dispatch('updateUI', { data: 'update1' });  // Executes immediately
register.dispatch('updateUI', { data: 'update2' });  // Ignored (throttled)
register.dispatch('updateUI', { data: 'update3' });  // Ignored (throttled)
// ... 1 second later, next call would execute
```

## Performance Comparison

### With Concurrency Control (Default)

```typescript
// Execution Timeline: Sequential, predictable
const timedRegister = new ActionRegister<TimingActions>();

console.time('Sequential Execution');
await Promise.all([
  timedRegister.dispatch('operation', { id: 1 }),  // Queued: Position 1
  timedRegister.dispatch('operation', { id: 2 }),  // Queued: Position 2
  timedRegister.dispatch('operation', { id: 3 })   // Queued: Position 3
]);
console.timeEnd('Sequential Execution');
// Result: ~300ms (100ms × 3 operations in sequence)
```

### Without Concurrency Control

```typescript
// Execution Timeline: Parallel, potential race conditions
const unsafeRegister = new ActionRegister<TimingActions>({
  registry: { useConcurrencyQueue: false }
});

console.time('Parallel Execution');
await Promise.all([
  unsafeRegister.dispatch('operation', { id: 1 }),  // Starts immediately
  unsafeRegister.dispatch('operation', { id: 2 }),  // Starts immediately
  unsafeRegister.dispatch('operation', { id: 3 })   // Starts immediately
]);
console.timeEnd('Parallel Execution');
// Result: ~100ms (operations run concurrently)
// ⚠️ Risk: Race conditions if handlers modify shared state
```

## Use Case Patterns

### 1. User State Management (Safe by Default)

```typescript
interface UserStateActions extends ActionPayloadMap {
  login: { username: string; password: string };
  logout: void;
  updateProfile: { userId: string; changes: Partial<UserProfile> };
}

// Safe for concurrent user interactions
const userManager = new ActionRegister<UserStateActions>({
  name: 'UserStateManager'
  // useConcurrencyQueue: true (default)
});

// Multiple UI interactions are safely queued
userManager.register('updateProfile', async (payload, controller) => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    controller.abort('User not authenticated');
    return;
  }

  const updated = await updateUserInDatabase(payload.userId, payload.changes);
  updateUserInCache(updated);

  return { step: 'profile-updated', userId: payload.userId };
}, { priority: 80, blocking: true });
```

### 2. Analytics Tracking (Performance Optimized)

```typescript
interface AnalyticsActions extends ActionPayloadMap {
  trackEvent: { event: string; properties: Record<string, any> };
  trackPageView: { page: string; userId?: string };
}

// High-frequency, non-critical operations - can disable queue
const analytics = new ActionRegister<AnalyticsActions>({
  name: 'AnalyticsTracker',
  registry: {
    useConcurrencyQueue: false,       // Disable for performance
    defaultExecutionMode: 'parallel'  // Parallel processing
  }
});

// Safe because analytics handlers don't modify shared state
analytics.register('trackEvent', async (payload) => {
  // Pure function - no shared state modification
  await sendToAnalyticsService(payload.event, payload.properties);
  return { tracked: true, timestamp: Date.now() };
}, { priority: 10, blocking: false });
```

### 3. Critical Operations (Maximum Safety)

```typescript
interface PaymentActions extends ActionPayloadMap {
  processPayment: {
    orderId: string;
    amount: number;
    paymentMethod: PaymentMethod;
  };
}

// Financial operations require maximum safety
const paymentProcessor = new ActionRegister<PaymentActions>({
  name: 'PaymentProcessor',
  registry: {
    useConcurrencyQueue: true,        // Mandatory for financial operations
    maxHandlersPerAction: 10,         // Conservative limit
    defaultExecutionMode: 'sequential', // Strict ordering
    errorHandler: (error, context) => {
      // Critical error logging
      logCriticalError('Payment processing failed', { error, context });
    }
  }
});

paymentProcessor.register('processPayment', async (payload, controller) => {
  // Validate payment
  const validation = await validatePayment(payload);
  if (!validation.valid) {
    controller.abort(`Payment validation failed: ${validation.reason}`);
    return;
  }

  // Process with external service
  const result = await chargePaymentMethod(payload.paymentMethod, payload.amount);

  // Update order status
  await updateOrderStatus(payload.orderId, 'paid');

  return {
    step: 'payment-processed',
    orderId: payload.orderId,
    transactionId: result.transactionId
  };
}, {
  priority: 100,
  blocking: true,
  timeout: 30000,  // 30 second timeout
  retries: 0       // No retries for payments
});
```

## Debugging and Monitoring

### Queue Status Monitoring

```typescript
// Monitor queue performance and status
const register = new ActionRegister<MonitoredActions>({
  name: 'MonitoredRegister',
  registry: { debug: true }  // Enable debug logging
});

// Access internal queue information
const queueInfo = register.getConcurrencyInfo?.(); // If available
console.log('Queue Status:', {
  queueLength: queueInfo?.queuedOperations || 'N/A',
  activeOperations: queueInfo?.activeOperations || 'N/A',
  maxConcurrency: queueInfo?.maxConcurrency || 'N/A',
  efficiency: queueInfo?.efficiency || 'N/A'
});
```

### Performance Profiling

```typescript
// Profile execution timing with and without queue
async function profileConcurrency() {
  const payload = { data: 'test' };

  // With queue (default)
  const queuedRegister = new ActionRegister<TestActions>();
  const queuedStart = performance.now();
  await Promise.all([
    queuedRegister.dispatch('test', payload),
    queuedRegister.dispatch('test', payload),
    queuedRegister.dispatch('test', payload)
  ]);
  const queuedTime = performance.now() - queuedStart;

  // Without queue
  const parallelRegister = new ActionRegister<TestActions>({
    registry: { useConcurrencyQueue: false }
  });
  const parallelStart = performance.now();
  await Promise.all([
    parallelRegister.dispatch('test', payload),
    parallelRegister.dispatch('test', payload),
    parallelRegister.dispatch('test', payload)
  ]);
  const parallelTime = performance.now() - parallelStart;

  console.log('Performance Comparison:', {
    queuedExecution: `${queuedTime.toFixed(2)}ms`,
    parallelExecution: `${parallelTime.toFixed(2)}ms`,
    speedup: `${(queuedTime / parallelTime).toFixed(2)}x faster (parallel)`
  });
}
```

## Best Practices

### When to Use Concurrency Control

✅ **Always use (default) for:**
- User state management and authentication
- Database operations and data modification
- Financial transactions and critical business logic
- Shared resource access (files, external APIs)
- Operations that modify component or application state

### When to Consider Disabling

⚠️ **Consider disabling for:**
- Pure analytics and logging (no shared state)
- Read-only operations with no side effects
- High-frequency, non-critical events
- Performance-critical scenarios with guaranteed single-threaded access

### Safety Guidelines

```typescript
// ✅ Safe patterns
const safeRegister = new ActionRegister<SafeActions>({
  registry: {
    useConcurrencyQueue: true,        // Default safety
    errorHandler: logErrors,          // Proper error handling
    maxHandlersPerAction: 1000        // Memory protection
  }
});

// ❌ Dangerous patterns
const dangerousRegister = new ActionRegister<DangerousActions>({
  registry: {
    useConcurrencyQueue: false,       // No safety net
    // No error handler
    maxHandlersPerAction: Infinity    // No memory limits
  }
});
```

### Error Handling in Concurrent Scenarios

```typescript
// Robust error handling with concurrency control
register.register('robustOperation', async (payload, controller) => {
  try {
    const result = await riskyOperation(payload.data);
    return { step: 'success', result };
  } catch (error) {
    // Log but don't crash the queue
    console.error('Operation failed:', error);

    // Use controller to communicate failure
    controller.setResult({
      step: 'error',
      error: error.message,
      retryable: isRetryableError(error)
    });

    return { step: 'failed', error: error.message };
  }
}, {
  priority: 70,
  blocking: true,
  timeout: 10000
});
```

## Memory Management

### Queue Size Monitoring

```typescript
// Monitor and control queue growth
const memoryAwareRegister = new ActionRegister<MemoryActions>({
  name: 'MemoryAware',
  registry: {
    maxHandlersPerAction: 500,        // Limit handlers
    autoCleanup: true,                // Enable cleanup
    errorHandler: (error, context) => {
      if (error.message.includes('memory')) {
        // Handle memory pressure
        console.warn('Memory pressure detected, reducing load');
      }
    }
  }
});
```

### Cleanup Strategies

```typescript
// Implement cleanup for long-running applications
class ManagedActionRegister<T extends ActionPayloadMap> extends ActionRegister<T> {
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: ActionRegisterConfig) {
    super(config);

    // Periodic cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performMaintenance();
    }, 5 * 60 * 1000);
  }

  private performMaintenance() {
    // Custom cleanup logic
    console.log('Performing register maintenance...');
    // Clear old handlers, reset counters, etc.
  }

  dispose() {
    clearInterval(this.cleanupInterval);
    // Additional cleanup
  }
}
```

## Related

- **[Priority System](./priority.md)** - Priority affects queue execution order
- **[Blocking Operations](./blocking.md)** - Blocking behavior within concurrent pipelines
- **[Performance Optimization](./performance.md)** - Performance considerations for concurrency
- **[Error Handling](./abort.md)** - Error handling in concurrent environments
- **[Introspection](./introspection.md)** - Debugging concurrent pipeline execution