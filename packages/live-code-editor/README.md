# @context-action/live-code-editor

Private framework-neutral contracts and pure workspace primitives for the
browser live-code editor seam.

The package owns workspace file/snapshot types, preview bridge messages and
diagnostics, folder import/permission results, the preview document compiler,
and browser-independent path, source-limit, error, and active-file helpers.
It also defines the async `WorkspaceRepository` boundary used by the stateful
workspace manager without prescribing Dexie or another persistence engine.
The package now owns the stateful `WorkspaceDocumentManager`; the standalone
demo only supplies seed files and its Dexie-backed repository through the thin
`BrowserWorkspace` adapter. The demo still owns the filesystem adapter, iframe
runtime, and editor adapters until those implementations have independent
consumers and tests.
