---
document_id: context-layered--next-work
category: context-layered
source_path: en/context-layered/next-work.md
character_limit: 2000
last_update: '2026-07-20T18:05:45.087Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Next Work and Documentation Ownership

Next Work and Documentation Ownership This page is the short, maintained backlog for the Context-Action architecture and tool-calling work. It prevents the semantic architecture guide, operational runbook, package READMEs, and generated API pages from carrying separate TODO lists. Documentation ownership | Concern | Canonical source | Keep out of this source | | --- | --- | --- | | Tool execution semantics, timeout, abort-drain, idempotency, durable recovery | Tool-calling Editor Architecture | deployment commands and incident response | | Redis deployment, retention, rollback, and operator procedure | Durable Operation Runbook | new protocol semantics | | Package API and consumer quickstart | package README.md | a second state-machine specification | | Exported TypeScript signatures | TypeDoc output and typedoc-vitepress-sync | handwritten behavior claims | | Symbol/document work context | @context-action/sem-doc reports and boundary guide | architecture-gate policy | | Architecture e

Key points:
• Durable operation records have lease-aware claim/replay/complete/fail/unknown
• IndexedDB and Redis reference backends, optional Redis client bridges, bounded
• Live Code Editor recovery covers both `editor.saveFile` and `editor.saveAll`.
• `TOOL_EXECUTION_UNKNOWN` diagnostics are retained in the durable record after
• `sem-doc` remains the operational Symbol Context SSOT, while Architecture
• Complete symbol snapshots, commit history, context intersection, and explicit
• LSP-level exact reference locations, unsaved overlays, and CodeActions.
• A compiler-resolved graph provider such as...