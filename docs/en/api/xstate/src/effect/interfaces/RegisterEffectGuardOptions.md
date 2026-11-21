[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src/effect](../README.md) / RegisterEffectGuardOptions

# Interface: RegisterEffectGuardOptions\<TEffect\>

Defined in: [packages/xstate/src/effect.ts:91](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L91)

## Type Parameters

### TEffect

`TEffect` = `unknown`

## Properties

### runner

> `readonly` **runner**: [`EffectRunnerPort`](../type-aliases/EffectRunnerPort.md)&lt;`TEffect`&gt;

Defined in: [packages/xstate/src/effect.ts:92](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L92)

***

### priority?

> `readonly` `optional` **priority?**: `number`

Defined in: [packages/xstate/src/effect.ts:93](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L93)

***

### id?

> `readonly` `optional` **id?**: `string`

Defined in: [packages/xstate/src/effect.ts:94](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L94)

***

### once?

> `readonly` `optional` **once?**: `boolean`

Defined in: [packages/xstate/src/effect.ts:95](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L95)

***

### mapError?

> `readonly` `optional` **mapError?**: (`error`) => `string`

Defined in: [packages/xstate/src/effect.ts:96](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L96)

#### Parameters

##### error

`unknown`

#### Returns

`string`
