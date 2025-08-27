[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegisterConfig

# Interface: ActionRegisterConfig

Defined in: [packages/core/src/types.ts:454](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L454)

Configuration options for ActionRegister initialization

Provides comprehensive configuration options for customizing ActionRegister
behavior including debugging, handler limits, execution modes, and cleanup policies.

## Examples

```typescript
const register = new ActionRegister<AppActions>({
  name: 'UserActionRegister',
  registry: {
    debug: true,
    maxHandlers: 20,
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
    defaultExecutionMode: 'parallel',
    useConcurrencyQueue: true,
    errorHandler: (error, context) => {
      console.error('Unhandled action error:', error);
      // Log to monitoring service
    }
  }
})
```

## Properties

### name?

> `optional` **name**: `string`

Defined in: [packages/core/src/types.ts:456](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L456)

Name identifier for this ActionRegister instance

***

### registry?

> `optional` **registry**: `object`

Defined in: [packages/core/src/types.ts:459](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L459)

Registry-specific configuration options

#### debug?

> `optional` **debug**: `boolean`

Debug mode for registry operations - enables detailed logging

#### autoCleanup?

> `optional` **autoCleanup**: `boolean`

Auto-cleanup configuration for one-time handlers

#### maxHandlers?

> `optional` **maxHandlers**: `number`

Maximum number of handlers per action (prevents memory leaks)

#### maxRetries?

> `optional` **maxRetries**: `number`

Maximum number of retries for failed operations

#### retryDelay?

> `optional` **retryDelay**: `number`

Delay between retries in milliseconds

#### defaultExecutionMode?

> `optional` **defaultExecutionMode**: [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Default execution mode for actions

#### useConcurrencyQueue?

> `optional` **useConcurrencyQueue**: `boolean`

Use concurrency queue for thread-safe operations. Default: false

#### errorHandler?

> `optional` **errorHandler**: (`error`, `context`) => `void`

Global error handler for unhandled action errors

##### Parameters

###### error

`Error`

The error that occurred

###### context

`object`

Error context information

####### action

`string`

The action name where the error occurred

####### handlerId?

`string`

The handler ID where the error occurred

####### payload

`any`

The action payload

##### Returns

`void`
