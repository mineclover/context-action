# @context-action/live-code-editor

Private framework-neutral contracts and pure workspace primitives for the
browser live-code editor seam.

The package owns workspace file/snapshot types, preview bridge messages and
diagnostics, folder import/permission results, the preview document compiler,
and browser-independent path, source-limit, error, and active-file helpers.
It also defines the async `WorkspaceRepository` boundary used by the stateful
workspace manager without prescribing Dexie or another persistence engine.
The standalone demo still owns Dexie persistence, the filesystem adapter,
iframe runtime, and the stateful BrowserWorkspace until those implementations
have independent consumers and tests.
