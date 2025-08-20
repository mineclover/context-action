[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ExecutionResult

# Interface: ExecutionResult\<R\>

Defined in: [packages/core/src/types.ts:684](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L684)

Comprehensive result of pipeline execution with detailed execution information

Contains complete information about the pipeline execution including success status,
results, timing metrics, handler details, and any errors that occurred.

## Examples

```typescript
const result = await register.dispatchWithResult('updateUser', userData)

if (result.success) {
  console.log(`Execution completed in ${result.execution.duration}ms`)
  console.log(`${result.execution.handlersExecuted} handlers executed`)
} else {
  console.error('Execution failed:', result.abortReason)
}
```

```typescript
const result = await register.dispatchWithResult('processOrder', order, {
  result: { collect: true, strategy: 'all' }
})

// Access all handler results
result.results.forEach((handlerResult, index) => {
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

Defined in: [packages/core/src/types.ts:686](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L686)

Whether the execution completed successfully

***

### aborted

> **aborted**: `boolean`

Defined in: [packages/core/src/types.ts:689](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L689)

Whether the execution was aborted

***

### abortReason?

> `optional` **abortReason**: `string`

Defined in: [packages/core/src/types.ts:692](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L692)

Reason for abortion if aborted

***

### terminated

> **terminated**: `boolean`

Defined in: [packages/core/src/types.ts:695](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L695)

Whether the execution was terminated early via controller.return()

***

### result?

> `optional` **result**: `R`

Defined in: [packages/core/src/types.ts:698](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L698)

Final result based on result strategy

***

### results

> **results**: (`undefined` \| `R`)[]

Defined in: [packages/core/src/types.ts:701](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L701)

All individual handler results (properly typed as potentially undefined)

***

### execution

> **execution**: `object`

Defined in: [packages/core/src/types.ts:704](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L704)

Execution metadata

#### duration

> **duration**: `number`

Total execution duration in milliseconds

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

Defined in: [packages/core/src/types.ts:725](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L725)

Detailed information about each handler

#### id

> **id**: `string`

Handler unique identifier

#### executed

> **executed**: `boolean`

Whether this handler was executed

#### duration?

> `optional` **duration**: `number`

Handler execution duration in milliseconds (only present if executed)

#### result?

> `optional` **result**: `R`

Result returned by this handler (properly typed as potentially undefined)

#### error?

> `optional` **error**: `Error`

Error thrown by this handler if any

#### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

Custom metadata for this handler

***

### errors

> **errors**: `object`[]

Defined in: [packages/core/src/types.ts:746](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L746)

Errors that occurred during execution

#### handlerId

> **handlerId**: `string`

ID of the handler that caused the error

#### error

> **error**: `Error`

The error that occurred

#### timestamp

> **timestamp**: `number`

Timestamp when the error occurred
