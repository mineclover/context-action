---
document_id: guide--production-readiness
category: guide
source_path: en/guide/production-readiness.md
character_limit: 1000
last_update: '2026-10-02T01:34:57.570Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Production readiness

Production readiness Context-Action is suitable for production React application state when its package boundary and operating model match the problem. This page states the current contract rather than making a blanket performance or exactly-once claim. Decision summary | Workload | Assessment | Required practice | | --- | --- | --- | | Local React UI and application state | Ready | Use createStoreCont

Key points:
• Pin and test Core `1.2.6`, Store Core `0.1.3`, Mutative Core `0.8.14`, scoped adapter `0.8.15`, and React `4.0.7` together.
• Run `pnpm release:check` from the exact candidate commit.
• Use the packed-consumer and React...