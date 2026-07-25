[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / PostgresDurableOperationBackendOptions

# Interface: PostgresDurableOperationBackendOptions

Defined in: [packages/tool-durable-operations/src/postgres-operation-backend.ts:29](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/postgres-operation-backend.ts#L29)

## Properties

### client

> `readonly` **client**: [`PostgresDurableOperationClient`](PostgresDurableOperationClient.md)

Defined in: [packages/tool-durable-operations/src/postgres-operation-backend.ts:30](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/postgres-operation-backend.ts#L30)

***

### tableName?

> `readonly` `optional` **tableName?**: `string`

Defined in: [packages/tool-durable-operations/src/postgres-operation-backend.ts:32](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/postgres-operation-backend.ts#L32)

PostgreSQL table name, optionally qualified as `schema.table`.

***

### defaultPageSize?

> `readonly` `optional` **defaultPageSize?**: `number`

Defined in: [packages/tool-durable-operations/src/postgres-operation-backend.ts:34](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/postgres-operation-backend.ts#L34)

Default page size for direct `listPage()` calls.
