[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / RedisDurableOperationBackendOptions

# Interface: RedisDurableOperationBackendOptions

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:93](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L93)

## Properties

### client

> `readonly` **client**: [`DurableOperationRedisClient`](DurableOperationRedisClient.md)

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:94](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L94)

***

### keyPrefix?

> `readonly` `optional` **keyPrefix?**: `string`

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:96](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L96)

Prefix for record keys and the lexicographic index.

***

### defaultPageSize?

> `readonly` `optional` **defaultPageSize?**: `number`

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:98](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/redis-operation-backend.ts#L98)

Default page size for direct `listPage()` calls.
