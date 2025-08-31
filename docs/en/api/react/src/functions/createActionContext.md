[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createActionContext

# Function: createActionContext()

## Call Signature

> **createActionContext**\<`T`\>(`contextName`, `config?`): [`ActionContextReturn`](../interfaces/ActionContextReturn.md)\<`T`\>

Defined in: [packages/react/src/actions/ActionContext.tsx:30](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/actions/ActionContext.tsx#L30)

Enhanced action context factory with automatic type inference

### Type Parameters

#### T

`T` *extends* `object`

Action payload map type for complete type safety

### Parameters

#### contextName

`string`

#### config?

[`ActionContextConfig`](../interfaces/ActionContextConfig.md)

Configuration options for the ActionRegister

### Returns

[`ActionContextReturn`](../interfaces/ActionContextReturn.md)\<`T`\>

Object containing Provider, hooks, and utility functions

### See

 - https://mineclover.github.io/context-action/en/guide/patterns/action/
 - https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
 - https://mineclover.github.io/context-action/en/guide/patterns/action/register-delegation

## Call Signature

> **createActionContext**\<`T`\>(`config`): [`ActionContextReturn`](../interfaces/ActionContextReturn.md)\<`T`\>

Defined in: [packages/react/src/actions/ActionContext.tsx:36](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/actions/ActionContext.tsx#L36)

Enhanced action context factory with automatic type inference

### Type Parameters

#### T

`T` *extends* `object`

Action payload map type for complete type safety

### Parameters

#### config

[`ActionContextConfig`](../interfaces/ActionContextConfig.md)

Configuration options for the ActionRegister

### Returns

[`ActionContextReturn`](../interfaces/ActionContextReturn.md)\<`T`\>

Object containing Provider, hooks, and utility functions

### See

 - https://mineclover.github.io/context-action/en/guide/patterns/action/
 - https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
 - https://mineclover.github.io/context-action/en/guide/patterns/action/register-delegation
