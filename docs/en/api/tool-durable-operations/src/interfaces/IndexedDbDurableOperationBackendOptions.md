[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / IndexedDbDurableOperationBackendOptions

# Interface: IndexedDbDurableOperationBackendOptions

Defined in: [packages/tool-durable-operations/src/indexeddb-operation-backend.ts:6](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/indexeddb-operation-backend.ts#L6)

## Properties

### databaseName?

> `readonly` `optional` **databaseName?**: `string`

Defined in: [packages/tool-durable-operations/src/indexeddb-operation-backend.ts:8](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/indexeddb-operation-backend.ts#L8)

IndexedDB database name. Defaults to `context-action-operations`.

***

### storeName?

> `readonly` `optional` **storeName?**: `string`

Defined in: [packages/tool-durable-operations/src/indexeddb-operation-backend.ts:10](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/indexeddb-operation-backend.ts#L10)

Object store name. Defaults to `durable-operations`.

***

### version?

> `readonly` `optional` **version?**: `number`

Defined in: [packages/tool-durable-operations/src/indexeddb-operation-backend.ts:12](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/indexeddb-operation-backend.ts#L12)

Schema version used when creating the object store. Defaults to 1.

***

### indexedDB?

> `readonly` `optional` **indexedDB?**: `IDBFactory`

Defined in: [packages/tool-durable-operations/src/indexeddb-operation-backend.ts:14](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/indexeddb-operation-backend.ts#L14)

Injectable factory for browser tests or a host-owned IndexedDB instance.
