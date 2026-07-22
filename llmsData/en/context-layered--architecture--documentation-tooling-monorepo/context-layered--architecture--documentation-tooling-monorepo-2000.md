---
document_id: context-layered--architecture--documentation-tooling-monorepo
category: context-layered
source_path: en/context-layered/architecture/documentation-tooling-monorepo.md
character_limit: 2000
last_update: '2026-07-22T16:39:29.112Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Documentation tooling monorepo boundary

Documentation tooling monorepo boundary The reusable documentation-management implementations are being extracted into context-action-documentation-tooling as the proposed canonical repository for Foundation and sem-doc. It is currently a local scaffold with no configured remote, and the consumer has not switched to package artifacts. The machine-readable ownership declaration is source-of-truth.json. Ownership | Boundary | Remains in context-action | Extracted tooling repository | | --- | --- | --- | | Product runtime | core, react, tool-protocol, durable operations, examples | — | | Symbol context | consumer configuration and generated artifacts | Foundation contracts/repository and sem-doc | | Architecture rules | architecture-governance implementation, authored architecture/registry.json, project policies, product-specific evidence | — (not extracted) | | API documentation | TypeDoc/VitePress configuration, generated site output, and typedoc