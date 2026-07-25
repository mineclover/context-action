[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / DurableSideEffectRunnerOptions

# Interface: DurableSideEffectRunnerOptions\<TResult, TDiagnostic\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:112](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L112)

## Type Parameters

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Properties

### store

> `readonly` **store**: [`DurableOperationStore`](DurableOperationStore.md)\<[`SideEffectRecordPayload`](SideEffectRecordPayload.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: [packages/tool-durable-operations/src/side-effect.ts:114](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L114)

Existing durable store; the runner does not create a second state machine.

***

### ownerId

> `readonly` **ownerId**: `string`

Defined in: [packages/tool-durable-operations/src/side-effect.ts:118](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/side-effect.ts#L118)

Stable owner identity for one worker/tab/process lifetime.
