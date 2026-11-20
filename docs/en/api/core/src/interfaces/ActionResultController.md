[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/core/src](../README.md) / ActionResultController

# Interface: ActionResultController\<T, R\>

Defined in: [packages/core/src/types.ts:230](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L230)

Controller for a result-producing handler. Concurrent result handlers do
not receive payload mutation or priority-jump capabilities.

## Extends

- [`ActionEffectController`](ActionEffectController.md)&lt;`T`&gt;

## Type Parameters

### Generic type T

`T` = `unknown`

### Generic type R

`R` = `void`

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

Defined in: [packages/core/src/types.ts:232](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L232)

#### Parameters

##### reason?

`string`

#### Returns

`void`

***

### return()

> **return**(`result`): `R`

Defined in: [packages/core/src/types.ts:233](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L233)

#### Parameters

##### result

Type parameter **R**

#### Returns

Type parameter **R**

***

### setResult()

> **setResult**(`result`): `void`

Defined in: [packages/core/src/types.ts:234](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L234)

#### Parameters

##### result

Type parameter **R**

#### Returns

`void`

***

### getResults()

> **getResults**(): readonly `R`[]

Defined in: [packages/core/src/types.ts:235](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L235)

#### Returns

readonly `R`[]

***

### mergeResult()

> **mergeResult**(`merger`): `void`

Defined in: [packages/core/src/types.ts:236](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L236)

#### Parameters

##### merger

(`previousResults`, `currentResult`) => `R`

#### Returns

`void`

## Properties

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/core/src/types.ts:211](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L211)

#### Inherited from

[`ActionEffectController`](ActionEffectController.md).[`signal`](ActionEffectController.md#signal)
