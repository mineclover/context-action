[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createActionContext

# Function: createActionContext()

> **createActionContext**&lt;`T`&gt;(`contextName`, `config?`): [`ActionContextReturn`](../interfaces/ActionContextReturn.md)&lt;`T`&gt;

Defined in: [packages/react/src/actions/ActionContext.tsx:174](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.tsx#L174)

Enhanced action context factory with automatic type inference

## Type Parameters

### Generic type T

`T` *extends* `object`

Action payload map type for complete type safety

## Parameters

### contextName

`string`

Stable name used to identify this action context

### config?

[`ActionContextConfig`](../interfaces/ActionContextConfig.md)

Optional configuration for the ActionRegister

## Returns

[`ActionContextReturn`](../interfaces/ActionContextReturn.md)&lt;`T`&gt;

Object containing Provider, hooks, and utility functions

## See

 - https://mineclover.github.io/context-action/en/guide/patterns/action/
 - https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
 - https://mineclover.github.io/context-action/en/guide/patterns/action/register-delegation
