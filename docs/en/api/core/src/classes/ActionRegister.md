[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegister

# Class: ActionRegister\<T\>

Defined in: [packages/core/src/ActionRegister.ts:35](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L35)

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

Defined in: [packages/core/src/ActionRegister.ts:54](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L54)

#### Parameters

##### config

[`ActionRegisterConfig`](../interfaces/ActionRegisterConfig.md) = `{}`

#### Returns

`ActionRegister`&lt;`T`&gt;

## Methods

### register()

> **register**\<`K`, `R`\>(`action`, `handler`, `config`): [`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

Defined in: [packages/core/src/ActionRegister.ts:92](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L92)

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

Defined in: [packages/core/src/ActionRegister.ts:226](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L226)

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

Defined in: [packages/core/src/ActionRegister.ts:459](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L459)

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

Defined in: [packages/core/src/ActionRegister.ts:949](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L949)

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

Defined in: [packages/core/src/ActionRegister.ts:965](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L965)

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

Defined in: [packages/core/src/ActionRegister.ts:978](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L978)

Get all registered action types

#### Returns

keyof `T`[]

Array of all registered action types

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### clearAction()

> **clearAction**&lt;`K`&gt;(`action`): `void`

Defined in: [packages/core/src/ActionRegister.ts:991](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L991)

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

Defined in: [packages/core/src/ActionRegister.ts:1002](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L1002)

Remove all handlers for all actions

#### Returns

`void`

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### getName()

> **getName**(): `string`

Defined in: [packages/core/src/ActionRegister.ts:1015](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L1015)

Get the name of this action register

#### Returns

`string`

The register name

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### getRegistryInfo()

> **getRegistryInfo**(): `ActionRegistryInfo`&lt;`T`&gt;

Defined in: [packages/core/src/ActionRegister.ts:1024](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L1024)

Get comprehensive registry information (similar to DeclarativeStoreRegistry pattern)

#### Returns

`ActionRegistryInfo`&lt;`T`&gt;

Registry information including actions, handlers, and execution modes

***

### getActionStats()

> **getActionStats**&lt;`K`&gt;(`action`): `null` \| `ActionHandlerStats`&lt;`T`&gt;

Defined in: [packages/core/src/ActionRegister.ts:1046](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L1046)

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

Defined in: [packages/core/src/ActionRegister.ts:1097](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L1097)

Get statistics for all registered actions

#### Returns

`ActionHandlerStats`&lt;`T`&gt;[]

Array of statistics for all actions

***

### getHandlersByTag()

> **getHandlersByTag**(`tag`): `Map`\<keyof `T`, `HandlerRegistration`\<`any`, `any`\>[]\>

Defined in: [packages/core/src/ActionRegister.ts:1109](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L1109)

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

Defined in: [packages/core/src/ActionRegister.ts:1131](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L1131)

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

Defined in: [packages/core/src/ActionRegister.ts:1153](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L1153)

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

Defined in: [packages/core/src/ActionRegister.ts:1167](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L1167)

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

Defined in: [packages/core/src/ActionRegister.ts:1176](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L1176)

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

Defined in: [packages/core/src/ActionRegister.ts:1187](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L1187)

Clear execution statistics for all actions

#### Returns

`void`

***

### clearActionExecutionStats()

> **clearActionExecutionStats**&lt;`K`&gt;(`action`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1200](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L1200)

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

Defined in: [packages/core/src/ActionRegister.ts:1213](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L1213)

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

Defined in: [packages/core/src/ActionRegister.ts:1222](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L1222)

Check if registry has debug mode enabled

#### Returns

`boolean`

Whether debug mode is enabled

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/core/src/ActionRegister.ts:41](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/ActionRegister.ts#L41)
