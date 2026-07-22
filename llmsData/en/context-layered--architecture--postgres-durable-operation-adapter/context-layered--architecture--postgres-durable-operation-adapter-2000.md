---
document_id: context-layered--architecture--postgres-durable-operation-adapter
category: context-layered
source_path: en/context-layered/architecture/postgres-durable-operation-adapter.md
character_limit: 2000
last_update: '2026-07-20T18:50:49.466Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
PostgreSQL Durable Operation Adapter Decision

PostgreSQL Durable Operation Adapter Decision This document records the SQL backend decision for the durable-operation contract. It is intentionally narrower than the semantic tool-calling guide: the guide defines state transitions, while this page defines the selected SQL dialect and adapter boundary. Decision Use PostgreSQL as the reference SQL dialect and expose a driver-neutral query client from @context-action/tool-protocol: - createPostgresDurableOperationBackend() owns SQL record mapping and conditional CAS statements. - The package does not depend on pg, a pool implementation, credentials, or connection lifecycle. - The application injects a query(text, values) client and runs the exported POSTGRESDURABLEOPERATIONSCHEMASQL migration through its own migration system. - The existing createDurableOperationStore() remains the only state machine; PostgreSQL stores records and enforces the conditional write boundary. This is a repository

Key points:
• `createPostgresDurableOperationBackend()` owns SQL record mapping and
• The package does not depend on `pg`, a pool implementation, credentials, or
• The application injects a `query(text, values)` client and runs the exported
• The existing `createDurableOperationStore()` remains the only state machine;
• a new record uses `INSERT ... ON CONFLICT DO NOTHING`;
• a revision transition uses `UPDATE ... WHERE operation_key = $1 AND revision = $n`;
• pruning uses `DELETE ... WHERE operation_key = $1 AND revision = $2`.
• the exact `pg`/pool wrapper used by the...