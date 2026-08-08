---
document_id: guide--webmcp
category: guide
source_path: en/guide/webmcp.md
character_limit: 5000
last_update: '2026-08-08T10:19:43.482Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
WebMCP Browser Tools

WebMCP Browser Tools @context-action/webmcp exposes an explicit subset of a canonical Context-Action tool registry through Chrome's experimental WebMCP imperative API. It is a browser adapter, not another registry: validation, authorization, approval, idempotency, provenance, and durable execution still run through ToolManagementInterface. > WebMCP is experimental browser functionality. Treat it as a progressive > enhancement and keep a non-WebMCP UI or server path for unsupported clients. Register a capability scope Use a stable session identifier and name every tool that the page may expose. An omitted tool is never published implicitly. Each registered WebMCP invocation receives a generated tool-call ID and is executed through registry.executeModelToolCall(). The adapter labels the canonical context with source: 'model', mode: 'agent', and metadata.transport: 'webmcp'. By default, that call ID is also the idempotency key; supply getIdempotencyKey when the surrounding workflow has a stable retry key. The returned scope reports whether the current document supports WebMCP. In SSR or unsupported browsers it is inert (supported: false) rather than throwing, so feature detection belongs at the UI boundary. React lifecycle integration @context-action/react/tools provides a hook that owns registration for a component lifetime. Obtain the canonical registry from your ToolContext, and memoize the options object so unrelated renders do not unregister and register the tools again. The hook disposes the scope on unmount, including an asynchronous registration that resolves after the component has already unmounted. Browser and origin requirements WebMCP registration requires a visible browser or webview context with document.modelContext; navigator.modelContext is not the supported API. Production pages need cross-origin isolation and the tools Permissions Policy. For cross-origin consumers, configure all of the following: - Register the exact consumer origin with exposedTo (HTTPS only; local HTTP is accepted only for localhost, 127.0.0.1, and [::1]). - Set the embedding iframe's allow="tools" permission when an iframe is involved. - Let the consumer discover tools with its matching fromOrigins request. WebMCP's visibility is not an authorization grant. Keep destructive-action confirmation and policy rules in the canonical tool registry, and expose the smallest tool list necessary for the current page. See Chrome's WebMCP overview and imperative API guide for current browser availability and deployment requirements.

Key points:
• Register the exact consumer origin with `exposedTo` (HTTPS only; local HTTP
• Set the embedding iframe's `allow="tools"` permission when an iframe is
• Let the consumer discover tools with its matching `fromOrigins` request.