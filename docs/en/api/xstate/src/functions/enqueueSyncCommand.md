[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/xstate/src](../README.md) / enqueueSyncCommand

# Function: enqueueSyncCommand()

> **enqueueSyncCommand**\<`TPayload`, `TResult`\>(`enq`, `command`, ...`args`): `void`

Defined in: [packages/xstate/src/pipeline-binding.ts:689](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L689)

Schedules a Context-Action command function safely inside XState v6's `(args, enq)` queue.

## Type Parameters

### TPayload

`TPayload` = `void`

### TResult

`TResult` = `unknown`

## Parameters

### enq

(`effect`) => `void`

### command

(`payload`) => `TResult`

### args

...[`EmitArgs`](../type-aliases/EmitArgs.md)&lt;`TPayload`&gt;

## Returns

`void`
