[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/xstate/src](../README.md) / BoundActorHandle

# Type Alias: BoundActorHandle\<TActions, TSnapshot\>

> **BoundActorHandle**\<`TActions`, `TSnapshot`\> = () => `void` & [`BoundActorController`](../interfaces/BoundActorController.md)\<`TActions`, `TSnapshot`\> & `object`

Defined in: [packages/xstate/src/contracts.ts:95](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L95)

Uniform synchronous binding handle returned by `bindActor`, `bindActorToSyncPipeline`,
and `bindActorToActionRegister`. Callable as `handle()` for `UnregisterFunction` compatibility.

## Type Declaration

### dispose()

> **dispose**(): `void`

#### Returns

`void`

## Type Parameters

### TActions

`TActions` *extends* `ActionPayloadMap`

### TSnapshot

`TSnapshot` *extends* [`StatechartSnapshotPort`](../interfaces/StatechartSnapshotPort.md) = [`StatechartSnapshotPort`](../interfaces/StatechartSnapshotPort.md)
