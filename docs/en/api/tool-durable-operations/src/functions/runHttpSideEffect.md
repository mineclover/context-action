[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / runHttpSideEffect

# Function: runHttpSideEffect()

> **runHttpSideEffect**\<`TResult`, `TDiagnostic`\>(`options`): `Promise`\<[`SideEffectRunResult`](../interfaces/SideEffectRunResult.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: [packages/tool-durable-operations/src/http-side-effect.ts:53](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/http-side-effect.ts#L53)

Execute one HTTP mutation through an existing durable side-effect runner.

The helper deliberately does not infer `failed` from a non-2xx response and
does not retry. A request error defaults to the runner's `unknown` outcome;
callers may classify a provider-confirmed pre-send rejection with `onError`.
The same key/fingerprint is replayed by the underlying runner and an abort
that wins while the request is in flight is retained as `unknown`.

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Parameters

### options

[`HttpSideEffectRunOptions`](../interfaces/HttpSideEffectRunOptions.md)\<`TResult`, `TDiagnostic`\>

## Returns

`Promise`\<[`SideEffectRunResult`](../interfaces/SideEffectRunResult.md)\<`TResult`, `TDiagnostic`\>\>
