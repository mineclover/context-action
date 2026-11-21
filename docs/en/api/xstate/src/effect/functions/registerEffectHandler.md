[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src/effect](../README.md) / registerEffectHandler

# Function: registerEffectHandler()

> **registerEffectHandler**\<`TActions`, `TResultMap`, `K`, `TEffect`\>(`register`, `action`, `buildEffect`, `options`): `UnregisterFunction`

Defined in: [packages/xstate/src/effect.ts:364](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L364)

Registers an Effect program as an `ActionRegister` handler, forwarding `controller.signal`
into the Effect runner for Fiber interruption on timeout or abort.

## Type Parameters

### TActions

`TActions` *extends* `object`

### TResultMap

`TResultMap` *extends* `Partial`\<`Record`\<`Extract`\<keyof `TActions`, `string`\>, `unknown`\>\>

### Generic type K

`K` *extends* `string`

### TEffect

`TEffect` = `unknown`

## Parameters

### register

`ActionRegister`\<`TActions`, `TResultMap`\>

### action

Type parameter **K**

### buildEffect

(`payload`, `controller`) => `TEffect`

### options

[`RegisterEffectHandlerOptions`](../interfaces/RegisterEffectHandlerOptions.md)&lt;`TEffect`&gt;

## Returns

`UnregisterFunction`
