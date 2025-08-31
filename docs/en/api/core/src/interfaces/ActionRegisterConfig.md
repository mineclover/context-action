[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegisterConfig

# Interface: ActionRegisterConfig

Defined in: [packages/core/src/types.ts:377](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L377)

Configuration options for ActionRegister initialization

Provides comprehensive configuration options for customizing ActionRegister
behavior including debugging, execution modes, and cleanup policies.

## Examples

```typescript
const register = new ActionRegister<AppActions>({
  name: 'UserActionRegister',
  registry: {
    debug: true,
    defaultExecutionMode: 'sequential'
  }
})
```

```typescript
const devRegister = new ActionRegister<AppActions>({
  name: 'DevRegister',
  registry: {
    debug: process.env.NODE_ENV === 'development',
    autoCleanup: true,
    defaultExecutionMode: 'parallel'
  }
})
```

## Properties

### name?

> `optional` **name**: `string`

Defined in: [packages/core/src/types.ts:379](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L379)

Name identifier for this ActionRegister instance

***

### registry?

> `optional` **registry**: `object`

Defined in: [packages/core/src/types.ts:382](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L382)

Registry-specific configuration options

#### debug?

> `optional` **debug**: `boolean`

Debug mode for registry operations - enables detailed logging

#### autoCleanup?

> `optional` **autoCleanup**: `boolean`

Auto-cleanup configuration for one-time handlers

#### defaultExecutionMode?

> `optional` **defaultExecutionMode**: [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Default execution mode for actions

#### useConcurrencyQueue?

> `optional` **useConcurrencyQueue**: `boolean`

Use concurrency queue for thread safety. Default: true

#### maxHandlersPerAction?

> `optional` **maxHandlersPerAction**: `number`

Maximum number of handlers per action. Default: 1000. Use Infinity to disable limit (not recommended)

#### errorHandler()?

> `optional` **errorHandler**: (`error`, `context`) => `void`

Global error handler for unhandled errors

##### Parameters

###### error

`Error`

###### context

`unknown`

##### Returns

`void`
