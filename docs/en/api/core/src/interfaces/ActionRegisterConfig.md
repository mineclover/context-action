[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegisterConfig

# Interface: ActionRegisterConfig

Defined in: [packages/core/src/types.ts:614](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/types.ts#L614)

Configuration options for ActionRegister initialization

Provides comprehensive configuration options for customizing ActionRegister
behavior including debugging, execution modes, and cleanup policies.

## Examples

**Basic Configuration**

```typescript
const register = new ActionRegister<AppActions>({
  name: 'UserActionRegister',
  registry: {
    debug: true,
    defaultExecutionMode: 'sequential'
  }
})
```

**Development Configuration**

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

> `optional` **name?**: `string`

Defined in: [packages/core/src/types.ts:616](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/types.ts#L616)

Name identifier for this ActionRegister instance

***

### registry?

> `optional` **registry?**: `object`

Defined in: [packages/core/src/types.ts:619](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/types.ts#L619)

Registry-specific configuration options

#### debug?

> `optional` **debug?**: `boolean`

Debug mode for registry operations - enables detailed logging

#### autoCleanup?

> `optional` **autoCleanup?**: `boolean`

Auto-cleanup configuration for one-time handlers

#### defaultExecutionMode?

> `optional` **defaultExecutionMode?**: [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Default execution mode for actions

#### useConcurrencyQueue?

> `optional` **useConcurrencyQueue?**: `boolean`

Use concurrency queue for thread safety. Default: true

#### maxHandlersPerAction?

> `optional` **maxHandlersPerAction?**: `number`

Maximum number of handlers per action. Default: 1000. Use Infinity to disable limit (not recommended)

#### errorHandler?

> `optional` **errorHandler?**: (`error`, `context`) => `void` \| `Promise`&lt;`void`&gt;

Global error handler for unhandled errors

##### Parameters

###### error

Type parameter **Error**

###### context

`unknown`

##### Returns

`void` \| `Promise`&lt;`void`&gt;

#### schema?

> `optional` **schema?**: `Record`\<`string`, [`ActionSchemaLike`](ActionSchemaLike.md)\>

Action schema map for runtime payload validation
When provided, enables Zod-based validation on dispatch

##### See

ActionSchemaMap from '@context-action/tool-protocol'

#### validateOnDispatch?

> `optional` **validateOnDispatch?**: `boolean`

Enable/disable validation on dispatch
Default: true when schema is provided

#### validationMode?

> `optional` **validationMode?**: `"strict"` \| `"warn"` \| `"silent"`

Validation mode when schema validation fails
- 'strict': throw ActionValidationError (default)
- 'warn': console.warn and continue execution
- 'silent': ignore validation errors silently
