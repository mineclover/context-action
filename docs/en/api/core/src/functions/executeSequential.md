[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / executeSequential

# Function: executeSequential()

> **executeSequential**\<`T`, `R`\>(`context`, `createController`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/execution-modes.ts:107](https://github.com/mineclover/context-action/blob/main/packages/core/src/execution-modes.ts#L107)

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

When a blocking handler fails

## See

https://mineclover.github.io/context-action/en/guide/patterns/action/dispatch-patterns
