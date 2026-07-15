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
memory workspace. The File System Access folder adapter remains in the example
until the persistence and adapter contracts stabilize.

The standalone top-bar settings dialog stores the user-owned API key under the
shared `context-action.openrouter.api-key` browser key used by the example
demos. It also persists the selected model and chat-completions endpoint. When
the key is present, chat requests use OpenRouter's native tool-call loop; when
it is absent, the same surface uses the deterministic local agent. The key is
sent directly from the browser to the configured endpoint and is never bundled
or sent to a Context-Action server.

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

`destructiveHint` is metadata for model and UI guidance. Authorization must still be enforced by `toolPolicy`.

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
  Blobs. Text source in the editor is a derived projection of the stored Blob.
- `Open folder` uses a generic file-system adapter. The current browser adapter
  uses the File System Access API from a user gesture and imports the folder
  into Dexie rather than making the directory handle the workspace owner.
- Text and binary files are imported with file-count, per-file, and total-size
  limits. Binary files remain in the file tree and are available as short-lived
  Blob URLs for preview assets, while only text files are editable.
- File-system handles stay in the parent adapter and never enter tool payloads
  or iframe messages.
- Text edits are persisted to Dexie immediately; `Save file` writes the active
  dirty text file back through the generic file-system adapter when a directory
  is open.
- Object URLs are derived handles only and must be revoked when the workspace
  or preview is replaced.
- For a runnable workspace, `index.html` is preferred; otherwise the first
  `.html` file becomes the entry point. Relative local `.css` and `.js`
  references are inlined and executed inside the sandboxed iframe.
- External CSS/JS URLs and arbitrary `runScript` requests are blocked by the
  preview boundary. Binary assets are not imported yet, so data URLs or a
  later asset adapter are required for images and fonts.
- Unsupported browsers retain the memory workspace instead of silently sending
  files to a server.

## Build order

1. Preserve tool IDs, error codes, and source context.
2. Apply allowlist and policy to discovery and execution.
3. Record parallel calls and failures through the lifecycle observer.
4. Implement the parent-owned DocumentManager.
5. Add the Dexie workspace repository and Blob/file-system adapter boundary.
6. Add a revision-aware preview bridge to the iframe.
7. Forward `toolCallId` and abort signals from the model adapter to the Registry.
8. Add browser proof for `tools/list → call → result` and workspace reload.

## Acceptance criteria

- Prototype names such as `toString` and `constructor` cannot execute as tools.
- Parallel results remain correlated by `toolCallId`.
- Validation and policy failures return structured errors the model can read.
- The iframe rejects stale document revisions.
- Destructive tools cannot run without policy approval.
