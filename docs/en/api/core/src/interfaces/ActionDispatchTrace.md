[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionDispatchTrace

# Interface: ActionDispatchTrace

Defined in: [packages/core/src/types.ts:1063](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1063)

Lifecycle trace emitted around a public dispatch operation.

## Properties

### dispatchId

> `readonly` **dispatchId**: `string`

Defined in: [packages/core/src/types.ts:1064](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1064)

***

### action

> `readonly` **action**: `string`

Defined in: [packages/core/src/types.ts:1065](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1065)

***

### phase

> `readonly` **phase**: `"started"` \| `"settled"`

Defined in: [packages/core/src/types.ts:1066](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1066)

***

### status?

> `readonly` `optional` **status?**: `"completed"` \| `"completed_with_errors"` \| `"failed"` \| `"cancelled"` \| `"debounced"` \| `"throttled"`

Defined in: [packages/core/src/types.ts:1067](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1067)

***

### transactionId?

> `readonly` `optional` **transactionId?**: `string`

Defined in: [packages/core/src/types.ts:1074](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1074)

***

### origin?

> `readonly` `optional` **origin?**: `"user"` \| `"system"` \| `"network"` \| `"undo"` \| `"redo"` \| `"reset"`

Defined in: [packages/core/src/types.ts:1075](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1075)

***

### label?

> `readonly` `optional` **label?**: `string`

Defined in: [packages/core/src/types.ts:1076](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1076)

***

### startedAt

> `readonly` **startedAt**: `number`

Defined in: [packages/core/src/types.ts:1077](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1077)

***

### endedAt?

> `readonly` `optional` **endedAt?**: `number`

Defined in: [packages/core/src/types.ts:1078](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1078)
