# DispatchOptions Interface

## 1. Purpose

The `DispatchOptions` interface provides a comprehensive set of options to control the behavior of a dispatched action. It allows for fine-grained control over timing, execution mode, cancellation, and more, on a per-dispatch basis.

## 2. Structure

The `DispatchOptions` interface has the following properties:

```typescript
export interface DispatchOptions {
  debounce?: number;
  throttle?: number;
  executionMode?: ExecutionMode;
  signal?: AbortSignal;
  immediate?: boolean;
  queuePriority?: number;
  timeout?: number;
  retryOnError?: {
    maxAttempts: number;
    delay: number;
  };
  autoAbort?: {
    enabled: boolean;
    onControllerCreated?: (controller: AbortController) => void;
    allowHandlerAbort?: boolean;
  };
  filter?: {
    handlerIds?: string[];
    excludeHandlerIds?: string[];
    priority?: {
      min?: number;
      max?: number;
    };
    custom?: (config: Required<HandlerConfig>) => boolean;
  };
  result?: {
    strategy?: 'first' | 'last' | 'all' | 'merge' | 'custom';
    merger?: <R>(results: Array<R | undefined>) => R;
    collect?: boolean;
    maxResults?: number;
    includeErrors?: boolean;
  };
}
```

## 3. Usage Patterns

You pass a `DispatchOptions` object as the third argument to the `dispatch` or `dispatchWithResult` methods of an `ActionRegister`.

### Debouncing and Throttling

```typescript
// This action will only be dispatched 300ms after the last call.
actionRegister.dispatch('search', { query }, { debounce: 300 });

// This action will be dispatched at most once every 1000ms.
actionRegister.dispatch('track-scroll', { position }, { throttle: 1000 });
```

### Filtering Handlers

You can filter which handlers are executed for a specific dispatch.

```typescript
actionRegister.dispatch('update-user', userData, {
  filter: {
    // Only run handlers with the 'validation' tag
    custom: (config) => config.tags?.includes('validation'),
  },
});
```

### Aborting an Action

You can use an `AbortController` to cancel a dispatch.

```typescript
const controller = new AbortController();

actionRegister.dispatch('long-running-task', {}, { signal: controller.signal });

// Later, to cancel the task
controller.abort();
```

## 4. TypeDoc Link

[DispatchOptions in types.ts](../../../packages/core/src/types.ts)
