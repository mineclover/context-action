[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/core/src](../README.md) / ActionDispatchTrace

# Interface: ActionDispatchTrace

Defined in: [packages/core/src/types.ts:928](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L928)

Lifecycle trace emitted around a public dispatch operation.

## Properties

### dispatchId

> `readonly` **dispatchId**: `string`

Defined in: [packages/core/src/types.ts:929](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L929)

***

### action

> `readonly` **action**: `string`

Defined in: [packages/core/src/types.ts:930](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L930)

***

### phase

> `readonly` **phase**: `"started"` \| `"settled"`

Defined in: [packages/core/src/types.ts:931](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L931)

***

### status?

> `readonly` `optional` **status?**: `"completed"` \| `"completed_with_errors"` \| `"failed"` \| `"cancelled"` \| `"debounced"` \| `"throttled"`

Defined in: [packages/core/src/types.ts:932](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L932)

***

### transactionId?

> `readonly` `optional` **transactionId?**: `string`

Defined in: [packages/core/src/types.ts:939](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L939)

***

### origin?

> `readonly` `optional` **origin?**: `"user"` \| `"system"` \| `"network"` \| `"undo"` \| `"redo"` \| `"reset"`

Defined in: [packages/core/src/types.ts:940](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L940)

***

### label?

> `readonly` `optional` **label?**: `string`

Defined in: [packages/core/src/types.ts:941](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L941)

***

### startedAt

> `readonly` **startedAt**: `number`

Defined in: [packages/core/src/types.ts:942](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L942)

***

### endedAt?

> `readonly` `optional` **endedAt?**: `number`

Defined in: [packages/core/src/types.ts:943](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L943)
