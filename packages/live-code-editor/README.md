# @context-action/live-code-editor

Private framework-neutral contracts and workspace primitives for the browser
live code editor seam.

The package owns workspace file/snapshot types, preview bridge messages and
diagnostics, folder import/permission results, the preview document compiler,
the browser filesystem adapter and its `WorkspaceFileSystemAdapter` port, and
browser-independent path, source-limit, error, and active-file helpers. It also
defines the async
`WorkspaceRepository` boundary used by the stateful workspace manager without
prescribing Dexie or another persistence engine. Its save-plan helpers create
bounded per-file source digests for ambiguous multi-file writes; they never
persist source text.

`WorkspaceDocumentManager` owns document state, history, revision changes, and
repository orchestration. The standalone demo supplies seed files and its
Dexie-backed `WorkspaceRepository` through the thin `BrowserWorkspace` adapter;
it also supplies the optional `DirectoryHandlePersistence` implementation.
The package filesystem adapter accepts a browser directory handle, so IndexedDB
and handle metadata remain application choices. The iframe runtime, ToolContext
schema, provider loop, and editor views remain application boundaries.

`WorkspaceFileSystemAdapter.readFile(path)` is a read-only reconciliation port
for a connected folder. It returns the current external file when available
and `undefined` when the path is absent; permission or folder failures remain
typed `WorkspaceToolError` values. It is intentionally separate from the
workspace manager snapshot so a recovery resolver can compare the external
write with the source that the mutation attempted to persist.
The optional `folderScopeId` identifies the connected destination across a
folder restore; a durable filesystem mutation should include it in its
idempotency key so two folders with the same path and workspace revision cannot
replay each other's records.

## Context-Action integration boundary

The package is the framework-neutral domain layer inside the Context-Action
tool-calling convention. A React integration should keep the boundaries in this
order:

```text
ToolContext schema + policy
  → useToolHandler orchestration
  → WorkspaceDocumentManager invariants and revision
  → WorkspaceRepository / filesystem adapter
  → preview bridge acknowledgement
  → structured tool result
```

The package must not create a React context or call Dexie directly. The
application defines each tool once in `createToolContext()`, checks
`expectedRevision` in the handler, delegates the mutation to the manager, waits
for persistence and preview work where required, and returns the manager's
revision/storage metadata to the model. Model-originated calls enter through
`executeModelToolCall()` with `mode: 'agent'`; an explicit palette command may
use `callTool()` with `mode: 'direct'` in its action hook.

```ts
import { createToolContext } from '@context-action/react';
import {
  WorkspaceDocumentManager,
  WorkspaceToolError,
  type WorkspaceRepository,
} from '@context-action/live-code-editor';

const StudioTools = createToolContext('StudioTools', {
  schema: studioToolSchema,
});

async function writeWorkspaceFile(
  manager: WorkspaceDocumentManager,
  path: string,
  source: string,
  expectedRevision?: number
) {
  const current = manager.getSnapshot();
  if (
    expectedRevision !== undefined &&
    expectedRevision !== current.revision
  ) {
    throw new WorkspaceToolError(
      'Re-read the workspace before applying this mutation.',
      {
        code: 'WORKSPACE_REVISION_CONFLICT',
        retryable: true,
        details: {
          expectedRevision,
          currentRevision: current.revision,
        },
      }
    );
  }
  const next = manager.updateFile(path, source, { coalesce: false });
  await manager.waitForPersistence();
  return {
    path,
    revision: next.revision,
    storageMode: next.storageMode,
  };
}

function createManager(repository: WorkspaceRepository) {
  return new WorkspaceDocumentManager({
    repository,
    seedFiles,
    rootName: 'web-studio',
    activePath: 'index.html',
  });
}
```

The handler should preserve the structured `WORKSPACE_REVISION_CONFLICT` result
through the ToolContext boundary. This short example shows the ownership
boundary; the complete approval, schema, trace, and preview flow lives in the
[Tool-Calling Web Studio Convention](../../docs/en/context-layered/usecase-tool-calling-web-studio.md).

## Use-case profile

- **Browser workspace:** implement `WorkspaceRepository` with Dexie and keep
  text sources and Blob assets in separate records. The manager remains usable
  in tests with an in-memory repository.
- **Connected folder:** use `BrowserWorkspaceFileSystemAdapter` only after the
  user explicitly opens a directory. Keep folder writes behind a separate
  `workspace.saveAll` tool and inject handle persistence when the browser can
  structured-clone the handle.
- **Live preview:** compile the current file graph with
  `buildPreviewDocument()`, send the revision to the sandbox bridge, and report
  success only after `context-action.preview.ready` acknowledges the same
  revision.
- **Recovery and audit:** return stable error codes and revision/storage
  metadata from handlers so the ToolContext policy, provider loop, retry UI, and
  trace can make the same decision.

The example Live Code Editor injects an IndexedDB-backed
`durableOperationStore` into its `createToolContext()` instance. Explicit
`editor.saveFile` and `editor.saveAll` commands pass a stable idempotency key
scoped to their session and path, so a same-session retry replays the durable
record instead of writing the folder twice. A new user-intended save must create
a new session/key pair. If a filesystem write reaches an `unknown` state, the
application must query or manually confirm the folder outcome and call
`registry.recoverOperation()`; it must not invoke the save handler again merely
because the caller timed out. The example's direct `editor.saveFile` recovery
action uses `readFile()` plus exact-source matching before recording completion.
The multi-file `editor.saveAll` recovery action validates the stored digest
manifest for every external file before recording completion. This is still an
application reconciliation boundary, not a replacement for a downstream
outbox.

Applications that wrap individual connected-folder writes with
`createDurableSideEffectRunner()` should surface `WORKSPACE_SIDE_EFFECT_UNKNOWN`
when the File System Access API outcome is ambiguous, and
`WORKSPACE_DURABLE_STATE_UNAVAILABLE` when the durable store cannot be opened.
Neither code claims exactly-once filesystem semantics; both prevent a blind
retry from being presented as a confirmed save.

## Verification

```bash
pnpm --filter @context-action/live-code-editor check
pnpm --filter @context-action/live-code-editor type-check
pnpm --filter @context-action/live-code-editor test
```
