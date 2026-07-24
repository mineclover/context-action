---
document_id: context-layered--usecase-panel-layout
category: context-layered
source_path: en/context-layered/usecase-panel-layout.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.276Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Panel Layout Preference Convention

Panel Layout Preference Convention This document defines the Context-Action convention for collapsible and resizable editor panels. It is the specification for the standalone Web Studio implementation, not a new workspace or tool protocol. Review decision The current implementation is aligned at the feature boundary: | Boundary | Implementation | Decision | | --- | --- | --- | | Presentation state | hooks/use-panel-layout.ts | Owns only sidebar/preview layout preference | | Resize interaction | views/panel-resize-handle.tsx | Pure interaction surface; emits a delta | | Preview presentation | views/preview-panel.tsx | Receives layout state and callbacks as props | | Composition | BoltStyleEditor.tsx | Connects the preference hook to the workbench grid | | Tool/domain state | ToolContext, workspace manager, revision history | Intentionally not coupled to panel layout | The feature does not call the Tool Registry, mutate workspace files, change a workspace revision, or enter the approval/trace pipeline. That is the correct boundary for a local presentation preference. Presentation-only ownership The standalone demo keeps the live preference state in a dedicated hook with React useState. Persistence is provided by the existing Dexie-backed workspace repository through a small PanelLayoutPreferenceRepository port; the panel view-model does not access IndexedDB directly. This is an intentional presentation-only ownership decision: - the state is local to one editor surface; - no tool, handler, or business rule consumes it; - a layout change does not represent a workspace mutation; - persistence is best-effort and does not affect editor correctness; - the persisted record is separate from workspace files and revisions. If the preference becomes shared across routes, must be observed by multiple surfaces, or becomes controllable by an agent/tool, migrate it to a named Store Context and a facade. Do not extend the current hook into a second domain state-management API. Contract The public preference model is intentionally small: The browser persistence contract uses the same Dexie database as the workspace: The stored value is a versioned preference record. WebCodingWorkspaceRepository implements the port with loadPanelLayout() and savePanelLayout(), while usePanelLayout normalizes bounds and treats read/write failures as a best-effort fallback to the defaults. A future breaking change to the shape must bump the preference schema and add a migration rather than silently reinterpreting old values. Panel preferences are not included in workspace file records, revision history, or folder sync. Ownership rules usePanelLayout The hook is the presentation view-model for the layout preference. It owns: - loading and clamping the persisted preference; -

Key points:
• the state is local to one editor surface;
• no tool, handler, or business rule consumes it;
• a layout change does not represent a workspace mutation;
• persistence is best-effort and does not affect editor correctness;
• the persisted record is separate from workspace files and revisions.
• loading and clamping the persisted preference;
• toggling the sidebar and preview rails;
• applying bounded width deltas;
• persisting preference changes without affecting workspace state.
• `role="separator"` and `aria-orientation="vertical"`;
• `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`;
• pointer capture and drag lifecycle;
• left/right arrow steps of eight CSS pixels.
• Do not put `localStorage`, Dexie, repository calls, `workspace`, or registry
• Do not include panel width or collapsed state in workspace revisions or file diffs.
• Do not use arbitrary CSS values outside the documented bounds.
• Do not infer approval or persistence status from a panel's visual state.
• Do not make the panel hook a general-purpose store for editor or tool state.