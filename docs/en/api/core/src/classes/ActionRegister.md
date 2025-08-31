[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegister

# Class: ActionRegister\<T\>

Defined in: [packages/core/src/ActionRegister.ts:37](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L37)

Action Register for managing action handlers with priority-based execution

Central action registration and dispatch system providing type-safe action pipeline management.
Supports sequential, parallel, and race execution modes with advanced handler filtering,
throttling, debouncing, and comprehensive result collection.

## Template

Action payload mapping interface extending ActionPayloadMap

## See

 - https://mineclover.github.io/context-action/en/guide/patterns/action/
 - https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
 - https://mineclover.github.io/context-action/en/guide/patterns/action/register-delegation

## Type Parameters

### T

`T` *extends* [`ActionPayloadMap`](../interfaces/ActionPayloadMap.md) = [`ActionPayloadMap`](../interfaces/ActionPayloadMap.md)

## Constructors

### Constructor

> **new ActionRegister**\<`T`\>(`config`): `ActionRegister`\<`T`\>

Defined in: [packages/core/src/ActionRegister.ts:67](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L67)

#### Parameters

##### config

[`ActionRegisterConfig`](../interfaces/ActionRegisterConfig.md) = `{}`

#### Returns

`ActionRegister`\<`T`\>

## Methods

### register()

> **register**\<`K`, `R`\>(`action`, `handler`, `config`): [`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

Defined in: [packages/core/src/ActionRegister.ts:113](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L113)

Register an action handler with optional configuration

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

##### R

`R` = `void`

#### Parameters

##### action

`K`

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

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### dispatch()

> **dispatch**\<`K`\>(`action`, `payload?`, `options?`): `Promise`\<`void`\>

Defined in: [packages/core/src/ActionRegister.ts:359](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L359)

Dispatch an action with optional execution options

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

`K`

The action type to dispatch

##### payload?

`T`\[`K`\]

The action payload data

##### options?

[`DispatchOptions`](../interfaces/DispatchOptions.md)

Optional dispatch options (execution mode, filters, etc.)

#### Returns

`Promise`\<`void`\>

Promise that resolves when all handlers complete

#### Throws

When action dispatching fails

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### dispatchWithResult()

> **dispatchWithResult**\<`K`, `R`\>(`action`, `payload?`, `options?`): `Promise`\<[`ExecutionResult`](../interfaces/ExecutionResult.md)\<`R`\>\>

Defined in: [packages/core/src/ActionRegister.ts:540](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L540)

Dispatch an action and return detailed execution results

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

##### R

`R` = `void`

#### Parameters

##### action

`K`

The action type to dispatch

##### payload?

`T`\[`K`\]

The action payload data

##### options?

[`DispatchOptions`](../interfaces/DispatchOptions.md)

Optional dispatch options including result collection strategy

#### Returns

`Promise`\<[`ExecutionResult`](../interfaces/ExecutionResult.md)\<`R`\>\>

Promise resolving to comprehensive execution results

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### getHandlerCount()

> **getHandlerCount**\<`K`\>(`action`): `number`

Defined in: [packages/core/src/ActionRegister.ts:1157](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1157)

Get the number of registered handlers for an action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

`K`

The action type to count handlers for

#### Returns

`number`

Number of registered handlers

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### hasHandlers()

> **hasHandlers**\<`K`\>(`action`): `boolean`

Defined in: [packages/core/src/ActionRegister.ts:1173](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1173)

Check if an action has any registered handlers

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

`K`

The action type to check

#### Returns

`boolean`

True if action has handlers, false otherwise

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### getRegisteredActions()

> **getRegisteredActions**(): keyof `T`[]

Defined in: [packages/core/src/ActionRegister.ts:1186](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1186)

Get all registered action types

#### Returns

keyof `T`[]

Array of all registered action types

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### clearAction()

> **clearAction**\<`K`\>(`action`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1199](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1199)

Remove all handlers for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

`K`

The action type to clear handlers for

#### Returns

`void`

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### clearAll()

> **clearAll**(): `void`

Defined in: [packages/core/src/ActionRegister.ts:1212](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1212)

Remove all handlers for all actions

#### Returns

`void`

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### getName()

> **getName**(): `string`

Defined in: [packages/core/src/ActionRegister.ts:1227](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1227)

Get the name of this action register

#### Returns

`string`

The register name

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### getRegistryInfo()

> **getRegistryInfo**(): `ActionRegistryInfo`\<`T`\>

Defined in: [packages/core/src/ActionRegister.ts:1236](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1236)

Get comprehensive registry information (similar to DeclarativeStoreRegistry pattern)

#### Returns

`ActionRegistryInfo`\<`T`\>

Registry information including actions, handlers, and execution modes

***

### getActionStats()

> **getActionStats**\<`K`\>(`action`): `null` \| `ActionHandlerStats`\<`T`\>

Defined in: [packages/core/src/ActionRegister.ts:1258](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1258)

Get detailed statistics for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

`K`

Action name to get statistics for

#### Returns

`null` \| `ActionHandlerStats`\<`T`\>

Detailed handler statistics

***

### getAllActionStats()

> **getAllActionStats**(): `ActionHandlerStats`\<`T`\>[]

Defined in: [packages/core/src/ActionRegister.ts:1299](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1299)

Get statistics for all registered actions

#### Returns

`ActionHandlerStats`\<`T`\>[]

Array of statistics for all actions

***

### setExecutionMode()

> **setExecutionMode**(`mode`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1311](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1311)

Set global execution mode for all actions

#### Parameters

##### mode

[`ExecutionMode`](../type-aliases/ExecutionMode.md)

Execution mode to set

#### Returns

`void`

***

### setActionExecutionMode()

> **setActionExecutionMode**\<`K`\>(`action`, `mode`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1325](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1325)

Set execution mode for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

`K`

Action name

##### mode

[`ExecutionMode`](../type-aliases/ExecutionMode.md)

Execution mode to set

#### Returns

`void`

***

### getActionExecutionMode()

> **getActionExecutionMode**\<`K`\>(`action`): [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Defined in: [packages/core/src/ActionRegister.ts:1339](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1339)

Get execution mode for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

`K`

Action name

#### Returns

[`ExecutionMode`](../type-aliases/ExecutionMode.md)

Execution mode for the action, or default if not set

***

### removeActionExecutionMode()

> **removeActionExecutionMode**\<`K`\>(`action`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1348](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1348)

Remove execution mode override for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

`K`

Action name

#### Returns

`void`

***

### getRegistryConfig()

> **getRegistryConfig**(): `undefined` \| \{ `debug?`: `boolean`; `autoCleanup?`: `boolean`; `defaultExecutionMode?`: [`ExecutionMode`](../type-aliases/ExecutionMode.md); `useConcurrencyQueue?`: `boolean`; `maxHandlersPerAction?`: `number`; `errorHandler?`: (`error`, `context`) => `void`; \}

Defined in: [packages/core/src/ActionRegister.ts:1362](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1362)

Get registry configuration (for debugging and inspection)

#### Returns

`undefined`

\{ `debug?`: `boolean`; `autoCleanup?`: `boolean`; `defaultExecutionMode?`: [`ExecutionMode`](../type-aliases/ExecutionMode.md); `useConcurrencyQueue?`: `boolean`; `maxHandlersPerAction?`: `number`; `errorHandler?`: (`error`, `context`) => `void`; \}

##### debug?

> `optional` **debug**: `boolean`

Debug mode for registry operations - enables detailed logging

##### autoCleanup?

> `optional` **autoCleanup**: `boolean`

Auto-cleanup configuration for one-time handlers

##### defaultExecutionMode?

> `optional` **defaultExecutionMode**: [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Default execution mode for actions

##### useConcurrencyQueue?

> `optional` **useConcurrencyQueue**: `boolean`

Use concurrency queue for thread safety. Default: true

##### maxHandlersPerAction?

> `optional` **maxHandlersPerAction**: `number`

Maximum number of handlers per action. Default: 1000. Use Infinity to disable limit (not recommended)

##### errorHandler()?

> `optional` **errorHandler**: (`error`, `context`) => `void`

Global error handler for unhandled errors

###### Parameters

###### error

`Error`

###### context

`unknown`

###### Returns

`void`

Current registry configuration

***

### isDebugEnabled()

> **isDebugEnabled**(): `boolean`

Defined in: [packages/core/src/ActionRegister.ts:1371](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1371)

Check if registry has debug mode enabled

#### Returns

`boolean`

Whether debug mode is enabled

***

### getUnregisterFunctionCount()

> **getUnregisterFunctionCount**(): `number`

Defined in: [packages/core/src/ActionRegister.ts:1422](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1422)

Gets the total count of registered unregister functions

#### Returns

`number`

Number of unregister functions

***

### hasUnregisterFunction()

> **hasUnregisterFunction**(`handlerId`): `boolean`

Defined in: [packages/core/src/ActionRegister.ts:1433](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1433)

Checks if an unregister function exists for the given handler ID

#### Parameters

##### handlerId

`string`

Handler identifier to check

#### Returns

`boolean`

True if unregister function exists

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/core/src/ActionRegister.ts:1445](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L1445)

🆕 Destroy method for comprehensive cleanup

Cleans up all internal resources including pipelines, guards, queues, and statistics.
Should be called when the ActionRegister is no longer needed to prevent memory leaks.

#### Returns

`void`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/core/src/ActionRegister.ts:46](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/ActionRegister.ts#L46)
