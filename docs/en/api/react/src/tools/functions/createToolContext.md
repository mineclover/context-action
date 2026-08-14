[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/react/src/tools](../README.md) / createToolContext

# Function: createToolContext()

> **createToolContext**&lt;`TSchema`&gt;(`contextName`, `config`): [`ToolContextReturn`](../interfaces/ToolContextReturn.md)&lt;`TSchema`&gt;

Defined in: [packages/react/src/tools/ToolContext.tsx:324](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.tsx#L324)

Creates a unified Tool Context for LLM integration

This factory creates a complete tool system that:
- Uses Zod schemas as the Single Source of Truth
- Provides runtime payload validation
- Exports tools in MCP, OpenAI, Anthropic formats
- Manages tool handlers with priority-based execution

## Type Parameters

### TSchema

`TSchema` *extends* `ActionSchemaMap`

## Parameters

### contextName

`string`

Name identifier for this tool context

### config

[`ToolContextConfig`](../interfaces/ToolContextConfig.md)&lt;`TSchema`&gt;

Configuration with required schema

## Returns

[`ToolContextReturn`](../interfaces/ToolContextReturn.md)&lt;`TSchema`&gt;

Tool context with Provider, hooks, and registry access

## Example

```typescript
const { Provider, useToolCall, useToolRegistry } = createToolContext('MyTools', {
  schema: myToolSchema,
  validationMode: 'strict',
});
```
