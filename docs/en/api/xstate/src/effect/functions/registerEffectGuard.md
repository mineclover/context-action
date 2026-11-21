[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src/effect](../README.md) / registerEffectGuard

# Function: registerEffectGuard()

> **registerEffectGuard**\<`TActions`, `TResultMap`, `K`, `TEffect`\>(`register`, `action`, `buildEffect`, `options`): `UnregisterFunction`

Defined in: [packages/xstate/src/effect.ts:409](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L409)

Registers an Effect program as an `ActionRegister` admission guard (`registerGuard`).
Failures abort the dispatch; returning `{ modifyPayload }` transforms the action payload.

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

[`RegisterEffectGuardOptions`](../interfaces/RegisterEffectGuardOptions.md)&lt;`TEffect`&gt;

## Returns

`UnregisterFunction`
