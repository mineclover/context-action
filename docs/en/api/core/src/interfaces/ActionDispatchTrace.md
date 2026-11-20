[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionDispatchTrace

# Interface: ActionDispatchTrace

Defined in: [packages/core/src/types.ts:1079](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1079)

Lifecycle trace emitted around a public dispatch operation.

## Properties

### dispatchId

> `readonly` **dispatchId**: `string`

Defined in: [packages/core/src/types.ts:1080](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1080)

***

### action

> `readonly` **action**: `string`

Defined in: [packages/core/src/types.ts:1081](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1081)

***

### phase

> `readonly` **phase**: `"started"` \| `"settled"`

Defined in: [packages/core/src/types.ts:1082](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1082)

***

### status?

> `readonly` `optional` **status?**: `"completed"` \| `"completed_with_errors"` \| `"failed"` \| `"cancelled"` \| `"debounced"` \| `"throttled"`

Defined in: [packages/core/src/types.ts:1083](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1083)

***

### transactionId?

> `readonly` `optional` **transactionId?**: `string`

Defined in: [packages/core/src/types.ts:1090](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1090)

***

### origin?

> `readonly` `optional` **origin?**: `"user"` \| `"system"` \| `"network"` \| `"undo"` \| `"redo"` \| `"reset"`

Defined in: [packages/core/src/types.ts:1091](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1091)

***

### label?

> `readonly` `optional` **label?**: `string`

Defined in: [packages/core/src/types.ts:1092](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1092)

***

### startedAt

> `readonly` **startedAt**: `number`

Defined in: [packages/core/src/types.ts:1093](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1093)

***

### endedAt?

> `readonly` `optional` **endedAt?**: `number`

Defined in: [packages/core/src/types.ts:1094](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1094)
