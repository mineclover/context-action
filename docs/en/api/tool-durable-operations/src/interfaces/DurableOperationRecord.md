[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableOperationRecord

# Interface: DurableOperationRecord\<TResult\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:32](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L32)

## Type Parameters

### TResult

`TResult` = `unknown`

## Properties

### key

> `readonly` **key**: `string`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:33](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L33)

***

### fingerprint

> `readonly` **fingerprint**: `string`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:34](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L34)

***

### ownerId

> `readonly` **ownerId**: `string`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:35](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L35)

***

### incarnation

> `readonly` **incarnation**: `string`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:37](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L37)

Opaque identity that never changes while one key incarnation exists.

***

### revision

> `readonly` **revision**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:39](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L39)

Monotonic CAS token within one incarnation.

***

### state

> `readonly` **state**: [`DurableOperationState`](../type-aliases/DurableOperationState.md)

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:40](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L40)

***

### result?

> `readonly` `optional` **result?**: `TResult`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:41](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L41)

***

### reason?

> `readonly` `optional` **reason?**: `string`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:42](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L42)

***

### createdAt

> `readonly` **createdAt**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:43](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L43)

***

### updatedAt

> `readonly` **updatedAt**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:44](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L44)

***

### leaseExpiresAt?

> `readonly` `optional` **leaseExpiresAt?**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:46](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L46)

The owner may be replaced after this point when a claim is retried.

***

### reconciledBy?

> `readonly` `optional` **reconciledBy?**: `string`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:48](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L48)

Recovery actor that resolved an unknown outcome, when applicable.

***

### reconciledAt?

> `readonly` `optional` **reconciledAt?**: `number`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:49](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L49)
