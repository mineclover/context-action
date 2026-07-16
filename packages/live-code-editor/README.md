# @context-action/live-code-editor

Private framework-neutral contracts for the browser live-code editor seam.

The package intentionally contains types only in this first extraction slice:
workspace files and snapshots, preview bridge messages and diagnostics, and
folder import/permission results. The standalone demo owns the browser
implementations until those contracts have independent consumers and tests.
