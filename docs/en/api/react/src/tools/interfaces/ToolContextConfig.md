[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/react/src/tools](../README.md) / ToolContextConfig

# Interface: ToolContextConfig\<TSchema\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:73](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L73)

Configuration options for createToolContext

## Type Parameters

### TSchema

`TSchema` *extends* `ActionSchemaMap`

## Properties

### schema

> **schema**: `TSchema`

Defined in: [packages/react/src/tools/ToolContext.types.ts:75](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L75)

Tool schema map (required) - defines all available tools

***

### validationMode?

> `optional` **validationMode?**: [`ToolValidationMode`](../type-aliases/ToolValidationMode.md)

Defined in: [packages/react/src/tools/ToolContext.types.ts:83](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L83)

Validation mode for tool execution
- 'strict': Throws ActionValidationError on invalid payload (default)
- 'warn': Logs warning but continues execution
- 'silent': Silently ignores validation errors

***

### validateOnDispatch?

> `optional` **validateOnDispatch?**: `boolean`

Defined in: [packages/react/src/tools/ToolContext.types.ts:89](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L89)

Enable/disable validation on dispatch

#### Default

```ts
true
```

***

### debug?

> `optional` **debug?**: `boolean`

Defined in: [packages/react/src/tools/ToolContext.types.ts:92](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L92)

Enable debug logging

***

### allowedToolNames?

> `optional` **allowedToolNames?**: readonly `string`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:95](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L95)

Optional execution allowlist applied to discovery and calls.

***

### toolListPageSize?

> `optional` **toolListPageSize?**: `number`

Defined in: [packages/react/src/tools/ToolContext.types.ts:98](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L98)

Optional page size for canonical tools/list discovery. Defaults to all tools.

***

### toolPolicy?

> `optional` **toolPolicy?**: [`ToolPolicy`](../type-aliases/ToolPolicy.md)

Defined in: [packages/react/src/tools/ToolContext.types.ts:101](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L101)

Optional runtime policy for allow/ask/deny decisions.

***

### onToolCall?

> `optional` **onToolCall?**: `ToolCallObserver`

Defined in: [packages/react/src/tools/ToolContext.types.ts:104](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L104)

Receives normalized tool lifecycle events for traces and audit UI.

***

### executionOwnerId?

> `optional` **executionOwnerId?**: `string`

Defined in: [packages/react/src/tools/ToolContext.types.ts:107](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L107)

Stable logical owner recorded in tool-call execution provenance.

***

### idempotency?

> `optional` **idempotency?**: `ToolIdempotencyRegistryOptions`

Defined in: [packages/react/src/tools/ToolContext.types.ts:113](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L113)

Bounded in-memory replay guard for calls that provide idempotencyKey.
Durable stores belong at the application/server mutation boundary.

***

### durableOperationStore?

> `optional` **durableOperationStore?**: `DurableOperationStore`\<`ToolCallResult`&lt;`unknown`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:116](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L116)

Optional durable record store for cross-reload/process mutation recovery.

***

### durableOperationOwnerId?

> `optional` **durableOperationOwnerId?**: `string`

Defined in: [packages/react/src/tools/ToolContext.types.ts:119](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L119)

Stable process/worker identity used for durable operation ownership.

***

### durableOperationLeaseMs?

> `optional` **durableOperationLeaseMs?**: `number`

Defined in: [packages/react/src/tools/ToolContext.types.ts:122](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L122)

Pending-operation lease duration. Defaults to five minutes.

***

### durableDiagnosticPolicy?

> `optional` **durableDiagnosticPolicy?**: `ToolObservabilityPolicy`

Defined in: [packages/react/src/tools/ToolContext.types.ts:129](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L129)

Policy used when durable failed/unknown diagnostics are projected.
Create it with `createToolObservabilityPolicy()`; the shared default is
used when omitted.
