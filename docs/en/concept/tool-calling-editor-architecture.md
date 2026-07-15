# Tool Calling Editor Architecture

A browser-based live editor keeps the canonical Tool Registry, policy, and call trace in the parent document. The iframe is a preview and document bridge, not the tool runtime.

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
`web.*` tool palette, an optional OpenRouter model loop, and a sandboxed iframe
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
memory workspace. `Open folder` now uses a parent-owned browser adapter: it
prefers the File System Access API and falls back to a directory-upload input,
then replaces the Dexie workspace with the imported text files. When the user
grants read/write access, the adapter retains the directory handle only in the
parent and `Save to folder` writes dirty files back to that directory; the
directory-upload fallback remains browser-workspace-only.

The standalone top-bar settings dialog stores the user-owned API key under the
shared `context-action.openrouter.api-key` browser key used by the example
demos. It also persists the selected model and chat-completions endpoint. When
the key is present, chat requests use OpenRouter's native tool-call loop; when
it is absent, the same surface uses the deterministic local agent. The key is
sent directly from the browser to the configured endpoint and is never bundled
or sent to a Context-Action server.
While an agent run is active, `Cancel` aborts the provider request, registry
execution, and any preview acknowledgement wait. Cancellation is shown as a
user-visible assistant message instead of a misleading tool success.

## Standard contract

Core `tool-protocol.ts` preserves provider-neutral execution metadata:

- `ToolCallId` correlates a model call with its result
- `ToolCallContext` carries `source`, `sessionId`, and `revision`
- `ToolCallError` provides stable `code`, `message`, `retryable`, and `details`
- `ToolCallEvent` exposes `started`, `completed`, and `failed`

React ToolContext adds runtime scope:

- `allowedToolNames`: an allowlist applied to both discovery and execution
- `toolPolicy`: an `allow`, `ask`, or `deny` decision
- `onToolCall`: lifecycle observer for traces and audit UI

When a blocking handler fails, ToolContext preserves its error message and
handler ID in the `tools/call` structured error message/details. The UI and
model therefore receive the concrete validation or workspace cause instead of
only a generic `Tool call failed` response.

`destructiveHint` is metadata for model and UI guidance. In this demo it marks
file deletion and revert samples so the palette asks for explicit confirmation.
Authorization must still be enforced by `toolPolicy`.

The standalone studio renders the same boundary as an execution trace. Local
and OpenRouter requests call `registry.listTools({ method: 'tools/list' })`
before provider-specific tool serialization. The ToolContext `onToolCall`
observer then records each `started`, `completed`, and `failed` event with its
source, duration, and result status. The trace is UI state only; it never sends
file contents or filesystem handles to the model. `Clear` resets that local trace
view without changing workspace files, tool registry state, or provider history.

Local agent and palette actions use the canonical `registry.callTool()` bridge
so their `local` source is preserved. Prompt-originated local mutations carry an
`interaction: prompt` metadata marker and use the same approval boundary as
model calls; direct palette samples remain explicit local actions. Provider model
calls use `executeModelToolCall()` and are subject to the model approval policy.

The sidebar tool catalog reads each canonical `getToolDefinition()` result
directly, so the displayed description, annotations, and JSON input schema are
the same contract exported to MCP and OpenRouter. Selecting a catalog row only
inspects that definition; a separate `Run sample` control is required to
execute its demo arguments, so browsing a destructive tool cannot mutate the
workspace accidentally. The catalog filter narrows the same canonical list
without changing discovery or execution policy.

For the standalone demo, model-originated non-read-only calls pause at the
`toolPolicy` boundary until the user approves or denies them. The approval card
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
exposes `editor.getDocument`, `editor.setDocument`, `editor.setScenario`, and
`editor.resetDocument`, plus `editor.getPreviewStatus`; each mutating handler
updates the parent DocumentManager and waits for the matching iframe revision
acknowledgement before returning its tool result. Do not expose an arbitrary
`runScript` tool.

The standalone editor implements the same boundary with a small injected
bridge. The sandbox posts `context-action.preview.ready` or
`context-action.preview.error` with the document revision. The parent accepts
messages only from the current iframe window, ignores stale revisions, and
visual mutation tools wait for the matching acknowledgement before reporting
success.

## Package and repository boundary plan

The full Live Code Editor remains inside `example` because it is a showcase
surface, not framework runtime. The Bolt-style visual shell is isolated in
`demos/bolt-style-editor` so it can be deployed as a static page without
coupling its route to the example application. `@context-action/core` continues
to own the provider-neutral tool protocol, while `@context-action/react` owns
ToolContext and the registry.

When the iframe sandbox, revision protocol, `postMessage` bridge,
DocumentManager, and editor adapters have independent tests and public
contracts, evaluate extracting them into a `packages/live-code-editor`
workspace package. Start it as a private package and decide whether to publish
it only after the contract stabilizes.

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
| `editor.getDocument` | allow | Read the current document and revision |
| `editor.getPreviewStatus` | allow | Read the latest iframe acknowledgement |
| `editor.setDocument` | local demo allow | Replace controlled source text; never execute it |
| `editor.setScenario` | local demo allow | Change the safe runner scenario |
| `editor.resetDocument` | local demo allow | Reset source to the selected example |

`editor.applyPatch` remains a planned follow-up contract. A production
integration must replace the local demo policy with an approval-capable
`toolPolicy` before enabling destructive or broad mutations.

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
- Supported HTML, CSS, JavaScript, JSON, Markdown, TypeScript, and text files are
  imported with file-count, per-file, and total-size limits. Supported images,
  fonts, and WASM files are retained as Blob-backed, preview-only assets;
  unsupported files are reported in the chat.
- File-system handles stay in the parent adapter and never enter tool payloads
  or iframe messages.
- Text edits are persisted to Dexie immediately. With a read/write directory
  handle, `Save to folder` writes the dirty text files back to the selected
  operating-system directory; upload-only imports remain browser-workspace-only.
- The standalone registry separates `workspace.createFile`,
  `workspace.writeFile`, `workspace.revertFile`, and `workspace.deleteFile`:
  new text files are
  normalized, opened as the active editor tab, persisted as Blob-backed
  records, and included in the next folder save. Deletions remove the
  browser-local record immediately, retain a deleted-path checkpoint for
  `Save to folder`, and keep undo/redo and the active preview entry valid.
  Pending deletion paths are stored in Dexie metadata, so a reload does not
  silently lose the later operating-system folder deletion.
- `workspace.revertFile` restores the active file to the last saved browser
  workspace checkpoint. For an unsaved new file it removes that file; model
  calls remain behind the destructive policy and approval boundary.
- The editor's active-file Delete action routes through the same
  `workspace.deleteFile` registry contract as the palette and model loop;
  it does not introduce a second mutation path.
- The `Save` button and `⌘/Ctrl+S` shortcut use the same save boundary; the
  shortcut is disabled while the settings or New file modal is being edited.
- `Download` exports the active text source or Blob asset as a browser download,
  so upload-only folder imports can still be taken back to local files.
- The Explorer's New file dialog similarly routes through
  `workspace.createFile`; validation failures stay in the tool result path and
  remain visible inside the dialog and do not close it, while successful creation
  selects the new tab. The Explorer and editor tabs also show per-file unsaved
  markers.
- The Explorer derives a sorted nested tree from each normalized file path.
  Directory rows can be collapsed or expanded without changing workspace data,
  while file selection continues to resolve to the full `activePath`.
- For a runnable workspace, `index.html` is preferred; otherwise the first
  `.html` file becomes the entry point. Relative local `.css` and `.js`
  references are inlined and executed inside the sandboxed iframe.
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
4. Implement the parent-owned DocumentManager.
5. Add the Dexie workspace repository and Blob/file-system adapter boundary.
6. Keep the revision-aware preview bridge and acknowledgement contract aligned
   with the DocumentManager.
7. Forward `toolCallId` and abort signals from the model adapter to the Registry,
   with a user-visible cancellation path.
8. Add browser proof for `tools/list → call → result` and workspace reload.
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
