[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableSideEffectRunnerOptions

# Interface: DurableSideEffectRunnerOptions\<TResult, TDiagnostic\>

Defined in: packages/tool-durable-operations/src/side-effect.ts:112

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Properties

### store

> `readonly` **store**: [`DurableOperationStore`](DurableOperationStore.md)\<[`SideEffectRecordPayload`](SideEffectRecordPayload.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: packages/tool-durable-operations/src/side-effect.ts:114

Existing durable store; the runner does not create a second state machine.

***

### ownerId

> `readonly` **ownerId**: `string`

Defined in: packages/tool-durable-operations/src/side-effect.ts:118

Stable owner identity for one worker/tab/process lifetime.
