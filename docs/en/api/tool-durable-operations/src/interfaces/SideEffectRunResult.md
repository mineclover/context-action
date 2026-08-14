[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / SideEffectRunResult

# Interface: SideEffectRunResult\<TResult, TDiagnostic\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:59](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L59)

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Properties

### state

> `readonly` **state**: [`SideEffectRunState`](../type-aliases/SideEffectRunState.md)

Defined in: [packages/tool-durable-operations/src/side-effect.ts:60](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L60)

***

### operation?

> `readonly` `optional` **operation?**: [`DurableOperationRecord`](DurableOperationRecord.md)\<[`SideEffectRecordPayload`](SideEffectRecordPayload.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:61](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L61)

***

### result?

> `readonly` `optional` **result?**: `TResult`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:64](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L64)

***

### diagnostic?

> `readonly` `optional` **diagnostic?**: `TDiagnostic`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:65](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L65)

***

### reason?

> `readonly` `optional` **reason?**: `string`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:66](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L66)
