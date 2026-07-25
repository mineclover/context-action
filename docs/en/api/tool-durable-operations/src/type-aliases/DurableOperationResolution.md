[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableOperationResolution

# Type Alias: DurableOperationResolution\<TResult\>

> **DurableOperationResolution**&lt;`TResult`&gt; = \{ `state`: `"completed"`; `result`: `TResult`; `reason?`: `string`; \} \| \{ `state`: `"failed"`; `reason`: `string`; `result?`: `TResult`; \}

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:63](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L63)

## Type Parameters

### TResult

`TResult` = `unknown`
