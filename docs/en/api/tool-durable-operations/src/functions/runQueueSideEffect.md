[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / runQueueSideEffect

# Function: runQueueSideEffect()

> **runQueueSideEffect**\<`TMessage`, `TAcknowledgement`, `TResult`, `TDiagnostic`\>(`options`): `Promise`\<[`SideEffectRunResult`](../interfaces/SideEffectRunResult.md)\<`TResult`, `TDiagnostic`\>\>

Defined in: [packages/tool-durable-operations/src/queue-side-effect.ts:55](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/queue-side-effect.ts#L55)

Publish one queue message through an existing durable side-effect runner.

Queue acknowledgement semantics are provider-owned: an acknowledgement may
be authoritative `completed`, a confirmed pre-enqueue rejection `failed`,
or ambiguous `unknown`. This helper never retries or infers completion from
an SDK return shape; the runner owns claim, replay, unknown, and recovery.

## Type Parameters

### TMessage

Type parameter **TMessage**

### TAcknowledgement

Type parameter **TAcknowledgement**

### TResult

Type parameter **TResult**

### TDiagnostic

`TDiagnostic` = `unknown`

## Parameters

### options

[`QueueSideEffectRunOptions`](../interfaces/QueueSideEffectRunOptions.md)\<`TMessage`, `TAcknowledgement`, `TResult`, `TDiagnostic`\>

## Returns

`Promise`\<[`SideEffectRunResult`](../interfaces/SideEffectRunResult.md)\<`TResult`, `TDiagnostic`\>\>
