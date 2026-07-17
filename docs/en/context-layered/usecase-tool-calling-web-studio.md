# Tool-Calling Web Studio Convention

This document turns the standalone web-coding demo into a reusable
Context-Action convention and use-case recipe. It describes the boundary
between a model/provider, the typed tool registry, workspace domain logic,
browser persistence, and the React views.

It is intentionally a demo convention, not a requirement that every
Context-Action application must use MCP or an iframe preview.

## When to use this recipe

Use this shape when a browser application needs one or more of the following:

- a model or local agent that can inspect and mutate a document-like workspace;
- MCP or function-calling tools that must be listed, approved, executed, and
  returned as structured results;
- browser-only persistence such as IndexedDB, Blob assets, or a local folder
  adapter;
- a live preview that acknowledges the revision it rendered;
- a UI that exposes the tool catalog and execution trace for debugging.

If the feature only has ordinary form state and no command boundary, use the
standard Action Only or Store Only pattern instead.

## Canonical flow

```text
tools/list
  -> model/local-agent tool call
  -> ToolContext policy + schema validation
  -> tools/call handler
  -> domain manager / repository
  -> preview bridge acknowledgement
  -> structured tool result + trace
  -> view subscription
```

The model never receives a workspace object and the view never decides whether
a tool is allowed. Each boundary has one source of truth:

| Boundary | Owner | Responsibility |
| --- | --- | --- |
| Tool identity and input/output schema | Tool Context | Define names, descriptions, annotations, and validation |
| Provider transport | action hook | Translate model messages into canonical model tool calls |
| Approval and policy | Tool Context policy | Allow, deny, or request confirmation |
| Workspace mutation | tool handler + manager | Check revision/type/path invariants and update the domain |
| Persistence | repository/filesystem adapter | Store browser data or sync an explicitly connected folder |
| Preview | preview compiler/bridge | Render a revision and acknowledge ready/error |
| Observation | observable hook | Subscribe React to external workspace and trace state |
| Presentation | view | Render data and emit callbacks |

## Context-Action layout

The recommended layout is:

```text
contexts/
  tool-context.ts              # createToolContext and schema
actions/
  run-agent.ts                 # provider-neutral orchestration
handlers/
  tool-handlers.tsx            # useToolHandler registrations
hooks/
  use-tool-execution.ts        # provider/model execution
  use-editor-observables.ts    # subscriptions and workspace derived state
  use-tool-catalog-model.ts    # canonical tools/list and catalog read model
  use-workspace-*.ts           # workspace actions and keyboard commands
views/
  tool-catalog-panel.tsx
  tool-trace-panel.tsx
  workspace-editor-toolbar.tsx
  workspace-source-panel.tsx
  ...
domain/
  workspace-manager.ts         # framework-neutral state transitions
  workspace-repository.ts      # persistence port
```

The standalone demo uses equivalent local names: `bolt-style-tool-context.ts`,
`actions/run-local-agent.ts`, `tool-handlers.tsx`, the `hooks/` directory, the
`views/` directory, and the private `@context-action/live-code-editor`
package. Its `use-tool-catalog-model.ts` owns canonical `tools/list`, tool
definitions, and catalog filtering; `use-tool-catalog-actions.ts` owns sample
arguments and palette commands, while `use-studio-export-actions.ts` owns
catalog and trace exports.
The local `src/tool-catalog-contract.ts` only aliases the framework's
`MCPToolDefinition` and `ToolAnnotations`, so views and action hooks do not
invent a second catalog definition shape.

The example Live Code Editor keeps the same seam even though it is a smaller
showcase. `LiveEditorToolchain.tsx` owns the ToolContext and handler
registration, `actions/useLiveEditorToolActions.ts` owns direct palette calls
and model-shaped calls, and `actions/useLiveEditorAgentExecution.ts` owns
provider discovery, cancellation, message execution, and agent trace
lifecycle. `actions/useLiveEditorProviderSettings.ts` owns the shared key and
model settings, `hooks/useLiveEditorObservables.ts` owns trace subscription,
`hooks/useLiveEditorWorkspaceObservables.ts` owns workspace/document
subscriptions and filesystem capability state, `actions/useLiveEditorWorkspaceActions.ts` owns IndexedDB
hydration, editor persistence, folder import, save, file selection, and reset
commands, `actions/useLiveEditorDocumentActions.ts` owns document source and
scenario mutations plus preview acknowledgements, and
`actions/useLiveEditorTraceActions.ts` owns trace clear/copy/download.
`LiveEditorAIToolbar.tsx` renders the returned tool catalog, results, trace, and
callbacks. This makes the example a concrete reference for the convention
without making the presentation layer a second registry or external-store API.

The realtime web-coding showcase follows the same boundary. `LiveWebCodingToolchain.tsx`
owns ToolContext and handler registration, `actions/useLiveWebCodingToolActions.ts`
owns `tools/list`, direct palette `tools/call`, and local-agent model-shaped calls,
while `actions/useLiveWebCodingAgentExecution.ts` owns the provider/local loop,
message history, cancellation, and agent trace lifecycle. The workbench composes
these returned data and callbacks. `hooks/useLiveWebCodingObservables.ts` owns
workspace/document/trace subscriptions, and
`actions/useLiveWebCodingTraceActions.ts` owns trace clear/copy/download. The
`actions/useLiveWebCodingWorkspaceActions.ts` owns IndexedDB hydration, file
selection, and reset commands, while the shared
`actions/useLiveEditorDocumentActions.ts` facade owns document patching and
preview-render acknowledgements. The workbench does not call registry,
provider, external-store, trace export, workspace repository, or document
manager mutation APIs directly.

## Rules

### 1. The schema is the single source of truth

Define a tool once in the ToolContext schema. Derive `tools/list`, OpenAI
function definitions, MCP definitions, catalog inspectors, and validation from
the registry. Do not hand-build a second provider-specific schema in a view or
transport adapter.

```tsx
const { Provider, useToolHandler, useToolRegistry } = createToolContext(
  'WebStudio',
  { schema: webStudioToolSchema }
);
```

### 2. Keep model transport provider-neutral

OpenRouter, a local fallback agent, or another provider may choose different
conversation formats. They must all end at the same canonical call boundary:

```ts
await registry.executeModelToolCall(
  { id, name, arguments: parsedArguments },
  { context: { source, mode: 'agent', sessionId }, signal }
);
```

When `source` is omitted, the registry records the call as `model`; an
explicit source such as `local` or `mcp` is preserved for approval, trace, and
audit consumers.

Treat `source` as the transport origin and `mode` as the execution intent:
agent/model loops use `mode: 'agent'`, while explicit palette or command
actions use `mode: 'direct'`. Keep provider-specific values in `metadata`; do
not overload them to decide whether a mutation needs approval. The registry
defaults `executeModelToolCall()` to `mode: 'agent'` when an adapter omits it;
direct `callTool()` invocations must opt into `mode: 'direct'` explicitly.
Adapters that receive JSON from a provider should run the shared runtime guards
before handing the request to the registry; malformed method, name, ID, or
argument shapes must become a structured validation error rather than reaching a
handler.

The action hook owns retries, cancellation, message history, and provider
errors. It does not mutate workspace state directly.

Use the registry boundary for every provider path. Build discovery requests with
`toToolListRequest({ cursor })` when pagination is needed, then pass them to
`registry.listTools()`. Provider serialization must use
`registry.toOpenAI()` or another registry export, and model-originated calls must
enter through `registry.executeModelToolCall()`. A direct provider-specific tool
array or handler invocation is outside this convention. Palette commands may
use `registry.callTool()` only inside the action hook that owns the direct
`tools/call` boundary; use the shared `toToolCallRequest()` adapter when a model
call must be represented as a JSON-RPC request for a catalog export or direct
execution.

### 3. Put domain invariants in handlers and framework-neutral managers

Handlers are the orchestration boundary. They must validate or delegate:

- normalized paths and supported file kinds;
- expected revision and conflict handling;
- text-size and asset-size limits;
- folder-linked versus browser-only state;
- preview acknowledgement and timeout behavior.

The workspace manager and repository port should remain usable without React.
The handler reads the current domain snapshot, calls the manager, waits for
required persistence/preview work, and returns a structured result.

### 4. Treat approval as a policy boundary

Read-only tools may be allowed automatically. Mutating model-originated tools
should pass through the ToolContext policy and return a pending approval to the
UI. The approval UI resolves a request; it does not execute the tool itself.

The example Live Code Editor uses an in-app reset approval dialog rather than
`window.confirm`. It restores focus to the cancel action, closes on `Escape` or
backdrop click, and only invokes the destructive reset command after explicit
confirmation.

The realtime web-coding showcase follows the same rule for its IndexedDB reset:
the reset button opens an in-app approval dialog, and the repository replacement
is invoked only by the dialog's explicit confirmation action. This keeps the
browser-only workspace reset aligned with the model/tool approval boundary and
makes the state inspectable by automated UI tests.

If a policy callback must use an external event store, expose that store to
React through a dedicated observable hook. This keeps the non-React ToolContext
callback safe while keeping subscriptions out of view components.

### 5. Views receive data and callbacks

Views such as the tool catalog, trace panel, editor toolbar, and source panel
may own ephemeral focus or display state. They must not know how Dexie,
OpenRouter, revision guards, or filesystem handles work. Mutation callbacks
should point to action hooks or handler-backed commands.

### 6. Return canonical errors

Use a stable error code, retryable flag, and structured details. The provider,
local agent, trace panel, and recovery policy can then make the same decision.
Do not make the UI parse arbitrary error strings to determine whether a retry is
safe.

### 7. Make revision flow explicit

Read tools return the current revision. Mutation tools accept
`expectedRevision` whenever the caller has observed one. A conflict is a
retryable structured result; it is not silently overwritten. The local agent
must update its planned revision after each successful mutation.

### 8. Keep protocol methods explicit in observability

The registry and trace are different concerns, but their protocol vocabulary
must remain aligned. A trace entry records `method: 'tools/list'` for
discovery, `method: 'tools/call'` for every started/completed/failed tool
lifecycle, and `method: 'agent.request'` for the surrounding provider or local
run. Keep the provider `toolCallId`, run-level `sessionId`, and internal trace
ID separate: providers may reuse or omit a call ID, while the trace still needs
stable lifecycle correlation.

This makes three entry points equivalent from an audit perspective:

- a model call routed through `executeModelToolCall`;
- a deterministic local-agent call routed through the same boundary;
- a manually selected palette command routed through the direct action hook.

The view may display or export these fields, but it must not infer the method
from a label or decide whether a call is retryable from free-form text.
The same rule applies to `source` and `mode`: traces and approval snapshots
preserve both fields so an audit consumer can distinguish transport origin from
execution intent after the call has completed.

## Use-case recipes

### A. Local agent fallback

Use when no provider key is available or when deterministic browser testing is
needed.

1. Call `tools/list` from the registry.
2. Build a bounded local plan from the user prompt.
3. Add the observed revision to guarded mutations.
4. Execute every call through `executeModelToolCall`.
5. Return the same structured result and trace shape as a provider call.

Evidence in the demo: `src/actions/run-local-agent.ts` and the local-agent
verification script.

### B. OpenRouter model loop

Use when a remote model should select tools from the same catalog.

1. Export the registry definitions to the provider format.
2. Normalize assistant tool calls and validate JSON arguments.
3. Execute each call through the ToolContext registry.
4. Append the canonical tool result to the provider message history.
5. Continue until the assistant returns text or the call budget is reached.

Evidence in the demo: `src/openrouter.ts`, `src/openrouter-protocol.ts`, and
the OpenRouter transport verifier.

### C. Browser workspace plus connected folder

Use when a user should work safely in IndexedDB first and explicitly sync to a
local folder.

1. Hydrate the browser repository.
2. Restore a persisted folder handle only when permission allows it.
3. Keep browser mutations and local-folder writes as separate tool boundaries.
4. Require `workspace.saveAll` for an explicit write to the folder.
5. Surface permission, disconnected, and stale-folder errors as structured
   results.

Evidence in the demo: `use-workspace-runtime.ts`, `workspace-storage.ts`, and
the browser filesystem adapter.

### D. Live preview acknowledgement

Use when a mutation must become visible before the agent reports completion.

1. Increment the workspace revision after a successful mutation.
2. Compile the HTML/CSS/JS graph for that revision.
3. Send it to the sandboxed iframe.
4. Wait for a matching `ready` or `error` bridge message.
5. Return preview status in the tool result.

Never report a preview mutation as complete merely because the iframe message
was sent; the acknowledgement must match the requested revision.

### E. Palette command and recovery audit

Use when a user needs to inspect or retry a tool without involving a model.

1. Build the request with the shared `toToolCallRequest()` adapter.
2. Execute it from the action hook through the registry boundary with
   `context.mode: 'direct'`.
3. Apply the same policy, revision guard, persistence, and preview wait as a
   model-originated call.
4. Preserve the canonical error code and `retryable` flag in the trace.
5. Let the view offer `Retry` only when the structured result says recovery is
   safe.

This keeps manual debugging useful without creating a second, less protected
mutation path.

The parity contract is covered by the React ToolContext integration test at
`packages/react/__tests__/tools/ToolContext.test.tsx`: the palette call is
allowed and returns structured output, while the model/prompt call is denied by
policy before the handler runs. Both lifecycles still emit canonical
`tools/call` events.

## Build and verification order

When the private package or its contracts change, use:

```bash
pnpm --filter @context-action/openrouter-browser-storage check
pnpm --filter @context-action/openrouter-browser-storage type-check
pnpm --filter @context-action/openrouter-browser-storage test
pnpm --filter @context-action/live-code-editor check
pnpm --filter @context-action/live-code-editor type-check
pnpm --filter @context-action/live-code-editor test
pnpm --filter @context-action/web-coding-demo check
pnpm --filter @context-action/web-coding-demo type-check
pnpm --filter @context-action/react test -- __tests__/tools/ToolContext.test.tsx
pnpm web-coding:verify
pnpm --filter example check
pnpm --filter example verify:openrouter
```

The demo `prebuild` runs the package check before rebuilding it. The final
verification must cover contract tests, production base-path output, preview,
filesystem, provider transport, and the browser flow.
The deployment workflow also runs `pnpm --filter example verify:openrouter` after
installing Chromium, so shared key behavior is a release gate rather than a
local-only check.

The standalone boundary also has a convention gate:

```bash
pnpm --filter @context-action/web-coding-demo verify:conventions
pnpm --filter @context-action/web-coding-demo verify:approval
```

The approval contract check proves that pending requests retain the canonical
`tools/call` method, `toolCallId`, session, and execution mode, and that both
explicit approval and abort cleanup settle the pending queue.

The example catalog check is included in `example check`. It validates that
each UI, standalone, Live Code Editor, and realtime web-coding prompt references
only tools present in the corresponding ToolContext schema, so a renamed or
removed tool cannot remain in the command library unnoticed. The catalog page
links each live surface to its route while reusing the same generic
`MCPCommandReference` shape for prompt, tool names, expected chain, and
difficulty.

It checks that ToolContext creation and handler registration stay in their
dedicated modules, external subscriptions stay in the observable hook, and
the local/provider paths use the canonical discovery, export, and model-call
boundaries. The example live-coding showcases also use the shared
`toToolCallRequest()` adapter instead of hand-building JSON-RPC requests.
Presentation views do not call workspace mutation, catalog, or tool execution
APIs directly.

The development entrypoint is part of that boundary as well. Keep the Vite
port configurable so the standalone demo can run beside the example app and
other local tools, then verify the package launcher itself:

```bash
pnpm --filter @context-action/web-coding-demo verify:dev-server
WEB_CODING_PORT=43144 pnpm --filter @context-action/web-coding-demo dev
```

The verifier starts the package `dev` script with a generated port, confirms
that it serves the standalone entry document, and terminates the process. This
keeps local run instructions and the release contract aligned.

## Anti-patterns

- A view calls `workspace.setValue`, Dexie, or `fetch` directly.
- OpenRouter and local fallback each implement their own mutation path.
- The catalog reconstructs tool definitions instead of reading the registry.
- A model-originated write bypasses policy because it came from a convenient
  UI button.
- A handler returns a success message before persistence or preview completion.
- Revision conflicts are hidden by re-reading and overwriting the latest file.
- External ToolContext state is subscribed to separately in many views.

## Demo mapping

The complete reference implementation is the standalone
[`@context-action/web-coding-demo`](../../../demos/bolt-style-editor/README.md).
Its package seam is documented in
[Tool-calling editor architecture](/en/concept/tool-calling-editor-architecture).
