[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/xstate/src](../README.md) / bindActor

# Function: bindActor()

## Call Signature

> **bindActor**\<`TActions`, `TResultMap`, `TEvent`, `TSnapshot`, `TEmitted`\>(`target`, `actor`, `options`): [`BoundActorHandle`](../type-aliases/BoundActorHandle.md)\<`TActions`, `TSnapshot`\>

Defined in: [packages/xstate/src/pipeline-binding.ts:639](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L639)

Standardized universal entrypoint mounting an `ActorRefLike` onto either an async
`ActionRegister` or a synchronous DOM `SyncActionPipeline`.

### Type Parameters

#### TActions

`TActions` *extends* `object`

#### TResultMap

`TResultMap` *extends* `Partial`\<`Record`\<`Extract`\<keyof `TActions`, `string`\>, `unknown`\>\> = `Partial`\<`Record`\<`Extract`\<keyof `TActions`, `string`\>, `unknown`\>\>

#### TEvent

`TEvent` *extends* [`StatechartEventLike`](../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../interfaces/StatechartEventLike.md)

#### TSnapshot

`TSnapshot` *extends* [`StatechartSnapshotPort`](../interfaces/StatechartSnapshotPort.md)\<`unknown`, `unknown`\> = [`StatechartSnapshotPort`](../interfaces/StatechartSnapshotPort.md)\<`unknown`, `unknown`\>

#### TEmitted

`TEmitted` *extends* [`StatechartEventLike`](../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../interfaces/StatechartEventLike.md)

### Parameters

#### target

`ActionRegister`\<`TActions`, `TResultMap`\>

#### actor

[`ActorRefLike`](../interfaces/ActorRefLike.md)\<`TEvent`, `TSnapshot`\>

#### options

[`BindActorActionRegisterOptions`](../interfaces/BindActorActionRegisterOptions.md)\<`TActions`, `TEvent`, `TSnapshot`, `TEmitted`\>

### Returns

[`BoundActorHandle`](../type-aliases/BoundActorHandle.md)\<`TActions`, `TSnapshot`\>

## Call Signature

> **bindActor**\<`TActions`, `TEvent`, `TSnapshot`, `TEmitted`\>(`target`, `actor`, `options`): [`BoundActorHandle`](../type-aliases/BoundActorHandle.md)\<`TActions`, `TSnapshot`\>

Defined in: [packages/xstate/src/pipeline-binding.ts:650](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L650)

Standardized universal entrypoint mounting an `ActorRefLike` onto either an async
`ActionRegister` or a synchronous DOM `SyncActionPipeline`.

### Type Parameters

#### TActions

`TActions` *extends* `Record`\<`string`, `unknown`\>

#### TEvent

`TEvent` *extends* [`StatechartEventLike`](../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../interfaces/StatechartEventLike.md)

#### TSnapshot

`TSnapshot` *extends* [`StatechartSnapshotPort`](../interfaces/StatechartSnapshotPort.md)\<`unknown`, `unknown`\> = [`StatechartSnapshotPort`](../interfaces/StatechartSnapshotPort.md)\<`unknown`, `unknown`\>

#### TEmitted

`TEmitted` *extends* [`StatechartEventLike`](../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../interfaces/StatechartEventLike.md)

### Parameters

#### target

`SyncActionPipeline`&lt;`TActions`&gt;

#### actor

[`ActorRefLike`](../interfaces/ActorRefLike.md)\<`TEvent`, `TSnapshot`\>

#### options

[`BindActorPipelineOptions`](../interfaces/BindActorPipelineOptions.md)\<`TActions`, `TEvent`, `TEmitted`\>

### Returns

[`BoundActorHandle`](../type-aliases/BoundActorHandle.md)\<`TActions`, `TSnapshot`\>
