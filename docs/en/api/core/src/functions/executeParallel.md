[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / executeParallel

# Function: executeParallel()

> **executeParallel**\<`T`, `R`\>(`context`, `createController`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/execution-modes.ts:330](https://github.com/mineclover/context-action/blob/main/packages/core/src/execution-modes.ts#L330)

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

(`registration`, `index`, `state`) => [`PipelineController`](../interfaces/PipelineController.md)\<`T`, `R`\>

Factory function for creating pipeline controllers

## Returns

`Promise`&lt;`void`&gt;

## Throws

When any blocking handler fails

## See

https://mineclover.github.io/context-action/en/guide/patterns/action/dispatch-patterns#parallel-execution
