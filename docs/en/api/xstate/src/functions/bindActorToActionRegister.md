[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src](../README.md) / bindActorToActionRegister

# Function: bindActorToActionRegister()

> **bindActorToActionRegister**\<`TActions`, `TResultMap`, `TEvent`, `TSnapshot`, `TEmitted`\>(`register`, `actor`, `options`): [`BoundActorHandle`](../type-aliases/BoundActorHandle.md)\<`TActions`, `TSnapshot`\>

Defined in: [packages/xstate/src/pipeline-binding.ts:505](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/pipeline-binding.ts#L505)

Mounts an XState v5/v6 or `@xstate/effect` `ActorRefLike` directly onto an
`@context-action/core` `ActionRegister` using Guard admission (`snapshot.can`)
and Result handler dispatch (`actor.send` + optional `waitForActorSnapshot`).

## Type Parameters

### TActions

`TActions` *extends* `object`

### TResultMap

`TResultMap` *extends* `Partial`\<`Record`\<`Extract`\<keyof `TActions`, `string`\>, `unknown`\>\> = `Partial`\<`Record`\<`Extract`\<keyof `TActions`, `string`\>, `unknown`\>\>

### TEvent

`TEvent` *extends* [`StatechartEventLike`](../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../interfaces/StatechartEventLike.md)

### TSnapshot

`TSnapshot` *extends* [`StatechartSnapshotPort`](../interfaces/StatechartSnapshotPort.md)\<`unknown`, `unknown`\> = [`StatechartSnapshotPort`](../interfaces/StatechartSnapshotPort.md)\<`unknown`, `unknown`\>

### TEmitted

`TEmitted` *extends* [`StatechartEventLike`](../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../interfaces/StatechartEventLike.md)

## Parameters

### register

`ActionRegister`\<`TActions`, `TResultMap`\>

### actor

[`ActorRefLike`](../interfaces/ActorRefLike.md)\<`TEvent`, `TSnapshot`\>

### options

[`BindActorActionRegisterOptions`](../interfaces/BindActorActionRegisterOptions.md)\<`TActions`, `TEvent`, `TSnapshot`, `TEmitted`\>

## Returns

[`BoundActorHandle`](../type-aliases/BoundActorHandle.md)\<`TActions`, `TSnapshot`\>
