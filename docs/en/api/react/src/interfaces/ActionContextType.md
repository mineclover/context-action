[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ActionContextType

# Interface: ActionContextType\<T, TResultMap\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:59](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L59)

Context type for ActionRegister with enhanced type safety and abort support

## Type Parameters

### Generic type T

`T` *extends* `ActionPayloadMap`

### TResultMap

`TResultMap` *extends* `ActionResultMap`&lt;`T`&gt; = \{ \}

## Properties

### actionRegisterRef

> **actionRegisterRef**: `RefObject`\<`ActionRegister`\<`T`, `TResultMap`\> \| `null`\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:63](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L63)

***

### dispatchLifecycle

> **dispatchLifecycle**: `ProviderDispatchLifecycle`

Defined in: [packages/react/src/actions/ActionContext.types.ts:64](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L64)
