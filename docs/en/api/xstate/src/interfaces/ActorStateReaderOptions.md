[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src](../README.md) / ActorStateReaderOptions

# Interface: ActorStateReaderOptions\<TSnapshot, TSelected\>

Defined in: [packages/xstate/src/actor-state-reader.ts:9](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/actor-state-reader.ts#L9)

## Type Parameters

### TSnapshot

`TSnapshot` *extends* [`StatechartSnapshotPort`](StatechartSnapshotPort.md)

### TSelected

`TSelected` = `TSnapshot`

## Properties

### select?

> `readonly` `optional` **select?**: (`snapshot`) => `TSelected`

Defined in: [packages/xstate/src/actor-state-reader.ts:14](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/actor-state-reader.ts#L14)

Optional projection selector to avoid broadcasting unrelated context changes.

#### Parameters

##### snapshot

Type parameter **TSnapshot**

#### Returns

Type parameter **TSelected**

***

### equals?

> `readonly` `optional` **equals?**: (`previous`, `next`) => `boolean`

Defined in: [packages/xstate/src/actor-state-reader.ts:16](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/actor-state-reader.ts#L16)

Equality comparator for projected values. Defaults to `Object.is`.

#### Parameters

##### previous

Type parameter **TSelected**

##### next

Type parameter **TSelected**

#### Returns

`boolean`

***

### now?

> `readonly` `optional` **now?**: () => `number`

Defined in: [packages/xstate/src/actor-state-reader.ts:18](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/actor-state-reader.ts#L18)

Optional deterministic clock for `ReadonlyStateSnapshot.lastUpdate`.

#### Returns

`number`
