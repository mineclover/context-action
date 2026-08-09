[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPToolScopeOptions

# Interface: WebMCPToolScopeOptions\<TDocument\>

Defined in: [packages/webmcp/src/index.ts:136](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L136)

Values that change browser capability registration and require a new scope.

## Extends

- [`WebMCPRegistrationConfig`](WebMCPRegistrationConfig.md)&lt;`TDocument`&gt;.[`WebMCPExecutionOptions`](WebMCPExecutionOptions.md)

## Type Parameters

### TDocument

`TDocument` = [`WebMCPDocument`](WebMCPDocument.md)

## Properties

### sessionId

> `readonly` **sessionId**: `string`

Defined in: [packages/webmcp/src/index.ts:107](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L107)

Stable identity for the page agent session.

#### Inherited from

[`WebMCPRegistrationConfig`](WebMCPRegistrationConfig.md).[`sessionId`](WebMCPRegistrationConfig.md#sessionid)

***

### toolNames

> `readonly` **toolNames**: readonly `string`[]

Defined in: [packages/webmcp/src/index.ts:109](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L109)

Explicit capability scope; an omitted list never exposes a whole registry.

#### Inherited from

[`WebMCPRegistrationConfig`](WebMCPRegistrationConfig.md).[`toolNames`](WebMCPRegistrationConfig.md#toolnames)

***

### document?

> `readonly` `optional` **document?**: `TDocument`

Defined in: [packages/webmcp/src/index.ts:111](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L111)

Defaults to the ambient browser document when it is available.

#### Inherited from

[`WebMCPRegistrationConfig`](WebMCPRegistrationConfig.md).[`document`](WebMCPRegistrationConfig.md#document)

***

### profile?

> `readonly` `optional` **profile?**: [`WebMCPRuntimeProfile`](WebMCPRuntimeProfile.md)&lt;`TDocument`&gt;

Defined in: [packages/webmcp/src/index.ts:113](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L113)

Defaults to the current WebMCP draft profile.

#### Inherited from

[`WebMCPRegistrationConfig`](WebMCPRegistrationConfig.md).[`profile`](WebMCPRegistrationConfig.md#profile)

***

### exposedTo?

> `readonly` `optional` **exposedTo?**: readonly `string`[]

Defined in: [packages/webmcp/src/index.ts:115](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L115)

Optional cross-origin documents allowed to discover and execute these tools.

#### Inherited from

[`WebMCPRegistrationConfig`](WebMCPRegistrationConfig.md).[`exposedTo`](WebMCPRegistrationConfig.md#exposedto)

***

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/webmcp/src/index.ts:117](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L117)

Unregister all registered tools when aborted.

#### Inherited from

[`WebMCPRegistrationConfig`](WebMCPRegistrationConfig.md).[`signal`](WebMCPRegistrationConfig.md#signal)

***

### context?

> `readonly` `optional` **context?**: `Omit`\<`ToolCallContext`, `"source"` \| `"mode"` \| `"sessionId"`\>

Defined in: [packages/webmcp/src/index.ts:122](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L122)

#### Inherited from

[`WebMCPExecutionOptions`](WebMCPExecutionOptions.md).[`context`](WebMCPExecutionOptions.md#context)

***

### callOptions?

> `readonly` `optional` **callOptions?**: `Omit`\<`ToolCallOptions`, `"signal"` \| `"context"` \| `"idempotencyKey"` \| `"interaction"`\>

Defined in: [packages/webmcp/src/index.ts:123](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L123)

#### Inherited from

[`WebMCPExecutionOptions`](WebMCPExecutionOptions.md).[`callOptions`](WebMCPExecutionOptions.md#calloptions)

***

### afterExecute?

> `readonly` `optional` **afterExecute?**: [`WebMCPAfterExecute`](../type-aliases/WebMCPAfterExecute.md)

Defined in: [packages/webmcp/src/index.ts:125](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L125)

Detached notification after canonical execution has committed.

#### Inherited from

[`WebMCPExecutionOptions`](WebMCPExecutionOptions.md).[`afterExecute`](WebMCPExecutionOptions.md#afterexecute)

***

### onObserverError?

> `readonly` `optional` **onObserverError?**: (`error`) => `void`

Defined in: [packages/webmcp/src/index.ts:127](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L127)

Receives detached post-execution notification failures.

#### Parameters

##### error

`unknown`

#### Returns

`void`

#### Inherited from

[`WebMCPExecutionOptions`](WebMCPExecutionOptions.md).[`onObserverError`](WebMCPExecutionOptions.md#onobservererror)

***

### interaction?

> `readonly` `optional` **interaction?**: `ToolInteractionHandler`

Defined in: [packages/webmcp/src/index.ts:129](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L129)

Canonical approval handler, called only after validation and policy ask.

#### Inherited from

[`WebMCPExecutionOptions`](WebMCPExecutionOptions.md).[`interaction`](WebMCPExecutionOptions.md#interaction)

***

### errorMode?

> `readonly` `optional` **errorMode?**: [`WebMCPErrorMode`](../type-aliases/WebMCPErrorMode.md)

Defined in: [packages/webmcp/src/index.ts:131](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L131)

Default `structured` preserves Context-Action's structured error envelope.

#### Inherited from

[`WebMCPExecutionOptions`](WebMCPExecutionOptions.md).[`errorMode`](WebMCPExecutionOptions.md#errormode)

***

### getIdempotencyKey?

> `readonly` `optional` **getIdempotencyKey?**: [`WebMCPIdempotencyKeyFactory`](../type-aliases/WebMCPIdempotencyKeyFactory.md)

Defined in: [packages/webmcp/src/index.ts:133](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L133)

Domain-owned retry identity; omitted by default because WebMCP has no native call ID.

#### Inherited from

[`WebMCPExecutionOptions`](WebMCPExecutionOptions.md).[`getIdempotencyKey`](WebMCPExecutionOptions.md#getidempotencykey)

***

### getExecutionOptions?

> `readonly` `optional` **getExecutionOptions?**: (`invocation`) => [`WebMCPExecutionOptions`](WebMCPExecutionOptions.md)

Defined in: [packages/webmcp/src/index.ts:139](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L139)

Optional lazy execution configuration for UI frameworks with changing props.

#### Parameters

##### invocation

[`WebMCPToolInvocation`](WebMCPToolInvocation.md)

#### Returns

[`WebMCPExecutionOptions`](WebMCPExecutionOptions.md)
