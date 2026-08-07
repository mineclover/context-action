[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/react/src/tools](../README.md) / ToolRegistry

# Interface: ToolRegistry\<TSchema\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:140](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L140)

Tool Registry - provides access to all defined tools
and their export methods for LLM integration

## Extends

- `ToolManagementInterface`&lt;`MCPToolDefinition`&gt;

## Type Parameters

### TSchema

`TSchema` *extends* `ActionSchemaMap`

## Methods

### getTool()

> **getTool**&lt;`K`&gt;(`name`): `TSchema`\[`K`\]

Defined in: [packages/react/src/tools/ToolContext.types.ts:146](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L146)

Get a specific tool by name

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### name

Type parameter **K**

#### Returns

`TSchema`\[`K`\]

***

### getToolNames()

> **getToolNames**(): keyof `TSchema`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:149](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L149)

Get all tool names

#### Returns

keyof `TSchema`[]

***

### toMCP()

> **toMCP**(): `MCPToolDefinition`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:154](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L154)

Export all tools as MCP format

#### Returns

`MCPToolDefinition`[]

***

### toOpenAI()

> **toOpenAI**(): `OpenAIToolDefinition`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:157](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L157)

Export all tools as OpenAI format

#### Returns

`OpenAIToolDefinition`[]

***

### toAnthropic()

> **toAnthropic**(): `AnthropicToolDefinition`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:160](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L160)

Export all tools as Anthropic format

#### Returns

`AnthropicToolDefinition`[]

***

### toMCPFiltered()

> **toMCPFiltered**&lt;`K`&gt;(`toolNames`): `MCPToolDefinition`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:163](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L163)

Export specific tools as MCP format

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### toolNames

`K`[]

#### Returns

`MCPToolDefinition`[]

***

### toOpenAIFiltered()

> **toOpenAIFiltered**&lt;`K`&gt;(`toolNames`): `OpenAIToolDefinition`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:166](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L166)

Export specific tools as OpenAI format

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### toolNames

`K`[]

#### Returns

`OpenAIToolDefinition`[]

***

### toAnthropicFiltered()

> **toAnthropicFiltered**&lt;`K`&gt;(`toolNames`): `AnthropicToolDefinition`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:169](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L169)

Export specific tools as Anthropic format

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### toolNames

`K`[]

#### Returns

`AnthropicToolDefinition`[]

***

### listTools()

> **listTools**(`request?`): `ToolListResult`&lt;`MCPToolDefinition`&gt;

Defined in: [packages/react/src/tools/ToolContext.types.ts:172](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L172)

Discover tools using the standard tools/list contract

#### Parameters

##### request?

Type parameter **ToolListRequest**

#### Returns

`ToolListResult`&lt;`MCPToolDefinition`&gt;

#### Overrides

`ToolManagementInterface.listTools`

***

### getToolDefinition()

> **getToolDefinition**(`name`): `MCPToolDefinition` \| `undefined`

Defined in: [packages/react/src/tools/ToolContext.types.ts:175](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L175)

Resolve a canonical definition for one tool

#### Parameters

##### name

`string`

#### Returns

`MCPToolDefinition` \| `undefined`

#### Overrides

`ToolManagementInterface.getToolDefinition`

***

### callTool()

> **callTool**(`request`, `options?`): `Promise`\<`ToolCallResult`&lt;`unknown`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:178](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L178)

Execute a canonical tools/call request

#### Parameters

##### request

Type parameter **ToolCallRequest**

##### options?

Type parameter **ToolCallOptions**

#### Returns

`Promise`\<`ToolCallResult`&lt;`unknown`&gt;\>

#### Overrides

`ToolManagementInterface.callTool`

***

### executeModelToolCall()

> **executeModelToolCall**(`call`, `options?`): `Promise`\<`ToolCallResult`&lt;`unknown`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:184](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L184)

Normalize and execute a model-side tool call

#### Parameters

##### call

Type parameter **ModelToolCall**

##### options?

Type parameter **ToolCallOptions**

#### Returns

`Promise`\<`ToolCallResult`&lt;`unknown`&gt;\>

#### Overrides

`ToolManagementInterface.executeModelToolCall`

***

### getOperationStatus()

> **getOperationStatus**(`toolName`, `idempotencyKey`, `context?`): `Promise`\<`DurableOperationRecord`\<`ToolCallResult`&lt;`unknown`&gt;\> \| `undefined`\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:190](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L190)

Query a durable operation without starting or retrying its handler.

#### Parameters

##### toolName

`string`

##### idempotencyKey

`string`

##### context?

Type parameter **ToolCallContext**

#### Returns

`Promise`\<`DurableOperationRecord`\<`ToolCallResult`&lt;`unknown`&gt;\> \| `undefined`\>

***

### reconcileOperation()

> **reconcileOperation**(`toolName`, `idempotencyKey`, `resolution`, `context?`, `expectedRevision?`): `Promise`\<`DurableOperationRecord`\<`ToolCallResult`&lt;`unknown`&gt;\> \| `undefined`\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:201](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L201)

Record a domain-confirmed outcome for an `unknown` durable operation.
This does not invoke the tool handler or decide whether compensation is
safe; the caller owns that domain decision.

#### Parameters

##### toolName

`string`

##### idempotencyKey

`string`

##### resolution

`DurableOperationResolution`\<`ToolCallResult`&lt;`unknown`&gt;\>

##### context?

Type parameter **ToolCallContext**

##### expectedRevision?

`number`

#### Returns

`Promise`\<`DurableOperationRecord`\<`ToolCallResult`&lt;`unknown`&gt;\> \| `undefined`\>

***

### recoverOperation()

> **recoverOperation**(`toolName`, `idempotencyKey`, `resolver`, `context?`): `Promise`\<`DurableOperationRecord`\<`ToolCallResult`&lt;`unknown`&gt;\> \| `undefined`\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:214](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L214)

Query an operation and invoke the resolver only for an unknown record.
The resolver owns domain status checks and compensation; this method never
starts the tool handler and reconciles with the observed revision.

#### Parameters

##### toolName

`string`

##### idempotencyKey

`string`

##### resolver

[`ToolOperationRecoveryResolver`](../type-aliases/ToolOperationRecoveryResolver.md)

##### context?

Type parameter **ToolCallContext**

#### Returns

`Promise`\<`DurableOperationRecord`\<`ToolCallResult`&lt;`unknown`&gt;\> \| `undefined`\>

## Properties

### tools

> `readonly` **tools**: `TSchema`

Defined in: [packages/react/src/tools/ToolContext.types.ts:143](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L143)

Get all tool definitions
