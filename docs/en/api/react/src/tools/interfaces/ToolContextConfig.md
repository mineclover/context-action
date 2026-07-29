[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/react/src/tools](../README.md) / ToolContextConfig

# Interface: ToolContextConfig\<TSchema\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:72](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L72)

Configuration options for createToolContext

## Type Parameters

### TSchema

`TSchema` *extends* `ActionSchemaMap`

## Properties

### schema

> **schema**: `TSchema`

Defined in: [packages/react/src/tools/ToolContext.types.ts:74](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L74)

Tool schema map (required) - defines all available tools

***

### validationMode?

> `optional` **validationMode?**: [`ToolValidationMode`](../type-aliases/ToolValidationMode.md)

Defined in: [packages/react/src/tools/ToolContext.types.ts:82](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L82)

Validation mode for tool execution
- 'strict': Throws ActionValidationError on invalid payload (default)
- 'warn': Logs warning but continues execution
- 'silent': Silently ignores validation errors

***

### validateOnDispatch?

> `optional` **validateOnDispatch?**: `boolean`

Defined in: [packages/react/src/tools/ToolContext.types.ts:88](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L88)

Enable/disable validation on dispatch

#### Default

```ts
true
```

***

### debug?

> `optional` **debug?**: `boolean`

Defined in: [packages/react/src/tools/ToolContext.types.ts:91](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L91)

Enable debug logging

***

### allowedToolNames?

> `optional` **allowedToolNames?**: readonly `string`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:94](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L94)

Optional execution allowlist applied to discovery and calls.

***

### toolListPageSize?

> `optional` **toolListPageSize?**: `number`

Defined in: [packages/react/src/tools/ToolContext.types.ts:97](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L97)

Optional page size for canonical tools/list discovery. Defaults to all tools.

***

### toolPolicy?

> `optional` **toolPolicy?**: [`ToolPolicy`](../type-aliases/ToolPolicy.md)

Defined in: [packages/react/src/tools/ToolContext.types.ts:100](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L100)

Optional runtime policy for allow/ask/deny decisions.

***

### onToolCall?

> `optional` **onToolCall?**: `ToolCallObserver`

Defined in: [packages/react/src/tools/ToolContext.types.ts:103](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L103)

Receives normalized tool lifecycle events for traces and audit UI.

***

### executionOwnerId?

> `optional` **executionOwnerId?**: `string`

Defined in: [packages/react/src/tools/ToolContext.types.ts:106](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L106)

Stable logical owner recorded in tool-call execution provenance.

***

### idempotency?

> `optional` **idempotency?**: `ToolIdempotencyRegistryOptions`

Defined in: [packages/react/src/tools/ToolContext.types.ts:112](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L112)

Bounded in-memory replay guard for calls that provide idempotencyKey.
Durable stores belong at the application/server mutation boundary.

***

### durableOperationStore?

> `optional` **durableOperationStore?**: `DurableOperationStore`\<`ToolCallResult`&lt;`unknown`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:115](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L115)

Optional durable record store for cross-reload/process mutation recovery.

***

### durableOperationOwnerId?

> `optional` **durableOperationOwnerId?**: `string`

Defined in: [packages/react/src/tools/ToolContext.types.ts:118](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L118)

Stable process/worker identity used for durable operation ownership.

***

### durableOperationLeaseMs?

> `optional` **durableOperationLeaseMs?**: `number`

Defined in: [packages/react/src/tools/ToolContext.types.ts:121](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L121)

Pending-operation lease duration. Defaults to five minutes.

***

### durableDiagnosticPolicy?

> `optional` **durableDiagnosticPolicy?**: `ToolObservabilityPolicy`

Defined in: [packages/react/src/tools/ToolContext.types.ts:128](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L128)

Policy used when durable failed/unknown diagnostics are projected.
Create it with `createToolObservabilityPolicy()`; the shared default is
used when omitted.
