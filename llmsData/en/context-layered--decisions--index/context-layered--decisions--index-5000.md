---
document_id: context-layered--decisions--index
category: context-layered
source_path: en/context-layered/decisions/index.md
character_limit: 5000
last_update: '2026-08-01T04:34:43.118Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Architecture Decision Records

Architecture Decision Records Decision records keep durable architectural choices close to the conventions that govern them. They are not a runtime registry and do not duplicate a package README or public guide. When to create one Create a record for a decision that changes package ownership or dependency direction, provider/handler/store boundaries, a protocol contract, persistence or privacy behavior, or a temporary compatibility exception. Use a stable identifier in the filename, for example CA-TOOL-PROTOCOL-001.md. Keep the identifier when the implementation moves; link a replacement record when the decision is superseded. Required shape The implementation, focused tests, and authoritative user documentation remain the evidence for the decision. This index only establishes the durable home and format for the decision itself. Existing reference decisions - PostgreSQL Durable Operation Adapter

Key points:
• [PostgreSQL Durable Operation Adapter](../architecture/postgres-durable-operation-adapter.md)