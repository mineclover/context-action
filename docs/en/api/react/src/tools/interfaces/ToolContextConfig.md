[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/react/src/tools](../README.md) / ToolContextConfig

# Interface: ToolContextConfig\<TSchema\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:74](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L74)

Configuration options for createToolContext

## Type Parameters

### TSchema

`TSchema` *extends* `ActionSchemaMap`

## Properties

### schema

> **schema**: `TSchema`

Defined in: [packages/react/src/tools/ToolContext.types.ts:76](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L76)

Tool schema map (required) - defines all available tools

***

### validationMode?

> `optional` **validationMode?**: [`ToolValidationMode`](../type-aliases/ToolValidationMode.md)

Defined in: [packages/react/src/tools/ToolContext.types.ts:84](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L84)

Validation mode for tool execution
- 'strict': Throws ActionValidationError on invalid payload (default)
- 'warn': Logs warning but continues execution
- 'silent': Silently ignores validation errors

***

### validateOnDispatch?

> `optional` **validateOnDispatch?**: `boolean`

Defined in: [packages/react/src/tools/ToolContext.types.ts:90](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L90)

Enable/disable validation on dispatch

#### Default

```ts
true
```

***

### debug?

> `optional` **debug?**: `boolean`

Defined in: [packages/react/src/tools/ToolContext.types.ts:93](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L93)

Enable debug logging

***

### allowedToolNames?

> `optional` **allowedToolNames?**: readonly `string`[]

Defined in: [packages/react/src/tools/ToolContext.types.ts:96](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L96)

Optional execution allowlist applied to discovery and calls.

***

### toolListPageSize?

> `optional` **toolListPageSize?**: `number`

Defined in: [packages/react/src/tools/ToolContext.types.ts:99](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L99)

Optional page size for canonical tools/list discovery. Defaults to all tools.

***

### toolPolicy?

> `optional` **toolPolicy?**: [`ToolPolicy`](../type-aliases/ToolPolicy.md)

Defined in: [packages/react/src/tools/ToolContext.types.ts:102](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L102)

Optional runtime policy for allow/ask/deny decisions.

***

### onToolCall?

> `optional` **onToolCall?**: `ToolCallObserver`

Defined in: [packages/react/src/tools/ToolContext.types.ts:105](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L105)

Receives normalized tool lifecycle events for traces and audit UI.

***

### executionOwnerId?

> `optional` **executionOwnerId?**: `string`

Defined in: [packages/react/src/tools/ToolContext.types.ts:108](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L108)

Stable logical owner recorded in tool-call execution provenance.

***

### idempotency?

> `optional` **idempotency?**: `ToolIdempotencyRegistryOptions`

Defined in: [packages/react/src/tools/ToolContext.types.ts:114](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L114)

Bounded in-memory replay guard for calls that provide idempotencyKey.
Durable stores belong at the application/server mutation boundary.

***

### durableOperationStore?

> `optional` **durableOperationStore?**: `DurableOperationStore`\<`ToolCallResult`&lt;`unknown`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:117](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L117)

Optional durable record store for cross-reload/process mutation recovery.

***

### durableOperationOwnerId?

> `optional` **durableOperationOwnerId?**: `string`

Defined in: [packages/react/src/tools/ToolContext.types.ts:120](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L120)

Stable process/worker identity used for durable operation ownership.

***

### durableOperationLeaseMs?

> `optional` **durableOperationLeaseMs?**: `number`

Defined in: [packages/react/src/tools/ToolContext.types.ts:123](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L123)

Pending-operation lease duration. Defaults to five minutes.

***

### durableDiagnosticPolicy?

> `optional` **durableDiagnosticPolicy?**: `ToolObservabilityPolicy`

Defined in: [packages/react/src/tools/ToolContext.types.ts:130](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L130)

Policy used when durable failed/unknown diagnostics are projected.
Create it with `createToolObservabilityPolicy()`; the shared default is
used when omitted.
