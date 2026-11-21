[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src/effect](../README.md) / RegisterEffectHandlerOptions

# Interface: RegisterEffectHandlerOptions\<TEffect\>

Defined in: [packages/xstate/src/effect.ts:81](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L81)

## Type Parameters

### TEffect

`TEffect` = `unknown`

## Properties

### runner

> `readonly` **runner**: [`EffectRunnerPort`](../type-aliases/EffectRunnerPort.md)&lt;`TEffect`&gt;

Defined in: [packages/xstate/src/effect.ts:82](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L82)

***

### priority?

> `readonly` `optional` **priority?**: `number`

Defined in: [packages/xstate/src/effect.ts:83](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L83)

***

### id?

> `readonly` `optional` **id?**: `string`

Defined in: [packages/xstate/src/effect.ts:84](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L84)

***

### once?

> `readonly` `optional` **once?**: `boolean`

Defined in: [packages/xstate/src/effect.ts:85](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L85)

***

### blocking?

> `readonly` `optional` **blocking?**: `boolean`

Defined in: [packages/xstate/src/effect.ts:86](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L86)

***

### abortOnError?

> `readonly` `optional` **abortOnError?**: `boolean`

Defined in: [packages/xstate/src/effect.ts:87](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L87)

***

### mapError?

> `readonly` `optional` **mapError?**: (`error`) => `string`

Defined in: [packages/xstate/src/effect.ts:88](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L88)

#### Parameters

##### error

`unknown`

#### Returns

`string`
