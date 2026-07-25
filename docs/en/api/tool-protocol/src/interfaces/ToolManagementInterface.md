[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolManagementInterface

# Interface: ToolManagementInterface\<TDefinition\>

Defined in: [packages/tool-protocol/src/tool-protocol.ts:555](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L555)

Management surface implemented by a ToolContext-backed registry.

`listTools` and `callTool` are the canonical boundaries. Existing format
exporters remain available for provider adapters, but should delegate to
these methods rather than inventing another execution contract.

## Type Parameters

### TDefinition

`TDefinition` *extends* [`ToolDefinition`](ToolDefinition.md) = [`ToolDefinition`](ToolDefinition.md)

## Methods

### listTools()

> **listTools**(`request?`): [`ToolListResult`](ToolListResult.md)&lt;`TDefinition`&gt;

Defined in: [packages/tool-protocol/src/tool-protocol.ts:558](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L558)

#### Parameters

##### request?

[`ToolListRequest`](ToolListRequest.md)

#### Returns

[`ToolListResult`](ToolListResult.md)&lt;`TDefinition`&gt;

***

### getToolDefinition()

> **getToolDefinition**(`name`): `TDefinition` \| `undefined`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:559](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L559)

#### Parameters

##### name

`string`

#### Returns

`TDefinition` \| `undefined`

***

### hasTool()

> **hasTool**(`name`): `boolean`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:560](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L560)

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### callTool()

> **callTool**(`request`, `options?`): `Promise`\<[`ToolCallResult`](ToolCallResult.md)&lt;`unknown`&gt;\>

Defined in: [packages/tool-protocol/src/tool-protocol.ts:561](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L561)

#### Parameters

##### request

[`ToolCallRequest`](ToolCallRequest.md)

##### options?

[`ToolCallOptions`](ToolCallOptions.md)

#### Returns

`Promise`\<[`ToolCallResult`](ToolCallResult.md)&lt;`unknown`&gt;\>

***

### executeModelToolCall()

> **executeModelToolCall**(`call`, `options?`): `Promise`\<[`ToolCallResult`](ToolCallResult.md)&lt;`unknown`&gt;\>

Defined in: [packages/tool-protocol/src/tool-protocol.ts:565](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L565)

#### Parameters

##### call

[`ModelToolCall`](ModelToolCall.md)

##### options?

[`ToolCallOptions`](ToolCallOptions.md)

#### Returns

`Promise`\<[`ToolCallResult`](ToolCallResult.md)&lt;`unknown`&gt;\>
