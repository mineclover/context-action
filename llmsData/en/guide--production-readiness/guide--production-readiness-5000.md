---
document_id: guide--production-readiness
category: guide
source_path: en/guide/production-readiness.md
character_limit: 5000
last_update: '2026-08-11T05:13:08.037Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Production readiness

Production readiness Context-Action is suitable for production React application state when its package boundary and operating model match the problem. This page states the current contract rather than making a blanket performance or exactly-once claim. Decision summary | Workload | Assessment | Required practice | | --- | --- | --- | | Local React UI and application state | Ready | Use createStoreContext, useStoreValue, and narrowly scoped contexts. | | Typed action coordination | Ready | Keep domain work in handlers and make cancellation/timeout behavior explicit. | | React 18/19 SSR and hydration | Ready for the verified versions | Keep the supported React and type-package versions aligned with the release cohort. | | Undo/redo or high-frequency updates | Suitable after application measurement | Choose history and notification settings for the workload; do not rely on universal performance multipliers. | | Cross-tab, worker, or server durable tool calls | Conditionally ready | Complete the Durable 0.2 fencing migration and validate the real persistence endpoint. | | Exactly-once remote side effects | Not promised by the library alone | Use provider idempotency keys, an inbox/outbox or equivalent, and domain reconciliation. | The Store and Action layers are a good fit when state ownership, subscriptions, and action handling need clear boundaries. They are not a replacement for an application's authorization model, external-provider idempotency contract, or operational database ownership. Verified stabilization boundary The protected release preflight covers strict source/test type checks, the React 18/19 compatibility matrix, SSR/hydration checks, packed ESM/CJS and NodeNext consumers, package exports, examples, workflow/release safety, and durable adapter verification. Redis and PostgreSQL adapters are also exercised against CI service containers. That evidence supports the library contract at the candidate commit. Before a production rollout, run the same preflight for the exact release candidate and exercise your staging or production-equivalent Redis/PostgreSQL endpoint, including credentials, TLS, migration, retention, and failover behavior. Compatible release family The current stabilization boundary intentionally coordinates these versions: | Package | Version | Why it matters | | --- | --- | --- | | @context-action/core | 1.1.0 | Stable action lifecycle and observer semantics. | | @context-action/react | 2.0.0 | React lifecycle, SSR, and fenced tool-reconciliation contract. | | @context-action/tool-protocol | 1.0.2 | Tool-call protocol and approval behavior. | | @context-action/tool-durable-operations | 0.2.0 | Incarnation/revision fencing for durable operation ownership. | Install this family as one compatible cohort. In particular, React 2 req

Key points:
• Pin and test the compatible package cohort, rather than independently upgrading React and durable tools.
• Run `pnpm release:check` from the exact candidate commit.
• Use the packed-consumer and React compatibility checks as release gates, not only workspace tests.
• Validate Redis/PostgreSQL in an application-owned staging environment; record sanitized evidence without credentials or raw request data.
• Define durable key, owner-ID, retention, pruning, alerting, and reconciliation policies before enabling external side effects.
• Use provider idempotency keys and a domain source of truth for money movement, provisioning, email, and other externally visible mutations.
• Roll out React 2 and Durable 0.2 behind normal application canary and rollback controls.