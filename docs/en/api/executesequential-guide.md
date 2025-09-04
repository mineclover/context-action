# executeSequential Function

## 1. Purpose

The `executeSequential` function is an execution mode for action handler pipelines. It ensures that action handlers are executed one after another in a sequential manner, respecting their defined priorities. This mode is suitable for scenarios where the order of execution is critical, or where a handler's output is required as input for subsequent handlers.

## 2. Signature

```typescript
export async function executeSequential<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void>;
```

-   `context`: The `PipelineContext` object, which contains the action payload, registered handlers, and execution state.
-   `createController`: A factory function that creates a `PipelineController` for each handler, allowing handlers to interact with the pipeline (e.g., abort, modify payload).

## 3. Usage Patterns

You typically don't call `executeSequential` directly. It is used internally by the `ActionRegister` when the `executionMode` is set to `'sequential'` (which is the default).

### Default Sequential Execution

By default, handlers registered with an `ActionRegister` will execute sequentially.

```typescript
import { ActionRegister } from '@context-action/core';

const register = new ActionRegister();

register.register('processOrder', async (payload, controller) => {
  console.log('Step 1: Validate order');
  // ... validation logic
});

register.register('processOrder', async (payload, controller) => {
  console.log('Step 2: Process payment');
}, { priority: 10 }); // This handler will run before the first one due to priority

// Dispatching the action will execute handlers sequentially
register.dispatch('processOrder', { orderId: '123' });
```

## 4. TypeDoc Link

[executeSequential in execution-modes.ts](../../../packages/core/src/execution-modes.ts)
