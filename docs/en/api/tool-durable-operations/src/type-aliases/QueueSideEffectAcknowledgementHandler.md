[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / QueueSideEffectAcknowledgementHandler

# Type Alias: QueueSideEffectAcknowledgementHandler\<TAcknowledgement, TResult, TDiagnostic\>

> **QueueSideEffectAcknowledgementHandler**\<`TAcknowledgement`, `TResult`, `TDiagnostic`\> = (`acknowledgement`, `context`) => [`SideEffectOutcome`](SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\> \| `Promise`\<[`SideEffectOutcome`](SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: [packages/tool-durable-operations/src/queue-side-effect.ts:16](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/queue-side-effect.ts#L16)

Provider-owned acknowledgement classifier for a queue publish.

## Type Parameters

### TAcknowledgement

Type parameter **TAcknowledgement**

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Parameters

### acknowledgement

Type parameter **TAcknowledgement**

### context

[`SideEffectExecutionContext`](../interfaces/SideEffectExecutionContext.md)

## Returns

[`SideEffectOutcome`](SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\> \| `Promise`\<[`SideEffectOutcome`](SideEffectOutcome.md)\<`TResult`, `TDiagnostic`\>\>
