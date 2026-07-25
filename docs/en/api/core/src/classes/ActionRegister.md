[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegister

# Class: ActionRegister\<T\>

Defined in: [packages/core/src/ActionRegister.ts:46](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L46)

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

## Accessors

### actions

#### Get Signature

> **get** **actions**(): \{ \[K in string \| number \| symbol\]: T\[K\] extends void ? (payload?: undefined, options?: DispatchOptions) =\> Promise\<void\> : (payload: T\[K\], options?: DispatchOptions) =\> Promise\<void\> \}

Defined in: [packages/core/src/ActionRegister.ts:155](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L155)

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

\{ \[K in string \| number \| symbol\]: T\[K\] extends void ? (payload?: undefined, options?: DispatchOptions) =\> Promise\<void\> : (payload: T\[K\], options?: DispatchOptions) =\> Promise\<void\> \}

***

### actionsWithResult

#### Get Signature

> **get** **actionsWithResult**(): \{ \[K in string \| number \| symbol\]: T\[K\] extends void ? (payload?: undefined, options?: DispatchOptions) =\> Promise\<ExecutionResult\<any\>\> : (payload: T\[K\], options?: DispatchOptions) =\> Promise\<ExecutionResult\<any\>\> \}

Defined in: [packages/core/src/ActionRegister.ts:215](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L215)

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

\{ \[K in string \| number \| symbol\]: T\[K\] extends void ? (payload?: undefined, options?: DispatchOptions) =\> Promise\<ExecutionResult\<any\>\> : (payload: T\[K\], options?: DispatchOptions) =\> Promise\<ExecutionResult\<any\>\> \}

Proxy object with action functions that return ExecutionResult

## Constructors

### Constructor

> **new ActionRegister**&lt;`T`&gt;(`config?`): `ActionRegister`&lt;`T`&gt;

Defined in: [packages/core/src/ActionRegister.ts:101](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L101)

#### Parameters

##### config?

[`ActionRegisterConfig`](../interfaces/ActionRegisterConfig.md) = `{}`

#### Returns

`ActionRegister`&lt;`T`&gt;

## Methods

### register()

> **register**\<`K`, `R`\>(`action`, `handler`, `config?`): [`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

Defined in: [packages/core/src/ActionRegister.ts:259](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L259)

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

##### config?

[`HandlerConfig`](../interfaces/HandlerConfig.md)\<`T`\[`K`\]\> = `{}`

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

#### Call Signature

> **dispatch**&lt;`K`&gt;(`action`, `payload`, `options?`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/ActionRegister.ts:530](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L530)

Dispatch an action with optional execution options

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### action

Type parameter **K**

The action type to dispatch

###### payload

`T`\[`K`\]

The action payload data

###### options?

[`DispatchOptions`](../interfaces/DispatchOptions.md)

Optional dispatch options (execution mode, filters, etc.)

##### Returns

`Promise`&lt;`void`&gt;

Promise that resolves when all handlers complete

##### Throws

When action dispatching fails

##### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

#### Call Signature

> **dispatch**&lt;`K`&gt;(`action`, `payload?`, `options?`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/ActionRegister.ts:537](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L537)

Dispatch an action with optional execution options

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### action

Type parameter **K**

The action type to dispatch

###### payload?

`undefined`

The action payload data

###### options?

[`DispatchOptions`](../interfaces/DispatchOptions.md)

Optional dispatch options (execution mode, filters, etc.)

##### Returns

`Promise`&lt;`void`&gt;

Promise that resolves when all handlers complete

##### Throws

When action dispatching fails

##### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### dispatchWithResult()

> **dispatchWithResult**\<`K`, `R`\>(`action`, `payload?`, `options?`): `Promise`\<[`ExecutionResult`](../interfaces/ExecutionResult.md)&lt;`R`&gt;\>

Defined in: [packages/core/src/ActionRegister.ts:1154](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L1154)

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

Defined in: [packages/core/src/ActionRegister.ts:1865](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L1865)

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

Defined in: [packages/core/src/ActionRegister.ts:1881](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L1881)

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

Defined in: [packages/core/src/ActionRegister.ts:1894](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L1894)

Get all registered action types

#### Returns

keyof `T`[]

Array of all registered action types

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### clearAction()

> **clearAction**&lt;`K`&gt;(`action`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1907](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L1907)

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

Defined in: [packages/core/src/ActionRegister.ts:1927](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L1927)

Remove all handlers for all actions

#### Returns

`void`

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### getName()

> **getName**(): `string`

Defined in: [packages/core/src/ActionRegister.ts:1947](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L1947)

Get the name of this action register

#### Returns

`string`

The register name

#### See

https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage

***

### getRegistryInfo()

> **getRegistryInfo**(): `ActionRegistryInfo`&lt;`T`&gt;

Defined in: [packages/core/src/ActionRegister.ts:1956](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L1956)

Get comprehensive registry information (similar to DeclarativeStoreRegistry pattern)

#### Returns

`ActionRegistryInfo`&lt;`T`&gt;

Registry information including actions, handlers, and execution modes

***

### getActionStats()

> **getActionStats**&lt;`K`&gt;(`action`): `ActionHandlerStats`&lt;`T`&gt; \| `null`

Defined in: [packages/core/src/ActionRegister.ts:1978](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L1978)

Get detailed statistics for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

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

Defined in: [packages/core/src/ActionRegister.ts:2020](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2020)

Get statistics for all registered actions

#### Returns

`ActionHandlerStats`&lt;`T`&gt;[]

Array of statistics for all actions

***

### setExecutionMode()

> **setExecutionMode**(`mode`): `void`

Defined in: [packages/core/src/ActionRegister.ts:2032](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2032)

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

Defined in: [packages/core/src/ActionRegister.ts:2046](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2046)

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

Defined in: [packages/core/src/ActionRegister.ts:2060](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2060)

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

Defined in: [packages/core/src/ActionRegister.ts:2069](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2069)

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

> **getRegistryConfig**(): \{ `debug?`: `boolean`; `autoCleanup?`: `boolean`; `defaultExecutionMode?`: [`ExecutionMode`](../type-aliases/ExecutionMode.md); `useConcurrencyQueue?`: `boolean`; `maxHandlersPerAction?`: `number`; `errorHandler?`: (`error`, `context`) => `void` \| `Promise`&lt;`void`&gt;; `schema?`: `Record`\<`string`, [`ActionSchemaLike`](../interfaces/ActionSchemaLike.md)\>; `validateOnDispatch?`: `boolean`; `validationMode?`: `"strict"` \| `"warn"` \| `"silent"`; \} \| `undefined`

Defined in: [packages/core/src/ActionRegister.ts:2083](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2083)

Get registry configuration (for debugging and inspection)

#### Returns

Current registry configuration

##### Type Literal

\{ `debug?`: `boolean`; `autoCleanup?`: `boolean`; `defaultExecutionMode?`: [`ExecutionMode`](../type-aliases/ExecutionMode.md); `useConcurrencyQueue?`: `boolean`; `maxHandlersPerAction?`: `number`; `errorHandler?`: (`error`, `context`) => `void` \| `Promise`&lt;`void`&gt;; `schema?`: `Record`\<`string`, [`ActionSchemaLike`](../interfaces/ActionSchemaLike.md)\>; `validateOnDispatch?`: `boolean`; `validationMode?`: `"strict"` \| `"warn"` \| `"silent"`; \}

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

Use concurrency queue for thread safety. Default: true

###### maxHandlersPerAction?

> `optional` **maxHandlersPerAction?**: `number`

Maximum number of handlers per action. Default: 1000. Use Infinity to disable limit (not recommended)

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

Defined in: [packages/core/src/ActionRegister.ts:2092](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2092)

Check if registry has debug mode enabled

#### Returns

`boolean`

Whether debug mode is enabled

***

### getUnregisterFunctionCount()

> **getUnregisterFunctionCount**(): `number`

Defined in: [packages/core/src/ActionRegister.ts:2167](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2167)

Gets the total count of registered unregister functions

#### Returns

`number`

Number of unregister functions

***

### hasUnregisterFunction()

> **hasUnregisterFunction**(`handlerId`): `boolean`

Defined in: [packages/core/src/ActionRegister.ts:2178](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2178)

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

Defined in: [packages/core/src/ActionRegister.ts:2183](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2183)

Reject queued dispatches without releasing registered handlers.

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/core/src/ActionRegister.ts:2274](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2274)

🆕 Destroy method for comprehensive cleanup

Begins terminal cleanup of pipelines, guards, queues, and statistics. Cleanup
remains synchronous when no work has started; otherwise active handlers drain
in the background. Use destroyAsync() when completion must be observed.

#### Returns

`void`

***

### destroyAsync()

> **destroyAsync**(): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/ActionRegister.ts:2287](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L2287)

Begin terminal shutdown and resolve after all started handlers have settled
and their registered cleanup functions have run.

Repeated calls return the same promise. New registrations and dispatches are
rejected as soon as shutdown begins.

#### Returns

`Promise`&lt;`void`&gt;

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/core/src/ActionRegister.ts:60](https://github.com/mineclover/context-action/blob/main/packages/core/src/ActionRegister.ts#L60)
