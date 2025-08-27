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
// Filter by specific handler IDs
await register.dispatch('updateUser', userData, {
  filter: {
    handlerIds: ['validation', 'business-logic'],  // Only these handlers
    excludeHandlerIds: ['analytics']                // Skip analytics handler
  }
})

// Filter by priority range
await register.dispatch('secureAction', data, {
  filter: {
    priority: { min: 10, max: 50 }  // Only handlers with priority 10-50
  }
})

// Custom filtering logic
await register.dispatch('processData', data, {
  filter: {
    custom: (config) => config.blocking === true  // Only blocking handlers
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

### immediate?

> `optional` **immediate**: `boolean`

Defined in: [packages/core/src/types.ts:553](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L553)

Bypass queue for immediate execution

***

### queuePriority?

> `optional` **queuePriority**: `number`

Defined in: [packages/core/src/types.ts:556](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L556)

Queue priority for this dispatch (higher = executed first)

***

### retryOnError?

> `optional` **retryOnError**: `object`

Defined in: [packages/core/src/types.ts:559](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L559)

Retry configuration for error handling

#### maxAttempts

> **maxAttempts**: `number`

Maximum number of retry attempts

#### delay

> **delay**: `number`

Delay between retries in milliseconds

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

Handler filtering options for fine-grained control over which handlers execute

#### handlerIds?

> `optional` **handlerIds**: `string`[]

Only execute handlers with these specific IDs

#### excludeHandlerIds?

> `optional` **excludeHandlerIds**: `string`[]

Exclude handlers with these specific IDs

#### priority?

> `optional` **priority**: `object`

Filter handlers by priority range

##### min?

> `optional` **min**: `number`

Minimum priority (inclusive)

##### max?

> `optional` **max**: `number`

Maximum priority (inclusive)

#### custom()?

> `optional` **custom**: (`config`) => `boolean`

Custom filter function for complex filtering logic

##### Parameters

###### config

`Required`\<[`HandlerConfig`](HandlerConfig.md)\>

Handler configuration object

##### Returns

`boolean`

`true` if handler should be included, `false` otherwise

***

### result?

> `optional` **result**: `object`

Defined in: [packages/core/src/types.ts:598](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L598)

Result collection and processing options for aggregating handler results

#### strategy?

> `optional` **strategy**: `"first"` \| `"last"` \| `"all"` \| `"merge"` \| `"custom"`

How to handle multiple results from handlers:
- `first`: Return only the first handler result  
- `last`: Return only the last handler result
- `all`: Return all handler results in execution order
- `merge`: Merge results using the `merger` function
- `custom`: Use custom `merger` function for processing

#### merger()?

> `optional` **merger**: &lt;`R`&gt;(`results`) => `R`

Custom result merger function (used with 'merge' or 'custom' strategy)

##### Type Parameters

###### R

Result type

##### Parameters

###### results

(`undefined` \| `R`)[]

Array of results from handlers (may include undefined)

##### Returns

Type parameter **R**

Merged result

#### collect?

> `optional` **collect**: `boolean`

Whether to collect results from all handlers (default: false)

#### maxResults?

> `optional` **maxResults**: `number`

Maximum number of results to collect (for performance optimization)

#### includeErrors?

> `optional` **includeErrors**: `boolean`

Whether to include error information in results (default: false)
