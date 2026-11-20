[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src](../README.md) / waitForActorSnapshot

# Function: waitForActorSnapshot()

> **waitForActorSnapshot**&lt;`TSnapshot`&gt;(`actor`, `predicate`, `options?`): `Promise`&lt;`TSnapshot`&gt;

Defined in: [packages/xstate/src/pipeline-binding.ts:162](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L162)

Awaits an `ActorRefLike` snapshot satisfying `predicate`.
Supports a 0ms synchronous fast-path if the current snapshot already matches,
plus cooperative cancellation via `AbortSignal` (`controller.signal`) and `timeoutMs`.

## Type Parameters

### TSnapshot

`TSnapshot` *extends* [`StatechartSnapshotPort`](../interfaces/StatechartSnapshotPort.md)\<`unknown`, `unknown`\>

## Parameters

### actor

`Pick`\<[`ActorRefLike`](../interfaces/ActorRefLike.md)\<`never`, `TSnapshot`\>, `"getSnapshot"` \| `"subscribe"`\>

### predicate

(`snapshot`) => `boolean`

### options?

[`WaitForActorOptions`](../interfaces/WaitForActorOptions.md) = `{}`

## Returns

`Promise`&lt;`TSnapshot`&gt;
