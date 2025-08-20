[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegister

# Class: ActionRegister\<T\>

Defined in: [packages/core/src/ActionRegister.ts:100](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L100)

Action Register for managing action handlers with priority-based execution

Central action registration and dispatch system providing type-safe action pipeline management.
Supports sequential, parallel, and race execution modes with advanced handler filtering,
throttling, debouncing, and comprehensive result collection.

## Template

Action payload mapping interface extending ActionPayloadMap

## Examples

```typescript
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string }
  deleteUser: { id: string }
  resetUser: void
}

const register = new ActionRegister<AppActions>({
  name: 'AppRegister',
  registry: { debug: true, maxHandlers: 10 }
})

// Register handler with priority
register.register('updateUser', async (payload, controller) => {
  await userService.update(payload.id, payload)
  controller.setResult({ success: true, userId: payload.id })
}, { priority: 10, tags: ['user', 'crud'] })

// Dispatch action
await register.dispatch('updateUser', { 
  id: '123', 
  name: 'John Doe', 
  email: 'john@example.com' 
})
```

```typescript
// High priority validation handler
register.register('updateUser', async (payload, controller) => {
  if (!payload.email.includes('@')) {
    controller.abort('Invalid email format')
    return
  }
}, { priority: 100, category: 'validation' })

// Lower priority update handler
register.register('updateUser', async (payload, controller) => {
  const user = await userService.update(payload.id, payload)
  controller.setResult(user)
}, { priority: 50, category: 'business-logic' })
```

```typescript
const register = new ActionRegister<AppActions>({
  name: 'AdvancedRegister',
  registry: {
    debug: true,
    maxHandlers: 20,
    defaultExecutionMode: 'parallel',
    autoCleanup: true
  }
})

// Handler with debouncing and tags
register.register('searchUsers', async (payload, controller) => {
  const results = await userService.search(payload.query)
  controller.setResult(results)
}, {
  priority: 10,
  debounce: 300,
  tags: ['search', 'user'],
  category: 'query',
  once: false
})
```

## Type Parameters

### Generic type T

`T` *extends* [`ActionPayloadMap`](../interfaces/ActionPayloadMap.md) = [`ActionPayloadMap`](../interfaces/ActionPayloadMap.md)

## Constructors

### Constructor

> **new ActionRegister**&lt;`T`&gt;(`config`): `ActionRegister`&lt;`T`&gt;

Defined in: [packages/core/src/ActionRegister.ts:119](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L119)

#### Parameters

##### config

[`ActionRegisterConfig`](../interfaces/ActionRegisterConfig.md) = `{}`

#### Returns

`ActionRegister`&lt;`T`&gt;

## Methods

### register()

> **register**\<`K`, `R`\>(`action`, `handler`, `config`): [`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

Defined in: [packages/core/src/ActionRegister.ts:179](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L179)

Register an action handler with optional configuration

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

##### R

`R` = `void`

#### Parameters

##### action

Type parameter **K**

The action type to register handler for

##### handler

[`ActionHandler`](../type-aliases/ActionHandler.md)\<`T`\[`K`\], `R`\>

The handler function to execute

##### config

[`HandlerConfig`](../interfaces/HandlerConfig.md) = `{}`

Optional handler configuration including priority, tags, etc.

#### Returns

[`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

Unregister function to remove this handler

#### Throws

When maximum handlers limit is reached

#### Examples

```typescript
const unregister = register.register('updateUser', async (payload, controller) => {
  await userService.update(payload.id, payload)
})

// Later remove the handler
unregister()
```

```typescript
register.register('validateUser', async (payload, controller) => {
  if (!payload.email) {
    controller.abort('Email is required')
  }
}, {
  priority: 100,
  tags: ['validation'],
  category: 'security',
  once: false
})
```

***

### dispatch()

> **dispatch**&lt;`K`&gt;(`action`, `payload?`, `options?`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/ActionRegister.ts:441](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L441)

Dispatch an action with optional execution options

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

The action type to dispatch

##### payload?

`T`\[`K`\]

The action payload data

##### options?

[`DispatchOptions`](../interfaces/DispatchOptions.md)

Optional dispatch options (execution mode, filters, etc.)

#### Returns

`Promise`&lt;`void`&gt;

Promise that resolves when all handlers complete

#### Throws

When action dispatching fails

#### Examples

```typescript
await register.dispatch('updateUser', {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
})
```

```typescript
await register.dispatch('updateUser', payload, {
  executionMode: 'parallel',
  timeout: 5000,
  filter: {
    tags: ['validation', 'business-logic'],
    excludeCategory: 'analytics'
  }
})
```

```typescript
await register.dispatch('searchUsers', { query: 'john' }, {
  throttle: 300,
  debounce: 100
})
```

***

### dispatchWithResult()

> **dispatchWithResult**\<`K`, `R`\>(`action`, `payload?`, `options?`): `Promise`\<[`ExecutionResult`](../interfaces/ExecutionResult.md)&lt;`R`&gt;\>

Defined in: [packages/core/src/ActionRegister.ts:698](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L698)

Dispatch an action and return detailed execution results

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

##### R

`R` = `void`

#### Parameters

##### action

Type parameter **K**

The action type to dispatch

##### payload?

`T`\[`K`\]

The action payload data

##### options?

[`DispatchOptions`](../interfaces/DispatchOptions.md)

Optional dispatch options including result collection strategy

#### Returns

`Promise`\<[`ExecutionResult`](../interfaces/ExecutionResult.md)&lt;`R`&gt;\>

Promise resolving to comprehensive execution results

#### Examples

```typescript
const result = await register.dispatchWithResult('updateUser', payload)

if (result.success) {
  console.log(`Executed ${result.execution.handlersExecuted} handlers`)
  console.log(`Duration: ${result.execution.duration}ms`)
}
```

```typescript
const result = await register.dispatchWithResult('processOrder', order, {
  result: {
    collect: true,
    strategy: 'merge',
    maxResults: 5,
    merger: (results) => results.reduce((acc, curr) => ({ ...acc, ...curr }), {})
  }
})

if (result.terminated) {
  console.log('Handler returned early:', result.result)
}
```

***

### getHandlerCount()

> **getHandlerCount**&lt;`K`&gt;(`action`): `number`

Defined in: [packages/core/src/ActionRegister.ts:1194](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1194)

Get the number of registered handlers for an action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

The action type to count handlers for

#### Returns

`number`

Number of registered handlers

#### Example

```typescript
register.register('updateUser', handler1)
register.register('updateUser', handler2)

console.log(register.getHandlerCount('updateUser')) // 2
```

***

### hasHandlers()

> **hasHandlers**&lt;`K`&gt;(`action`): `boolean`

Defined in: [packages/core/src/ActionRegister.ts:1215](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1215)

Check if an action has any registered handlers

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

The action type to check

#### Returns

`boolean`

True if action has handlers, false otherwise

#### Example

```typescript
if (register.hasHandlers('updateUser')) {
  await register.dispatch('updateUser', userData)
}
```

***

### getRegisteredActions()

> **getRegisteredActions**(): keyof `T`[]

Defined in: [packages/core/src/ActionRegister.ts:1232](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1232)

Get all registered action types

#### Returns

keyof `T`[]

Array of all registered action types

#### Example

```typescript
const actions = register.getRegisteredActions()
console.log('Registered actions:', actions) // ['updateUser', 'deleteUser', 'resetUser']
```

***

### clearAction()

> **clearAction**&lt;`K`&gt;(`action`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1249](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1249)

Remove all handlers for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

The action type to clear handlers for

#### Returns

`void`

#### Example

```typescript
register.clearAction('updateUser')
console.log(register.hasHandlers('updateUser')) // false
```

***

### clearAll()

> **clearAll**(): `void`

Defined in: [packages/core/src/ActionRegister.ts:1264](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1264)

Remove all handlers for all actions

#### Returns

`void`

#### Example

```typescript
register.clearAll()
console.log(register.getRegisteredActions().length) // 0
```

***

### getName()

> **getName**(): `string`

Defined in: [packages/core/src/ActionRegister.ts:1281](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1281)

Get the name of this action register

#### Returns

`string`

The register name

#### Example

```typescript
const register = new ActionRegister({ name: 'UserRegister' })
console.log(register.getName()) // 'UserRegister'
```

***

### getRegistryInfo()

> **getRegistryInfo**(): `ActionRegistryInfo`&lt;`T`&gt;

Defined in: [packages/core/src/ActionRegister.ts:1290](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1290)

Get comprehensive registry information (similar to DeclarativeStoreRegistry pattern)

#### Returns

`ActionRegistryInfo`&lt;`T`&gt;

Registry information including actions, handlers, and execution modes

***

### getActionStats()

> **getActionStats**&lt;`K`&gt;(`action`): `null` \| `ActionHandlerStats`&lt;`T`&gt;

Defined in: [packages/core/src/ActionRegister.ts:1312](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1312)

Get detailed statistics for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

Action name to get statistics for

#### Returns

`null` \| `ActionHandlerStats`&lt;`T`&gt;

Detailed handler statistics

***

### getAllActionStats()

> **getAllActionStats**(): `ActionHandlerStats`&lt;`T`&gt;[]

Defined in: [packages/core/src/ActionRegister.ts:1363](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1363)

Get statistics for all registered actions

#### Returns

`ActionHandlerStats`&lt;`T`&gt;[]

Array of statistics for all actions

***

### getHandlersByTag()

> **getHandlersByTag**(`tag`): `Map`\<keyof `T`, `HandlerRegistration`\<`any`, `any`\>[]\>

Defined in: [packages/core/src/ActionRegister.ts:1375](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1375)

Get handlers by tag across all actions

#### Parameters

##### tag

`string`

Tag to filter handlers by

#### Returns

`Map`\<keyof `T`, `HandlerRegistration`\<`any`, `any`\>[]\>

Map of actions to handlers with the specified tag

***

### getHandlersByCategory()

> **getHandlersByCategory**(`category`): `Map`\<keyof `T`, `HandlerRegistration`\<`any`, `any`\>[]\>

Defined in: [packages/core/src/ActionRegister.ts:1397](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1397)

Get handlers by category across all actions

#### Parameters

##### category

`string`

Category to filter handlers by

#### Returns

`Map`\<keyof `T`, `HandlerRegistration`\<`any`, `any`\>[]\>

Map of actions to handlers with the specified category

***

### setActionExecutionMode()

> **setActionExecutionMode**&lt;`K`&gt;(`action`, `mode`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1419](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1419)

Set execution mode for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

Action name

##### mode

[`ExecutionMode`](../type-aliases/ExecutionMode.md)

Execution mode to set

#### Returns

`void`

***

### getActionExecutionMode()

> **getActionExecutionMode**&lt;`K`&gt;(`action`): [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Defined in: [packages/core/src/ActionRegister.ts:1433](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1433)

Get execution mode for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

Action name

#### Returns

[`ExecutionMode`](../type-aliases/ExecutionMode.md)

Execution mode for the action, or default if not set

***

### removeActionExecutionMode()

> **removeActionExecutionMode**&lt;`K`&gt;(`action`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1442](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1442)

Remove execution mode override for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

Action name

#### Returns

`void`

***

### clearExecutionStats()

> **clearExecutionStats**(): `void`

Defined in: [packages/core/src/ActionRegister.ts:1453](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1453)

Clear execution statistics for all actions

#### Returns

`void`

***

### clearActionExecutionStats()

> **clearActionExecutionStats**&lt;`K`&gt;(`action`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1466](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1466)

Clear execution statistics for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

Action name

#### Returns

`void`

***

### getRegistryConfig()

> **getRegistryConfig**(): `undefined` \| \{ `debug?`: `boolean`; `autoCleanup?`: `boolean`; `maxHandlers?`: `number`; `maxRetries?`: `number`; `retryDelay?`: `number`; `defaultExecutionMode?`: [`ExecutionMode`](../type-aliases/ExecutionMode.md); \}

Defined in: [packages/core/src/ActionRegister.ts:1479](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1479)

Get registry configuration (for debugging and inspection)

#### Returns

`undefined`

\{ `debug?`: `boolean`; `autoCleanup?`: `boolean`; `maxHandlers?`: `number`; `maxRetries?`: `number`; `retryDelay?`: `number`; `defaultExecutionMode?`: [`ExecutionMode`](../type-aliases/ExecutionMode.md); \}

##### debug?

> `optional` **debug**: `boolean`

Debug mode for registry operations - enables detailed logging

##### autoCleanup?

> `optional` **autoCleanup**: `boolean`

Auto-cleanup configuration for one-time handlers

##### maxHandlers?

> `optional` **maxHandlers**: `number`

Maximum number of handlers per action (prevents memory leaks)

##### maxRetries?

> `optional` **maxRetries**: `number`

Maximum number of retries for failed operations

##### retryDelay?

> `optional` **retryDelay**: `number`

Delay between retries in milliseconds

##### defaultExecutionMode?

> `optional` **defaultExecutionMode**: [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Default execution mode for actions

Current registry configuration

***

### isDebugEnabled()

> **isDebugEnabled**(): `boolean`

Defined in: [packages/core/src/ActionRegister.ts:1488](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L1488)

Check if registry has debug mode enabled

#### Returns

`boolean`

Whether debug mode is enabled

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/core/src/ActionRegister.ts:106](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/ActionRegister.ts#L106)
