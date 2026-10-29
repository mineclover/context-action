---
document_id: context-layered--decisions--CA-ELEMENT-INTEROP-001
category: context-layered
source_path: en/context-layered/decisions/CA-ELEMENT-INTEROP-001.md
character_limit: 1000
last_update: '2026-10-25T07:23:14.352Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
CA-ELEMENT-INTEROP-001: Core subpaths and host-neutral Element bindings

CA-ELEMENT-INTEROP-001: Core subpaths and host-neutral Element bindings Status: accepted for implementation; release cohort unapproved Owner: Framework Core & UI Integration Related issue/spec: CA-ELEMENT-INTEROP-001 (user-approved local boundary design) Context Preact/Lit public handles and React bridges duplicated property/event mechanics. A private shared-package pro

Key points:
• Keep an independent shared package: reconsider if it needs independent releases.
• Put the bridge in `@context-action/react`: rejected because its React 19...