[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / SideEffectRecoveryResult

# Interface: SideEffectRecoveryResult\<TResult, TDiagnostic\>

Defined in: packages/tool-durable-operations/src/side-effect.ts:83

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Properties

### state

> `readonly` **state**: [`SideEffectRecoveryState`](../type-aliases/SideEffectRecoveryState.md)

Defined in: packages/tool-durable-operations/src/side-effect.ts:84

***

### operation?

> `readonly` `optional` **operation?**: [`DurableOperationRecord`](DurableOperationRecord.md)\<[`SideEffectRecordPayload`](SideEffectRecordPayload.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: packages/tool-durable-operations/src/side-effect.ts:85

***

### result?

> `readonly` `optional` **result?**: `TResult`

Defined in: packages/tool-durable-operations/src/side-effect.ts:88

***

### diagnostic?

> `readonly` `optional` **diagnostic?**: `TDiagnostic`

Defined in: packages/tool-durable-operations/src/side-effect.ts:89

***

### reason?

> `readonly` `optional` **reason?**: `string`

Defined in: packages/tool-durable-operations/src/side-effect.ts:90
