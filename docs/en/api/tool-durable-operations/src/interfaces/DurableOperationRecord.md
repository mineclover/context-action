[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableOperationRecord

# Interface: DurableOperationRecord\<TResult\>

Defined in: packages/tool-durable-operations/src/durable-operation.ts:22

## Type Parameters

### TResult

`TResult` = `unknown`

## Properties

### key

> `readonly` **key**: `string`

Defined in: packages/tool-durable-operations/src/durable-operation.ts:23

***

### fingerprint

> `readonly` **fingerprint**: `string`

Defined in: packages/tool-durable-operations/src/durable-operation.ts:24

***

### ownerId

> `readonly` **ownerId**: `string`

Defined in: packages/tool-durable-operations/src/durable-operation.ts:25

***

### revision

> `readonly` **revision**: `number`

Defined in: packages/tool-durable-operations/src/durable-operation.ts:27

Monotonic CAS token used to reject stale owner transitions.

***

### state

> `readonly` **state**: [`DurableOperationState`](../type-aliases/DurableOperationState.md)

Defined in: packages/tool-durable-operations/src/durable-operation.ts:28

***

### result?

> `readonly` `optional` **result?**: `TResult`

Defined in: packages/tool-durable-operations/src/durable-operation.ts:29

***

### reason?

> `readonly` `optional` **reason?**: `string`

Defined in: packages/tool-durable-operations/src/durable-operation.ts:30

***

### createdAt

> `readonly` **createdAt**: `number`

Defined in: packages/tool-durable-operations/src/durable-operation.ts:31

***

### updatedAt

> `readonly` **updatedAt**: `number`

Defined in: packages/tool-durable-operations/src/durable-operation.ts:32

***

### leaseExpiresAt?

> `readonly` `optional` **leaseExpiresAt?**: `number`

Defined in: packages/tool-durable-operations/src/durable-operation.ts:34

The owner may be replaced after this point when a claim is retried.

***

### reconciledBy?

> `readonly` `optional` **reconciledBy?**: `string`

Defined in: packages/tool-durable-operations/src/durable-operation.ts:36

Recovery actor that resolved an unknown outcome, when applicable.

***

### reconciledAt?

> `readonly` `optional` **reconciledAt?**: `number`

Defined in: packages/tool-durable-operations/src/durable-operation.ts:37
