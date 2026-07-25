[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / RedisDurableOperationBackendOptions

# Interface: RedisDurableOperationBackendOptions

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:92](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/redis-operation-backend.ts#L92)

## Properties

### client

> `readonly` **client**: [`DurableOperationRedisClient`](DurableOperationRedisClient.md)

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:93](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/redis-operation-backend.ts#L93)

***

### keyPrefix?

> `readonly` `optional` **keyPrefix?**: `string`

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:95](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/redis-operation-backend.ts#L95)

Prefix for record keys and the lexicographic index.

***

### defaultPageSize?

> `readonly` `optional` **defaultPageSize?**: `number`

Defined in: [packages/tool-durable-operations/src/redis-operation-backend.ts:97](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/redis-operation-backend.ts#L97)

Default page size for direct `listPage()` calls.
