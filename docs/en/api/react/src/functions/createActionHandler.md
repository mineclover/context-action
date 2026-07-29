[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createActionHandler

# Function: createActionHandler()

> **createActionHandler**\<`T`, `K`\>(`registry`, `action`, `handler`, `config?`): `object`

Defined in: [packages/react/src/actions/react-helpers.ts:15](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/react-helpers.ts#L15)

## Type Parameters

### Generic type T

`T` *extends* `object`

### Generic type K

`K` *extends* `string` \| `number` \| `symbol`

## Parameters

### registry

`ActionRegister`&lt;`T`&gt;

### action

Type parameter **K**

### handler

`ActionHandler`\<`T`\[`K`\]\>

### config?

`HandlerConfig`\<`T`\[`K`\]\>

## Returns

`object`

### register

> **register**: () => `UnregisterFunction`

#### Returns

Type parameter **UnregisterFunction**

### unregister

> **unregister**: () => `void`

#### Returns

`void`

### registerWithCleanup

> **registerWithCleanup**: () => () => `void`

#### Returns

() => `void`

### config

> **config**: `Required`\<`HandlerConfig`\<`T`\[`K`\]\>\>
