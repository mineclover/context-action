[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / createDurableSideEffectRunner

# Function: createDurableSideEffectRunner()

> **createDurableSideEffectRunner**\<`TResult`, `TDiagnostic`\>(`options`): [`DurableSideEffectRunner`](../interfaces/DurableSideEffectRunner.md)\<`TResult`, `TDiagnostic`\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:272](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/side-effect.ts#L272)

Execute an external side effect behind an existing durable operation store.

This helper owns only claim/execute/transition orchestration. It does not
persist a second state machine and it never retries an ambiguous effect.

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Parameters

### options

[`DurableSideEffectRunnerOptions`](../interfaces/DurableSideEffectRunnerOptions.md)\<`TResult`, `TDiagnostic`\>

## Returns

[`DurableSideEffectRunner`](../interfaces/DurableSideEffectRunner.md)\<`TResult`, `TDiagnostic`\>
