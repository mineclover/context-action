[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableOperationListPage

# Interface: DurableOperationListPage\<TResult\>

Defined in: packages/tool-durable-operations/src/durable-operation.ts:57

## Type Parameters

### TResult

`TResult` = `unknown`

## Properties

### records

> `readonly` **records**: readonly [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;[]

Defined in: packages/tool-durable-operations/src/durable-operation.ts:58

***

### nextCursor?

> `readonly` `optional` **nextCursor?**: `string`

Defined in: packages/tool-durable-operations/src/durable-operation.ts:60

Omit when the page is the final page.
