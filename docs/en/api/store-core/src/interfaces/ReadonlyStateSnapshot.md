[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/store-core/src](../README.md) / ReadonlyStateSnapshot

# Interface: ReadonlyStateSnapshot\<T\>

Defined in: [packages/store-core/src/contracts.ts:32](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L32)

State-owning backends must publish a monotonically increasing version.

## Extends

- [`StateSnapshot`](StateSnapshot.md)&lt;`T`&gt;

## Type Parameters

### Generic type T

Type parameter **T**

## Properties

### value

> `readonly` **value**: `T`

Defined in: [packages/store-core/src/contracts.ts:25](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L25)

#### Inherited from

[`StateSnapshot`](StateSnapshot.md).[`value`](StateSnapshot.md#value)

***

### name

> `readonly` **name**: `string`

Defined in: [packages/store-core/src/contracts.ts:26](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L26)

#### Inherited from

[`StateSnapshot`](StateSnapshot.md).[`name`](StateSnapshot.md#name)

***

### lastUpdate

> `readonly` **lastUpdate**: `number`

Defined in: [packages/store-core/src/contracts.ts:28](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L28)

#### Inherited from

[`StateSnapshot`](StateSnapshot.md).[`lastUpdate`](StateSnapshot.md#lastupdate)

***

### version

> `readonly` **version**: `number`

Defined in: [packages/store-core/src/contracts.ts:33](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L33)

#### Overrides

[`StateSnapshot`](StateSnapshot.md).[`version`](StateSnapshot.md#version)
