---
document_id: context-layered--architecture--documentation-tooling-monorepo
category: context-layered
source_path: en/context-layered/architecture/documentation-tooling-monorepo.md
character_limit: 2000
last_update: '2026-07-22T19:56:24.945Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Documentation tooling monorepo boundary

Documentation tooling monorepo boundary The reusable documentation-management implementations live in context-action-documentation-tooling, the canonical repository for Foundation and sem-doc. The repository is remote-backed and publishes the packages consumed by this repository. The machine-readable ownership declaration is source-of-truth.json. Ownership | Boundary | Remains in context-action | Extracted tooling repository | | --- | --- | --- | | Product runtime | core, react, tool-protocol, durable operations, examples | — | | Symbol context | consumer configuration and generated artifacts | Foundation contracts/repository and sem-doc | | Architecture rules | architecture-governance implementation, authored architecture/registry.json, project policies, product-specific evidence | — (not extracted) | | API documentation | TypeDoc/VitePress configuration, generated site output, and typedoc-vitepress-sync implementation | — (not extracted) | | L

Key points:
• `sem` supplies the external entity evidence for a repository revision.
• Foundation contracts give that evidence deterministic symbol, file, revision, complete-snapshot,
• Foundation repository materializes Git commits, worktrees, and bounded `analysisProjects` inputs.
• `sem-doc` validates and serializes bounded work contexts, document bindings, operational ContextScope,
• Consumer-owned Architecture Governance materializes repository-wide snapshots/history and its