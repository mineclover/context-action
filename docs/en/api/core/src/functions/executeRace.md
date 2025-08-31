[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / executeRace

# Function: executeRace()

> **executeRace**\<`T`, `R`\>(`context`, `createController`): `Promise`\<`void`\>

Defined in: [packages/core/src/execution-modes.ts:294](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/execution-modes.ts#L294)

Execute handlers in race mode (first to complete wins)

Executes all qualifying handlers simultaneously using Promise.race, where
the first handler to complete determines the pipeline result. Other handlers
are effectively cancelled. Useful for scenarios where you want the fastest
response from multiple equivalent handlers.

## Type Parameters

### T

`T`

The payload type for the action

### R

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

`Promise`\<`void`\>

## Throws

When the winning handler fails and is blocking

## See

https://mineclover.github.io/context-action/en/guide/patterns/action/dispatch-patterns#race-execution
