[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/ai-sdk/src](../README.md) / AISDKToolSetOptions

# Interface: AISDKToolSetOptions

Defined in: [packages/ai-sdk/src/index.ts:68](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L68)

## Properties

### sessionId

> `readonly` **sessionId**: `string`

Defined in: [packages/ai-sdk/src/index.ts:70](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L70)

Stable identifier for one model conversation or agent run.

***

### toolNames

> `readonly` **toolNames**: readonly `string`[]

Defined in: [packages/ai-sdk/src/index.ts:76](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L76)

Explicit capability scope for this generation. Derive this from the active
ContextScope; use an empty array for a model turn that must not call tools.

***

### context?

> `readonly` `optional` **context?**: `Omit`\<`ToolCallContext`, `"source"` \| `"mode"` \| `"sessionId"`\>

Defined in: [packages/ai-sdk/src/index.ts:79](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L79)

Extra provenance fields; source/mode/session are adapter-owned.

***

### callOptions?

> `readonly` `optional` **callOptions?**: `Omit`\<`ToolCallOptions`, `"signal"` \| `"context"` \| `"idempotencyKey"`\>

Defined in: [packages/ai-sdk/src/index.ts:82](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L82)

Per-call execution budgets applied by the canonical manager.

***

### getIdempotencyKey?

> `readonly` `optional` **getIdempotencyKey?**: [`AISDKToolIdempotencyKeyFactory`](../type-aliases/AISDKToolIdempotencyKeyFactory.md)

Defined in: [packages/ai-sdk/src/index.ts:91](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L91)

Defaults to the AI SDK `toolCallId`, which is safe for same-call retries.
Supply a domain operation identity when recovery must span a new model call.

***

### ~~needsApproval?~~

> `readonly` `optional` **needsApproval?**: [`AISDKToolApprovalPolicy`](../type-aliases/AISDKToolApprovalPolicy.md)

Defined in: [packages/ai-sdk/src/index.ts:99](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L99)

Native AI SDK approval gate, evaluated before the tool's execute function.

#### Deprecated

AI SDK may move approval configuration to generation-level
options. Keep this adapter option for v7 compatibility and mirror the
same policy in the caller's generation configuration when available.

***

### errorMode?

> `readonly` `optional` **errorMode?**: [`AISDKToolErrorMode`](../type-aliases/AISDKToolErrorMode.md)

Defined in: [packages/ai-sdk/src/index.ts:106](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L106)

Preserve canonical errors as data, or expose them as AI SDK tool errors.
The adapter only exposes a definition output schema in `throw` mode;
structured error envelopes are intentionally outside business schemas.
