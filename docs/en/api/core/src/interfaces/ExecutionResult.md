[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ExecutionResult

# Interface: ExecutionResult\<R\>

Defined in: [packages/core/src/types.ts:657](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L657)

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

Defined in: [packages/core/src/types.ts:659](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L659)

Whether the execution completed successfully

***

### aborted

> **aborted**: `boolean`

Defined in: [packages/core/src/types.ts:662](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L662)

Whether the execution was aborted

***

### abortReason?

> `optional` **abortReason**: `string`

Defined in: [packages/core/src/types.ts:665](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L665)

Reason for abortion if aborted

***

### terminated

> **terminated**: `boolean`

Defined in: [packages/core/src/types.ts:668](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L668)

Whether the execution was terminated early via controller.return()

***

### result?

> `optional` **result**: `R`

Defined in: [packages/core/src/types.ts:671](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L671)

Final result based on result strategy

***

### results

> **results**: (`undefined` \| `R`)[]

Defined in: [packages/core/src/types.ts:674](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L674)

All individual handler results (properly typed as potentially undefined)

***

### execution

> **execution**: `object`

Defined in: [packages/core/src/types.ts:677](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L677)

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

Defined in: [packages/core/src/types.ts:698](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L698)

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

Defined in: [packages/core/src/types.ts:719](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L719)

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
