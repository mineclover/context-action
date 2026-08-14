[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableOperationClaim

# Interface: DurableOperationClaim\<TResult\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:52](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L52)

## Type Parameters

### TResult

`TResult` = `unknown`

## Properties

### status

> `readonly` **status**: [`DurableOperationClaimStatus`](../type-aliases/DurableOperationClaimStatus.md)

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:53](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L53)

***

### record

> `readonly` **record**: [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:54](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L54)

***

### fence

> `readonly` **fence**: [`DurableOperationFence`](DurableOperationFence.md)

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:56](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L56)

Fence that must accompany every owner or reconciliation transition.
