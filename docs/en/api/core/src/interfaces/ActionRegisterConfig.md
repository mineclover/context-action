[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegisterConfig

# Interface: ActionRegisterConfig

Defined in: [packages/core/src/types.ts:481](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L481)

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
    maxHandlers: 50,
    defaultExecutionMode: 'parallel'
  }
})
```

## Properties

### name?

> `optional` **name**: `string`

Defined in: [packages/core/src/types.ts:483](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L483)

Name identifier for this ActionRegister instance

***

### registry?

> `optional` **registry**: `object`

Defined in: [packages/core/src/types.ts:486](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L486)

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
