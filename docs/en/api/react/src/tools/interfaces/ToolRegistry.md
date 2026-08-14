[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/react/src/tools](../README.md) / ToolRegistry

# Interface: ToolRegistry\<TSchema\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:141](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L141)

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

Defined in: [packages/react/src/tools/ToolContext.types.ts:147](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L147)

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

Defined in: [packages/react/src/tools/ToolContext.types.ts:150](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L150)

Get all tool names

#### Returns

keyof `TSchema`[]

***

### toMCP()

> **toMCP**(): `MCPToolDefinition`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:155](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L155)

Export all tools as MCP format

#### Returns

`MCPToolDefinition`[]

***

### toOpenAI()

> **toOpenAI**(): `OpenAIToolDefinition`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:158](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L158)

Export all tools as OpenAI format

#### Returns

`OpenAIToolDefinition`[]

***

### toAnthropic()

> **toAnthropic**(): `AnthropicToolDefinition`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:161](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L161)

Export all tools as Anthropic format

#### Returns

`AnthropicToolDefinition`[]

***

### toMCPFiltered()

> **toMCPFiltered**&lt;`K`&gt;(`toolNames`): `MCPToolDefinition`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:164](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L164)

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

Defined in: [packages/react/src/tools/ToolContext.types.ts:167](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L167)

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

Defined in: [packages/react/src/tools/ToolContext.types.ts:170](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L170)

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

Defined in: [packages/react/src/tools/ToolContext.types.ts:173](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L173)

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

Defined in: [packages/react/src/tools/ToolContext.types.ts:176](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L176)

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

Defined in: [packages/react/src/tools/ToolContext.types.ts:179](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L179)

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

Defined in: [packages/react/src/tools/ToolContext.types.ts:185](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L185)

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

Defined in: [packages/react/src/tools/ToolContext.types.ts:191](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L191)

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

> **reconcileOperation**(`toolName`, `idempotencyKey`, `resolution`, `context?`, `expectedFence?`): `Promise`\<`DurableOperationRecord`\<`ToolCallResult`&lt;`unknown`&gt;\> \| `undefined`\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:205](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L205)

Record a domain-confirmed outcome for an `unknown` durable operation.
This does not invoke the tool handler or decide whether compensation is
safe; the caller owns that domain decision. Pass the full fence captured
with the unknown record as the fifth argument. The omitted and numeric
legacy forms remain in the positional ABI but fail closed at runtime;
use the full fence or `recoverOperation()`.

#### Parameters

##### toolName

`string`

##### idempotencyKey

`string`

##### resolution

`DurableOperationResolution`\<`ToolCallResult`&lt;`unknown`&gt;\>

##### context?

Type parameter **ToolCallContext**

##### expectedFence?

`number` \| `DurableOperationFence`

#### Returns

`Promise`\<`DurableOperationRecord`\<`ToolCallResult`&lt;`unknown`&gt;\> \| `undefined`\>

***

### recoverOperation()

> **recoverOperation**(`toolName`, `idempotencyKey`, `resolver`, `context?`): `Promise`\<`DurableOperationRecord`\<`ToolCallResult`&lt;`unknown`&gt;\> \| `undefined`\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:218](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L218)

Query an operation and invoke the resolver only for an unknown record.
The resolver owns domain status checks and compensation; this method never
starts the tool handler and reconciles with the observed full fence.

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

Defined in: [packages/react/src/tools/ToolContext.types.ts:144](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L144)

Get all tool definitions
