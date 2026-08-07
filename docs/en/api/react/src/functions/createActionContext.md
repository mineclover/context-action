[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createActionContext

# Function: createActionContext()

> **createActionContext**\<`T`, `TResultMap`\>(`contextName`, `config?`): [`ActionContextReturn`](../interfaces/ActionContextReturn.md)\<`T`, `TResultMap`\>

Defined in: [packages/react/src/actions/ActionContext.tsx:179](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.tsx#L179)

Enhanced action context factory with automatic type inference

## Type Parameters

### Generic type T

`T` *extends* `object`

Action payload map type for complete type safety

### TResultMap

`TResultMap` *extends* `Partial`\<`Record`\<keyof `T`, `unknown`\>\> = \{ \}

## Parameters

### contextName

`string`

Stable name used to identify this action context

### config?

[`ActionContextConfig`](../interfaces/ActionContextConfig.md)

Optional configuration for the ActionRegister

## Returns

[`ActionContextReturn`](../interfaces/ActionContextReturn.md)\<`T`, `TResultMap`\>

Object containing Provider, hooks, and utility functions

## See

 - https://mineclover.github.io/context-action/en/guide/patterns/action/
 - https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
 - https://mineclover.github.io/context-action/en/guide/patterns/action/register-delegation
