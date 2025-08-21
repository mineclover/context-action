[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createActionContext

# Function: createActionContext()

## Fileoverview

Action system exports - comprehensive action management

## Implements

actioncontext

## Implements

viewmodel-layer

## Implements

mvvm-pattern

## Memberof

api-terms

Comprehensive action system including context providers, enhanced type-safe contexts,
utilities for business logic coordination, and various patterns for managing user 
interactions and business logic flow.

## Call Signature

> **createActionContext**&lt;`T`&gt;(`contextName`, `config?`): [`ActionContextReturn`](../interfaces/ActionContextReturn.md)&lt;`T`&gt;

Defined in: [packages/react/src/actions/ActionContext.tsx:30](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/actions/ActionContext.tsx#L30)

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

Defined in: [packages/react/src/actions/ActionContext.tsx:36](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/actions/ActionContext.tsx#L36)

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
