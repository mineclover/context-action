# Tool Calling Editor Architecture

A browser-based live editor keeps the canonical Tool Registry, policy, and call trace in the parent document. The iframe is a preview and document bridge, not the tool runtime.

For the reusable Context-Action rules and use-case recipes behind this demo,
see [Tool-Calling Web Studio Convention](/en/context-layered/usecase-tool-calling-web-studio).

## Execution boundary

```text
tools/list
  → model tool call { id, name, arguments }
  → ToolRegistry.executeModelToolCall()
  → ToolPolicy
  → DocumentManager
  → iframe preview bridge
  → tool result { toolCallId, content, structuredContent, error? }
  → model
```

Orca is an ADE that connects multiple coding agents with worktrees, terminals, and an embedded browser. This project uses only selected boundaries from the reference clone:

- Design Mode selection capture: pass selector, HTML/CSS summary, and screen state as context
- browser bridge: separate browser UI from host-owned state
- agent lifecycle: observe started, waiting, approval, completed, and failed states
- CLI command bridge: expose explicit commands instead of arbitrary scripts

Reference clone: `architecture-references/orca` (MIT, inspected at commit `9a23792`)

## Realtime web-coding showcase

The focused showcase route is `/integrations/live-web-coding`. It intentionally
keeps the first slice small: a three-file HTML/CSS/JS workspace, a visible
`web.*` tool palette including bounded `web.applyPatch`, an optional OpenRouter model loop, and a sandboxed iframe
preview. Without an API key, the same `tools/list` → model/local agent →
`tools/call` → tool result path runs through a deterministic local fallback, so
the tool contract and preview synchronization can be tested offline.

[bolt.diy](https://github.com/stackblitz-labs/bolt.diy) is a reference for the
larger browser coding-agent shape—provider selection, file-oriented editing,
preview, and MCP integration. It is not a dependency or a target architecture
for this showcase; browser-local persistence and the parent-owned ToolContext
remain the current boundary.

The Bolt-style standalone studio is published at `/web-coding/` from the
`demos/bolt-style-editor` workspace package. It is independent of the example
application route and imports only the framework package plus its own editor
surface. Its first slice uses a Dexie-backed browser workspace, Blob file
records, and a deterministic local agent so GitHub Pages can demonstrate the
complete `tools/list` → model/local agent → `tools/call` → tool result → preview
flow without an API key. If IndexedDB is unavailable, it falls back to the
memory workspace. `Open folder` now uses the package browser filesystem adapter: it
prefers the File System Access API and falls back to a directory-upload input,
then replaces the Dexie workspace with the imported text files. When the user
grants read/write access, `Save to folder` writes dirty files back to that
directory; a structured-clone-capable browser may persist the handle alongside
workspace metadata for the next load. The directory-upload fallback remains
browser-workspace-only. When a writable folder remains linked, `Reload` reads
the directory again and replaces the browser workspace; dirty changes require
explicit confirmation before they are discarded. Opening a different folder uses
the same confirmation boundary, and cancelling preserves the current workspace.
The adapter exposes restored write permission as `granted`, `prompt`, `denied`,
`unknown`, or `disconnected`; the header and `workspace.getStatus` surface the
same state, while `Grant access` requests permission without replacing the
browser workspace.
If IndexedDB becomes unavailable during hydration or a later workspace write,
the editor keeps the current in-memory files but exposes the bounded storage
error in `workspace.getStatus` and the status bar. The UI labels the session as
memory-only so a failed browser persistence write cannot look like a durable
save.
Initial hydration restores the persisted folder link after the Dexie workspace
is loaded. During that short boundary the editor and tool controls remain
disabled; if the handle cannot be restored, the browser workspace stays
available and the header explicitly reports that the folder link is unavailable
so the user can open the folder again.
An empty or unsupported folder is rejected during both open and reload, so it
cannot replace the current workspace or leave a misleading folder connection.
The deterministic prompt planner and revision-aware preflight now live in
`demos/bolt-style-editor/src/local-agent-plan.ts`, separate from the React
editor orchestration. This keeps the local fallback contract independently
testable while the reusable workspace runtime lives in
`packages/live-code-editor`.
The preview document compiler and local asset/script rewriting are isolated in
`packages/live-code-editor/src/preview-document.ts`; the demo path is a
compatibility re-export. `WorkspaceDocumentManager` owns state, history, and
revision persistence orchestration while the compiler owns the iframe document
boundary. The demo `BrowserWorkspace` supplies only seed files and its Dexie
repository.
The OpenRouter response/error transport contract is isolated in
`demos/bolt-style-editor/src/openrouter-protocol.ts`; `openrouter.ts` owns the
provider tool loop while the protocol module owns status classification, body
decoding, cancellation, and structured tool-result serialization.
The standalone provider payload is derived from the same `listAllTools(registry)`
result used for `tools/list`, through core's `toOpenAIToolDefinitions()` adapter.
It does not query a second registry export, so discovery names and schemas remain
the definitions sent to the model.
The example AI runner also returns the provider's complete `responseMessages`,
and the ToolContext AI and realtime web-coding showcases append those assistant
tool-call and tool-result messages to the next model turn. The visible chat
transcript remains a separate presentation projection.
The registry provider boundary remains in
`demos/bolt-style-editor/src/bolt-style-tool-context.ts`; workspace and preview
mutation handlers are isolated in `src/tool-handlers.tsx`. React orchestration
is split into focused hooks: `use-tool-execution` owns provider-neutral
execution, `use-workspace-folder-actions` owns folder boundaries,
`use-workspace-editor-actions` owns drafts and file mutations,
`use-tool-catalog-model` owns canonical `tools/list`, definitions, and catalog
filtering, while `use-tool-catalog-actions` owns tool-argument samples and
palette commands. The local `src/tool-catalog-contract.ts` aliases the
framework's `MCPToolDefinition` and `ToolAnnotations` for the view/action
boundary, so the catalog does not declare a second definition shape.
`use-workspace-keyboard-shortcuts` owns global commands, and
`use-studio-export-actions` owns copy/download exports. The shared
`use-confirmation-request` hook owns the promise-backed destructive confirmation
boundary. Browser-only runtime helpers such as revision guards, text patching,
escaping, and cancellation
remain in `src/tool-runtime-utils.ts`; views under `src/views/` receive data and
callbacks without owning workspace mutation policy. This keeps React editor
orchestration, tool registration, and workspace mutation contracts independently
reviewable without prematurely creating a public package.
The example Live Code Editor follows the same seam: its `actions/` hooks own
direct registry calls, provider settings, trace exports, and the
provider-facing agent loop; `hooks/useLiveEditorObservables.ts` owns trace
subscription, `hooks/useLiveEditorWorkspaceObservables.ts` owns
workspace/document subscriptions and filesystem capability state, and
`actions/useLiveEditorWorkspaceActions.ts` owns IndexedDB hydration, editor
persistence, folder import/save, file selection, and reset commands.
`actions/useLiveEditorDocumentActions.ts` owns document source/scenario
mutations and preview acknowledgements. The `LiveEditorAIToolbar.tsx` renders
the catalog, results, trace, and callbacks.
The standalone Vite config resolves the workspace `core`, `react`, and
`mutative` packages from source, so its dev server does not require a stale
intermediate `packages/*/dist` artifact before the page can boot.
Production builds are checked with `scripts/verify-web-coding-build.mjs` both
before and after they are copied into the GitHub Pages `/web-coding/` directory;
the check validates the base path, compiled entry assets, transitive JavaScript
chunk references, CSS asset references, and path-safe file existence.
The standalone verification command also serves the built output through Vite
preview and opens `/context-action/web-coding/` in a browser, proving that the
base path, lazy editor chunk, tool catalog, and preview render together after
the production build.

The standalone top-bar settings dialog stores the user-owned API key under the
shared, same-origin `context-action.openrouter.api-key` browser key used by the
example demos. Same-origin tabs and locations update their provider controls
live through the storage subscription; local development servers on different
ports intentionally have separate browser storage and require separate entry.
It also persists the selected model and chat-completions endpoint. When the key
is present, chat requests use OpenRouter's native tool-call loop; when it is
absent, the same surface uses the deterministic local agent. The key is sent
directly from the browser to the configured endpoint and is never bundled or
sent to a Context-Action server.
If the browser blocks or cannot write `localStorage`, both provider surfaces
keep a session-only in-memory fallback for the current tab; cross-page key reuse
still requires browser storage to be available.
While an agent run is active, `Cancel` aborts the provider request, registry
execution, and any preview acknowledgement wait. Cancellation is shown as a
user-visible assistant message instead of a misleading tool success.
The deterministic local fallback follows the same inspection boundary for
mutations: it calls `workspace.getStatus`, then `workspace.listFiles` and
`workspace.readFile` for text mutations when a file target is known, before
applying the mutation.
Mutation tool results wait for the queued Dexie write after the preview
acknowledgement, so an immediate browser reload cannot race a rename, source
write, undo, or redo and restore stale workspace state.
For a download request without an explicit path, it resolves the current
`activePath` to `workspace.downloadFile`; it asks for a path only when no active
workspace file exists.
The example live editor exposes the same boundary: its `Run editor toolchain`
control becomes `Cancel editor toolchain` while the browser-side OpenRouter
request is active and forwards the abort signal through the provider-neutral
runner contract. The realtime web-coding showcase uses the same signal for its
local agent, model request, and palette tool paths; leaving either route also
aborts an in-flight execution.
The example workspace reset uses the same explicit approval principle as the
standalone studio: an accessible in-app dialog resolves the destructive intent
before the reset command replaces the IndexedDB showcase files.

The standalone chat keeps failed and cancelled executions as typed UI states.
Retryable provider or local-tool errors and failed palette samples with a
retryable result show a `Retry` action that reuses the original prompt or tool
arguments. Non-retryable execution and policy errors do not offer a misleading
retry, while cancellation is shown as cancelled rather than failed.
The composer also exposes prompt recipes for visual changes, workspace status,
file creation, the explicit folder save and reload boundaries, and folder
disconnection; each recipe enters the same local-agent planning and approval
path as free-form text.
The example ToolContext AI demo keeps provider failures inline as an alert,
restores the failed prompt in the composer, and leaves the saved key and model
controls available so a corrected configuration can be submitted again.
When the standalone studio has a configured key but receives a configuration,
authentication, access, or invalid-response failure, it also keeps that shared
key intact and offers `Use local agent & retry` for the same prompt. This is a
one-request provider bypass: the retry runs through the canonical local-agent
tool boundary without issuing another OpenRouter request, and the chat badge
shows the active local mode while it runs.

The standalone OpenRouter bridge parses the response body as text before JSON
decoding, so a misconfigured endpoint cannot leak a browser `Response.json()`
exception into the chat. It classifies 401/403 as non-retryable authentication or
access errors, 429 and 5xx responses as retryable provider errors, and network
failures as retryable. Each provider failure carries an explicit
`OPENROUTER_*` code in the user-visible message. If a model returns malformed
or non-object JSON in `function.arguments`, the bridge rejects it before
registry execution as retryable `OPENROUTER_INVALID_TOOL_CALL`; it never
silently converts the payload to `{}` where a no-argument tool could run.
The bridge retries transient 429/5xx responses and network failures at most
twice with a bounded, abortable backoff; authentication/access errors,
malformed successful responses, and tool execution failures are surfaced
immediately for explicit user recovery. The running status exposes the current
retry attempt while that backoff is active. Each provider request also has a
bounded timeout; timeout failures keep the `OPENROUTER_TIMEOUT` code and use
the same limited retry path without confusing them with user cancellation. A
successful response is also checked before the model loop: tool calls must have
function type, non-empty unique IDs, a function name, and string JSON
arguments. Missing or duplicate IDs and malformed function records become the
non-retryable `OPENROUTER_INVALID_RESPONSE` error instead of reaching
`tools/call` with an ambiguous correlation.
The loop is bounded to five provider turns and twelve total tool calls per
run. A response that would exceed the total call budget is rejected before any
call in that response executes as non-retryable `OPENROUTER_TOOL_CALL_LIMIT`;
this keeps a malformed or over-eager model from causing an unbounded sequence
of workspace mutations. The response decoder also requires the assistant
message role and string-or-null content, rather than trusting a structurally
similar provider message.
Tool results are serialized at this boundary as well: a handler that
accidentally returns a non-JSON value becomes `TOOL_RESULT_SERIALIZATION_FAILED`
inside the next provider message instead of aborting the model loop with a
raw `JSON.stringify` exception. The bridge first applies `isToolCallResult()`;
an invalid result shape becomes `TOOL_RESULT_VALIDATION_FAILED` before
serialization is attempted.

## Standard contract

Core `tool-protocol.ts` preserves provider-neutral execution metadata:

- `ToolCallId` correlates a model call with its result
- `ToolCallContext` carries transport `source`, execution `mode`, `sessionId`,
  and `revision`
- `isToolListRequest()` and `isToolCallRequest()` validate untrusted JSON before
  it enters the registry boundary
  (`undefined` means no optional list request; `null` is rejected)
- `isToolListResult()` validates each discovery page before `listAllTools()` adds
  its definitions to a provider adapter
- `isToolCallResult()` validates text content, correlation IDs, and structured
  error metadata before an adapter forwards a tool result
- `ToolCallError` provides stable `code`, `message`, `retryable`, and `details`
- `ToolCallEvent` exposes `started`, `completed`, and `failed`
- Each `ToolCallEvent` carries the canonical `tools/call` request so an audit
  observer can correlate arguments with the eventual result
- An action's optional `outputSchema` validates structured handler results before
  they are returned; invalid output becomes `TOOL_OUTPUT_VALIDATION_FAILED`

Core exports `TOOL_CALL_ERROR_CODES` and `ToolCallErrorCode` for the canonical
managed-call codes. Applications can still attach domain-specific codes when a
handler needs to report a workspace or product-specific failure.

`createToolContext` can set `toolListPageSize` for large catalogs. Canonical
`toToolListRequest({ cursor })` requests passed to `listTools()` then return an opaque
`nextCursor`; direct `listTools()` calls and provider batch exports remain the
complete catalog. Provider adapters that need complete paged discovery use the
core `listAllTools()` helper, which follows `nextCursor` and rejects a repeated
cursor.

The standalone workspace, realtime web-coding, and Live Code Editor catalogs use
this same output contract for file reads, mutations, preview acknowledgements,
and save results. Their catalog definitions therefore describe both what a
model may send and what the next model step may safely consume.
Within the example app, `live-tool-result-contract.ts` is the narrow shared
boundary for preview acknowledgement validation and result metadata assembly:
the two-revision editor uses `createLiveEditorResultContext`, while the
single-revision realtime workspace uses `createLiveWorkspaceMutationResult`.
Handlers still own domain state and side effects; the helper only prevents the
output schema and returned metadata from drifting between tool surfaces.
The standalone demo applies the same separation in
`src/tool-result-contract.ts`: handlers provide the current snapshot and the
pure helper returns persistence and revision metadata without reading state.
The example's `tool-result-format.ts` likewise provides the single pure
presentation adapter for local palette and agent messages; it does not execute
tools or reinterpret the registry contract.
The dedicated `mcp-function-calling-catalog.ts` now keeps prompt recipes for
the UI, standalone workspace, Live Code Editor, and realtime web-coding
surfaces under one `MCPCommandReference` shape; `example check` validates each
recipe against its real ToolContext schema.
The standalone Web Studio mutation and preview results also carry the current
`storageMode` and optional bounded `storageError`. A model can therefore tell
whether a successful preview is backed by IndexedDB or is session-only memory
without making a second status call.

React ToolContext adds runtime scope:

- `allowedToolNames`: an allowlist applied to both discovery and execution
- `toolPolicy`: an `allow`, `ask`, or `deny` decision
- `onToolCall`: lifecycle observer for traces and audit UI

In strict mode, `tools/call` arguments are validated before `toolPolicy` runs.
Invalid model input returns `TOOL_VALIDATION_FAILED` with schema issues and
never opens an approval prompt or reaches a handler. `warn` and `silent` modes
retain the existing permissive dispatch behavior.

`toolPolicy` also receives the call `AbortSignal`, so an approval or policy
wait cannot outlive a cancelled provider request. The same signal is forwarded
through registry handlers and preview waits; cancellation at any of those
boundaries returns the retryable `TOOL_CANCELLED` result.

Provider-specific filtered exports (`toMCPFiltered`, `toOpenAIFiltered`, and
`toAnthropicFiltered`) use the same allowlist boundary. A tool that is hidden
from `tools/list` cannot be reintroduced into a provider payload by selecting
its name directly.

When a blocking handler fails, ToolContext preserves its error message and
handler ID in the `tools/call` structured error message/details. The UI and
model therefore receive the concrete validation or workspace cause instead of
only a generic `Tool call failed` response.
Handlers may additionally attach `code`, `retryable`, and `details` metadata to
their thrown Error. ToolContext preserves that metadata in the canonical result
instead of flattening it into `TOOL_EXECUTION_FAILED`; the standalone workspace
uses this for retryable revision conflicts, terminal source-limit errors, and
stale local-folder handles. If a folder disappears during reload, save, or
delete, the adapter clears the persisted File System Access handle and returns
`WORKSPACE_FOLDER_STALE` with `retryable: true`, allowing the model to request a
reconnect before retrying. The `saveAll` handler preserves that metadata when it
adds its partial-completion summary, and the chat exposes a `Reconnect folder`
action so recovery does not depend on finding the folder controls manually. A
browser-only save uses `WORKSPACE_FOLDER_NOT_CONNECTED`; a permission refusal
uses `WORKSPACE_FOLDER_PERMISSION_DENIED`. Both are retryable and expose the
operation in `details`, while the chat chooses folder reconnect or permission
granting as the corresponding recovery action.

Preview mutation handlers use `PREVIEW_TARGET_NOT_FOUND` when an HTML/CSS
target is absent, rather than asking the model to repeat an impossible patch.
Iframe runtime failures, acknowledgement timeouts, and superseded revisions
are preserved as `PREVIEW_RUNTIME_ERROR`, `PREVIEW_ACK_TIMEOUT`, and
`PREVIEW_REVISION_SUPERSEDED`; timeout and superseded-revision results are
retryable and expose a `Refresh preview` chat action. Local agent requests and
palette/quick-tool calls use the same recovery policy, including folder reconnect,
permission grant, preview refresh, and revision re-read actions.

Workspace path and state errors are also explicit: `WORKSPACE_PATH_INVALID`,
`WORKSPACE_FILE_NOT_FOUND`, `WORKSPACE_FILE_CONFLICT`,
`WORKSPACE_FILE_TYPE_CONFLICT`, `WORKSPACE_PATCH_NOT_FOUND`,
`WORKSPACE_NO_SUPPORTED_FILES`, `WORKSPACE_EMPTY`,
`WORKSPACE_ACTIVE_FILE_NOT_FOUND`, `WORKSPACE_PREVIEW_ENTRY_REQUIRED`,
`WORKSPACE_FOLDER_STATE_CONFLICT`, and `WORKSPACE_HISTORY_EMPTY` are
non-retryable and include the operation or path in `details`. A patch miss
includes only the path, occurrence mode, and search length; it never echoes
source or search content into the tool error. Structural workspace failures
also explain which invariant blocked the operation. Read, open, and download tools
are registered as blocking handlers, ensuring a failed lookup is returned as a
structured tool error instead of being passed to output-schema validation as an
empty success.
Revision changes detected during `saveAll` or `saveCheckpoint` retain the
retryable `WORKSPACE_REVISION_CONFLICT` code with expected/current revisions and
the operation, including when a partial-save summary is added.

The standalone OpenRouter bridge forwards the canonical error `code`,
`retryable` flag, and `details` into the next model message. A local run shows
the same code and details in the assistant transcript, keeping provider and
offline fallback behavior aligned.

`destructiveHint` is metadata for model and UI guidance. In this demo it marks
file deletion and revert samples so the palette asks for explicit confirmation.
Authorization must still be enforced by `toolPolicy`.

The standalone studio and realtime web-coding route render the same boundary as
an execution trace. Local and OpenRouter requests use the canonical
`tools/list` discovery (the paginated `listAllTools()` helper delegates to
`registry.listTools()`) before provider-specific tool serialization. The ToolContext `onToolCall`
observer then records each `started`, `completed`, and `failed` event with its
source, duration, and result status. The trace is UI state only; it never sends
file contents or filesystem handles to the model. `Clear` resets that local trace
view without changing workspace files, tool registry state, or provider history;
it is disabled while an execution is active so the in-flight lifecycle remains
visible.
The standalone `agent.request` row now surrounds the same run and records
running, completed, failed, or cancelled status, so a provider failure remains
visible even when no `tools/call` was reached.
Each agent run creates one `sessionId` and forwards it through `tools/list` and
every `executeModelToolCall()` context. The trace therefore separates the
provider per-call `toolCallId` from the run-level session correlation, which
remains available in the compact row tooltip and copied trace JSON. It also
preserves the context `source` and `mode` on call rows and approval snapshots,
so transport origin and agent/direct intent remain auditable together. It also
assigns every lifecycle a unique internal `traceId`, correlating
`started`/`completed` events by the canonical request object and session queue;
failed calls retain their structured `retryable` flag, and the compact row
labels the provider call ID plus `retryable` or `terminal` recovery state.
provider IDs may therefore be reused across model turns or omitted without
overwriting another row. Local fallback and OpenRouter use the same correlation
contract.
Approval requests expose the same session marker, and direct palette calls create
their own session so manual execution is still auditable without an agent row.
Call rows expose a bounded `tools/call` detail view with the canonical arguments
and result. File-like `source`, `search`, and `replace` values are redacted to a
character count, so the trace can explain the call without copying file contents
into the UI. The compact row still shows safe result summaries such as file
count, path, theme, or revision, and shows both the provider `toolCallId` (when
present) and internal `traceId`; the full values are available as the row
tooltip. The trace panel's `Copy` action exports the
same bounded, already-redacted entries as JSON, making a `tools/list` → call →
result example reusable in documentation or external tests without exposing
workspace source.
The example realtime web-coding and Live Code Editor traces keep the same
minimum protocol fields: catalog or agent discovery adds a `method: 'tools/list'`
row, while registry
lifecycle events use `method: 'tools/call'`. Each call row also shows `source`
and `mode`, so `local · agent`, `model · agent`, and `local · direct` executions
remain distinguishable in the same UI.
Once more than one session is present, both example panels expose the same
session selector and narrow only the visible rows; Copy, Download, and Clear
continue to operate on the full bounded trace.
The prompt execution itself is also wrapped in a `method: 'agent.request'` row
with `running`, `completed`, `failed`, or `cancelled` status. A provider failure
before a tool call, or a user cancellation, therefore remains visible as a run
instead of disappearing from the trace.

The realtime web-coding workspace exposes a monotonic workspace revision from
`web.getWorkspace` and `web.readFile`. All mutating `web.*` tools accept the
optional `expectedRevision`, reject stale edits before changing source, and
return the new workspace revision after the preview acknowledgement. This
keeps full-file writes, visual helpers, and bounded `web.applyPatch` on one
optimistic-concurrency contract.

Direct palette actions use the canonical `registry.callTool()` bridge so their
`local` source is preserved. The deterministic local agent routes its planned
calls through `executeModelToolCall()` with a `local-fallback` provider marker;
this keeps the offline demo on the same `model → tools/call` boundary and the
same approval policy as provider model calls. Direct palette samples remain
explicit local actions.

The sidebar tool catalog reads each canonical `getToolDefinition()` result
directly, so the displayed description, default model/MCP policy summary,
annotations, JSON input schema, and optional structured `outputSchema` are the
same canonical contract exported to MCP and enforced at the result boundary.
OpenAI-compatible/OpenRouter payloads
use their provider-specific input-function projection; the registry still
validates the structured result after every provider call. Selecting a catalog
row only inspects that definition; a separate `Run sample` control is required
to execute its demo arguments, so browsing a destructive tool cannot mutate the
workspace accidentally. Catalog search and scope filters narrow the same
canonical list without changing discovery or execution policy. Scope counts are
derived from canonical annotations and namespaces: all, read-only, workspace,
and preview. `Copy list` serializes the complete `tools` array returned by
`registry.listTools(toToolListRequest())`, so the catalog can be pasted into
an MCP/provider test without reconstructing definitions by hand. `Download list`,
`Download definition`, and `Download tools/call` provide the same contracts as
JSON files when browser Clipboard permissions are unavailable. The sample
argument editor refreshes only untouched generated samples when selection or
workspace revision changes; once the user edits the JSON, custom arguments are
preserved so stale-revision and validation cases can be tested deliberately.

For the standalone demo, model- and MCP-originated non-read-only calls pause at
the `toolPolicy` boundary until the user approves or denies them. Only an
explicit non-prompt local palette action bypasses that gate. The approval card
shows the tool name, description, source, and argument keys; it never
echoes the file source. It may show a safe argument preview such as a target
`path` or `theme`, but never the file `source`. Prompt-originated local mutations
use the same approval round trip, while direct palette calls remain deterministic
local actions.

## iframe rules

The iframe is limited to:

- preview rendering
- receiving document revisions and reporting apply status
- handling a restricted bridge message set

The iframe must not own the ToolRegistry or model API key. The current showcase
exposes `editor.getStatus`, `editor.listFiles`, `editor.openFile`, `editor.saveFile`, and
`editor.saveAll` for the browser workspace,
alongside `editor.getDocument`, `editor.setDocument`, `editor.setScenario`, and
`editor.resetDocument`, plus `editor.getPreviewStatus`. `editor.getStatus` is
read-only and returns separate workspace/document revisions, persistence mode,
preview state, dirty paths, and local-folder connection status. `editor.listFiles`
is read-only and returns the active path, workspace revision, storage mode, dirty
paths, and file metadata. `editor.openFile` selects a text file and waits until
the matching preview revision is rendered; binary files are rejected. Every
preview-aware editor mutation returns `activePath`, `workspaceRevision`,
`documentRevision`, and the acknowledged `preview` result. File-save results
return the same workspace/document revision context together with `dirtyPaths`.
This keeps the two revision clocks explicit at the tool-result boundary. Do not
expose an arbitrary `runScript` tool.

`editor.saveFile` is a separate destructive boundary: it writes the selected
text file through the parent-owned filesystem adapter, requires a writable
folder opened by the user, and clears that path's filesystem-dirty state only
after the write succeeds. Live Editor handlers are registered as blocking
pipeline steps, so thrown validation, filesystem, and preview errors become
failed `tools/call` results instead of being reported as successful no-op calls.
`editor.saveAll` applies the same boundary to every dirty text path in a
deterministic sequence. If a later file fails, already-written files stay clean
and the remaining paths stay dirty so the caller can retry without losing the
partial-save state. The standalone workspace marks each successful file or
deletion immediately after its filesystem operation, and the failure message
lists the completed paths so a retry can be scoped to the remaining changes.

The standalone editor implements the same boundary with a small injected
bridge. The sandbox posts `context-action.preview.ready` or
`context-action.preview.error` with the document revision. The parent accepts
messages only from the current iframe window, ignores stale revisions, and
visual mutation tools wait for the matching acknowledgement before reporting
success. The bridge suppresses the ready message after the first runtime or
unhandled-rejection error for that revision, so an errored document cannot be
reported as synchronized by a later `DOMContentLoaded` event.

## Package and repository boundary plan

The full Live Code Editor remains inside `example` because it is a showcase
surface, not framework runtime. The Bolt-style visual shell is isolated in
`demos/bolt-style-editor` so it can be deployed as a static page without
coupling its route to the example application. `@context-action/core` continues
to own the provider-neutral tool protocol, while `@context-action/react` owns
ToolContext and the registry.

The first extraction seam now exists as the private
`@context-action/live-code-editor` workspace package. It exports the
framework-neutral workspace, preview, and folder-import contracts consumed by
the standalone demo, plus the pure preview document compiler, workspace model
helpers, repository boundary, and stateful `WorkspaceDocumentManager`. The demo
still owns the Dexie `DirectoryHandlePersistence` implementation, while the
package owns the browser filesystem adapter and its public
`WorkspaceFileSystemAdapter` port. Consumers should depend on that port rather
than the browser adapter class when injecting folder import, permission, and
write behavior. The demo keeps the iframe runtime and editor adapters. Extract
those remaining browser-specific pieces only after
they have independent consumers and tests; decide whether to publish the
package only after the contract stabilizes.

The browser-owned OpenRouter API key has a separate, smaller seam in the
private `@context-action/openrouter-browser-storage` package. It owns the
canonical `context-action.openrouter.api-key` entry and same-origin change
subscription. The example's React hook and the standalone provider settings
both consume that package, so the key contract is defined once. This remains
origin-scoped browser storage: a local example page and a GitHub Pages deploy
cannot share localStorage directly, and no key is sent to a Context-Action
server.

The browser proof at `scripts/verify-example-openrouter-browser.mjs` opens the
Tool Context AI and Live Code Editor routes together and verifies both
same-origin storage events and clear behavior. Example `dev`, `build`, and
`build:fast` lifecycle hooks build this private storage package before Vite
resolves its workspace export, so a fresh checkout does not depend on a stale
`dist` directory.

The example keeps its existing Dexie repository and iframe bridge for showcase
compatibility, but `example/src/lib/live-code-editor-filesystem.ts` is now only
a Blob-oriented facade over the package adapter. It does not reimplement folder
traversal, path validation, limits, permission handling, or writes. This keeps
the example API stable while ensuring the standalone and example surfaces share
the same filesystem safety contract.

Consider a separate repository only when one or more of these conditions hold:

- the editor is reused by multiple products outside context-action;
- it needs an independent release and versioning cadence;
- editor-specific dependencies such as Monaco/Codemirror, bundlers, workers,
  or a sandbox service become substantial; or
- framework and editor teams need separate ownership or security operations.

The default extraction order is `example → standalone demo/workspace package → independent repository`.

## Current showcase editor tools

| Tool | Default policy | Purpose |
| --- | --- | --- |
| `editor.getStatus` | allow | Read workspace/document revisions, preview, persistence, and folder connection |
| `editor.listFiles` | allow | List workspace files, active path, storage mode, and dirty paths |
| `editor.openFile` | local demo allow | Select a text file and await its matching preview revision |
| `editor.saveFile` | approval required | Write a text file to the user-opened local folder |
| `editor.saveAll` | approval required | Write every dirty text file to the user-opened local folder |
| `editor.getDocument` | allow | Read the current document and revision |
| `editor.getPreviewStatus` | allow | Read the latest iframe acknowledgement |
| `editor.setDocument` | local demo allow | Replace controlled source text; never execute it |
| `editor.applyPatch` | local demo allow | Apply a bounded literal text patch and await the matching preview revision |
| `editor.setScenario` | local demo allow | Change the safe runner scenario |
| `editor.resetDocument` | local demo allow | Reset source to the selected example |

## Standalone Web Studio workspace catalog

| Tool | Policy | Purpose |
| --- | --- | --- |
| `workspace.getStatus` | allow | Read revision, persistence, preview, dirty paths, and folder connection |
| `workspace.listFiles` | allow | List files and per-file dirty state |
| `workspace.readFile` | allow | Read one text file with its current revision |
| `workspace.downloadFile` | approval required | Download one text file or Blob asset through the browser |
| `workspace.openFile` | allow | Select a workspace file in the editor and persist the active path |
| `workspace.createFile` | local demo allow | Create a normalized text file |
| `workspace.renameFile` | local demo allow | Rename a file while preserving its source and preview contract |
| `workspace.writeFile` | local demo allow | Replace one text file and refresh preview |
| `workspace.applyPatch` | local demo allow | Apply a bounded literal text replacement |
| `workspace.undo`, `workspace.redo` | local demo allow | Move through the workspace edit history with a revision guard |
| `workspace.deleteFile` | approval required | Delete one workspace file and retain a pending deletion |
| `workspace.revertFile` | approval required | Restore one file to its saved browser checkpoint |
| `workspace.saveAll` | approval required | Write dirty files and pending deletions to the linked folder, guarded by the current workspace revision |
| `workspace.saveCheckpoint` | local demo allow | Mark a browser-only checkpoint clean without writing to the local folder |
| `workspace.reloadFolder` | approval required | Re-read the connected folder and replace the browser workspace, guarded before and after the filesystem read |
| `workspace.disconnectFolder` | approval required | Stop local-folder sync while retaining the browser workspace |
| `workspace.reset` | approval required | Restore the browser-only demo workspace to its four-file seed; unavailable while a folder is linked |
| `preview.setTheme` | approval required | Change the controlled preview accent theme |
| `preview.addFeature` | approval required | Add a feature card through the preview contract |
| `preview.updateHero` | approval required | Update the controlled preview hero copy |
| `preview.getStatus` | allow | Read the latest sandbox preview acknowledgement |
| `preview.refresh` | approval for model/prompt calls; local direct allow for palette calls | Remount the sandbox iframe and await the current revision acknowledgement |

Every workspace mutation, preview acknowledgement, and save result includes
`storageMode` plus an optional bounded `storageError`, alongside its revision
and preview fields. This keeps a successful in-memory fallback explicit rather
than allowing a model to infer durable storage from a successful tool call.

`workspace.downloadFile` is also marked with the MCP `openWorldHint` because it
crosses the browser workspace boundary and creates a user-visible local
download; the approval policy remains the authoritative execution gate.

For the standalone surface, the status-aware sequence is:

```text
tools/list → workspace.getStatus → workspace.listFiles →
workspace.openFile (when a tab is requested) → workspace.readFile →
workspace.reset, workspace mutation, workspace.undo/redo, or preview.refresh → iframe acknowledgement → workspace.saveAll/saveCheckpoint (when requested)
```

When the user explicitly asks to refresh an already connected folder, the
status-aware branch is `workspace.getStatus → workspace.reloadFolder →
workspace.listFiles`; the reload replaces the browser workspace and therefore
remains behind the destructive approval policy.

The standard browser workspace call sequence is:

```text
tools/list → editor.getStatus → editor.listFiles → editor.openFile → editor.setDocument →
iframe acknowledgement → editor.saveFile/editor.saveAll (when filesystem persistence is requested)
```

The model discovers the available tools first, lists the workspace before
choosing a path, opens the selected text file, and only then performs a
bounded source mutation. Preview-aware editor results include the active path,
both revision clocks, and the preview acknowledgement so the caller can verify
that the parent workspace and iframe are synchronized.

Standalone workspace mutations use the corresponding single-clock result
contract: preview-aware results include `activePath`, `revision`, and
`preview`; `workspace.saveAll` includes `activePath`, the resulting `revision`,
and the saved/deleted path lists. Browser-only `workspace.saveCheckpoint` returns
the same path lists plus its storage mode and checkpoint status without claiming
an iframe refresh.

The realtime web-coding route exposes the parallel workspace contract:

| Tool | Default policy | Purpose |
| --- | --- | --- |
| `web.getWorkspace` | allow | Read files, active entry point, and workspace revision |
| `web.readFile` | allow | Read one text file and the current workspace revision |
| `web.applyPatch` | local demo allow | Apply a bounded literal patch with an optional revision guard |
| `web.writeFile` | local demo allow | Replace one text file with an optional revision guard |
| `web.setTheme`, `web.addFeature`, `web.updateHero` | local demo allow | Run controlled visual mutations with the same revision guard |

The example and standalone workspace now expose bounded patch contracts. The
example applies the patch to the current parent-owned document; the standalone
workspace applies it to an addressed workspace file. A production integration
must use an approval-capable `toolPolicy` before enabling destructive or broad
mutations.

## Code workspace boundary

The Live Code Editor now has a parent-owned workspace manager and a Dexie
repository in addition to the document manager:

```text
Open folder → generic FileSystemAdapter
           → Dexie (metadata + Blob files)
           → WorkspaceManager (text projection, activePath, dirtyPaths)
           → DocumentManager (active source + revision)
           → ToolContext / iframe preview
```

- Dexie is the canonical browser-local store for workspace metadata and file
  Blobs. Text source in the editor is a derived projection of the stored Blob;
  binary assets retain their Blob directly for preview.
- `Open folder` uses a generic file-system adapter. The current browser adapter
  uses the File System Access API from a user gesture and imports the folder
  into Dexie rather than making the directory handle the workspace owner.
- If a picked folder contains no supported files, the import fails without
  replacing the current Dexie workspace or its previously linked directory
  handle.
- Supported HTML, CSS, JavaScript, JSON, Markdown, TypeScript, and text files are
  imported with file-count, per-file, and total-size limits. Supported images,
  fonts, and WASM files are retained as Blob-backed, preview-only assets;
  unsupported files are reported in the chat.
- Imported paths containing NUL bytes or parent traversal segments are rejected
  as invalid entries instead of being silently rewritten to another workspace
  path.
- Opening another folder while browser-side edits are dirty requires explicit
  confirmation; cancelling preserves the current workspace. Reload applies the
  same empty-folder guard, so an empty connected directory cannot replace the
  workspace.
- Directory traversal stops once the file-count or total-byte limit is reached,
  while the import result retains one skipped-entry summary for that limit. It
  also stops after 2,000 scanned directory/file entries, and duplicate
  normalized paths are skipped so hostile or malformed uploads cannot create an
  unbounded diagnostics list.
- File-system handles stay behind the parent adapter and never enter tool
  payloads or iframe messages. Where supported, the adapter stores a handle in
  workspace metadata only so it can reconnect after reload.
- IndexedDB hydration repairs a stale active path by selecting the preferred
  HTML entry (or the first available file), and removes deletion markers that
  point at files already present. A partially persisted workspace therefore
  does not surface an impossible active tab or false pending deletion.
- The Explorer `Reload` action re-reads the connected directory through the
  same adapter and replaces the Dexie workspace through the canonical
  `workspace.reloadFolder` tool. It asks for confirmation when browser-side
  edits are dirty, preventing an external refresh from silently discarding
  them; model calls remain behind the destructive approval policy.
- Text edits are persisted to Dexie immediately. With a read/write directory
  handle, `Save to folder` writes the dirty text files back to the selected
  operating-system directory; upload-only imports remain browser-workspace-only.
  When the browser can structured-clone a directory handle, the handle is stored
  with workspace metadata and restored on the next load; write permission is
  still checked at the save boundary.
- The standalone registry separates `workspace.openFile`, `workspace.downloadFile`, `workspace.createFile`,
  `workspace.renameFile`, `workspace.writeFile`, `workspace.applyPatch`,
  `workspace.revertFile`, `workspace.undo`, `workspace.redo`, `workspace.deleteFile`, `workspace.saveAll`, `workspace.saveCheckpoint`, and
  `workspace.reloadFolder`, and `workspace.reset`:
  new text files are
  normalized, opened as the active editor tab, persisted as Blob-backed
  records, and included in the next folder save. Deletions remove the
  browser-local record immediately, retain a deleted-path checkpoint for
  `Save to folder`, and keep undo/redo and the active preview entry valid.
  Pending deletion paths are stored in Dexie metadata, so a reload does not
  silently lose the later operating-system folder deletion.
  The filesystem delete boundary is idempotent: if an external change already
  removed the target file or one of its parent directories, the save converges
  without failing on `NotFoundError`.
- `workspace.renameFile` preserves the source and Blob asset, changes the
  canonical path, updates the active tab when needed, and treats a saved source
  path as a pending deletion plus a new dirty path until `workspace.saveAll`
  commits the rename to the linked folder. Renaming an unsaved browser-only
  file does not create a false pending deletion. Supported HTML/CSS/JS and
  asset extensions remain type-safe, and the workspace cannot rename away its
  last HTML preview entry.
- `workspace.revertFile` restores the active file to the last saved browser
  workspace checkpoint. A renamed file retains its origin metadata so revert
  can restore the original path and source even after the browser workspace is
  reloaded. For an unsaved new file it removes that file; model calls remain
  behind the destructive policy and approval boundary.
- `workspace.undo` and `workspace.redo` are the canonical edit-history boundaries
  for the editor buttons and local/model calls. They require the current
  `expectedRevision`, move the browser workspace checkpoint, persist the
  resulting projection, and wait for the matching iframe acknowledgement. The
  in-memory history is bounded to the latest 100 checkpoints; source-edit
  navigation preserves the active tab while structural checkpoints restore the
  path required by the resulting file set.
- `preview.refresh` is the canonical preview-remount boundary for the Refresh
  button, tool palette, and explicit agent request. It keeps the workspace
  revision unchanged while resetting the iframe and waiting for the same
  revision to become acknowledged again.
- The editor's active-file Delete action routes through the same
  `workspace.deleteFile` registry contract as the palette and model loop;
  it does not introduce a second mutation path.
- `workspace.applyPatch` performs a literal bounded search/replace on a text file,
  supports `first` or `all` occurrence mode, rejects missing matches and oversized
  output, then waits for the same preview revision acknowledgement as other
  workspace mutations.
- Text mutations share one workspace-level source limit of 80,000 characters.
  `workspace.createFile`, `workspace.writeFile`, `workspace.applyPatch`, direct
  editor updates, and history restores all pass through the same guard, while
  tool schemas expose the same limit before a handler runs. Imported text files
  retain the separate filesystem import byte budget.
- The standalone code editor surfaces the same budget in its header as a live
  character count. Imported text that is larger than the mutation limit remains
  readable and is marked as over budget so it can be reduced before the next
  write instead of being silently truncated.
- The New file dialog applies the same budget to initial source and blocks an
  oversized create request before it reaches the registry, keeping UI-side
  feedback aligned with schema and workspace validation.
- The model-facing descriptions for `workspace.createFile`,
  `workspace.writeFile`, and `workspace.applyPatch` repeat the shared source
  budget, so `tools/list` communicates the constraint before a provider emits a
  `tools/call` request.
- `workspace.saveAll` is the explicit filesystem boundary for the standalone
  demo. It writes all dirty files and pending deletions through the same
  parent-owned adapter used by the Save to folder button. Each successful
  operation is marked clean immediately, while the full IndexedDB checkpoint
  is marked clean only after every operation succeeds. The checkpoint is
  revision-guarded, so edits made while the folder write is in flight remain
  dirty instead of being overwritten by a stale clean state. If the linked
  folder disappears during a write, the adapter clears the persisted handle
  and keeps the browser workspace available for opening another folder.
  Without a writable folder it returns a failed tool result.
- `workspace.saveCheckpoint` is the browser-only save boundary. It marks the
  current IndexedDB checkpoint clean without writing an operating-system folder
  and fails while a writable folder is linked, so the two save semantics cannot
  silently cross. Its asynchronous persistence step re-checks the captured
  revision before marking the checkpoint clean, so a concurrent edit remains
  dirty.
- `workspace.reloadFolder` is the explicit external-refresh boundary. It reads
  the connected folder through the parent adapter, replaces the Dexie-backed
  browser workspace, re-checking the captured revision after the adapter read
  and before the import boundary, waits for the new preview revision, and
  reports skipped files plus the resulting local-folder status. It fails when
  no writable folder is connected.
- `workspace.reset` is the repeatable-demo recovery boundary. It is available
  only for a browser-only workspace, replaces the Dexie projection with the
  four-file seed, waits for the matching preview acknowledgement, and refuses
  to run while a writable folder is linked so it cannot accidentally stage the
  seed for a filesystem save. Once the user confirms the discard, the editor
  skips its pending draft flush and replaces the browser workspace directly;
  the import boundary re-checks the captured revision after pending persistence
  work has drained.
- When a writable folder is linked, the Explorer `Save to folder` button and
  `⌘/Ctrl+S` shortcut call this same `workspace.saveAll` registry path, so the
  UI save, model call, approval policy, trace, and structured result stay
  aligned. Browser-only `Save` only advances the local browser checkpoint.
- `workspace.getStatus` is the read-only status boundary for the standalone
  catalog. It reports the current revision, persistence mode, preview state,
  dirty/deleted paths, undo/redo capabilities, and explicit filesystem
  capabilities (`permission`, `saveAllAvailable`, and `reloadAvailable`); this
  lets a model inspect the local-folder permission and edit-history boundaries
  before mutating them.
- `workspace.readFile` returns the current workspace revision. Callers can pass
  that value as `expectedRevision` to any workspace mutation
  (`reset`, `createFile`, `renameFile`, `deleteFile`, `writeFile`, `applyPatch`,
  `revertFile`, `saveCheckpoint`, `saveAll`, or `reloadFolder`); a stale
  revision is rejected before the source is changed, requiring the caller to
  read again.
- All workspace file lookups canonicalize slash direction and harmless `.`
  segments at the tool boundary; parent traversal and empty paths are rejected.
  Preview references also decode URL-encoded local paths before resolving them,
  so folder files containing spaces remain runnable.
- The local demo agent also recognizes two quoted strings in a replacement request
  and routes it through `workspace.applyPatch`, so the exact-text mutation path can
  be demonstrated without an external model key. It captures the planned workspace
  revision before approval, so edits made while approval is pending are rejected
  instead of being overwritten. The standalone chat labels this specific revision
  conflict as `Re-read & retry`, which runs the inspection preflight again before
  asking for approval on the current workspace revision.
- For visual requests, the same local fallback recognizes quoted hero title/subtitle
  and feature-card title/description values and passes them to the typed
  `preview.updateHero` or `preview.addFeature` call; it does not confuse those copy
  values with an exact source patch unless the prompt names a workspace path.
- The `Save` button and `⌘/Ctrl+S` shortcut use the same save boundary; the
  shortcut is disabled while the settings, New file, or Rename file modal is
  being edited.
- The OpenRouter, New file, Rename file, and destructive-action confirmation
  dialogs are keyboard-modal: `Escape` closes the active dialog, `Tab` wraps
  within its controls, body scrolling is locked while it is open, and closing
  restores focus to the trigger. Clicking the backdrop also dismisses the
  dialog. Folder replacement, browser reset, file deletion/revert, and
  destructive palette samples all use this in-app confirmation surface rather
  than a native `window.confirm`, so the decision remains visible and testable.
- The source editor keeps syntax highlighting and editing in one overlay surface
  for HTML, CSS, JavaScript, TypeScript, JSON, and Markdown files, carrying
  HTML and CSS/JavaScript block-comment state across lines so multiline source
  remains visually coherent while it is edited.
  Keystrokes stay in a responsive local draft while the user is typing; idle,
  blur, and tool/save boundaries flush that draft through `workspace.writeFile`
  so source mutation and preview refresh still use the canonical registry path.
  `⌘/Ctrl+F` opens in-file search, `Enter`/`Shift+Enter` move through
  case-insensitive matches, `⌘/Ctrl+G` also moves between matches, and `Esc`
  returns focus to the source. The editor header exposes the current line,
  column, and total line count.
- `⌘/Ctrl+Shift+F` opens workspace-wide search across text files. Results are
  capped at 80 lines, show `path:line` plus a compact preview, and selecting a
  result activates that file without changing its source.
- Direct source editing is temporarily disabled while an agent/tool chain is
  running. The approved expected revision remains authoritative during that
  interval, preventing manual edits from racing an approved mutation.
- The chat history uses a bounded scroll region and follows the latest entry,
  keeping approval, error, retry, and tool-result feedback visible without
  expanding the editor indefinitely.
- The status bar distinguishes browser-persisted edits from edits that still
  need to be written to a linked local folder. It also guards an editor draft
  that is still inside the debounce window before its Dexie write completes.
  Once a browser-only draft has been persisted, closing the tab does not show a
  misleading filesystem warning; linked-folder edits still install a
  `beforeunload` guard so the explicit `Save to folder` boundary cannot be
  silently skipped.
- Workspace search overlays any draft still held by the editor over the
  persisted snapshot, so a search performed during the debounce window sees
  exactly the source currently visible in the editor.
- The editor `Download` action routes through `workspace.downloadFile`, so text
  sources and Blob assets share the same trace, approval, and structured result
  contract while upload-only imports can still be taken back to local files.
- The Explorer's New file dialog similarly routes through
  `workspace.createFile`; validation failures stay in the tool result path and
  remain visible inside the dialog and do not close it, while successful creation
  selects the new tab. The Explorer and editor tabs also show per-file unsaved
  markers.
- The Explorer's Rename action similarly routes through `workspace.renameFile`,
  keeps the source intact, rejects duplicate or incompatible paths in the tool
  result, and keeps the dialog open so the path can be corrected.
- Explorer rows, editor tabs, and workspace-search results route file selection
  through `workspace.openFile`, so active-path persistence and the visible
  `tools/call` trace do not depend on a second direct state mutation path.
- A linked folder can be explicitly disconnected from the Explorer. This clears
  the persisted directory handle without discarding the browser workspace, so
  a stale or unintended folder can be left in browser-only mode before another
  folder is opened.
- The Explorer derives a sorted nested tree from each normalized file path.
  Directory rows can be collapsed or expanded without changing workspace data,
  while file selection continues to resolve to the full `activePath`.
- For a runnable workspace, `index.html` is preferred; otherwise the first
  `.html` file becomes the entry point. Relative local `.css` and `.js`
  references are inlined and executed inside the sandboxed iframe. Local CSS
  `@import` chains are inlined recursively with media conditions preserved,
  while each imported stylesheet keeps its own relative asset base; cyclic or
  excessive import graphs are cut off with bounded diagnostics.
  Module scripts also rewrite local JavaScript `import`, `export ... from`, and
  dynamic `import()` specifiers to stable workspace module specifiers. A
  sandbox-local Blob module bootstrap and import map then resolves those
  specifiers, preserving native module execution including cyclic graphs.
  Missing local and external imports become bounded module errors, while bare
  package specifiers remain visible to the browser and are reported as
  unsupported module diagnostics. The same bounded module graph is inspected
  before the iframe runs, and graph-limit diagnostics identify imports that
  were intentionally not traversed.
- Missing local CSS/JS/asset references, blocked external stylesheet/script
  references, and unsupported bare module specifiers appear in the parent
  Preview diagnostics panel and in the
  structured `preview.getStatus` result, so a model can explain an incomplete
  preview instead of reporting a false success.
- If an imported workspace has no HTML entry, the preview renders a diagnostic
  card explaining that `index.html` or another `.html` file is required instead
  of showing a blank iframe.
- Visual tools resolve the selected HTML entry and the preferred stylesheet
  from the workspace path, so imported `src/index.html` layouts do not depend on
  root-level filenames. If a workspace does not expose the expected target,
  the tool returns an explicit error instead of reporting a false success.
- External CSS/JS URLs and arbitrary `runScript` requests are blocked by the
  preview boundary. Local asset references are rewritten to short-lived object
  URLs, and the URLs are revoked when the workspace preview changes.
- Unsupported folder-picker browsers use the directory-upload fallback; if
  IndexedDB itself is unavailable, the imported workspace remains in memory
  instead of being sent to a server.

## Build order

1. Preserve tool IDs, error codes, and source context.
2. Apply allowlist and policy to discovery and execution.
3. Record parallel calls and failures through the lifecycle observer.
4. Implement the parent-owned `WorkspaceDocumentManager` against the
   framework-neutral `WorkspaceRepository` boundary.
5. Add the demo-owned Dexie workspace repository and inject its directory-handle
   persistence into the package filesystem adapter.
6. Keep the revision-aware preview bridge and acknowledgement contract aligned
   with the DocumentManager.
7. Forward `toolCallId` and abort signals from the model adapter to the Registry,
   with a user-visible cancellation path.
8. Run `scripts/verify-web-coding-browser.mjs` to prove the standalone source
   editing and syntax-highlighting surface plus the
   `tools/list → call → result` and approval-to-preview path in a real browser.
   The same proof reloads the page and checks Dexie-backed source and preview
   restoration; pass `WEB_CODING_URL` when checking an already-running server.
9. Keep destructive workspace tools approval-gated for model calls and make
   explicit folder deletion part of the user-triggered save boundary.

## Acceptance criteria

- Prototype names such as `toString` and `constructor` cannot execute as tools.
- Parallel results remain correlated by `toolCallId`.
- Validation and policy failures return structured errors the model can read.
- The iframe rejects stale document revisions.
- Destructive tools cannot run without policy approval.
- Model-originated mutation calls cannot pass the policy boundary without an
  explicit approval or denial.
