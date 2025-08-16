[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / executeSequential

# Function: executeSequential()

> **executeSequential**\<`T`, `R`\>(`context`, `createController`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/execution-modes.ts:15](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/execution-modes.ts#L15)

Execute handlers in sequential mode (one after another)

## Type Parameters

### Generic type T

Type parameter **T**

### Generic type R

`R` = `void`

## Parameters

### context

[`PipelineContext`](../interfaces/PipelineContext.md)\<`T`, `R`\>

### createController

(`registration`, `index`) => [`PipelineController`](../interfaces/PipelineController.md)\<`T`, `R`\>

## Returns

`Promise`&lt;`void`&gt;
