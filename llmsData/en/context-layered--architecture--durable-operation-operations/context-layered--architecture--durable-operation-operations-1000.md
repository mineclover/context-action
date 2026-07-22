---
document_id: context-layered--architecture--durable-operation-operations
category: context-layered
source_path: en/context-layered/architecture/durable-operation-operations.md
character_limit: 1000
last_update: '2026-07-20T17:57:58.102Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Durable Operation Operations Runbook

Durable Operation Operations Runbook This runbook is the operational companion to the semantic contract in the Tool-calling editor architecture guide. It covers deployment verification for the Redis reference backend and the recovery boundary exposed by @context-action/react. The guide above is the semantic source of truth. This page intentionally keeps only

Key points:
• `@context-action/tool-protocol` owns the durable-operation state machine and
• `@context-action/react` owns `ToolContext` and the
• The application owns the domain status query,...