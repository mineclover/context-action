[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / executeRace

# Function: executeRace()

> **executeRace**\<`T`, `R`\>(`context`, `createController`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/execution-modes.ts:390](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/core/src/execution-modes.ts#L390)

Execute handlers in race mode (first to complete wins)

Executes all qualifying handlers simultaneously using Promise.race, where
the first handler to complete determines the pipeline result. Other handlers
continue in the background and remain tracked for lifecycle cleanup; handlers
must observe the controller signal for cooperative external cancellation.
Useful for scenarios where you want the fastest response from multiple
equivalent handlers.

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

When the winning handler fails and is blocking

## See

https://mineclover.github.io/context-action/en/guide/patterns/action/dispatch-patterns#race-execution
