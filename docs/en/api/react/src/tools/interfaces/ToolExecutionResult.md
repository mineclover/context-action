[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/react/src/tools](../README.md) / ToolExecutionResult

# Interface: ToolExecutionResult\<R\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:229](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L229)

Result of tool execution with validation info

## Extends

- `ExecutionResult`&lt;`R`&gt;

## Type Parameters

### Generic type R

`R` = `void`

## Properties

### validationPassed

> **validationPassed**: `boolean`

Defined in: [packages/react/src/tools/ToolContext.types.ts:231](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L231)

Whether validation passed

***

### validationErrors?

> `optional` **validationErrors?**: `string`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:233](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L233)

Validation errors if any
