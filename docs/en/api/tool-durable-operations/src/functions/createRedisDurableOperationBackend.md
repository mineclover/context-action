[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / createRedisDurableOperationBackend

# Function: createRedisDurableOperationBackend()

> **createRedisDurableOperationBackend**&lt;`TResult`&gt;(`options`): [`DurableOperationBackend`](../interfaces/DurableOperationBackend.md)&lt;`TResult`&gt;

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:259](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L259)

Create a Redis-backed durable operation backend.

Records are stored as JSON strings and indexed in a sorted set. The CAS Lua
script updates both keys atomically, while `listPage()` uses a keyset-style
lex cursor that remains valid when earlier records are deleted by pruning.

## Type Parameters

### TResult

`TResult` = `unknown`

## Parameters

### options

[`RedisDurableOperationBackendOptions`](../interfaces/RedisDurableOperationBackendOptions.md)

## Returns

[`DurableOperationBackend`](../interfaces/DurableOperationBackend.md)&lt;`TResult`&gt;
