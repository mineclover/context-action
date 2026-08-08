[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegister

# Class: ActionRegister\<T, TResultMap\>

Defined in: [packages/core/src/ActionRegister.ts:107](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L107)

Action Register for managing action handlers with priority-based execution

Central action registration and dispatch system providing type-safe action pipeline management.
Supports sequential, parallel, and race execution modes with advanced handler filtering,
throttling, debouncing, and comprehensive result collection.

## Template

**TActionMap**

Action payload mapping interface extending ActionPayloadMap

## See

 - https://mineclover.github.io/context-action/en/guide/patterns/action/
 - https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
 - https://mineclover.github.io/context-action/en/guide/patterns/action/register-delegation

## Type Parameters

### Generic type T

`T` *extends* [`ActionPayloadMap`](../type-aliases/ActionPayloadMap.md) = `Record`\<`string`, `unknown`\>

### TResultMap

`TResultMap` *extends* [`ActionResultMap`](../type-aliases/ActionResultMap.md)&lt;`T`&gt; = \{ \}

## Accessors

### actions

#### Get Signature

> **get** **actions**(): `{ [K in string]: (args: DispatchArgs<T[K]>) => Promise<void> }`

Defined in: [packages/core/src/ActionRegister.ts:219](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L219)

🆕 Action-based dispatcher

Provides function-based access to actions for more convenient dispatching.
Each action becomes a callable function that can be invoked directly.

##### Example

```typescript
interface MyActions extends ActionPayloadMap {
  userLogin: { userId: string; email: string };
  resetApp: void;
}

const registry = new ActionRegister<MyActions>();

// Function-based dispatching
await registry.actions.userLogin({ userId: '123', email: 'test@example.com' });
await registry.actions.resetApp();
await registry.actions.resetApp(undefined, { debounce: 100 });
```

##### Returns

`{ [K in string]: (args: DispatchArgs<T[K]>) => Promise<void> }`

***

### actionsWithResult

#### Get Signature

> **get** **actionsWithResult**(): `{ [K in string]: (args: DispatchArgs<T[K]>) => Promise<ExecutionResult<ActionResult<TResultMap, K>>> }`

Defined in: [packages/core/src/ActionRegister.ts:273](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L273)

Actions-based dispatching with result collection

Provides a function-based interface for dispatching actions with detailed execution results.
Each registered action becomes a callable function that returns ExecutionResult.

##### Example

```typescript
// Actions with payload
const result = await registry.actionsWithResult.userLogin({ userId: '123', email: 'user@example.com' });

// Actions without payload
const result = await registry.actionsWithResult.userLogout();
const debouncedResult = await registry.actionsWithResult.userLogout(
  undefined,
  { debounce: 100 }
);

// With options
const result = await registry.actionsWithResult.processData(
  { data: { name: 'test' }, type: 'json' },
  { executionMode: 'parallel' }
);
```

##### Returns

`{ [K in string]: (args: DispatchArgs<T[K]>) => Promise<ExecutionResult<ActionResult<TResultMap, K>>> }`

Proxy object with action functions that return ExecutionResult

## Constructors

### Constructor

> **new ActionRegister**\<`T`, `TResultMap`\>(`config?`): `ActionRegister`\<`T`, `TResultMap`\>

Defined in: [packages/core/src/ActionRegister.ts:161](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L161)

#### Parameters

##### config?

[`ActionRegisterConfig`](../interfaces/ActionRegisterConfig.md) = `{}`

#### Returns

`ActionRegister`\<`T`, `TResultMap`\>

## Methods

### register()

#### Call Signature

> **register**&lt;`K`&gt;(`action`, `handler`, `config?`): [`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

Defined in: [packages/core/src/ActionRegister.ts:319](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L319)

Register an action handler with optional configuration

##### Type Parameters

###### K

`K` *extends* `string`

##### Parameters

###### action

Type parameter **K**

The action type to register handler for

###### handler

[`ActionResultHandler`](../type-aliases/ActionResultHandler.md)\<`T`\[`K`\], [`ActionResult`](../type-aliases/ActionResult.md)\<`TResultMap`, `K`\>\>

The handler function to execute

###### config?

[`HandlerConfig`](../interfaces/HandlerConfig.md)\<`T`\[`K`\]\>

Optional handler configuration including priority, timing, and lifecycle options.

##### Returns

[`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

Unregister function to remove this handler

##### Throws

When maximum handlers limit is reached

##### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

#### Call Signature

> **register**\<`K`, `R`\>(`action`, `handler`, `config?`): [`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

Defined in: [packages/core/src/ActionRegister.ts:324](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L324)

Register an action handler with optional configuration

##### Type Parameters

###### K

`K` *extends* `string`

###### R

`R` = `void`

##### Parameters

###### action

Type parameter **K**

The action type to register handler for

###### handler

[`ActionHandler`](../type-aliases/ActionHandler.md)\<`T`\[`K`\], `R`\>

The handler function to execute

###### config?

[`HandlerConfig`](../interfaces/HandlerConfig.md)\<`T`\[`K`\]\>

Optional handler configuration including priority, timing, and lifecycle options.

##### Returns

[`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

Unregister function to remove this handler

##### Throws

When maximum handlers limit is reached

##### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### registerEffect()

> **registerEffect**\<`K`, `R`\>(`action`, `handler`, `config?`): [`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

Defined in: [packages/core/src/ActionRegister.ts:343](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L343)

Register a side-effect-only handler. This is the explicit route for
validation, logging, and abort guards on actions with mapped results.

#### Type Parameters

##### K

`K` *extends* `string`

##### R

`R` = `void`

#### Parameters

##### action

Type parameter **K**

##### handler

[`ActionHandler`](../type-aliases/ActionHandler.md)\<`T`\[`K`\], `R`\>

##### config?

[`HandlerConfig`](../interfaces/HandlerConfig.md)\<`T`\[`K`\]\> = `{}`

#### Returns

[`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

***

### registerResult()

> **registerResult**&lt;`K`&gt;(`action`, `handler`, `config?`): [`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

Defined in: [packages/core/src/ActionRegister.ts:356](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L356)

Register a handler that contributes the result declared for an action.

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### action

Type parameter **K**

##### handler

[`ActionResultHandler`](../type-aliases/ActionResultHandler.md)\<`T`\[`K`\], [`ActionResult`](../type-aliases/ActionResult.md)\<`TResultMap`, `K`\>\>

##### config?

[`HandlerConfig`](../interfaces/HandlerConfig.md)\<`T`\[`K`\]\>

#### Returns

[`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

***

### dispatch()

> **dispatch**&lt;`K`&gt;(`action`, ...`args`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/ActionRegister.ts:648](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L648)

Dispatch an action with optional execution options

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### action

Type parameter **K**

The action type to dispatch

##### args

...[`DispatchArgs`](../type-aliases/DispatchArgs.md)\<`T`\[`K`\]\>

#### Returns

`Promise`&lt;`void`&gt;

Promise that resolves when all handlers complete

#### Throws

When action dispatching fails

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### dispatchWithResult()

#### Call Signature

> **dispatchWithResult**&lt;`K`&gt;(`action`, ...`args`): `Promise`\<[`ExecutionResult`](../interfaces/ExecutionResult.md)\<[`ActionResult`](../type-aliases/ActionResult.md)\<`TResultMap`, `K`\>\>\>

Defined in: [packages/core/src/ActionRegister.ts:1342](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L1342)

Dispatch an action and return detailed execution results

##### Type Parameters

###### K

`K` *extends* `string`

##### Parameters

###### action

Type parameter **K**

The action type to dispatch

###### args

...[`DispatchArgs`](../type-aliases/DispatchArgs.md)\<`T`\[`K`\]\>

##### Returns

`Promise`\<[`ExecutionResult`](../interfaces/ExecutionResult.md)\<[`ActionResult`](../type-aliases/ActionResult.md)\<`TResultMap`, `K`\>\>\>

Promise resolving to comprehensive execution results

##### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

#### Call Signature

> **dispatchWithResult**\<`K`, `R`\>(`action`, ...`args`): `Promise`\<[`ExecutionResult`](../interfaces/ExecutionResult.md)&lt;`R`&gt;\>

Defined in: [packages/core/src/ActionRegister.ts:1346](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L1346)

Dispatch an action and return detailed execution results

##### Type Parameters

###### K

`K` *extends* `string`

###### R

`R` = `void`

##### Parameters

###### action

Type parameter **K**

The action type to dispatch

###### args

...[`DispatchArgs`](../type-aliases/DispatchArgs.md)\<`T`\[`K`\]\>

##### Returns

`Promise`\<[`ExecutionResult`](../interfaces/ExecutionResult.md)&lt;`R`&gt;\>

Promise resolving to comprehensive execution results

##### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### getHandlerCount()

> **getHandlerCount**&lt;`K`&gt;(`action`): `number`

Defined in: [packages/core/src/ActionRegister.ts:2067](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2067)

Get the number of registered handlers for an action

#### Type Parameters

##### K

`K` *extends* `string`

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

Defined in: [packages/core/src/ActionRegister.ts:2083](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2083)

Check if an action has any registered handlers

#### Type Parameters

##### K

`K` *extends* `string`

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

Defined in: [packages/core/src/ActionRegister.ts:2096](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2096)

Get all registered action types

#### Returns

keyof `T`[]

Array of all registered action types

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### clearAction()

> **clearAction**&lt;`K`&gt;(`action`): `void`

Defined in: [packages/core/src/ActionRegister.ts:2109](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2109)

Remove all handlers for a specific action

#### Type Parameters

##### K

`K` *extends* `string`

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

Defined in: [packages/core/src/ActionRegister.ts:2129](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2129)

Remove all handlers for all actions

#### Returns

`void`

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### getName()

> **getName**(): `string`

Defined in: [packages/core/src/ActionRegister.ts:2150](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2150)

Get the name of this action register

#### Returns

`string`

The register name

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### getRegistryInfo()

> **getRegistryInfo**(): `ActionRegistryInfo`&lt;`T`&gt;

Defined in: [packages/core/src/ActionRegister.ts:2159](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2159)

Get comprehensive registry information (similar to DeclarativeStoreRegistry pattern)

#### Returns

`ActionRegistryInfo`&lt;`T`&gt;

Registry information including actions, handlers, and execution modes

***

### getActionStats()

> **getActionStats**&lt;`K`&gt;(`action`): `ActionHandlerStats`&lt;`T`&gt; \| `null`

Defined in: [packages/core/src/ActionRegister.ts:2181](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2181)

Get detailed statistics for a specific action

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### action

Type parameter **K**

Action name to get statistics for

#### Returns

`ActionHandlerStats`&lt;`T`&gt; \| `null`

Detailed handler statistics

***

### getAllActionStats()

> **getAllActionStats**(): `ActionHandlerStats`&lt;`T`&gt;[]

Defined in: [packages/core/src/ActionRegister.ts:2223](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2223)

Get statistics for all registered actions

#### Returns

`ActionHandlerStats`&lt;`T`&gt;[]

Array of statistics for all actions

***

### setExecutionMode()

> **setExecutionMode**(`mode`): `void`

Defined in: [packages/core/src/ActionRegister.ts:2235](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2235)

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

Defined in: [packages/core/src/ActionRegister.ts:2249](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2249)

Set execution mode for a specific action

#### Type Parameters

##### K

`K` *extends* `string`

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

Defined in: [packages/core/src/ActionRegister.ts:2263](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2263)

Get execution mode for a specific action

#### Type Parameters

##### K

`K` *extends* `string`

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

Defined in: [packages/core/src/ActionRegister.ts:2272](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2272)

Remove execution mode override for a specific action

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### action

Type parameter **K**

Action name

#### Returns

`void`

***

### getRegistryConfig()

> **getRegistryConfig**(): \{ `debug?`: `boolean`; `autoCleanup?`: `boolean`; `defaultExecutionMode?`: [`ExecutionMode`](../type-aliases/ExecutionMode.md); `useConcurrencyQueue?`: `boolean`; `maxHandlersPerAction?`: `number`; `maxJumps?`: `number`; `errorHandler?`: (`error`, `context`) => `void` \| `Promise`&lt;`void`&gt;; `schema?`: `Record`\<`string`, [`ActionSchemaLike`](../interfaces/ActionSchemaLike.md)\>; `validateOnDispatch?`: `boolean`; `validationMode?`: `"strict"` \| `"warn"` \| `"silent"`; \} \| `undefined`

Defined in: [packages/core/src/ActionRegister.ts:2286](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2286)

Get registry configuration (for debugging and inspection)

#### Returns

Current registry configuration

##### Type Literal

\{ `debug?`: `boolean`; `autoCleanup?`: `boolean`; `defaultExecutionMode?`: [`ExecutionMode`](../type-aliases/ExecutionMode.md); `useConcurrencyQueue?`: `boolean`; `maxHandlersPerAction?`: `number`; `maxJumps?`: `number`; `errorHandler?`: (`error`, `context`) => `void` \| `Promise`&lt;`void`&gt;; `schema?`: `Record`\<`string`, [`ActionSchemaLike`](../interfaces/ActionSchemaLike.md)\>; `validateOnDispatch?`: `boolean`; `validationMode?`: `"strict"` \| `"warn"` \| `"silent"`; \}

###### debug?

> `optional` **debug?**: `boolean`

Debug mode for registry operations - enables detailed logging

###### autoCleanup?

> `optional` **autoCleanup?**: `boolean`

Auto-cleanup configuration for one-time handlers

###### defaultExecutionMode?

> `optional` **defaultExecutionMode?**: [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Default execution mode for actions

###### useConcurrencyQueue?

> `optional` **useConcurrencyQueue?**: `boolean`

Serialize independent dispatches through the optional queue. Default: false.

###### maxHandlersPerAction?

> `optional` **maxHandlersPerAction?**: `number`

Optional maximum number of handlers per action. Defaults to `Infinity`.
A configured finite limit rejects an overflowing registration instead of
silently dropping the handler.

###### maxJumps?

> `optional` **maxJumps?**: `number`

Maximum controller priority jumps in one dispatch. Default: 10; use
`Infinity` only when the caller owns a separate termination invariant.

###### errorHandler?

> `optional` **errorHandler?**: (`error`, `context`) => `void` \| `Promise`&lt;`void`&gt;

Global error handler for unhandled errors

###### Parameters

###### error

Type parameter **Error**

###### context

`unknown`

###### Returns

`void` \| `Promise`&lt;`void`&gt;

###### schema?

> `optional` **schema?**: `Record`\<`string`, [`ActionSchemaLike`](../interfaces/ActionSchemaLike.md)\>

Action schema map for runtime payload validation
When provided, enables Zod-based validation on dispatch

###### See

ActionSchemaMap from '@context-action/tool-protocol'

###### validateOnDispatch?

> `optional` **validateOnDispatch?**: `boolean`

Enable/disable validation on dispatch
Default: true when schema is provided

###### validationMode?

> `optional` **validationMode?**: `"strict"` \| `"warn"` \| `"silent"`

Validation mode when schema validation fails
- 'strict': throw ActionValidationError (default)
- 'warn': console.warn and continue execution
- 'silent': ignore validation errors silently

***

`undefined`

***

### isDebugEnabled()

> **isDebugEnabled**(): `boolean`

Defined in: [packages/core/src/ActionRegister.ts:2295](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2295)

Check if registry has debug mode enabled

#### Returns

`boolean`

Whether debug mode is enabled

***

### getUnregisterFunctionCount()

> **getUnregisterFunctionCount**(): `number`

Defined in: [packages/core/src/ActionRegister.ts:2381](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2381)

Gets the total count of registered unregister functions

#### Returns

`number`

Number of unregister functions

***

### hasUnregisterFunction()

> **hasUnregisterFunction**(`handlerId`): `boolean`

Defined in: [packages/core/src/ActionRegister.ts:2396](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2396)

Checks if an unregister function exists for the given handler ID

#### Parameters

##### handlerId

`string`

Handler identifier to check

#### Returns

`boolean`

True if unregister function exists

***

### cancelPendingDispatches()

> **cancelPendingDispatches**(): `void`

Defined in: [packages/core/src/ActionRegister.ts:2404](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2404)

Reject queued dispatches without releasing registered handlers.

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/core/src/ActionRegister.ts:2494](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2494)

🆕 Destroy method for comprehensive cleanup

Begins terminal cleanup of pipelines, guards, queues, and statistics. Cleanup
remains synchronous when no work has started; otherwise active handlers drain
in the background. Use destroyAsync() when completion must be observed.

#### Returns

`void`

***

### destroyAsync()

> **destroyAsync**(): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/ActionRegister.ts:2507](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2507)

Begin terminal shutdown and resolve after all started handlers have settled
and their registered cleanup functions have run.

Repeated calls return the same promise. New registrations and dispatches are
rejected as soon as shutdown begins.

#### Returns

`Promise`&lt;`void`&gt;

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/core/src/ActionRegister.ts:122](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L122)
