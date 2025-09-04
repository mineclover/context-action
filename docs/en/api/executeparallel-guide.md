# executeParallel Function

## 1. Purpose

The `executeParallel` function is an execution mode for action handler pipelines. It executes all qualifying action handlers simultaneously. This mode is ideal for scenarios where handlers are independent and their order of execution does not matter, allowing for maximum concurrency and potentially faster overall execution.

## 2. Signature

```typescript
export async function executeParallel<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void>;
```

-   `context`: The `PipelineContext` object, which contains the action payload, registered handlers, and execution state.
-   `createController`: A factory function that creates a `PipelineController` for each handler, allowing handlers to interact with the pipeline (e.g., abort, modify payload).

## 3. Usage Patterns

You typically don't call `executeParallel` directly. It is used internally by the `ActionRegister` when the `executionMode` is set to `'parallel'`.

### Setting Parallel Execution Mode

You can configure an `ActionRegister` to use parallel execution for specific actions.

```typescript
import { ActionRegister } from '@context-action/core';

const register = new ActionRegister();

// Configure 'logEvent' action to run handlers in parallel
register.setActionExecutionMode('logEvent', 'parallel');

register.register('logEvent', async (payload, controller) => {
  console.log('Logging to Analytics A:', payload);
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
});

register.register('logEvent', async (payload, controller) => {
  console.log('Logging to Analytics B:', payload);
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50));
});

// Both handlers will start executing at roughly the same time.
register.dispatch('logEvent', { eventName: 'UserClicked', data: {} });
```

## 4. TypeDoc Link

[executeParallel in execution-modes.ts](../../../packages/core/src/execution-modes.ts)
