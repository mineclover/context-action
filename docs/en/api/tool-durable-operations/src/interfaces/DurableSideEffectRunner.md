[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableSideEffectRunner

# Interface: DurableSideEffectRunner\<TResult, TDiagnostic\>

Defined in: packages/tool-durable-operations/src/side-effect.ts:144

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Methods

### run()

> **run**(`options`): `Promise`\<[`SideEffectRunResult`](SideEffectRunResult.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: packages/tool-durable-operations/src/side-effect.ts:145

#### Parameters

##### options

[`SideEffectRunOptions`](SideEffectRunOptions.md)\<`TResult`, `TDiagnostic`\>

#### Returns

`Promise`\<[`SideEffectRunResult`](SideEffectRunResult.md)\<`TResult`, `TDiagnostic`\>\>

***

### recover()

> **recover**(`key`, `resolver`, `options?`): `Promise`\<[`SideEffectRecoveryResult`](SideEffectRecoveryResult.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: packages/tool-durable-operations/src/side-effect.ts:148

#### Parameters

##### key

`string`

##### resolver

[`SideEffectResolver`](../type-aliases/SideEffectResolver.md)\<`TResult`, `TDiagnostic`\>

##### options?

[`SideEffectRecoveryOptions`](SideEffectRecoveryOptions.md)

#### Returns

`Promise`\<[`SideEffectRecoveryResult`](SideEffectRecoveryResult.md)\<`TResult`, `TDiagnostic`\>\>

***

### get()

> **get**(`key`): `Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)\<[`SideEffectRecordPayload`](SideEffectRecordPayload.md)\<`TResult`, `TDiagnostic`\>\> \| `undefined`\>

Defined in: packages/tool-durable-operations/src/side-effect.ts:153

#### Parameters

##### key

`string`

#### Returns

`Promise`\<[`DurableOperationRecord`](DurableOperationRecord.md)\<[`SideEffectRecordPayload`](SideEffectRecordPayload.md)\<`TResult`, `TDiagnostic`\>\> \| `undefined`\>
