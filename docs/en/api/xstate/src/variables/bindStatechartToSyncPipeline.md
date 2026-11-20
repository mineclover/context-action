[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src](../README.md) / bindStatechartToSyncPipeline

# Variable: bindStatechartToSyncPipeline

> `const` **bindStatechartToSyncPipeline**: \<`TActions`, `TEvent`, `TSnapshot`, `TEmitted`\>(`pipeline`, `actor`, `options`) => [`BoundActorHandle`](../type-aliases/BoundActorHandle.md)\<`TActions`, `TSnapshot`\> = `bindActorToSyncPipeline`

Defined in: [packages/xstate/src/pipeline-binding.ts:498](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L498)

Compatibility alias preserving earlier draft terminology.

Mounts an XState v5/v6 `ActorRefLike` onto a synchronous `SyncActionPipeline`
(`@context-action/core/element`) for 0ms DOM interaction gating and dispatch.

## Type Parameters

### TActions

`TActions` *extends* `Record`\<`string`, `unknown`\>

### TEvent

`TEvent` *extends* [`StatechartEventLike`](../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../interfaces/StatechartEventLike.md)

### TSnapshot

`TSnapshot` *extends* [`StatechartSnapshotPort`](../interfaces/StatechartSnapshotPort.md)\<`unknown`, `unknown`\> = [`StatechartSnapshotPort`](../interfaces/StatechartSnapshotPort.md)\<`unknown`, `unknown`\>

### TEmitted

`TEmitted` *extends* [`StatechartEventLike`](../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../interfaces/StatechartEventLike.md)

## Parameters

### pipeline

`SyncActionPipeline`&lt;`TActions`&gt;

### actor

[`ActorRefLike`](../interfaces/ActorRefLike.md)\<`TEvent`, `TSnapshot`\>

### options

[`BindActorPipelineOptions`](../interfaces/BindActorPipelineOptions.md)\<`TActions`, `TEvent`, `TEmitted`\>

## Returns

[`BoundActorHandle`](../type-aliases/BoundActorHandle.md)\<`TActions`, `TSnapshot`\>
