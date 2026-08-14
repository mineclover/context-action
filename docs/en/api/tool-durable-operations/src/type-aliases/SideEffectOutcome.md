[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / SideEffectOutcome

# Type Alias: SideEffectOutcome\<TResult, TDiagnostic\>

> **SideEffectOutcome**\<`TResult`, `TDiagnostic`\> = \{ `state`: `"completed"`; `result`: `TResult`; `reason?`: `string`; \} \| \{ `state`: `"failed"`; `reason`: `string`; `result?`: `TResult`; `diagnostic?`: `TDiagnostic`; \} \| \{ `state`: `"unknown"`; `reason`: `string`; `diagnostic?`: `TDiagnostic`; \}

Defined in: [packages/tool-durable-operations/src/side-effect.ts:18](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L18)

Result of an external side-effect attempt.

`unknown` is intentionally explicit. A network error after a request was
sent, a queue acknowledgement lost after enqueue, or a provider timeout
must not be converted into a retryable failure by guessing that nothing
happened.

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`
