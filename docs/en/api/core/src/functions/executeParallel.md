[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / executeParallel

# Function: executeParallel()

> **executeParallel**\<`T`, `R`\>(`context`, `createController`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/execution-modes.ts:205](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/execution-modes.ts#L205)

Execute handlers in parallel mode (all at once)

Executes all qualifying action handlers simultaneously using Promise.allSettled.
Supports both blocking and non-blocking handlers. Blocking handlers can still
fail the entire pipeline if they throw errors.

## Type Parameters

### Generic type T

Type parameter **T**

The payload type for the action

### Generic type R

`R` = `void`

The result type for handlers

## Parameters

### context

`PipelineContext`\<`T`, `R`\>

Pipeline execution context containing handlers and state

### createController

(`registration`, `index`) => [`PipelineController`](../interfaces/PipelineController.md)\<`T`, `R`\>

Factory function for creating pipeline controllers

## Returns

`Promise`&lt;`void`&gt;

## Throws

When any blocking handler fails

## Examples

```typescript
// This is called internally by ActionRegister.dispatch()
// when executionMode is 'parallel'

// All handlers execute simultaneously:
// - Analytics handler (non-blocking)
// - Validation handler (blocking)
// - Update handler (blocking)
// - Notification handler (non-blocking)

await executeParallel(context, (registration, index) => ({
  abort: (reason) => { context.aborted = true },
  setResult: (result) => { context.results.push(result) },
  // ... other controller methods
}))
```

```typescript
// Perfect for independent operations
register.setActionExecutionMode('logEvent', 'parallel')

// These can all run simultaneously:
register.register('logEvent', analyticsHandler, { blocking: false })
register.register('logEvent', metricsHandler, { blocking: false })
register.register('logEvent', auditHandler, { blocking: true })
```
