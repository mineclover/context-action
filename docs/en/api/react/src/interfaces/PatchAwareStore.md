[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / PatchAwareStore

# Interface: PatchAwareStore\<T\>

Defined in: [packages/react/src/stores/hooks/useStorePath.ts:21](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useStorePath.ts#L21)

Store interface that supports patch-aware subscriptions
Compatible with Store, TimeTravelStore and structurally typed backend stores.
Patch payloads are observed, never mutated or copied by this boundary.

## Type Parameters

### Generic type T

Type parameter **T**

## Methods

### getValue()

> **getValue**(): `T`

Defined in: [packages/react/src/stores/hooks/useStorePath.ts:22](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useStorePath.ts#L22)

#### Returns

Type parameter **T**

***

### subscribe()

> **subscribe**(`listener`): `Unsubscribe`

Defined in: [packages/react/src/stores/hooks/useStorePath.ts:25](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useStorePath.ts#L25)

#### Parameters

##### listener

() => `void`

#### Returns

Type parameter **Unsubscribe**

***

### subscribeWithPatches()

> **subscribeWithPatches**(`listener`): `Unsubscribe`

Defined in: [packages/react/src/stores/hooks/useStorePath.ts:26](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useStorePath.ts#L26)

#### Parameters

##### listener

(`patches`) => `void`

#### Returns

Type parameter **Unsubscribe**

## Properties

### getSnapshot?

> `optional` **getSnapshot?**: () => [`Snapshot`](Snapshot.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/hooks/useStorePath.ts:24](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useStorePath.ts#L24)

Stable external-store snapshot; custom legacy stores may omit it.

#### Returns

[`Snapshot`](Snapshot.md)&lt;`T`&gt;
