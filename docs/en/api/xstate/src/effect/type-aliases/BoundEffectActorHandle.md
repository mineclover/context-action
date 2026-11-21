[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src/effect](../README.md) / BoundEffectActorHandle

# Type Alias: BoundEffectActorHandle\<TActions, TSnapshot\>

> **BoundEffectActorHandle**\<`TActions`, `TSnapshot`\> = () => `void` & [`BoundActorController`](../../interfaces/BoundActorController.md)\<`TActions`, `TSnapshot`\> & `object`

Defined in: [packages/xstate/src/effect.ts:124](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L124)

## Type Declaration

### dispose()

> **dispose**(): `Promise`&lt;`void`&gt;

#### Returns

`Promise`&lt;`void`&gt;

## Type Parameters

### TActions

`TActions` *extends* `ActionPayloadMap`

### TSnapshot

`TSnapshot` *extends* [`StatechartSnapshotPort`](../../interfaces/StatechartSnapshotPort.md) = [`StatechartSnapshotPort`](../../interfaces/StatechartSnapshotPort.md)
