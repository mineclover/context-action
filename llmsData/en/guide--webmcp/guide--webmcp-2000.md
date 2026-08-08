---
document_id: guide--webmcp
category: guide
source_path: en/guide/webmcp.md
character_limit: 2000
last_update: '2026-08-08T10:19:43.482Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
WebMCP Browser Tools

WebMCP Browser Tools @context-action/webmcp exposes an explicit subset of a canonical Context-Action tool registry through Chrome's experimental WebMCP imperative API. It is a browser adapter, not another registry: validation, authorization, approval, idempotency, provenance, and durable execution still run through ToolManagementInterface. > WebMCP is experimental browser functionality. Treat it as a progressive > enhancement and keep a non-WebMCP UI or server path for unsupported clients. Register a capability scope Use a stable session identifier and name every tool that the page may expose. An omitted tool is never published implicitly. Each registered WebMCP invocation receives a generated tool-call ID and is executed through registry.executeModelToolCall(). The adapter labels the canonical context with source: 'model', mode: 'agent', and metadata.transport: 'webmcp'. By default, that call ID is also the idempotency key; supply getIdempotencyKey when the surrounding workflow has a stable retry key. The

Key points:
• Register the exact consumer origin with `exposedTo` (HTTPS only; local HTTP
• Set the embedding iframe's `allow="tools"` permission when an iframe is
• Let the consumer discover tools with its matching `fromOrigins` request.