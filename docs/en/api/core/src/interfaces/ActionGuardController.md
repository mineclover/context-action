[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionGuardController

# Interface: ActionGuardController\<T\>

Defined in: [packages/core/src/types.ts:368](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L368)

Controller available to preflight guards. Guards may reject or normalize input,
but cannot publish a result or terminate a result pipeline.

## Extends

- [`ActionEffectController`](ActionEffectController.md)&lt;`T`&gt;

## Type Parameters

### Generic type T

`T` = `unknown`

## Methods

### getPayload()

> **getPayload**(): `T`

Defined in: [packages/core/src/types.ts:363](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L363)

#### Returns

Type parameter **T**

#### Inherited from

[`ActionEffectController`](ActionEffectController.md).[`getPayload`](ActionEffectController.md#getpayload)

***

### abort()

> **abort**(`reason?`): `void`

Defined in: [packages/core/src/types.ts:369](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L369)

#### Parameters

##### reason?

`string`

#### Returns

`void`

***

### modifyPayload()

> **modifyPayload**(`modifier`): `void`

Defined in: [packages/core/src/types.ts:370](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L370)

#### Parameters

##### modifier

(`payload`) => `T`

#### Returns

`void`

## Properties

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/core/src/types.ts:362](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L362)

#### Inherited from

[`ActionEffectController`](ActionEffectController.md).[`signal`](ActionEffectController.md#signal)
