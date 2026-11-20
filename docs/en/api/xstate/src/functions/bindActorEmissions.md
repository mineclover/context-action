[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src](../README.md) / bindActorEmissions

# Function: bindActorEmissions()

## Call Signature

> **bindActorEmissions**\<`TActions`, `TResultMap`, `TEmitted`\>(`actor`, `target`, `emissions`, `options?`): () => `void`

Defined in: [packages/xstate/src/pipeline-binding.ts:389](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L389)

Routes outbound XState v5/v6 `emit()` events (`actor.on(type, handler)`) directly into
a Context-Action `ActionRegister` or `SyncActionPipeline`.

### Type Parameters

#### TActions

`TActions` *extends* `object`

#### TResultMap

`TResultMap` *extends* `Partial`\<`Record`\<`Extract`\<keyof `TActions`, `string`\>, `unknown`\>\> = `Partial`\<`Record`\<`Extract`\<keyof `TActions`, `string`\>, `unknown`\>\>

#### TEmitted

`TEmitted` *extends* [`StatechartEventLike`](../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../interfaces/StatechartEventLike.md)

### Parameters

#### actor

`Pick`\<[`ActorRefLike`](../interfaces/ActorRefLike.md)\<[`StatechartEventLike`](../interfaces/StatechartEventLike.md), [`StatechartSnapshotPort`](../interfaces/StatechartSnapshotPort.md)\>, `"on"`\>

#### target

`ActionRegister`\<`TActions`, `TResultMap`\>

#### emissions

[`ActorEmissionMap`](../type-aliases/ActorEmissionMap.md)\<`TActions`, `TEmitted`\>

#### options?

[`BindActorEmissionsOptions`](../interfaces/BindActorEmissionsOptions.md)

### Returns

() => `void`

## Call Signature

> **bindActorEmissions**\<`TActions`, `TEmitted`\>(`actor`, `target`, `emissions`, `options?`): () => `void`

Defined in: [packages/xstate/src/pipeline-binding.ts:399](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L399)

Routes outbound XState v5/v6 `emit()` events (`actor.on(type, handler)`) directly into
a Context-Action `ActionRegister` or `SyncActionPipeline`.

### Type Parameters

#### TActions

`TActions` *extends* `Record`\<`string`, `unknown`\>

#### TEmitted

`TEmitted` *extends* [`StatechartEventLike`](../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../interfaces/StatechartEventLike.md)

### Parameters

#### actor

`Pick`\<[`ActorRefLike`](../interfaces/ActorRefLike.md)\<[`StatechartEventLike`](../interfaces/StatechartEventLike.md), [`StatechartSnapshotPort`](../interfaces/StatechartSnapshotPort.md)\>, `"on"`\>

#### target

`SyncActionPipeline`&lt;`TActions`&gt;

#### emissions

[`ActorEmissionMap`](../type-aliases/ActorEmissionMap.md)\<`TActions`, `TEmitted`\>

#### options?

[`BindActorEmissionsOptions`](../interfaces/BindActorEmissionsOptions.md)

### Returns

() => `void`
