[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / SideEffectRecoveryContext

# Interface: SideEffectRecoveryContext\<TResult, TDiagnostic\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:77](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L77)

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Properties

### operation

> `readonly` **operation**: [`DurableOperationRecord`](DurableOperationRecord.md)\<[`SideEffectRecordPayload`](SideEffectRecordPayload.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:78](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L78)

***

### result?

> `readonly` `optional` **result?**: `TResult`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:81](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L81)

***

### diagnostic?

> `readonly` `optional` **diagnostic?**: `TDiagnostic`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:82](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L82)
