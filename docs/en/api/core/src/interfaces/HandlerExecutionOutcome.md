[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / HandlerExecutionOutcome

# Interface: HandlerExecutionOutcome\<R\>

Defined in: [packages/core/src/types.ts:699](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L699)

Concrete outcome produced by an execution mode. Keeping this record beside
the executor avoids reconstructing execution metrics from cursor indexes.

## Type Parameters

### Generic type R

`R` = `void`

## Properties

### id

> **id**: `string`

Defined in: [packages/core/src/types.ts:700](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L700)

***

### status

> **status**: [`HandlerExecutionStatus`](../type-aliases/HandlerExecutionStatus.md)

Defined in: [packages/core/src/types.ts:701](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L701)

***

### executed

> **executed**: `boolean`

Defined in: [packages/core/src/types.ts:702](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L702)

***

### duration

> **duration**: `number` \| `undefined`

Defined in: [packages/core/src/types.ts:703](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L703)

***

### result

> **result**: `R` \| `undefined`

Defined in: [packages/core/src/types.ts:704](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L704)

***

### error

> **error**: `Error` \| `undefined`

Defined in: [packages/core/src/types.ts:705](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L705)

***

### metadata

> **metadata**: `Record`\<`string`, `unknown`\> \| `undefined`

Defined in: [packages/core/src/types.ts:706](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L706)

***

### terminationRequested?

> `optional` **terminationRequested?**: `boolean`

Defined in: [packages/core/src/types.ts:707](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L707)

***

### terminationResult?

> `optional` **terminationResult?**: `R`

Defined in: [packages/core/src/types.ts:708](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L708)
