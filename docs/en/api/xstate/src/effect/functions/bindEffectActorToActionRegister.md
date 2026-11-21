[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src/effect](../README.md) / bindEffectActorToActionRegister

# Function: bindEffectActorToActionRegister()

> **bindEffectActorToActionRegister**\<`TActions`, `TResultMap`, `TEvent`, `TSnapshot`, `TEmitted`\>(`register`, `actor`, `options`): [`BoundEffectActorHandle`](../type-aliases/BoundEffectActorHandle.md)\<`TActions`, `TSnapshot`\>

Defined in: [packages/xstate/src/effect.ts:451](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L451)

Mounts an `@xstate/effect` `ActorRefLike` onto an `@context-action/core` `ActionRegister`
and binds its lifecycle to an Effect `Scope` so `dispose()` unmounts handlers and
closes/interrupts the underlying Effect scope deterministically.

## Type Parameters

### TActions

`TActions` *extends* `object`

### TResultMap

`TResultMap` *extends* `Partial`\<`Record`\<`Extract`\<keyof `TActions`, `string`\>, `unknown`\>\> = `Partial`\<`Record`\<`Extract`\<keyof `TActions`, `string`\>, `unknown`\>\>

### TEvent

`TEvent` *extends* [`StatechartEventLike`](../../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../../interfaces/StatechartEventLike.md)

### TSnapshot

`TSnapshot` *extends* [`StatechartSnapshotPort`](../../interfaces/StatechartSnapshotPort.md)\<`unknown`, `unknown`\> = [`StatechartSnapshotPort`](../../interfaces/StatechartSnapshotPort.md)\<`unknown`, `unknown`\>

### TEmitted

`TEmitted` *extends* [`StatechartEventLike`](../../interfaces/StatechartEventLike.md) = [`StatechartEventLike`](../../interfaces/StatechartEventLike.md)

## Parameters

### register

`ActionRegister`\<`TActions`, `TResultMap`\>

### actor

[`ActorRefLike`](../../interfaces/ActorRefLike.md)\<`TEvent`, `TSnapshot`\>

### options

[`BindEffectActorOptions`](../interfaces/BindEffectActorOptions.md)\<`TActions`, `TEvent`, `TSnapshot`, `TEmitted`\>

## Returns

[`BoundEffectActorHandle`](../type-aliases/BoundEffectActorHandle.md)\<`TActions`, `TSnapshot`\>
