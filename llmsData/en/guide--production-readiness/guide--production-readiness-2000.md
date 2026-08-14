---
document_id: guide--production-readiness
category: guide
source_path: en/guide/production-readiness.md
character_limit: 2000
last_update: '2026-08-11T05:13:08.037Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Production readiness

Production readiness Context-Action is suitable for production React application state when its package boundary and operating model match the problem. This page states the current contract rather than making a blanket performance or exactly-once claim. Decision summary | Workload | Assessment | Required practice | | --- | --- | --- | | Local React UI and application state | Ready | Use createStoreContext, useStoreValue, and narrowly scoped contexts. | | Typed action coordination | Ready | Keep domain work in handlers and make cancellation/timeout behavior explicit. | | React 18/19 SSR and hydration | Ready for the verified versions | Keep the supported React and type-package versions aligned with the release cohort. | | Undo/redo or high-frequency updates | Suitable after application measurement | Choose history and notification settings for the workload; do not rely on universal performance multipliers. | | Cross-tab, worker, or server durable tool calls | Conditionally ready | Complete t

Key points:
• Pin and test the compatible package cohort, rather than independently upgrading React and durable tools.
• Run `pnpm release:check` from the exact candidate commit.
• Use the packed-consumer and React compatibility checks as release gates, not only workspace tests.
• Validate Redis/PostgreSQL in an application-owned staging environment; record sanitized evidence without credentials or raw request data.
• Define durable key, owner-ID, retention, pruning, alerting, and reconciliation policies before enabling external side effects.
• Use provider idempotency keys and a domain source of truth for money movement, provisioning,...