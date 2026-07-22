---
document_id: context-layered--architecture--postgres-durable-operation-adapter
category: context-layered
source_path: en/context-layered/architecture/postgres-durable-operation-adapter.md
character_limit: 5000
last_update: '2026-07-20T18:50:49.554Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
PostgreSQL Durable Operation Adapter Decision

PostgreSQL Durable Operation Adapter Decision This document records the SQL backend decision for the durable-operation contract. It is intentionally narrower than the semantic tool-calling guide: the guide defines state transitions, while this page defines the selected SQL dialect and adapter boundary. Decision Use PostgreSQL as the reference SQL dialect and expose a driver-neutral query client from @context-action/tool-protocol: - createPostgresDurableOperationBackend() owns SQL record mapping and conditional CAS statements. - The package does not depend on pg, a pool implementation, credentials, or connection lifecycle. - The application injects a query(text, values) client and runs the exported POSTGRESDURABLEOPERATIONSCHEMASQL migration through its own migration system. - The existing createDurableOperationStore() remains the only state machine; PostgreSQL stores records and enforces the conditional write boundary. This is a repository reference decision, not evidence that a production database has already been selected. A deployment still has to run the adapter against its actual PostgreSQL service before it can be considered verified. Concurrency and isolation contract Each backend CAS is one PostgreSQL statement: - a new record uses INSERT ... ON CONFLICT DO NOTHING; - a revision transition uses UPDATE ... WHERE operationkey = $1 AND revision = $n; - pruning uses DELETE ... WHERE operationkey = $1 AND revision = $2. The statements are safe under PostgreSQL's default READ COMMITTED isolation because the unique-key and row locks make the conditional write atomic. The adapter does not keep a transaction open across the read/CAS retry loop. A caller may use a pool or transaction wrapper for observability, but must not weaken the conditional predicates or reuse one connection transaction across unrelated operations. The adapter does not claim exactly-once execution of an external mutation. It coordinates the durable operation record; the provider still needs its own idempotency or inbox/outbox boundary. Schema and migration ownership The migration is exported as a string for an application-owned migration: Do not run this migration automatically from the adapter. Production schema changes must be versioned, reviewed, and rolled back through the host's normal database migration process. Use a distinct table or prefix per application and environment. Verification boundary The repository tests use a structural fake query client to verify parameterized SQL shape, insert/update/delete CAS, keyset pagination, lease reclaim, replay, and retention pruning. They do not prove a live PostgreSQL server, network, TLS, pool, migration, or failover configuration. Before production adoption, add an opt-in integration f

Key points:
• `createPostgresDurableOperationBackend()` owns SQL record mapping and
• The package does not depend on `pg`, a pool implementation, credentials, or
• The application injects a `query(text, values)` client and runs the exported
• The existing `createDurableOperationStore()` remains the only state machine;
• a new record uses `INSERT ... ON CONFLICT DO NOTHING`;
• a revision transition uses `UPDATE ... WHERE operation_key = $1 AND revision = $n`;
• pruning uses `DELETE ... WHERE operation_key = $1 AND revision = $2`.
• the exact `pg`/pool wrapper used by the service;
• the versioned migration applied to an isolated database;
• concurrent claims from separate connections;
• lease reclaim, unknown reconciliation, replay, and bounded prune checks;
• evidence for PostgreSQL version, isolation setting, owner, and rollback.