---
document_id: context-layered--architecture--durable-operation-operations
category: context-layered
source_path: en/context-layered/architecture/durable-operation-operations.md
character_limit: 5000
last_update: '2026-07-20T17:57:58.103Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Durable Operation Operations Runbook

Durable Operation Operations Runbook This runbook is the operational companion to the semantic contract in the Tool-calling editor architecture guide. It covers deployment verification for the Redis reference backend and the recovery boundary exposed by @context-action/react. The guide above is the semantic source of truth. This page intentionally keeps only deployment, incident, and resolver-operating procedures; package READMEs should link here instead of repeating the durable state machine. Boundary and prerequisites - @context-action/tool-protocol owns the durable-operation state machine and Redis backend. - @context-action/react owns ToolContext and the getOperationStatus()/recoverOperation() registry surface. - The application owns the domain status query, compensation decision, and downstream idempotency/outbox behavior. - Redis must be reachable from every process that can execute the mutation. Use a TLS URL and an ACL user in staging/production; do not print the URL or credentials in logs. Deployment verification Run the public-API smoke check against the exact Redis endpoint used by the deployment. The command creates a unique key prefix and removes its records when it exits. The smoke check must report status: "ok" for all of these checks: - atomic claim across two store instances; - completed-result replay without a second owner; - unknown record resolution with a revision check; - terminal-record retention pruning. Run the full integration suite as a second gate. It exercises eight concurrent owners, lease expiry/reclaim, recovery, and bounded retention cleanup: The CI workflow runs the smoke command and this suite with Redis 7. A staging or production pass is still required because connectivity, TLS, ACL permissions, failover behavior, and latency are deployment properties that CI cannot prove. Verification evidence Keep one short evidence record per target environment. A local Redis 7 container is useful for reproducing the contract but does not satisfy the staging/production gate. | Field | Required value | | --- | --- | | Environment | local, staging, or production | | Commit | exact application commit SHA | | Redis version | server major/minor from an operator-safe version check | | Endpoint | hostname/port only; never the full URL or credentials | | Smoke | command timestamp and status: "ok" | | Integration | command timestamp and passed/skipped counts | | Operator | responsible owner or automation run ID | | Rollback | approved application/backend rollback decision | Attach the raw CI or command output to the protected deployment record, not to the repository. If any gate fails, mark the deployment unverified and keep mutation traffic fail-closed until the cause and rollback decision are reco

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
• pending records older than their lease;
• repeated CAS contention or failed prune runs;
• growth of the operation catalog beyond the expected retention window.
• Read the record with `registry.getOperationStatus(toolName, key, context)`.
• If it is `pending`, wait for the lease or investigate the owner; do not
• If it is `completed` or `failed`, replay the recorded result and stop.
• If it is `unknown`, call `registry.recoverOperation()` with an application
• The resolver returns a completed/failed resolution. The observed revision is
• If a genuinely new logical operation is required, generate a new