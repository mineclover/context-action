[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / DispatchOptions

# Interface: DispatchOptions

Defined in: [packages/core/src/types.ts:536](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L536)

Comprehensive dispatch options for controlling action execution

Provides fine-grained control over how actions are dispatched and executed,
including timing controls, handler filtering, result processing, and abort handling.

## Examples

```typescript
await register.dispatch('searchUsers', { query: 'john' }, {
  debounce: 300,     // Wait 300ms after last call
  throttle: 1000,    // Limit to once per second
  executionMode: 'parallel'
})
```

```typescript
await register.dispatch('updateUser', userData, {
  filter: {
    tags: ['validation', 'business-logic'],  // Only these tags
    excludeCategory: 'analytics',            // Skip analytics handlers
    environment: 'production'                // Production handlers only
  }
})
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
```

```typescript
const controller = new AbortController()

// Auto-abort with custom controller
await register.dispatch('longRunningTask', data, {
  autoAbort: {
    enabled: true,
    allowHandlerAbort: true,
    onControllerCreated: (ctrl) => {
      setTimeout(() => ctrl.abort('Timeout'), 5000)
    }
  }
})
```

## Properties

### debounce?

> `optional` **debounce**: `number`

Defined in: [packages/core/src/types.ts:538](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L538)

Debounce delay in milliseconds - wait for this delay after last call

***

### throttle?

> `optional` **throttle**: `number`

Defined in: [packages/core/src/types.ts:541](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L541)

Throttle delay in milliseconds - limit execution to once per this period

***

### executionMode?

> `optional` **executionMode**: [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Defined in: [packages/core/src/types.ts:544](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L544)

Execution mode override for this specific dispatch

***

### signal?

> `optional` **signal**: `AbortSignal`

Defined in: [packages/core/src/types.ts:547](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L547)

Abort signal for cancelling the dispatch

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [packages/core/src/types.ts:550](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L550)

Timeout for this dispatch in milliseconds

***

### retries?

> `optional` **retries**: `number`

Defined in: [packages/core/src/types.ts:553](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L553)

Number of retries for this dispatch

***

### autoAbort?

> `optional` **autoAbort**: `object`

Defined in: [packages/core/src/types.ts:556](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L556)

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

Defined in: [packages/core/src/types.ts:568](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L568)

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

Defined in: [packages/core/src/types.ts:598](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L598)

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

(`undefined` \| `R`)[]

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
