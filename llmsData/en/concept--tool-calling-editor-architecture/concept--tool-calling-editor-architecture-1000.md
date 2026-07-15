---
document_id: concept--tool-calling-editor-architecture
category: concept
source_path: en/concept/tool-calling-editor-architecture.md
character_limit: 1000
last_update: '2026-07-15T14:31:19.547Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Tool Calling Editor Architecture

Tool Calling Editor Architecture A browser-based live editor keeps the canonical Tool Registry, policy, and call trace in the parent document. The iframe is a preview and document bridge, not the tool runtime. Execution boundary Orca is an ADE that connects multiple coding agents with worktrees, terminals, and an embedded browser. This project uses only selected boundaries from the re

Key points:
• Design Mode selection capture: pass selector, HTML/CSS summary, and screen state as context
• browser bridge: separate browser UI from host-owned state
• agent lifecycle: observe started, waiting,...