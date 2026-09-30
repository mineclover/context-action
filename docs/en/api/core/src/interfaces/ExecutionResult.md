[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ExecutionResult

# Interface: ExecutionResult\<R\>

Defined in: [packages/core/src/types.ts:1117](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1117)

Comprehensive result of pipeline execution with detailed execution information

Contains complete information about the pipeline execution including success status,
results, handler details, and any errors that occurred.

## Examples

**Basic Result Handling**

```typescript
const result = await register.dispatchWithResult('updateUser', userData)

if (result.success) {
  console.log(`Execution completed in ${result.execution.duration}ms`)
  console.log(`${result.execution.handlersExecuted} handlers executed`)
} else {
  console.error('Execution failed:', result.abortReason)
}
```

**Advanced Result Processing**

```typescript
const result = await register.dispatchWithResult('processOrder', order, {
  result: { collect: true, strategy: 'all' }
})

// Access all handler results - now properly typed
result.successResults.forEach((handlerResult, index) => {
  console.log(`Handler ${index} result:`, handlerResult)
})

// Check individual handler performance
result.handlers.forEach(handler => {
  if (handler.duration && handler.duration > 1000) {
    console.warn(`Slow handler ${handler.id}: ${handler.duration}ms`)
  }
})
```

## Type Parameters

### Generic type R

`R` = `void`

The result type for this execution

## Properties

### success

> **success**: `boolean`

Defined in: [packages/core/src/types.ts:1119](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1119)

Whether the execution completed successfully

***

### aborted

> **aborted**: `boolean`

Defined in: [packages/core/src/types.ts:1122](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1122)

Whether caller or pipeline cancellation aborted the execution

***

### abortReason

> **abortReason**: `string` \| `undefined`

Defined in: [packages/core/src/types.ts:1125](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1125)

Reason for abortion if aborted

***

### terminated

> **terminated**: `boolean`

Defined in: [packages/core/src/types.ts:1128](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1128)

Whether the execution was terminated early via controller.return()

***

### outcome

> **outcome**: `"completed"` \| `"failed"` \| `"cancelled"` \| `"debounced"` \| `"throttled"` \| `"completed_with_errors"`

Defined in: [packages/core/src/types.ts:1131](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1131)

High-level terminal state, including timing-guard rejections.

***

### validation?

> `optional` **validation?**: `object`

Defined in: [packages/core/src/types.ts:1134](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1134)

Runtime payload validation outcome when a schema was configured

#### passed

> **passed**: `boolean`

#### errors

> **errors**: `string`[]

***

### result

> **result**: `R` \| `R`[] \| `undefined`

Defined in: [packages/core/src/types.ts:1140](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1140)

Final result based on result strategy - only present for non-void results

***

### successResults

> **successResults**: `R`[]

Defined in: [packages/core/src/types.ts:1144](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1144)

All successful handler results (guaranteed non-undefined)

***

### results

> **results**: (`R` \| `undefined`)[]

Defined in: [packages/core/src/types.ts:1147](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1147)

All handler results including undefined from failed handlers (legacy compatibility)

***

### failedResults

> **failedResults**: `object`[]

Defined in: [packages/core/src/types.ts:1150](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1150)

Failed handler results with error context

#### handlerId

> **handlerId**: `string`

#### error

> **error**: `Error`

#### ~~expectedType~~

> **expectedType**: `string`

##### Deprecated

Runtime execution cannot infer the TypeScript result type.

***

### execution

> **execution**: `object`

Defined in: [packages/core/src/types.ts:1158](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1158)

Execution metadata

#### duration

> **duration**: `number`

Total canonical dispatch duration in milliseconds, including admission
and queue wait. Awaited observer notification time is intentionally
excluded because observers cannot alter the terminal result.

#### admissionDuration

> **admissionDuration**: `number`

Validation and timing-guard admission duration in milliseconds.

#### queueWaitDuration

> **queueWaitDuration**: `number`

Time spent waiting in the dispatch queue in milliseconds.

#### pipelineDuration

> **pipelineDuration**: `number`

Handler pipeline duration in milliseconds.

#### retryDelayDuration?

> `optional` **retryDelayDuration?**: `number`

Backoff time consumed between whole-action retry attempts.

#### resultProcessingDuration?

> `optional` **resultProcessingDuration?**: `number`

Time spent aggregating raw handler values into the public result.

#### attempts?

> `optional` **attempts?**: `object`[]

Per-attempt pipeline timing, including attempts that are retried.

#### handlersExecuted

> **handlersExecuted**: `number`

Number of handlers that were executed

#### handlersSkipped

> **handlersSkipped**: `number`

Number of handlers that were skipped

#### handlersFailed

> **handlersFailed**: `number`

Number of handlers that failed

#### startTime

> **startTime**: `number`

Execution start timestamp

#### endTime

> **endTime**: `number`

Execution end timestamp

***

### handlers

> **handlers**: `object`[]

Defined in: [packages/core/src/types.ts:1204](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1204)

Detailed information about each handler

#### id

> **id**: `string`

Handler unique identifier

#### executed

> **executed**: `boolean`

Whether this handler was executed

#### status

> **status**: [`HandlerExecutionStatus`](../type-aliases/HandlerExecutionStatus.md)

Final lifecycle state observed for this handler

#### duration

> **duration**: `number` \| `undefined`

Handler execution duration in milliseconds (only present if executed)

#### result

> **result**: `R` \| `undefined`

Result returned by this handler - properly typed for success/failure

#### error

> **error**: `Error` \| `undefined`

Error thrown by this handler if any

#### metadata

> **metadata**: `Record`\<`string`, `unknown`\> \| `undefined`

Custom metadata for this handler

***

### raceDiagnostics?

> `optional` **raceDiagnostics?**: `object`

Defined in: [packages/core/src/types.ts:1228](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1228)

Race-only snapshots. Loser failures never change the winner contract.

#### winnerId?

> `optional` **winnerId?**: `string`

#### winner?

> `optional` **winner?**: [`HandlerExecutionOutcome`](HandlerExecutionOutcome.md)&lt;`R`&gt;

Immutable winner outcome captured at dispatch return.

#### loserSnapshots

> **loserSnapshots**: [`HandlerExecutionOutcome`](HandlerExecutionOutcome.md)&lt;`R`&gt;[]

#### pendingLosersAtReturn

> **pendingLosersAtReturn**: `number`

Losers still running when the canonical winner result was returned.

#### observedLoserFailures

> **observedLoserFailures**: `number`

Failed losers observable at that same snapshot point.

***

### errors

> **errors**: [`HandlerError`](HandlerError.md)[]

Defined in: [packages/core/src/types.ts:1240](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1240)

Errors that occurred during execution
