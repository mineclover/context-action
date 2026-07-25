[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableOperationRecord

# Interface: DurableOperationRecord\<TResult\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:22](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L22)

## Type Parameters

### TResult

`TResult` = `unknown`

## Properties

### key

> `readonly` **key**: `string`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:23](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L23)

***

### fingerprint

> `readonly` **fingerprint**: `string`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:24](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L24)

***

### ownerId

> `readonly` **ownerId**: `string`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:25](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L25)

***

### revision

> `readonly` **revision**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:27](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L27)

Monotonic CAS token used to reject stale owner transitions.

***

### state

> `readonly` **state**: [`DurableOperationState`](../type-aliases/DurableOperationState.md)

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:28](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L28)

***

### result?

> `readonly` `optional` **result?**: `TResult`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:29](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L29)

***

### reason?

> `readonly` `optional` **reason?**: `string`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:30](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L30)

***

### createdAt

> `readonly` **createdAt**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:31](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L31)

***

### updatedAt

> `readonly` **updatedAt**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:32](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L32)

***

### leaseExpiresAt?

> `readonly` `optional` **leaseExpiresAt?**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:34](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L34)

The owner may be replaced after this point when a claim is retried.

***

### reconciledBy?

> `readonly` `optional` **reconciledBy?**: `string`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:36](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L36)

Recovery actor that resolved an unknown outcome, when applicable.

***

### reconciledAt?

> `readonly` `optional` **reconciledAt?**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:37](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L37)
