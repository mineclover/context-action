[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createActionContext

# Function: createActionContext()

## Call Signature

> **createActionContext**&lt;`T`&gt;(`contextName`, `config?`): [`ActionContextReturn`](../interfaces/ActionContextReturn.md)&lt;`T`&gt;

Defined in: [packages/react/src/actions/ActionContext.tsx:30](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/actions/ActionContext.tsx#L30)

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

[`ActionContextReturn`](../interfaces/ActionContextReturn.md)&lt;`T`&gt;

Object containing Provider, hooks, and utility functions

### See

 - https://mineclover.github.io/context-action/en/guide/patterns/action/
 - https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
 - https://mineclover.github.io/context-action/en/guide/patterns/action/register-delegation

## Call Signature

> **createActionContext**&lt;`T`&gt;(`config`): [`ActionContextReturn`](../interfaces/ActionContextReturn.md)&lt;`T`&gt;

Defined in: [packages/react/src/actions/ActionContext.tsx:36](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/actions/ActionContext.tsx#L36)

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

[`ActionContextReturn`](../interfaces/ActionContextReturn.md)&lt;`T`&gt;

Object containing Provider, hooks, and utility functions

### See

 - https://mineclover.github.io/context-action/en/guide/patterns/action/
 - https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
 - https://mineclover.github.io/context-action/en/guide/patterns/action/register-delegation
