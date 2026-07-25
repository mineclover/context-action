[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / SideEffectRecoveryResolution

# Type Alias: SideEffectRecoveryResolution\<TResult, TDiagnostic\>

> **SideEffectRecoveryResolution**\<`TResult`, `TDiagnostic`\> = \{ `state`: `"completed"`; `result`: `TResult`; `diagnostic?`: `TDiagnostic`; `reason?`: `string`; \} \| \{ `state`: `"failed"`; `reason`: `string`; `result?`: `TResult`; `diagnostic?`: `TDiagnostic`; \}

Defined in: [packages/tool-durable-operations/src/side-effect.ts:94](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L94)

Application-facing resolution returned by an unknown-outcome resolver.

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`
