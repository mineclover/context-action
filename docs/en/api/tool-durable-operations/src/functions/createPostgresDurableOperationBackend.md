[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / createPostgresDurableOperationBackend

# Function: createPostgresDurableOperationBackend()

> **createPostgresDurableOperationBackend**&lt;`TResult`&gt;(`options`): [`DurableOperationBackend`](../interfaces/DurableOperationBackend.md)&lt;`TResult`&gt;

Defined in: [packages/tool-durable-operations/src/postgres-operation-backend.ts:222](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/postgres-operation-backend.ts#L222)

Create a PostgreSQL-backed durable operation backend.

Each CAS is a single conditional statement. PostgreSQL row/unique-key
locking makes insert-vs-insert and revision-checked updates atomic across
processes; the generic durable store retries only when the conditional
statement loses a race. No process-local Promise is shared here.

## Type Parameters

### TResult

`TResult` = `unknown`

## Parameters

### options

[`PostgresDurableOperationBackendOptions`](../interfaces/PostgresDurableOperationBackendOptions.md)

## Returns

[`DurableOperationBackend`](../interfaces/DurableOperationBackend.md)&lt;`TResult`&gt;
