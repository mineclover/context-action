---
document_id: guide--production-readiness
category: guide
source_path: en/guide/production-readiness.md
character_limit: 5000
last_update: '2026-10-02T01:34:57.571Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Production readiness

Production readiness Context-Action is suitable for production React application state when its package boundary and operating model match the problem. This page states the current contract rather than making a blanket performance or exactly-once claim. Decision summary | Workload | Assessment | Required practice | | --- | --- | --- | | Local React UI and application state | Ready | Use createStoreContext, useStoreValue, and narrowly scoped contexts. | | Typed action coordination | Ready | Keep domain work in handlers and make cancellation/timeout behavior explicit. | | React 19.2 SSR and hydration | Ready for the verified versions | Keep the supported React and type-package versions aligned with the release cohort. | | Undo/redo or high-frequency updates | Suitable after application measurement | Choose history and notification settings for the workload; do not rely on universal performance multipliers. | | Cross-tab, worker, or server durable tool calls | Development track | Complete the Durable 0.2 fencing migration and validate the real persistence endpoint before a separate release decision. | | Exactly-once remote side effects | Not promised by the library alone | Use provider idempotency keys, an inbox/outbox or equivalent, and domain reconciliation. | The Store and Action layers are a good fit when state ownership, subscriptions, and action handling need clear boundaries. They are not a replacement for an application's authorization model, external-provider idempotency contract, or operational database ownership. Verified stabilization boundary The protected release preflight covers strict source/test type checks, the React 19.2 minimum/current compatibility matrix, SSR/hydration checks, packed ESM/CJS and NodeNext consumers, package exports, examples, workflow/release safety, and durable adapter verification. Redis and PostgreSQL adapters are also exercised against CI service containers. That evidence supports the library contract at the candidate commit. Before a production rollout, run the same preflight for the exact release candidate and exercise your staging or production-equivalent Redis/PostgreSQL endpoint, including credentials, TLS, migration, retention, and failover behavior. Current state-management release The current stable release is the state-management surface: | Package | Version | Why it matters | | --- | --- | --- | | @context-action/core | 1.2.6 | Stable action lifecycle, dispatch trace, and observer semantics. | | @context-action/store-core | 0.1.3 | Framework-neutral state, patch, and timeline backend contracts. | | @context-action/mutative-core | 0.8.14 | Upstream mutative@1.3.0 compatibility baseline and maintained fork fixes. | | @context-action/mutative | 0.8.15 | Defensive collection snapshots, immutable update, and tim

Key points:
• Pin and test Core `1.2.6`, Store Core `0.1.3`, Mutative Core `0.8.14`, scoped adapter `0.8.15`, and React `4.0.7` together.
• Run `pnpm release:check` from the exact candidate commit.
• Use the packed-consumer and React compatibility checks as release gates, not only workspace tests.
• Roll out this cohort behind normal application canary and rollback controls.