[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / HttpSideEffectResponseHandler

# Type Alias: HttpSideEffectResponseHandler\<TResult, TDiagnostic\>

> **HttpSideEffectResponseHandler**\<`TResult`, `TDiagnostic`\> = (`response`, `context`) => [`SideEffectOutcome`](SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\> \| `Promise`\<[`SideEffectOutcome`](SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: [packages/tool-durable-operations/src/http-side-effect.ts:18](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/http-side-effect.ts#L18)

The application-owned response classification for an HTTP mutation.

HTTP status alone is not a universal exactly-once signal: a provider may
return a 5xx after applying a mutation. The response handler must therefore
classify the provider's authoritative acknowledgement as `completed`, a
confirmed pre-effect rejection as `failed`, or an ambiguous response as
`unknown`.

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Parameters

### response

Type parameter **Response**

### context

[`SideEffectExecutionContext`](../interfaces/SideEffectExecutionContext.md)

## Returns

[`SideEffectOutcome`](SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\> \| `Promise`\<[`SideEffectOutcome`](SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\>\>
