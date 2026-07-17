# @context-action/live-code-editor

Private framework-neutral contracts and workspace primitives for the browser
live code editor seam.

The package owns workspace file/snapshot types, preview bridge messages and
diagnostics, folder import/permission results, the preview document compiler,
the browser filesystem adapter and its `WorkspaceFileSystemAdapter` port, and
browser-independent path, source-limit, error, and active-file helpers. It also
defines the async
`WorkspaceRepository` boundary used by the stateful workspace manager without
prescribing Dexie or another persistence engine.

`WorkspaceDocumentManager` owns document state, history, revision changes, and
repository orchestration. The standalone demo supplies seed files and its
Dexie-backed `WorkspaceRepository` through the thin `BrowserWorkspace` adapter;
it also supplies the optional `DirectoryHandlePersistence` implementation.
The package filesystem adapter accepts a browser directory handle, so IndexedDB
and handle metadata remain application choices. The iframe runtime, ToolContext
schema, provider loop, and editor views remain application boundaries.

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

## Verification

```bash
pnpm --filter @context-action/live-code-editor check
pnpm --filter @context-action/live-code-editor type-check
pnpm --filter @context-action/live-code-editor test
```
