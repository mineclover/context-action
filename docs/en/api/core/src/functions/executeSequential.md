[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / executeSequential

# Function: executeSequential()

> **executeSequential**\<`T`, `R`\>(`context`, `createController`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/execution-modes.ts:51](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/execution-modes.ts#L51)

Execute handlers in sequential mode (one after another)

Executes action handlers one at a time in priority order (highest first).
Supports both blocking and non-blocking handlers, with proper abort and
termination handling. Handlers can modify payload for subsequent handlers
and jump to different priority levels.

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

When a blocking handler fails or validation errors occur

## Example

```typescript
// This is called internally by ActionRegister.dispatch()
// when executionMode is 'sequential'

// Handlers execute in this order (by priority):
// 1. Priority 100: Validation handler
// 2. Priority 50: Business logic handler  
// 3. Priority 10: Logging handler

await executeSequential(context, (registration, index) => ({
  abort: (reason) => { context.aborted = true; context.abortReason = reason },
  modifyPayload: (modifier) => { context.payload = modifier(context.payload) },
  // ... other controller methods
}))
```
