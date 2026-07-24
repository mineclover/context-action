---
document_id: context-layered--usecase-panel-layout
category: context-layered
source_path: en/context-layered/usecase-panel-layout.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.276Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Panel Layout Preference Convention

Panel Layout Preference Convention This document defines the Context-Action convention for collapsible and resizable editor panels. It is the specification for the standalone Web Studio implementation, not a new workspace or tool protocol. Review decision The current implementation is aligned at the feature boundary: | Boundary | Implementation | Decision | | --- | --- | --- | | Presentation state | hooks/use-panel-layout.ts | Owns only sidebar/preview layout preference | | Resize interaction | views/panel-resize-handle.tsx | Pure interaction surface; emits a delta | | Preview presentation | views/preview-panel.tsx | Receives layout state and callbacks as props | | Composition | BoltStyleEditor.tsx | Connects the preference hook to the workbench grid | | Tool/domain state | ToolContext, workspace manager, revision history | Intentionally not coupled to panel layout | The feature does not call the Tool Registry, mutate workspace files, change a workspace revision, or enter

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
•...