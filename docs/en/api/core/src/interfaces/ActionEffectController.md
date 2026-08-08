[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionEffectController

# Interface: ActionEffectController\<T\>

Defined in: [packages/core/src/types.ts:361](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L361)

Controller available to observer-only effect handlers.

## Extended by

- [`ActionGuardController`](ActionGuardController.md)
- [`ActionResultController`](ActionResultController.md)

## Type Parameters

### Generic type T

`T` = `unknown`

## Methods

### getPayload()

> **getPayload**(): `T`

Defined in: [packages/core/src/types.ts:363](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L363)

#### Returns

Type parameter **T**

## Properties

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/core/src/types.ts:362](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L362)
