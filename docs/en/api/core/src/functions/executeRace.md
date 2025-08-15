[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / executeRace

# Function: executeRace()

> **executeRace**\<`T`, `R`\>(`context`, `createController`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/execution-modes.ts:205](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/execution-modes.ts#L205)

Execute handlers in race mode (first to complete wins)

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
