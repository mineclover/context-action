[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / createIndexedDbDurableOperationBackend

# Function: createIndexedDbDurableOperationBackend()

> **createIndexedDbDurableOperationBackend**&lt;`TResult`&gt;(`options?`): [`DurableOperationBackend`](../interfaces/DurableOperationBackend.md)&lt;`TResult`&gt; & `object`

Defined in: packages/tool-durable-operations/src/indexeddb-operation-backend.ts:136

Create an IndexedDB backend for `createDurableOperationStore()`.

Each claim/update is a single IndexedDB transaction. Cross-tab atomicity is
provided by the object store's revision-checked compare-and-set operation;
this backend does not share in-memory state or Promises between tabs.

## Type Parameters

### TResult

`TResult` = `unknown`

## Parameters

### options?

[`IndexedDbDurableOperationBackendOptions`](../interfaces/IndexedDbDurableOperationBackendOptions.md) = `{}`

## Returns

[`DurableOperationBackend`](../interfaces/DurableOperationBackend.md)&lt;`TResult`&gt; & `object`
