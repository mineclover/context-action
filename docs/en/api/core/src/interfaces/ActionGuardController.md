[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/core/src](../README.md) / ActionGuardController

# Interface: ActionGuardController\<T\>

Defined in: [packages/core/src/types.ts:223](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L223)

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

Defined in: [packages/core/src/types.ts:212](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L212)

#### Returns

Type parameter **T**

#### Inherited from

[`ActionEffectController`](ActionEffectController.md).[`getPayload`](ActionEffectController.md#getpayload)

***

### abort()

> **abort**(`reason?`): `void`

Defined in: [packages/core/src/types.ts:224](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L224)

#### Parameters

##### reason?

`string`

#### Returns

`void`

***

### modifyPayload()

> **modifyPayload**(`modifier`): `void`

Defined in: [packages/core/src/types.ts:225](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L225)

#### Parameters

##### modifier

(`payload`) => `T`

#### Returns

`void`

## Properties

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/core/src/types.ts:211](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L211)

#### Inherited from

[`ActionEffectController`](ActionEffectController.md).[`signal`](ActionEffectController.md#signal)
