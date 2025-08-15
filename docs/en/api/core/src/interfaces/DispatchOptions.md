[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / DispatchOptions

# Interface: DispatchOptions

Defined in: [packages/core/src/types.ts:239](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L239)

## Properties

### debounce?

> `optional` **debounce**: `number`

Defined in: [packages/core/src/types.ts:241](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L241)

Debounce delay in milliseconds - wait for this delay after last call

***

### throttle?

> `optional` **throttle**: `number`

Defined in: [packages/core/src/types.ts:244](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L244)

Throttle delay in milliseconds - limit execution to once per this period

***

### executionMode?

> `optional` **executionMode**: [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Defined in: [packages/core/src/types.ts:247](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L247)

Execution mode override for this specific dispatch

***

### signal?

> `optional` **signal**: `AbortSignal`

Defined in: [packages/core/src/types.ts:250](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L250)

Abort signal for cancelling the dispatch

***

### autoAbort?

> `optional` **autoAbort**: `object`

Defined in: [packages/core/src/types.ts:253](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L253)

Auto-abort options for automatic AbortController management

#### enabled

> **enabled**: `boolean`

Create and manage AbortController automatically

#### onControllerCreated()?

> `optional` **onControllerCreated**: (`controller`) => `void`

Provide access to the created AbortController

##### Parameters

###### controller

Type parameter **AbortController**

##### Returns

`void`

#### allowHandlerAbort?

> `optional` **allowHandlerAbort**: `boolean`

Enable pipeline abort trigger from handlers

***

### filter?

> `optional` **filter**: `object`

Defined in: [packages/core/src/types.ts:265](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L265)

Handler filtering options

#### tags?

> `optional` **tags**: `string`[]

Only execute handlers with these tags

#### category?

> `optional` **category**: `string`

Only execute handlers in this category

#### handlerIds?

> `optional` **handlerIds**: `string`[]

Only execute handlers with these IDs

#### excludeTags?

> `optional` **excludeTags**: `string`[]

Exclude handlers with these tags

#### excludeCategory?

> `optional` **excludeCategory**: `string`

Exclude handlers in this category

#### excludeHandlerIds?

> `optional` **excludeHandlerIds**: `string`[]

Exclude handlers with these IDs

#### environment?

> `optional` **environment**: `"development"` \| `"production"` \| `"test"`

Only execute handlers matching this environment

#### feature?

> `optional` **feature**: `string`

Only execute handlers with this feature flag enabled

#### custom()?

> `optional` **custom**: (`config`) => `boolean`

Custom filter function

##### Parameters

###### config

`Required`\<[`HandlerConfig`](HandlerConfig.md)\>

##### Returns

`boolean`

***

### result?

> `optional` **result**: `object`

Defined in: [packages/core/src/types.ts:295](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L295)

Result collection and processing options

#### strategy?

> `optional` **strategy**: `"first"` \| `"last"` \| `"all"` \| `"merge"` \| `"custom"`

How to handle multiple results

#### merger()?

> `optional` **merger**: &lt;`R`&gt;(`results`) => `R`

Custom result merger function (used with 'merge' or 'custom' strategy)

##### Type Parameters

###### R

Type parameter **R**

##### Parameters

###### results

`R`[]

##### Returns

Type parameter **R**

#### collect?

> `optional` **collect**: `boolean`

Whether to collect results from all handlers

#### timeout?

> `optional` **timeout**: `number`

Timeout for result collection

#### maxResults?

> `optional` **maxResults**: `number`

Maximum number of results to collect
