---
document_id: context-layered--decisions--CA-STATECHART-EFFECT-001
category: context-layered
source_path: en/context-layered/decisions/CA-STATECHART-EFFECT-001.md
character_limit: 1000
last_update: '2026-11-19T09:22:46.304Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
CA-STATECHART-EFFECT-001: Separate `@context-action/xstate` Adapter Boundary and Core Integration Philosophy

CA-STATECHART-EFFECT-001: Separate @context-action/xstate Adapter Boundary and Core Integration Philosophy Status: accepted for implementation; publication cohort unapproved Owner: Framework Core & Runtime Integration Related issue/spec: CA-STATECHART-EFFECT-001 (packages/xstate/docs/xstate-effect-integration.md, CA-ELEMENT-INTEROP-001, CA-SPEC-EVIDENCE-001) Context I

Key points:
• **Keep ports split inside `@context-action/core/element` and `@context-action/store-core`**: Rejected because it...