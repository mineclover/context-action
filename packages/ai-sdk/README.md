# @context-action/ai-sdk

Thin AI SDK v7 adapter for Context-Action tool managers. It keeps the model
SDK outside `@context-action/core` and `@context-action/tool-protocol`.

```ts
import { createAISDKToolScope } from '@context-action/ai-sdk';

const toolScope = createAISDKToolScope(registry, {
  sessionId,
  toolNames: contextScope.toolNames,
  callOptions: { timeout: 10_000, maxOutputBytes: 32_768 },
  needsApproval: ({ definition }) => definition.annotations?.destructiveHint === true,
});

const result = await streamText({
  model,
  tools: toolScope.tools,
  activeTools: toolScope.activeTools,
});
```

`ToolContext` remains the authorization, validation, provenance, and durable
operation boundary. AI SDK approval is a user-interaction gate; it never
replaces the final ToolContext policy check.

`needsApproval` is retained for the AI SDK v7 adapter contract and is marked
deprecated because newer AI SDK flows may configure approval at generation
level. When using such a flow, mirror the same policy in the generation
options while keeping the ToolContext policy as the final authorization gate.

## Execution contract

- The adapter forwards the provider `toolCallId`, abort signal, timeout, output
  budget, and model provenance to the canonical manager.
- Its default idempotency key is `toolCallId`, which protects retries of the
  same model call. Pass `getIdempotencyKey` with a domain operation identifier
  when recovery can create a new model call.
- Canonical failures are returned as structured tool results by default so the
  model can react to a policy or validation error. Set `errorMode: 'throw'` to
  surface them as AI SDK tool errors instead.
- Tool selection is per turn. Derive `toolNames` from the active ContextScope;
  it is required, so a caller cannot expose a whole registry by omission. Pass
  `[]` for a turn that must not call tools.

The adapter does not introduce another scheduler. The canonical tool manager
owns execution serialization and durability. Put independently parallelizable
read tools and serialized mutation tools in separate manager contexts when
their scheduling requirements differ.
