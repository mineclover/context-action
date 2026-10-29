# Example stabilization traceability

The example app keeps the experimental AI/live-coding source tree available for
development while the public catalog exposes only routes that are registered in
`src/App.tsx`. Disabled pages must not be linked from a catalog card. Internal
navigation uses React Router `Link` so the GitHub Pages basename remains intact.

The regular example type-check intentionally excludes the experimental source
tree. Run the companion strict check when changing that tree:

```bash
cd example
pnpm exec tsc -p tsconfig.integrations.json --noEmit
```

The strict config includes the AI, live-code-editor, and live-web-coding pages,
their browser adapters, CSS module declarations, and the repository-only
`@context-action/react/tools` source entry. It must pass before re-enabling one
of those routes.

Route smoke verification waits for the lazy route marker and rejects both the
Suspense loading marker and the explicit 404 marker. This keeps a non-empty
layout from being mistaken for a rendered route.

The MCP/function-calling catalog keeps the Live Code Editor and Realtime Web
Coding command contracts visible as disabled sections while their routes are
held back. `node scripts/verify-mcp-function-calling-catalog.mjs` remains the
source check for those command schemas and boundary references.
