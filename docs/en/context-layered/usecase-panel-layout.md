# Panel Layout Preference Convention

This document defines the Context-Action convention for collapsible and
resizable editor panels. It is the specification for the standalone Web
Studio implementation, not a new workspace or tool protocol.

## Review decision

The current implementation is aligned at the feature boundary:

| Boundary | Implementation | Decision |
| --- | --- | --- |
| Presentation state | `hooks/use-panel-layout.ts` | Owns only sidebar/preview layout preference |
| Resize interaction | `views/panel-resize-handle.tsx` | Pure interaction surface; emits a delta |
| Preview presentation | `views/preview-panel.tsx` | Receives layout state and callbacks as props |
| Composition | `BoltStyleEditor.tsx` | Connects the preference hook to the workbench grid |
| Tool/domain state | ToolContext, workspace manager, revision history | Intentionally not coupled to panel layout |

The feature does not call the Tool Registry, mutate workspace files, change a
workspace revision, or enter the approval/trace pipeline. That is the correct
boundary for a local presentation preference.

### Explicit convention exception

The standalone demo keeps this preference in a dedicated hook with React
`useState` and `localStorage`. This is an intentional **presentation-only
exception** to the Store Only pattern:

- the state is local to one editor surface;
- no tool, handler, or business rule consumes it;
- a layout change does not represent a workspace mutation;
- persistence is best-effort and does not affect editor correctness.

If the preference becomes shared across routes, must be observed by multiple
surfaces, or becomes controllable by an agent/tool, migrate it to a named Store
Context and a facade. Do not extend the current hook into a second domain
state-management API.

## Contract

The public preference model is intentionally small:

```ts
type PanelLayoutState = {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  previewCollapsed: boolean;
  previewWidth: number;
};
```

The browser persistence contract is:

```text
context-action.web-coding.panel-layout
```

The stored value is versionless and best-effort in the current demo. Invalid,
missing, or unavailable storage falls back to the defaults. A future breaking
change to the shape must add a versioned envelope and a migration rather than
silently reinterpreting old values.

## Ownership rules

### `usePanelLayout`

The hook is the presentation view-model for the layout preference. It owns:

- loading and clamping the persisted preference;
- toggling the sidebar and preview rails;
- applying bounded width deltas;
- persisting preference changes without affecting workspace state.

It must not own file mutations, tool execution, approval decisions, preview
revision acknowledgements, or provider settings.

### `PanelResizeHandle`

The resize handle is a reusable view primitive. It owns only transient pointer
interaction and keyboard affordances:

- `role="separator"` and `aria-orientation="vertical"`;
- `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`;
- pointer capture and drag lifecycle;
- left/right arrow steps of eight CSS pixels.

The parent interprets the physical delta for its panel. The handle must not
write storage or know whether it is resizing the sidebar or preview.

### `BoltStyleEditor` and `PreviewPanel`

The workbench owns composition. It supplies CSS variables, collapse callbacks,
and bounded resize callbacks. `PreviewPanel` may render its collapse control
and resize handle, but it must not discover or mutate the layout preference on
its own.

## Invariants

| Rule | Value |
| --- | --- |
| Sidebar width | 190–420 CSS px |
| Preview width | 300–720 CSS px |
| Default sidebar width | 236 CSS px |
| Default preview width | 380 CSS px |
| Collapsed desktop rail | 34 CSS px grid column |
| Keyboard resize step | 8 CSS px |
| Narrow layouts | Resize handles hidden; panel collapse remains available |

Widths are clamped before they enter the rendered grid. Collapsing a panel
does not discard its previous width; expanding restores the last accepted
width. Preview full-screen mode is presentation-only and must exit cleanly
when the preview panel is collapsed.

## Context-Action mapping

```text
PanelLayoutState
  -> usePanelLayout (presentation view-model)
  -> EditorWorkbench (composition)
  -> PreviewPanel / sidebar rail / resize handle (views)
```

This flow intentionally does not become:

```text
panel toggle -> workspace action -> tools/call -> revision
```

Panel layout is not an MCP command. If a future product requirement needs
agent-controlled layout, define a separate schema, policy, structured result,
and audit contract before exposing it as a tool.

## Anti-patterns

- Do not put `localStorage`, `workspace`, or registry calls in a view primitive.
- Do not include panel width or collapsed state in workspace revisions or file diffs.
- Do not use arbitrary CSS values outside the documented bounds.
- Do not infer approval or persistence status from a panel's visual state.
- Do not make the panel hook a general-purpose store for editor or tool state.

## Verification contract

The implementation is covered by the standalone convention and browser gates:

```bash
node scripts/verify-web-coding-conventions.mjs
pnpm --filter @context-action/web-coding-demo type-check
pnpm --filter @context-action/web-coding-demo check
node scripts/verify-web-coding-browser.mjs
pnpm --filter @context-action/web-coding-demo build
```

The browser proof must cover collapse/expand rails, keyboard resizing,
pointer resizing, mobile overflow, and the existing preview full-screen flow.
