[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionDispatchTrace

# Interface: ActionDispatchTrace

Defined in: [packages/core/src/types.ts:1062](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1062)

Lifecycle trace emitted around a public dispatch operation.

## Properties

### dispatchId

> `readonly` **dispatchId**: `string`

Defined in: [packages/core/src/types.ts:1063](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1063)

***

### action

> `readonly` **action**: `string`

Defined in: [packages/core/src/types.ts:1064](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1064)

***

### phase

> `readonly` **phase**: `"started"` \| `"settled"`

Defined in: [packages/core/src/types.ts:1065](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1065)

***

### status?

> `readonly` `optional` **status?**: `"completed"` \| `"failed"` \| `"cancelled"` \| `"debounced"` \| `"throttled"`

Defined in: [packages/core/src/types.ts:1066](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1066)

***

### transactionId?

> `readonly` `optional` **transactionId?**: `string`

Defined in: [packages/core/src/types.ts:1067](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1067)

***

### origin?

> `readonly` `optional` **origin?**: `"user"` \| `"system"` \| `"network"` \| `"undo"` \| `"redo"` \| `"reset"`

Defined in: [packages/core/src/types.ts:1068](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1068)

***

### label?

> `readonly` `optional` **label?**: `string`

Defined in: [packages/core/src/types.ts:1069](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1069)

***

### startedAt

> `readonly` **startedAt**: `number`

Defined in: [packages/core/src/types.ts:1070](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1070)

***

### endedAt?

> `readonly` `optional` **endedAt?**: `number`

Defined in: [packages/core/src/types.ts:1071](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1071)
