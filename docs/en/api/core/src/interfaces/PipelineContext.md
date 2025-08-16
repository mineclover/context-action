[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / PipelineContext

# Interface: PipelineContext\<T, R\>

Defined in: [packages/core/src/types.ts:203](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L203)

## Type Parameters

### Generic type T

`T` = `any`

### Generic type R

`R` = `void`

## Properties

### action

> **action**: `string`

Defined in: [packages/core/src/types.ts:204](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L204)

***

### payload

> **payload**: `T`

Defined in: [packages/core/src/types.ts:205](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L205)

***

### handlers

> **handlers**: [`HandlerRegistration`](HandlerRegistration.md)\<`T`, `R`\>[]

Defined in: [packages/core/src/types.ts:206](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L206)

***

### aborted

> **aborted**: `boolean`

Defined in: [packages/core/src/types.ts:207](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L207)

***

### abortReason?

> `optional` **abortReason**: `string`

Defined in: [packages/core/src/types.ts:208](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L208)

***

### currentIndex

> **currentIndex**: `number`

Defined in: [packages/core/src/types.ts:209](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L209)

***

### jumpToPriority?

> `optional` **jumpToPriority**: `number`

Defined in: [packages/core/src/types.ts:210](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L210)

***

### executionMode

> **executionMode**: [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Defined in: [packages/core/src/types.ts:211](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L211)

***

### results

> **results**: `R`[]

Defined in: [packages/core/src/types.ts:214](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L214)

***

### terminated

> **terminated**: `boolean`

Defined in: [packages/core/src/types.ts:215](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L215)

***

### terminationResult?

> `optional` **terminationResult**: `R`

Defined in: [packages/core/src/types.ts:216](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L216)
