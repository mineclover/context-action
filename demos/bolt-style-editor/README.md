# Context-Action Web Studio

Standalone Bolt-style web coding demo for Context-Action. The editor keeps the
tool registry, policy, execution trace, workspace state, and preview bridge in
the parent document; the sandboxed iframe only renders the current workspace.

The reusable rules and use-case recipes for this shape are documented in
[Tool-Calling Web Studio Convention](../../docs/en/context-layered/usecase-tool-calling-web-studio.md)
and its [Korean version](../../docs/ko/context-layered/usecase-tool-calling-web-studio.md).

## Run locally

From the repository root:

```bash
# Root aliases for the private package and standalone release check:
pnpm build:live-code-editor
pnpm check:live-code-editor
pnpm type-check:live-code-editor
pnpm test:live-code-editor
pnpm web-coding:verify

# Equivalent package-filter commands:
pnpm --filter @context-action/web-coding-demo verify
pnpm --filter @context-action/web-coding-demo verify:conventions
pnpm --filter @context-action/web-coding-demo verify:dev-server

# Or run individual stages:
pnpm --filter @context-action/web-coding-demo type-check
pnpm --filter @context-action/web-coding-demo check
pnpm --filter @context-action/web-coding-demo build
node scripts/verify-web-coding-build.mjs
node scripts/verify-web-coding-production-browser.mjs
node scripts/verify-web-coding-plan.mjs
node scripts/verify-web-coding-trace.mjs
node scripts/verify-web-coding-approval.mjs
node scripts/verify-web-coding-preview.mjs
node scripts/verify-web-coding-filesystem.mjs
node scripts/verify-web-coding-openrouter.mjs
node scripts/verify-web-coding-browser.mjs
WEB_CODING_PORT=43144 pnpm --filter @context-action/web-coding-demo dev
# or: pnpm --filter @context-action/web-coding-demo dev -- --port 43144
```

`verify` runs formatting, type-checking, the production build, the GitHub Pages
artifact check, a production base-path browser smoke test, all standalone
tool/preview/filesystem/OpenRouter/trace contract checks, a dev-server port
override contract, and the isolated development-server Playwright browser proof
in the same order used for a local release check.

The browser proof starts an isolated Vite server and exercises source editing,
syntax highlighting, directory-upload fallback, local-agent discovery,
approval, preview mutation, and the Dexie-backed source/preview restore path
after a browser reload. Set
`WEB_CODING_URL` to reuse an already-running server instead of starting one.

The directory-upload part creates a short-lived fixture under the operating
system temporary directory because the browser API needs a real directory
path. That fixture is separate from the IndexedDB/Blob workspace and is
removed in the verifier's cleanup block; it is never used as application
storage or shipped with the static demo.

The development server defaults to an OS-assigned free localhost port, so it
does not claim a commonly used fixed port. This applies both to the package
`dev` script and to direct Vite invocations. Set `WEB_CODING_PORT` when a stable
port is useful for an in-app browser tab or another local integration; Vite CLI
port arguments are also forwarded when invoking the package directly.

## What this demonstrates

```text
tools/list
  → local agent or OpenRouter model tool call
  → ToolContext policy + schema validation
  → tools/call handler
  → Dexie workspace mutation
  → iframe preview acknowledgement
  → structured tool result + execution trace
```

The sidebar exposes the canonical catalog and sample arguments for the
workspace and preview tools. The catalog can export `tools/list`, a selected
tool definition, or a `tools/call` request as JSON. The trace panel exports
bounded, redacted execution entries as JSON; use `All` in the trace header to
inspect entries older than the recent eight. Failed calls retain their
`retryable` metadata, and the compact trace row shows the provider call ID plus
whether recovery is retryable or terminal. After more than one execution
session exists, the trace header also exposes a session selector so one
`agent.request` → `tools/list` → `tools/call` chain can be inspected in
isolation; Copy, Download, and Clear continue to operate on the full trace.

The registry schema, approval policy, and lifecycle observer are isolated in
`src/bolt-style-tool-context.ts`; workspace/preview mutation handlers live in
`src/tool-handlers.tsx`; and local agent execution lives in
`src/actions/run-local-agent.ts`. The editor surface consumes focused action
hooks: `use-tool-execution` owns provider-neutral execution,
`use-workspace-folder-actions` owns folder boundaries,
`use-workspace-runtime` owns workspace hydration and persisted-folder restore,
`use-editor-observables` owns reactive workspace, filesystem, trace, and
approval subscriptions plus persisted dirty paths, deleted paths, and undo/redo
availability,
`use-workspace-editor-actions` owns drafts and file mutations,
`use-tool-catalog-model` owns canonical `tools/list`, definitions, and catalog
filtering,
`use-tool-catalog-actions` owns tool-argument samples and palette commands,
`use-workspace-keyboard-shortcuts` owns global commands, and
`use-studio-export-actions` owns copy/download exports. The shared
`use-confirmation-request` hook owns the promise-backed destructive confirmation
boundary. The local `src/tool-catalog-contract.ts` aliases the framework's
`MCPToolDefinition` and `ToolAnnotations`; views and action hooks consume that
contract instead of declaring a second catalog shape. Browser-only helpers
such as revision guards, patching, escaping, and cancellation remain in
`src/tool-runtime-utils.ts`; views under `src/views/` receive data and
callbacks without owning workspace mutation policy. The keyboard-aware file
tree is isolated in `src/views/workspace-file-tree.tsx` and only emits file
selection callbacks. The bounded, redacted execution history is rendered by
`src/views/tool-trace-panel.tsx` and receives export/clear actions as props.
`src/tool-result-contract.ts` keeps persistence and revision metadata assembly
pure and snapshot-driven, so handlers do not duplicate the canonical result
shape.
The editor tabs and mutation controls are rendered by
`src/views/workspace-editor-toolbar.tsx`; mutations still enter through the
workspace action hooks. The text/Blob source surface is isolated in
`src/views/workspace-source-panel.tsx` and receives draft updates through a
callback.

The code header shows the current text size against the shared 80,000-character
workspace mutation limit. Imported files may use the separate filesystem import
byte budget; an oversized imported source remains visible so it can be reduced
before the next mutation.

The New file dialog uses the same limit for its initial source, exposes a live
counter, and prevents an oversized create request before it reaches the tool
registry.

The editor also includes IDE-style file navigation: use the `Quick open`
button or `Ctrl/Cmd+P`, type a path fragment, then use the arrow keys and
`Enter` to open a workspace file. `Esc` closes the palette and restores the
previous focus.

Use `Search` or `Ctrl/Cmd+Shift+F` to search all text files. Arrow keys and
`Enter` jump to a matching line; `Esc` closes the search and restores its
trigger focus.

Use `Ctrl/Cmd+Z` and `Ctrl/Cmd+Shift+Z` (or `Ctrl+Y`) outside editable fields
to route workspace history through `workspace.undo` and `workspace.redo`.
Inside the source and argument editors, native text editing history remains
in control. Source-edit undo/redo keeps the current editor tab; structural
history such as create, rename, and delete restores the path required by the
workspace checkpoint.

The Explorer is a keyboard tree: `↑↓` move between visible entries, `←→`
collapse or expand directories, and `Home/End` move to the first or last
entry.

Preview runtime exceptions and incomplete local references are reported back
from the sandboxed iframe as a visible diagnostic panel. Each diagnostic
source path is keyboard-focusable and opens that workspace file in the editor;
source navigation is paused while another tool chain is running.

## Workspace boundaries

- Text files and Blob assets are stored in Dexie/IndexedDB.
- Without IndexedDB, the workspace falls back to memory for the current tab.
- If IndexedDB fails during hydration or a later write, the workspace exposes
  the bounded storage error through `workspace.getStatus` and marks the
  session as memory-only so a persistence failure is not silent.
- Workspace mutation, preview, and save tool results also include `storageMode`
  and an optional bounded `storageError`, so model tool chains can distinguish
  durable IndexedDB state from a session-only fallback without a second status call.
- `Open` uses the File System Access API when available and a directory-upload
  fallback otherwise.
- `Save to folder` is the explicit operating-system filesystem boundary.
- Destructive UI actions use an in-app keyboard-modal confirmation surface;
  folder replacement, reset, delete/revert, and destructive tool samples never
  depend on a native `window.confirm`.
- In-memory workspace edit history is bounded to the latest 100 checkpoints;
  new edits also discard the redo branch, matching normal editor history.
- Restored folder handles expose `granted`, `prompt`, `denied`, `unknown`, or
  `disconnected` write-permission state; `Grant access` re-requests permission
  without replacing the browser workspace.
- If a connected folder disappears during reload, save, or delete, the adapter
  clears the stale persisted handle and returns retryable
  `WORKSPACE_FOLDER_STALE` metadata so the model and trace can request a folder
  reconnect instead of treating the failure as an opaque save error. The chat
  error also exposes a `Reconnect folder` action; `saveAll` preserves the same
  structured metadata when it reports partially completed work.
- Browser-only saves return `WORKSPACE_FOLDER_NOT_CONNECTED`, while denied
  write access returns `WORKSPACE_FOLDER_PERMISSION_DENIED`. Both retain
  retryable operation metadata; the chat offers `Reconnect folder` or `Grant
  folder access` respectively.
- Preview mutations report missing HTML/CSS targets as non-retryable
  `PREVIEW_TARGET_NOT_FOUND`. Runtime failures, acknowledgement timeouts, and
  superseded preview revisions use `PREVIEW_RUNTIME_ERROR`,
  `PREVIEW_ACK_TIMEOUT`, and `PREVIEW_REVISION_SUPERSEDED`; retryable preview
  synchronization failures expose a `Refresh preview` chat action.
- Workspace input failures use non-retryable `WORKSPACE_PATH_INVALID`,
  `WORKSPACE_FILE_NOT_FOUND`, `WORKSPACE_FILE_CONFLICT`,
  `WORKSPACE_FILE_TYPE_CONFLICT`, `WORKSPACE_PATCH_NOT_FOUND`, or
  `WORKSPACE_NO_SUPPORTED_FILES`, `WORKSPACE_EMPTY`,
  `WORKSPACE_PREVIEW_ENTRY_REQUIRED`, `WORKSPACE_FOLDER_STATE_CONFLICT`, or
  `WORKSPACE_HISTORY_EMPTY` codes with bounded operation details. A patch miss
  reports only its path, occurrence mode, and search length; structural
  workspace failures explain the invariant that blocked the operation.
  Read/open/download tools are blocking handlers so
  these failures cannot be mistaken for an empty successful result.
- A revision change detected during `saveAll` or `saveCheckpoint` keeps the
  retryable `WORKSPACE_REVISION_CONFLICT` code and includes the save operation
  and expected/current revisions, even when the result contains a partial-save
  summary.
- Preview source is rendered in a sandboxed iframe with revision acknowledgements;
  arbitrary scripts, external assets, and filesystem handles do not cross into
  the tool or preview payloads.

## Provider settings

OpenRouter settings are optional. With no key, the deterministic local agent
keeps the complete discovery → call → result path available offline. When a key
is supplied, it is stored under the same-origin
`context-action.openrouter.api-key` local-storage key used by the example demos
and sent directly from the browser to the configured chat-completions endpoint.
Keys are not bundled or sent to a Context-Action server.
If the browser blocks or cannot write `localStorage`, the current tab keeps a
session-only fallback so the editor remains usable; cross-page reuse then
requires browser storage to be available.

## GitHub Pages

The production Vite base is `/context-action/web-coding/`. The repository's
`deploy-all.yml` workflow builds this package and publishes its `dist` output at
the standalone `/web-coding/` path alongside the documentation and example app.

The first package boundary is now represented by the private
`@context-action/live-code-editor` workspace package. It exports the
framework-neutral workspace, preview, and folder-import contracts consumed by
this demo, the pure preview document compiler, and the stateful
`WorkspaceDocumentManager`. The demo keeps only the seed-file and Dexie
repository adapter in `BrowserWorkspace`; the browser-owned filesystem adapter,
iframe runtime, and editor adapters are consumed from the package through
compatibility re-exports. The demo still owns only the IndexedDB persistence
implementation and editor UI adapters.

See the [tool-calling editor architecture guide](../../docs/en/concept/tool-calling-editor-architecture.md)
for the full contract, approval policy, revision rules, and extraction plan.
