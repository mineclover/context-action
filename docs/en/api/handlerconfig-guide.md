# HandlerConfig Interface

## 1. Purpose

The `HandlerConfig` interface provides a set of configuration options to control the behavior of an action handler within the action pipeline. It allows for fine-grained control over execution priority, timing, and lifecycle management.

## 2. Structure

The `HandlerConfig` interface has the following properties:

```typescript
export interface HandlerConfig {
  /** Priority level (higher numbers execute first). Default: 0 */
  priority?: number;
  
  /** Unique identifier for the handler. Auto-generated if not provided */
  id?: string;
  
  /** Whether to wait for async handlers to complete. Default: false */
  blocking?: boolean;
  
  /** Whether this handler should run once and then be removed. Default: false */
  once?: boolean;
  
  /** Debounce delay in milliseconds */
  debounce?: number;
  
  /** Throttle delay in milliseconds */
  throttle?: number;
  
  /** Replace existing handler with same ID. Default: false for backward compatibility */
  replaceExisting?: boolean;
  
  /** Cleanup function to call when handler is unregistered */
  cleanup?: () => void;
}
```

## 3. Usage Patterns

`HandlerConfig` is used as the third argument when registering a handler with `actionRegister.register()`.

### Basic Configuration

You can specify `priority` to control execution order, and timing controls like `debounce` and `throttle`.

```typescript
// This handler will run before handlers with default priority (0)
// and will only be called 300ms after the last dispatch.
register.register('search', searchHandler, {
  priority: 100,
  debounce: 300,
});
```

### Lifecycle Management

The `once` property ensures a handler is executed only once and then automatically unregistered. The `cleanup` function is called when a handler is unregistered, which is useful for resource management.

```typescript
const initHandler = () => { console.log('Initialization logic'); };
const cleanupLogic = () => { console.log('Cleaning up resources'); };

register.register('init', initHandler, {
  once: true, // This handler will be removed after its first execution.
  cleanup: cleanupLogic, // This function will be called upon unregistration.
});
```

### Advanced Control

The `blocking` property can be used to force the pipeline to wait for an asynchronous handler to complete before proceeding. The `id` can be used for identification and for replacement with `replaceExisting`.

```typescript
register.register('payment', asyncPaymentHandler, {
  priority: 200,
  blocking: true, // The pipeline will wait for this handler to resolve.
  id: 'payment-processor',
});

// Later, you can replace the handler by using the same id.
register.register('payment', newAsyncPaymentHandler, {
  id: 'payment-processor',
  replaceExisting: true,
});
```

## 4. TypeDoc Link

[HandlerConfig in types.ts](../../../packages/core/src/types.ts)
