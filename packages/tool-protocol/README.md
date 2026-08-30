# @context-action/tool-protocol

Framework-neutral action schemas and tool protocol contracts for Context-Action.

This package owns the transport boundary shared by MCP, OpenAI-compatible
providers, Anthropic-compatible providers, and local `ToolContext` adapters.
It has no React or action-runtime dependency.

```bash
npm install @context-action/tool-protocol zod
```

```ts
import { z } from 'zod';
import { createActionSchema, defineAction, toOpenAIToolDefinitions } from '@context-action/tool-protocol';

const tools = createActionSchema({
  search: defineAction({
    name: 'search',
    description: 'Search the catalog',
    parameters: z.object({ query: z.string() }),
  }, z),
});

const definitions = toOpenAIToolDefinitions(Object.values(tools));
```

Zod is a runtime dependency because the package exposes the action-schema API from
its root entry point. `@context-action/core` owns action registration and
execution. The repository's source-only `packages/react/src/tools` track binds
this protocol to `createToolContext`, but React 3 deliberately does not publish
`@context-action/react/tools`. Protocol and schema symbols must be imported from
this package directly.

## API boundaries

- Paged discovery uses `listAllTools(manager, { maxPages })`; the default is
  1,000 pages, and `Infinity` is reserved for callers with an independent
  resource bound.
- `ToolCallOptions.timeout` and `ToolCallOptions.idempotencyKey` define the
  transport contract. Runtime timeout, abort-drain, and in-memory idempotency
  semantics live in the [Tool-calling editor architecture guide](../../docs/en/concept/tool-calling-editor-architecture.md).
  Cross-process durable recovery is owned by
  [`@context-action/tool-durable-operations`](../tool-durable-operations/README.md).
  The source-only ToolContext adapter accepts timeout only as a safe integer
  from 0 through 2,147,483,647 ms so JavaScript timers and provenance agree.
- `ToolCallEvent.provenance` is an additive, validated lifecycle record for
  traces and audit consumers. It carries the logical owner, observed state,
  optional timeout/output budgets, UTF-8 output usage, and elapsed time without
  retaining tool arguments or result payloads. The durable operation store
  remains the cross-process source of truth; provenance is not a second state
  machine. `ToolCallOptions.maxOutputBytes` can enforce an optional result
  boundary and returns `TOOL_OUTPUT_LIMIT_EXCEEDED` before the result is
  returned to the caller.
- `createToolObservabilityPolicy()` and
  `serializeToolObservabilityValue()` provide the shared telemetry boundary.
  They redact credential/source-like fields, bound depth/collections/strings,
  cap serialized UTF-8 bytes (including its oversize marker), and expose
  retention metadata. The helper does
  not mutate durable records or create a state machine; callers must apply it
  before persisting trace/diagnostic values. The Bolt-style demo uses the same
  policy instead of a local redaction implementation. For ambiguous
  `ToolCallResult` records, `sanitizeToolCallDiagnostic()` keeps only the error
  code/retryability and bounded redacted details; the source-only ToolContext
  track applies it before persisting unknown or failed durable operations, while
  successful results remain lossless for the caller. Source-track ToolContext
  callers can override the shared limits with `durableDiagnosticPolicy`; this is
  not an installed React 3 package option.
- `createToolObservationSink()` creates a `ToolCallObserver` that delivers only
  a serialized metadata projection plus policy/retention metadata. Its callback
  never receives the canonical event, request arguments, result content, or
  error messages, making it the preferred boundary for an application-owned
  provider/server telemetry sink.
- Durable operation records, side-effect runners, HTTP/queue bridges, and
  IndexedDB/Redis/PostgreSQL reference backends belong to
  [`@context-action/tool-durable-operations`](../tool-durable-operations/README.md).
  This package intentionally exports no durable backend or provider mutation
  adapter.

The package owns provider-neutral contracts only. `@context-action/core` owns
action registration/execution, the source-only ToolContext track owns React
binding, and `@context-action/tool-durable-operations` owns cross-process
mutation recovery. Keep these boundaries explicit when adding a provider or
persistence adapter.

Before publication, validate the packed consumer surface locally from the
workspace tarballs:

```bash
pnpm verify:local-tool-consumers
```

The publish workflow separately runs the registry-backed consumer smoke after
the package metadata becomes visible on npm.
