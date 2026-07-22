---
document_id: context-layered--architecture--durable-operation-operations
category: context-layered
source_path: en/context-layered/architecture/durable-operation-operations.md
character_limit: 2000
last_update: '2026-07-20T17:57:58.102Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Durable Operation Operations Runbook

Durable Operation Operations Runbook This runbook is the operational companion to the semantic contract in the Tool-calling editor architecture guide. It covers deployment verification for the Redis reference backend and the recovery boundary exposed by @context-action/react. The guide above is the semantic source of truth. This page intentionally keeps only deployment, incident, and resolver-operating procedures; package READMEs should link here instead of repeating the durable state machine. Boundary and prerequisites - @context-action/tool-protocol owns the durable-operation state machine and Redis backend. - @context-action/react owns ToolContext and the getOperationStatus()/recoverOperation() registry surface. - The application owns the domain status query, compensation decision, and downstream idempotency/outbox behavior. - Redis must be reachable from every process that can execute the mutation. Use a TLS URL and an ACL user in staging/prod

Key points:
• `@context-action/tool-protocol` owns the durable-operation state machine and
• `@context-action/react` owns `ToolContext` and the
• The application owns the domain status query, compensation decision, and
• Redis must be reachable from every process that can execute the mutation.
• atomic claim across two store instances;
• completed-result replay without a second owner;
• `unknown` record resolution with a revision check;
• terminal-record retention pruning.
• `TOOL_IDEMPOTENCY_STORE_FAILED` rate and Redis command latency;
• `TOOL_IDEMPOTENCY_UNKNOWN` count or age;
• pending...