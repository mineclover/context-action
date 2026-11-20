[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/core/src](../README.md) / HandlerExecutionOutcome

# Interface: HandlerExecutionOutcome\<R\>

Defined in: [packages/core/src/types.ts:548](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L548)

Concrete outcome produced by an execution mode. Keeping this record beside
the executor avoids reconstructing execution metrics from cursor indexes.

## Type Parameters

### Generic type R

`R` = `void`

## Properties

### id

> **id**: `string`

Defined in: [packages/core/src/types.ts:549](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L549)

***

### status

> **status**: [`HandlerExecutionStatus`](../type-aliases/HandlerExecutionStatus.md)

Defined in: [packages/core/src/types.ts:550](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L550)

***

### executed

> **executed**: `boolean`

Defined in: [packages/core/src/types.ts:551](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L551)

***

### duration

> **duration**: `number` \| `undefined`

Defined in: [packages/core/src/types.ts:552](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L552)

***

### result

> **result**: `R` \| `undefined`

Defined in: [packages/core/src/types.ts:553](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L553)

***

### error

> **error**: `Error` \| `undefined`

Defined in: [packages/core/src/types.ts:554](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L554)

***

### metadata

> **metadata**: `Record`\<`string`, `unknown`\> \| `undefined`

Defined in: [packages/core/src/types.ts:555](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L555)

***

### terminationRequested?

> `optional` **terminationRequested?**: `boolean`

Defined in: [packages/core/src/types.ts:556](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L556)

***

### terminationResult?

> `optional` **terminationResult?**: `R`

Defined in: [packages/core/src/types.ts:557](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L557)
