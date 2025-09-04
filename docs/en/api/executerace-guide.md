# executeRace Function

## 1. Purpose

The `executeRace` function is an execution mode for action handler pipelines. It executes all qualifying action handlers simultaneously, but only the result of the first handler to complete is considered. Other handlers are effectively cancelled. This mode is useful when you need the fastest possible response from multiple equivalent handlers, such as fetching data from several sources and taking the first one that responds.

## 2. Signature

```typescript
export async function executeRace<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void>;
```

-   `context`: The `PipelineContext` object, which contains the action payload, registered handlers, and execution state.
-   `createController`: A factory function that creates a `PipelineController` for each handler, allowing handlers to interact with the pipeline (e.g., abort, modify payload).

## 3. Usage Patterns

You typically don't call `executeRace` directly. It is used internally by the `ActionRegister` when the `executionMode` is set to `'race'`.

### Setting Race Execution Mode

You can configure an `ActionRegister` to use race execution for specific actions.

```typescript
import { ActionRegister } from '@context-action/core';

const register = new ActionRegister();

// Configure 'fetchData' action to run handlers in race mode
register.setActionExecutionMode('fetchData', 'race');

register.register('fetchData', async (payload, controller) => {
  console.log('Fetching from API A');
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 500));
  return 'Data from API A';
});

register.register('fetchData', async (payload, controller) => {
  console.log('Fetching from API B');
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 200));
  return 'Data from API B';
});

// The dispatch will return the result from the fastest handler ('Data from API B').
const result = await register.dispatchWithResult('fetchData', {});
console.log('Fastest data:', result.result);
```

## 4. TypeDoc Link

[executeRace in execution-modes.ts](../../../packages/core/src/execution-modes.ts)
