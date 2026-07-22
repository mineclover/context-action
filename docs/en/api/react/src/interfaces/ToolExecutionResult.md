[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ToolExecutionResult

# Interface: ToolExecutionResult\<R\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:228](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/tools/ToolContext.types.ts#L228)

Result of tool execution with validation info

## Extends

- `ExecutionResult`&lt;`R`&gt;

## Type Parameters

### Generic type R

`R` = `void`

## Properties

### validationPassed

> **validationPassed**: `boolean`

Defined in: [packages/react/src/tools/ToolContext.types.ts:230](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/tools/ToolContext.types.ts#L230)

Whether validation passed

***

### validationErrors?

> `optional` **validationErrors?**: `string`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:232](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/tools/ToolContext.types.ts#L232)

Validation errors if any
