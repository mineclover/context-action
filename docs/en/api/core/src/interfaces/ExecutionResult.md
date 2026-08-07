[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ExecutionResult

# Interface: ExecutionResult\<R\>

Defined in: [packages/core/src/types.ts:900](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L900)

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

Defined in: [packages/core/src/types.ts:902](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L902)

Whether the execution completed successfully

***

### aborted

> **aborted**: `boolean`

Defined in: [packages/core/src/types.ts:905](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L905)

Whether the execution was aborted

***

### abortReason

> **abortReason**: `string` \| `undefined`

Defined in: [packages/core/src/types.ts:908](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L908)

Reason for abortion if aborted

***

### terminated

> **terminated**: `boolean`

Defined in: [packages/core/src/types.ts:911](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L911)

Whether the execution was terminated early via controller.return()

***

### validation?

> `optional` **validation?**: `object`

Defined in: [packages/core/src/types.ts:914](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L914)

Runtime payload validation outcome when a schema was configured

#### passed

> **passed**: `boolean`

#### errors

> **errors**: `string`[]

***

### result

> **result**: `R` \| `R`[] \| `undefined`

Defined in: [packages/core/src/types.ts:920](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L920)

Final result based on result strategy - only present for non-void results

***

### successResults

> **successResults**: `R`[]

Defined in: [packages/core/src/types.ts:924](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L924)

All successful handler results (guaranteed non-undefined)

***

### results

> **results**: (`R` \| `undefined`)[]

Defined in: [packages/core/src/types.ts:927](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L927)

All handler results including undefined from failed handlers (legacy compatibility)

***

### failedResults

> **failedResults**: `object`[]

Defined in: [packages/core/src/types.ts:930](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L930)

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

Defined in: [packages/core/src/types.ts:938](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L938)

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

Defined in: [packages/core/src/types.ts:959](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L959)

Detailed information about each handler

#### id

> **id**: `string`

Handler unique identifier

#### executed

> **executed**: `boolean`

Whether this handler was executed

#### status

> **status**: `HandlerExecutionStatus`

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

### errors

> **errors**: `HandlerError`[]

Defined in: [packages/core/src/types.ts:983](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L983)

Errors that occurred during execution
