---
document_id: context-layered--architecture--postgres-durable-operation-adapter
category: context-layered
source_path: en/context-layered/architecture/postgres-durable-operation-adapter.md
character_limit: 1000
last_update: '2026-07-20T18:50:49.404Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
PostgreSQL Durable Operation Adapter Decision

PostgreSQL Durable Operation Adapter Decision This document records the SQL backend decision for the durable-operation contract. It is intentionally narrower than the semantic tool-calling guide: the guide defines state transitions, while this page defines the selected SQL dialect and adapter boundary. Decision Use PostgreSQL as the reference SQL diale

Key points:
• `createPostgresDurableOperationBackend()` owns SQL record mapping and
• The package does not depend on `pg`, a pool implementation, credentials, or
• The application...