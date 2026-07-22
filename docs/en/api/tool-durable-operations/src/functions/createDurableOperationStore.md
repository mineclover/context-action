[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / createDurableOperationStore

# Function: createDurableOperationStore()

> **createDurableOperationStore**&lt;`TResult`&gt;(`backend`, `options?`): [`DurableOperationStore`](../interfaces/DurableOperationStore.md)&lt;`TResult`&gt;

Defined in: packages/tool-durable-operations/src/durable-operation.ts:260

Create a reference store over an atomic backend.

The adapter owns the state machine and CAS retries. The backend owns
durability and cross-process atomicity; no Promise or process-local state is
shared by this layer.

## Type Parameters

### TResult

`TResult` = `unknown`

## Parameters

### backend

[`DurableOperationBackend`](../interfaces/DurableOperationBackend.md)&lt;`TResult`&gt;

### options?

[`DurableOperationStoreOptions`](../interfaces/DurableOperationStoreOptions.md) = `{}`

## Returns

[`DurableOperationStore`](../interfaces/DurableOperationStore.md)&lt;`TResult`&gt;
