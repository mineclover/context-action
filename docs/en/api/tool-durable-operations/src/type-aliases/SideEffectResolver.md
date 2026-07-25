[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / SideEffectResolver

# Type Alias: SideEffectResolver\<TResult, TDiagnostic\>

> **SideEffectResolver**\<`TResult`, `TDiagnostic`\> = (`context`) => `Promise`\<[`SideEffectRecoveryResolution`](SideEffectRecoveryResolution.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:108](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L108)

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Parameters

### context

[`SideEffectRecoveryContext`](../interfaces/SideEffectRecoveryContext.md)\<`TResult`, `TDiagnostic`\>

## Returns

`Promise`\<[`SideEffectRecoveryResolution`](SideEffectRecoveryResolution.md)\<`TResult`, `TDiagnostic`\>\>
