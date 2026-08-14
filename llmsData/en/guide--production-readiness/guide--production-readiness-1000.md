---
document_id: guide--production-readiness
category: guide
source_path: en/guide/production-readiness.md
character_limit: 1000
last_update: '2026-08-11T05:13:08.036Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Production readiness

Production readiness Context-Action is suitable for production React application state when its package boundary and operating model match the problem. This page states the current contract rather than making a blanket performance or exactly-once claim. Decision summary | Workload | Assessment | Required practice | | --- | --- | --- | | Local React UI and application state | Ready | Use createStoreCont

Key points:
• Pin and test the compatible package cohort, rather than independently upgrading React and durable tools.
• Run `pnpm release:check` from the exact candidate commit.
• Use the packed-consumer and React compatibility checks as...