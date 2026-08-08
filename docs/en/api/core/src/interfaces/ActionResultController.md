[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionResultController

# Interface: ActionResultController\<T, R\>

Defined in: [packages/core/src/types.ts:375](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L375)

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

Defined in: [packages/core/src/types.ts:363](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L363)

#### Returns

Type parameter **T**

#### Inherited from

[`ActionEffectController`](ActionEffectController.md).[`getPayload`](ActionEffectController.md#getpayload)

***

### abort()

> **abort**(`reason?`): `void`

Defined in: [packages/core/src/types.ts:377](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L377)

#### Parameters

##### reason?

`string`

#### Returns

`void`

***

### return()

> **return**(`result`): `R`

Defined in: [packages/core/src/types.ts:378](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L378)

#### Parameters

##### result

Type parameter **R**

#### Returns

Type parameter **R**

***

### setResult()

> **setResult**(`result`): `void`

Defined in: [packages/core/src/types.ts:379](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L379)

#### Parameters

##### result

Type parameter **R**

#### Returns

`void`

***

### getResults()

> **getResults**(): readonly `R`[]

Defined in: [packages/core/src/types.ts:380](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L380)

#### Returns

readonly `R`[]

***

### mergeResult()

> **mergeResult**(`merger`): `void`

Defined in: [packages/core/src/types.ts:381](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L381)

#### Parameters

##### merger

(`previousResults`, `currentResult`) => `R`

#### Returns

`void`

## Properties

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/core/src/types.ts:362](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L362)

#### Inherited from

[`ActionEffectController`](ActionEffectController.md).[`signal`](ActionEffectController.md#signal)
