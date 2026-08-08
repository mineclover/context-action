---
document_id: guide--webmcp
category: guide
source_path: en/guide/webmcp.md
character_limit: 1000
last_update: '2026-08-08T10:19:43.482Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
WebMCP Browser Tools

WebMCP Browser Tools @context-action/webmcp exposes an explicit subset of a canonical Context-Action tool registry through Chrome's experimental WebMCP imperative API. It is a browser adapter, not another registry: validation, authorization, approval, idempotency, provenance, and durable execution still run through ToolManagementInterface. > WebMCP is experimental browser functionality. Treat it as a progressive > enha

Key points:
• Register the exact consumer origin with `exposedTo` (HTTPS only; local HTTP
• Set the embedding iframe's `allow="tools"` permission when an iframe is
• Let the consumer discover tools with its matching `fromOrigins` request.