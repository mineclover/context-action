[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / DispatchOptions

# Interface: DispatchOptions

Defined in: [packages/core/src/types.ts:957](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L957)

Comprehensive dispatch options for controlling action execution

Provides fine-grained control over how actions are dispatched and executed,
including timing controls, handler filtering, result processing, and abort handling.

## Examples

**Basic Dispatch Options**

```typescript
await register.dispatch('searchUsers', { query: 'john' }, {
  debounce: 300,     // Wait 300ms after last call
  throttle: 1000,    // Limit to once per second
  executionMode: 'parallel'
})
```

**Handler Filtering**

```typescript
await register.dispatch('updateUser', userData, {
  filter: {
    handlerIds: ['validation', 'business-logic'], // Only these handlers
    excludeHandlerIds: ['analytics'],              // Skip selected handlers
    priority: { min: 10 }                          // Minimum priority
  }
})
```

**Result Collection**

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

**Abort Control**

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

> `optional` **debounce?**: `number`

Defined in: [packages/core/src/types.ts:959](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L959)

Debounce delay in milliseconds - wait for this delay after last call

***

### throttle?

> `optional` **throttle?**: `number`

Defined in: [packages/core/src/types.ts:962](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L962)

Throttle delay in milliseconds - limit execution to once per this period

***

### executionMode?

> `optional` **executionMode?**: [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Defined in: [packages/core/src/types.ts:965](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L965)

Execution mode override for this specific dispatch

***

### signal?

> `optional` **signal?**: `AbortSignal`

Defined in: [packages/core/src/types.ts:968](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L968)

Abort signal for cancelling the dispatch

***

### immediate?

> `optional` **immediate?**: `boolean`

Defined in: [packages/core/src/types.ts:971](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L971)

Bypass queue and execute immediately

***

### queuePriority?

> `optional` **queuePriority?**: `number`

Defined in: [packages/core/src/types.ts:974](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L974)

Priority in dispatch queue (higher = earlier execution)

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [packages/core/src/types.ts:981](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L981)

Non-negative finite wall-clock timeout in milliseconds, including queue
wait and retry delay. Rejects with ActionTimeoutError and aborts the
dispatch signal. Invalid values throw RangeError.

***

### retryOnError?

> `optional` **retryOnError?**: `object`

Defined in: [packages/core/src/types.ts:988](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L988)

Retry configuration for error recovery. Retries reuse the handler
selection and timing settings resolved when the dispatch starts, except
handlers already consumed by the `once` lifecycle.

#### maxAttempts

> **maxAttempts**: `number`

Maximum total attempts, including the initial attempt. Minimum: 1

#### delay

> **delay**: `number`

Delay between retries in milliseconds

#### attemptBarrier?

> `optional` **attemptBarrier?**: `"abort-and-drain"` \| `"abort-and-overlap"`

Retry boundary for work started by a race attempt. `abort-and-drain` is
the safe default for race; `abort-and-overlap` is an explicit opt-in for
idempotent/read-only handlers. Both modes abort the superseded attempt;
only the former waits for its started work to settle.

***

### autoAbort?

> `optional` **autoAbort?**: `object`

Defined in: [packages/core/src/types.ts:1003](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1003)

Auto-abort options for automatic AbortController management

#### enabled

> **enabled**: `boolean`

Create and manage AbortController automatically

#### onControllerCreated?

> `optional` **onControllerCreated?**: (`controller`) => `void`

Provide access to the created AbortController

##### Parameters

###### controller

Type parameter **AbortController**

##### Returns

`void`

#### allowHandlerAbort?

> `optional` **allowHandlerAbort?**: `boolean`

Enable pipeline abort trigger from handlers

***

### filter?

> `optional` **filter?**: `object`

Defined in: [packages/core/src/types.ts:1015](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1015)

Handler filtering options

#### handlerIds?

> `optional` **handlerIds?**: `string`[]

Only execute handlers with these IDs

#### excludeHandlerIds?

> `optional` **excludeHandlerIds?**: `string`[]

Exclude handlers with these IDs

#### priority?

> `optional` **priority?**: `object`

Priority-based filtering

##### priority.min?

> `optional` **min?**: `number`

Minimum priority threshold

##### priority.max?

> `optional` **max?**: `number`

Maximum priority threshold

#### custom?

> `optional` **custom?**: (`config`) => `boolean`

Custom filter function. Receives an immutable config snapshot.

##### Parameters

###### config

`Readonly`\<[`ResolvedHandlerConfig`](ResolvedHandlerConfig.md)\>

##### Returns

`boolean`

***

### result?

> `optional` **result?**: `object`

Defined in: [packages/core/src/types.ts:1035](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1035)

Result collection and processing options

#### strategy?

> `optional` **strategy?**: `"first"` \| `"last"` \| `"all"` \| `"merge"` \| `"custom"`

How to handle multiple results. In parallel mode, results follow priority order.

#### merger?

> `optional` **merger?**: &lt;`R`&gt;(`results`) => `R`

Custom result merger function (used with 'merge' or 'custom' strategy)

##### Type Parameters

###### R

Type parameter **R**

##### Parameters

###### results

(`R` \| `undefined`)[]

##### Returns

Type parameter **R**

#### collect?

> `optional` **collect?**: `boolean`

Whether to collect results from all handlers

#### maxResults?

> `optional` **maxResults?**: `number`

Maximum number of results to aggregate. A value of 0 produces no aggregated results.

#### ~~includeErrors?~~

> `optional` **includeErrors?**: `boolean`

##### Deprecated

Errors are always exposed through ExecutionResult.errors and failedResults.
