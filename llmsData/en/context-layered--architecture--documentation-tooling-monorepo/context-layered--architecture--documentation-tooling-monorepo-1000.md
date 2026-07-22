---
document_id: context-layered--architecture--documentation-tooling-monorepo
category: context-layered
source_path: en/context-layered/architecture/documentation-tooling-monorepo.md
character_limit: 1000
last_update: '2026-07-22T19:56:24.945Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Documentation tooling monorepo boundary

Documentation tooling monorepo boundary The reusable documentation-management implementations live in context-action-documentation-tooling, the canonical repository for Foundation and sem-doc. The repository is remote-backed and publishes the packages consumed by this repository. The machine-readable ownership declaration is source-of-truth.json. Ownership

Key points:
• `sem` supplies the external entity evidence for a repository revision.
• Foundation contracts give that evidence deterministic symbol, file, revision, complete-snapshot,
•...