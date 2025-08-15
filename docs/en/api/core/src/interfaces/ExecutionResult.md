[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ExecutionResult

# Interface: ExecutionResult\<R\>

Defined in: [packages/core/src/types.ts:316](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L316)

Result of pipeline execution containing detailed execution information

## Type Parameters

### Generic type R

`R` = `void`

## Properties

### success

> **success**: `boolean`

Defined in: [packages/core/src/types.ts:318](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L318)

Whether the execution completed successfully

***

### aborted

> **aborted**: `boolean`

Defined in: [packages/core/src/types.ts:321](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L321)

Whether the execution was aborted

***

### abortReason?

> `optional` **abortReason**: `string`

Defined in: [packages/core/src/types.ts:324](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L324)

Reason for abortion if aborted

***

### terminated

> **terminated**: `boolean`

Defined in: [packages/core/src/types.ts:327](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L327)

Whether the execution was terminated early via controller.return()

***

### result?

> `optional` **result**: `R`

Defined in: [packages/core/src/types.ts:330](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L330)

Final result based on result strategy

***

### results

> **results**: `R`[]

Defined in: [packages/core/src/types.ts:333](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L333)

All individual handler results

***

### execution

> **execution**: `object`

Defined in: [packages/core/src/types.ts:336](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L336)

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

Defined in: [packages/core/src/types.ts:357](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L357)

Detailed information about each handler

#### id

> **id**: `string`

Handler unique identifier

#### executed

> **executed**: `boolean`

Whether this handler was executed

#### duration?

> `optional` **duration**: `number`

Handler execution duration in milliseconds

#### result?

> `optional` **result**: `R`

Result returned by this handler

#### error?

> `optional` **error**: `Error`

Error thrown by this handler if any

#### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

Custom metadata for this handler

***

### errors

> **errors**: `object`[]

Defined in: [packages/core/src/types.ts:378](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L378)

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
