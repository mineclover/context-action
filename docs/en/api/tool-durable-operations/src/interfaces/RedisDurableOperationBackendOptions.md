[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / RedisDurableOperationBackendOptions

# Interface: RedisDurableOperationBackendOptions

Defined in: packages/tool-durable-operations/src/redis-operation-backend.ts:92

## Properties

### client

> `readonly` **client**: [`DurableOperationRedisClient`](DurableOperationRedisClient.md)

Defined in: packages/tool-durable-operations/src/redis-operation-backend.ts:93

***

### keyPrefix?

> `readonly` `optional` **keyPrefix?**: `string`

Defined in: packages/tool-durable-operations/src/redis-operation-backend.ts:95

Prefix for record keys and the lexicographic index.

***

### defaultPageSize?

> `readonly` `optional` **defaultPageSize?**: `number`

Defined in: packages/tool-durable-operations/src/redis-operation-backend.ts:97

Default page size for direct `listPage()` calls.
