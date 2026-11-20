[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/store-core/src](../README.md) / StateSnapshot

# Interface: StateSnapshot\<T\>

Defined in: [packages/store-core/src/contracts.ts:24](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L24)

Observation shape for legacy Stores that do not publish version tokens.

## Extended by

- [`ReadonlyStateSnapshot`](ReadonlyStateSnapshot.md)

## Type Parameters

### Generic type T

Type parameter **T**

## Properties

### value

> `readonly` **value**: `T`

Defined in: [packages/store-core/src/contracts.ts:25](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L25)

***

### name

> `readonly` **name**: `string`

Defined in: [packages/store-core/src/contracts.ts:26](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L26)

***

### version?

> `readonly` `optional` **version?**: `number`

Defined in: [packages/store-core/src/contracts.ts:27](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L27)

***

### lastUpdate

> `readonly` **lastUpdate**: `number`

Defined in: [packages/store-core/src/contracts.ts:28](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L28)
