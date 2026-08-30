[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / HandlerExecutionOutcome

# Interface: HandlerExecutionOutcome\<R\>

Defined in: [packages/core/src/types.ts:682](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L682)

Concrete outcome produced by an execution mode. Keeping this record beside
the executor avoids reconstructing execution metrics from cursor indexes.

## Type Parameters

### Generic type R

`R` = `void`

## Properties

### id

> **id**: `string`

Defined in: [packages/core/src/types.ts:683](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L683)

***

### status

> **status**: [`HandlerExecutionStatus`](../type-aliases/HandlerExecutionStatus.md)

Defined in: [packages/core/src/types.ts:684](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L684)

***

### executed

> **executed**: `boolean`

Defined in: [packages/core/src/types.ts:685](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L685)

***

### duration

> **duration**: `number` \| `undefined`

Defined in: [packages/core/src/types.ts:686](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L686)

***

### result

> **result**: `R` \| `undefined`

Defined in: [packages/core/src/types.ts:687](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L687)

***

### error

> **error**: `Error` \| `undefined`

Defined in: [packages/core/src/types.ts:688](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L688)

***

### metadata

> **metadata**: `Record`\<`string`, `unknown`\> \| `undefined`

Defined in: [packages/core/src/types.ts:689](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L689)

***

### terminationRequested?

> `optional` **terminationRequested?**: `boolean`

Defined in: [packages/core/src/types.ts:690](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L690)

***

### terminationResult?

> `optional` **terminationResult?**: `R`

Defined in: [packages/core/src/types.ts:691](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L691)
