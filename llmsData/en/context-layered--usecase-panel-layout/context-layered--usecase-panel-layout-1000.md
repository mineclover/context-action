---
document_id: context-layered--usecase-panel-layout
category: context-layered
source_path: en/context-layered/usecase-panel-layout.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.276Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Panel Layout Preference Convention

Panel Layout Preference Convention This document defines the Context-Action convention for collapsible and resizable editor panels. It is the specification for the standalone Web Studio implementation, not a new workspace or tool protocol. Review decision The current implementation is aligned at the feature boundary: | Boundary | Implementation | Decision | | --- | --- | --- | | Prese

Key points:
• the state is local to one editor surface;
• no tool, handler, or business rule consumes it;
• a layout change does not represent a workspace mutation;
• persistence is best-effort and does not affect...