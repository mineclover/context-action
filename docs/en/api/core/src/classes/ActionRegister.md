[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegister

# Class: ActionRegister\<T\>

Defined in: [packages/core/src/ActionRegister.ts:37](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L37)

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

### Generic type T

`T` *extends* [`ActionPayloadMap`](../interfaces/ActionPayloadMap.md) = [`ActionPayloadMap`](../interfaces/ActionPayloadMap.md)

## Constructors

### Constructor

> **new ActionRegister**&lt;`T`&gt;(`config`): `ActionRegister`&lt;`T`&gt;

Defined in: [packages/core/src/ActionRegister.ts:67](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L67)

#### Parameters

##### config

[`ActionRegisterConfig`](../interfaces/ActionRegisterConfig.md) = `{}`

#### Returns

`ActionRegister`&lt;`T`&gt;

## Methods

### register()

> **register**\<`K`, `R`\>(`action`, `handler`, `config`): [`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

Defined in: [packages/core/src/ActionRegister.ts:113](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L113)

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

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### dispatch()

> **dispatch**&lt;`K`&gt;(`action`, `payload?`, `options?`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/ActionRegister.ts:359](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L359)

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

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### dispatchWithResult()

> **dispatchWithResult**\<`K`, `R`\>(`action`, `payload?`, `options?`): `Promise`\<[`ExecutionResult`](../interfaces/ExecutionResult.md)&lt;`R`&gt;\>

Defined in: [packages/core/src/ActionRegister.ts:537](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L537)

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

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### getHandlerCount()

> **getHandlerCount**&lt;`K`&gt;(`action`): `number`

Defined in: [packages/core/src/ActionRegister.ts:1154](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1154)

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

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### hasHandlers()

> **hasHandlers**&lt;`K`&gt;(`action`): `boolean`

Defined in: [packages/core/src/ActionRegister.ts:1170](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1170)

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

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### getRegisteredActions()

> **getRegisteredActions**(): keyof `T`[]

Defined in: [packages/core/src/ActionRegister.ts:1183](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1183)

Get all registered action types

#### Returns

keyof `T`[]

Array of all registered action types

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### clearAction()

> **clearAction**&lt;`K`&gt;(`action`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1196](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1196)

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

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### clearAll()

> **clearAll**(): `void`

Defined in: [packages/core/src/ActionRegister.ts:1209](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1209)

Remove all handlers for all actions

#### Returns

`void`

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### getName()

> **getName**(): `string`

Defined in: [packages/core/src/ActionRegister.ts:1224](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1224)

Get the name of this action register

#### Returns

`string`

The register name

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### getRegistryInfo()

> **getRegistryInfo**(): `ActionRegistryInfo`&lt;`T`&gt;

Defined in: [packages/core/src/ActionRegister.ts:1233](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1233)

Get comprehensive registry information (similar to DeclarativeStoreRegistry pattern)

#### Returns

`ActionRegistryInfo`&lt;`T`&gt;

Registry information including actions, handlers, and execution modes

***

### getActionStats()

> **getActionStats**&lt;`K`&gt;(`action`): `null` \| `ActionHandlerStats`&lt;`T`&gt;

Defined in: [packages/core/src/ActionRegister.ts:1255](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1255)

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

Defined in: [packages/core/src/ActionRegister.ts:1296](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1296)

Get statistics for all registered actions

#### Returns

`ActionHandlerStats`&lt;`T`&gt;[]

Array of statistics for all actions

***

### setExecutionMode()

> **setExecutionMode**(`mode`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1308](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1308)

Set global execution mode for all actions

#### Parameters

##### mode

[`ExecutionMode`](../type-aliases/ExecutionMode.md)

Execution mode to set

#### Returns

`void`

***

### setActionExecutionMode()

> **setActionExecutionMode**&lt;`K`&gt;(`action`, `mode`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1322](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1322)

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

Defined in: [packages/core/src/ActionRegister.ts:1336](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1336)

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

Defined in: [packages/core/src/ActionRegister.ts:1345](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1345)

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

### getRegistryConfig()

> **getRegistryConfig**(): `undefined` \| \{ `debug?`: `boolean`; `autoCleanup?`: `boolean`; `defaultExecutionMode?`: [`ExecutionMode`](../type-aliases/ExecutionMode.md); `useConcurrencyQueue?`: `boolean`; `maxHandlersPerAction?`: `number`; `errorHandler?`: (`error`, `context`) => `void`; \}

Defined in: [packages/core/src/ActionRegister.ts:1359](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1359)

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

Type parameter **Error**

###### context

`unknown`

###### Returns

`void`

Current registry configuration

***

### isDebugEnabled()

> **isDebugEnabled**(): `boolean`

Defined in: [packages/core/src/ActionRegister.ts:1368](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1368)

Check if registry has debug mode enabled

#### Returns

`boolean`

Whether debug mode is enabled

***

### getUnregisterFunctionCount()

> **getUnregisterFunctionCount**(): `number`

Defined in: [packages/core/src/ActionRegister.ts:1419](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1419)

Gets the total count of registered unregister functions

#### Returns

`number`

Number of unregister functions

***

### hasUnregisterFunction()

> **hasUnregisterFunction**(`handlerId`): `boolean`

Defined in: [packages/core/src/ActionRegister.ts:1430](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1430)

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

Defined in: [packages/core/src/ActionRegister.ts:1442](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L1442)

🆕 Destroy method for comprehensive cleanup

Cleans up all internal resources including pipelines, guards, queues, and statistics.
Should be called when the ActionRegister is no longer needed to prevent memory leaks.

#### Returns

`void`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/core/src/ActionRegister.ts:46](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/ActionRegister.ts#L46)
