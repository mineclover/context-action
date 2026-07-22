---
document_id: concept--tool-calling-editor-architecture
category: concept
source_path: en/concept/tool-calling-editor-architecture.md
character_limit: 2000
last_update: '2026-07-20T18:03:43.569Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Tool Calling Editor Architecture

Tool Calling Editor Architecture A browser-based live editor keeps the canonical Tool Registry, policy, and call trace in the parent document. The iframe is a preview and document bridge, not the tool runtime. For the reusable Context-Action rules and use-case recipes behind this demo, see Tool-Calling Web Studio Convention. Execution boundary ToolCallResult.content accepts both text and JSON content blocks. Provider serializers may use structuredContent when present, but must retain the content blocks when no structured output exists; the canonical runtime guard validates both forms before a result is sent back to the model. Use the core stringifyToolContent helper for human-readable provider/UI text so a JSON block is not silently dropped by a text-only mapper. Orca is an ADE that connects multiple coding agents with worktrees, terminals, and an embedded browser. This project uses only selected boundaries from the reference clone: - Design Mode selection capture: pass se

Key points:
• Design Mode selection capture: pass selector, HTML/CSS summary, and screen state as context
• browser bridge: separate browser UI from host-owned state
• agent lifecycle: observe started, waiting, approval, completed, and failed states
• CLI command bridge: expose explicit commands instead of arbitrary scripts
• `ToolCallId` correlates a model call with its result
• `ToolCallContext` carries transport `source`, execution `mode`, `sessionId`,
• `isToolListRequest()` and `isToolCallRequest()` validate untrusted JSON before
• `isToolListResult()` validates each discovery page before `listAllTools()`...