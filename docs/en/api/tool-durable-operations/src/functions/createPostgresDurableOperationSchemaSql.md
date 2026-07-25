[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / createPostgresDurableOperationSchemaSql

# Function: createPostgresDurableOperationSchemaSql()

> **createPostgresDurableOperationSchemaSql**(`tableName?`): `string`

Defined in: [packages/tool-durable-operations/src/postgres-operation-backend.ts:72](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/postgres-operation-backend.ts#L72)

Create the application-owned migration for a specific safe table name.
The default constant below is convenient for a single shared table; hosts
that need an isolated verification table can generate one explicitly.

## Parameters

### tableName?

`string` = `DEFAULT_TABLE_NAME`

## Returns

`string`
