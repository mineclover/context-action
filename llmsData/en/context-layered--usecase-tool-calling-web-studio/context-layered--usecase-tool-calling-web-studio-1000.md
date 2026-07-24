---
document_id: context-layered--usecase-tool-calling-web-studio
category: context-layered
source_path: en/context-layered/usecase-tool-calling-web-studio.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.305Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Tool-Calling Web Studio Convention

Tool-Calling Web Studio Convention This document turns the standalone web-coding demo into a reusable Context-Action convention and use-case recipe. It describes the boundary between a model/provider, the typed tool registry, workspace domain logic, browser persistence, and the React views. It is intentionally a demo convention, not a requirement that every Context-Action

Key points:
• a model or local agent that can inspect and mutate a document-like workspace;
• MCP or function-calling tools that must be listed, approved, executed, and
• browser-only persistence such as...