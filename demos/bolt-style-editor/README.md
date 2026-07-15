# Context-Action Web Studio

Standalone Bolt-style web coding demo for Context-Action. The editor keeps the
tool registry, policy, execution trace, workspace state, and preview bridge in
the parent document; the sandboxed iframe only renders the current workspace.

## Run locally

From the repository root:

```bash
pnpm --filter @context-action/web-coding-demo type-check
pnpm --filter @context-action/web-coding-demo check
pnpm --filter @context-action/web-coding-demo build
node scripts/verify-web-coding-build.mjs
node scripts/verify-web-coding-plan.mjs
node scripts/verify-web-coding-browser.mjs
pnpm --filter @context-action/web-coding-demo dev -- --port 43144
```

The browser proof starts an isolated Vite server and exercises source editing,
syntax highlighting, directory-upload fallback, local-agent discovery,
approval, preview mutation, and the Dexie-backed source/preview restore path
after a browser reload. Set
`WEB_CODING_URL` to reuse an already-running server instead of starting one.

The development server defaults to `http://127.0.0.1:43127/`. The port can be
overridden for parallel local apps.

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
bounded, redacted execution entries as JSON.

## Workspace boundaries

- Text files and Blob assets are stored in Dexie/IndexedDB.
- Without IndexedDB, the workspace falls back to memory for the current tab.
- `Open` uses the File System Access API when available and a directory-upload
  fallback otherwise.
- `Save to folder` is the explicit operating-system filesystem boundary.
- Destructive UI actions use an in-app keyboard-modal confirmation surface;
  folder replacement, reset, delete/revert, and destructive tool samples never
  depend on a native `window.confirm`.
- Restored folder handles expose `granted`, `prompt`, `denied`, `unknown`, or
  `disconnected` write-permission state; `Grant access` re-requests permission
  without replacing the browser workspace.
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

## GitHub Pages

The production Vite base is `/context-action/web-coding/`. The repository's
`deploy-all.yml` workflow builds this package and publishes its `dist` output at
the standalone `/web-coding/` path alongside the documentation and example app.

See the [tool-calling editor architecture guide](../../docs/en/concept/tool-calling-editor-architecture.md)
for the full contract, approval policy, revision rules, and extraction plan.
