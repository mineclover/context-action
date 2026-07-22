[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / SideEffectResolver

# Type Alias: SideEffectResolver\<TResult, TDiagnostic\>

> **SideEffectResolver**\<`TResult`, `TDiagnostic`\> = (`context`) => `Promise`\<[`SideEffectRecoveryResolution`](SideEffectRecoveryResolution.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: packages/tool-durable-operations/src/side-effect.ts:108

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
