---
document_id: context-layered--next-work
category: context-layered
source_path: en/context-layered/next-work.md
character_limit: 2000
last_update: '2026-07-30T23:07:58.107Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Next Work and Documentation Ownership

Next Work and Documentation Ownership This page is the short, maintained backlog for the Context-Action architecture and tool-calling work. It prevents the semantic architecture guide, operational runbook, package READMEs, and generated API pages from carrying separate TODO lists. Documentation ownership | Concern | Canonical source | Keep out of this source | | --- | --- | --- | | Tool execution semantics, timeout, abort-drain, idempotency, durable recovery | Tool-calling Editor Architecture | deployment commands and incident response | | Redis deployment, retention, rollback, and operator procedure | Durable Operation Runbook | new protocol semantics | | Package API and consumer quickstart | package README.md | a second state-machine specification | | Durable mutation execution, side-effect adapters, and backend operations | @context-action/tool-durable-operations and Durable Operation Runbook | provider-neutral tool schemas or domain outbox policy | | Exported TypeScript signatures

Key points:
• Durable operation records have lease-aware claim/replay/complete/fail/unknown
• IndexedDB, Redis, and PostgreSQL reference backends, optional Redis client
• Live Code Editor recovery covers both `editor.saveFile` and `editor.saveAll`.
• `TOOL_EXECUTION_UNKNOWN` diagnostics are retained in the durable record after
• The repository CI workflow uses Redis 7 and PostgreSQL 16 service containers
• A local tarball consumer smoke installs the unpublished tool packages and
• LSP-level exact reference locations, unsaved overlays, and CodeActions.
• A compiler-resolved graph provider such as `@samchon/graph` or...