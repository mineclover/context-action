[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ExecutionResult

# Interface: ExecutionResult\<R\>

Defined in: [packages/core/src/types.ts:581](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L581)

Comprehensive result of pipeline execution with detailed execution information

Contains complete information about the pipeline execution including success status,
results, handler details, and any errors that occurred.

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

### R

`R` = `void`

The result type for this execution

## Properties

### success

> **success**: `boolean`

Defined in: [packages/core/src/types.ts:583](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L583)

Whether the execution completed successfully

***

### aborted

> **aborted**: `boolean`

Defined in: [packages/core/src/types.ts:586](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L586)

Whether the execution was aborted

***

### abortReason

> **abortReason**: `undefined` \| `string`

Defined in: [packages/core/src/types.ts:589](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L589)

Reason for abortion if aborted

***

### terminated

> **terminated**: `boolean`

Defined in: [packages/core/src/types.ts:592](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L592)

Whether the execution was terminated early via controller.return()

***

### result

> **result**: `undefined` \| `R`

Defined in: [packages/core/src/types.ts:595](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L595)

Final result based on result strategy - only present for non-void results

***

### successResults

> **successResults**: `R`[]

Defined in: [packages/core/src/types.ts:599](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L599)

All successful handler results (guaranteed non-undefined)

***

### results

> **results**: (`undefined` \| `R`)[]

Defined in: [packages/core/src/types.ts:602](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L602)

All handler results including undefined from failed handlers (legacy compatibility)

***

### failedResults

> **failedResults**: `object`[]

Defined in: [packages/core/src/types.ts:605](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L605)

Failed handler results with error context

#### handlerId

> **handlerId**: `string`

#### error

> **error**: `Error`

#### expectedType

> **expectedType**: `string`

***

### execution

> **execution**: `object`

Defined in: [packages/core/src/types.ts:612](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L612)

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

Defined in: [packages/core/src/types.ts:633](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L633)

Detailed information about each handler

#### id

> **id**: `string`

Handler unique identifier

#### executed

> **executed**: `boolean`

Whether this handler was executed

#### duration

> **duration**: `undefined` \| `number`

Handler execution duration in milliseconds (only present if executed)

#### result

> **result**: `undefined` \| `R`

Result returned by this handler - properly typed for success/failure

#### error

> **error**: `undefined` \| `Error`

Error thrown by this handler if any

#### metadata

> **metadata**: `undefined` \| `Record`\<`string`, `any`\>

Custom metadata for this handler

***

### errors

> **errors**: `HandlerError`[]

Defined in: [packages/core/src/types.ts:654](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L654)

Errors that occurred during execution
