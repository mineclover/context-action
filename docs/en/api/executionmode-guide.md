# ExecutionMode Type

## 1. Purpose

The `ExecutionMode` type alias defines the strategies for executing multiple action handlers registered for the same action. It allows you to control whether handlers run in sequence, in parallel, or in a race against each other.

## 2. Structure

`ExecutionMode` is a string literal type that can be one of the following values:

```typescript
export type ExecutionMode = 'sequential' | 'parallel' | 'race';
```

-   `'sequential'`: Handlers are executed one by one, in order of their `priority`. This is the default mode.
-   `'parallel'`: All handlers are executed concurrently.
-   `'race'`: All handlers are executed concurrently, but the pipeline finishes as soon as the first handler completes.

## 3. Usage Patterns

You can set the execution mode for a specific action using the `setActionExecutionMode` method on an `ActionRegister` instance, or you can override it for a single dispatch call.

### Setting a Default Mode for an Action

This is useful for defining the standard behavior for an action.

```typescript
// For actions where order matters
actionRegister.setActionExecutionMode('processOrder', 'sequential');

// For independent logging or tracking actions
actionRegister.setActionExecutionMode('trackEvent', 'parallel');

// For fetching data from multiple sources where only the fastest is needed
actionRegister.setActionExecutionMode('fetchFastest', 'race');
```

### Overriding Mode for a Specific Dispatch

You can override the default execution mode for a particular `dispatch` call by using `DispatchOptions`.

```typescript
// Force parallel execution for this specific dispatch, even if the default is sequential
await actionRegister.dispatch('trackEvent', eventData, {
  executionMode: 'parallel',
});
```

## 4. TypeDoc Link

[ExecutionMode in types.ts](../../../packages/core/src/types.ts)
