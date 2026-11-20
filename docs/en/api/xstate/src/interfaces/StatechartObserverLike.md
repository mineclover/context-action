[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/xstate/src](../README.md) / StatechartObserverLike

# Interface: StatechartObserverLike\<TSnapshot\>

Defined in: [packages/xstate/src/contracts.ts:20](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L20)

## Type Parameters

### TSnapshot

`TSnapshot`

## Methods

### next()?

> `optional` **next**(`snapshot`): `void`

Defined in: [packages/xstate/src/contracts.ts:21](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L21)

#### Parameters

##### snapshot

`TSnapshot`

#### Returns

`void`

***

### error()?

> `optional` **error**(`error`): `void`

Defined in: [packages/xstate/src/contracts.ts:22](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L22)

#### Parameters

##### error

`unknown`

#### Returns

`void`

***

### complete()?

> `optional` **complete**(): `void`

Defined in: [packages/xstate/src/contracts.ts:23](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/contracts.ts#L23)

#### Returns

`void`
