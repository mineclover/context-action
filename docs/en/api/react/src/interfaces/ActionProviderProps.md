[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / ActionProviderProps

# Interface: ActionProviderProps\<T, TResultMap\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:82](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L82)

Props accepted by the Provider returned from createActionContext().

## Type Parameters

### Generic type T

`T` *extends* `ActionPayloadMap`

### TResultMap

`TResultMap` *extends* `ActionResultMap`&lt;`T`&gt; = \{ \}

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/react/src/actions/ActionContext.types.ts:86](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L86)

***

### register?

> `optional` **register?**: `ActionRegister`\<`T`, `TResultMap`\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:92](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L92)

Optional externally constructed ActionRegister instance for headless-first
orchestration and dependency injection. When omitted, the Provider creates
and owns its own ActionRegister instance.

***

### ownership?

> `optional` **ownership?**: `"shared"` \| `"owned"`

Defined in: [packages/react/src/actions/ActionContext.types.ts:100](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L100)

Controls whether Provider unmount destroys an injected external `register`.
Defaults to `'shared'` when `register` is supplied (Provider unregisters
React-mounted handlers and aborts Provider dispatches without destroying
the external register). Set to `'owned'` to transfer destruction ownership
to the Provider. Ignored when `register` is omitted (always `'owned'`).
