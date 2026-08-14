[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableOperationListPage

# Interface: DurableOperationListPage\<TResult\>

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:71](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L71)

## Type Parameters

### TResult

`TResult` = `unknown`

## Properties

### records

> `readonly` **records**: readonly [`DurableOperationRecord`](DurableOperationRecord.md)&lt;`TResult`&gt;[]

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:72](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L72)

***

### nextCursor?

> `readonly` `optional` **nextCursor?**: `string`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:74](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L74)

Omit when the page is the final page.
