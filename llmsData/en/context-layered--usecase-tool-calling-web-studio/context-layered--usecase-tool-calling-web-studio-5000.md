---
document_id: context-layered--usecase-tool-calling-web-studio
category: context-layered
source_path: en/context-layered/usecase-tool-calling-web-studio.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.306Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Tool-Calling Web Studio Convention

Tool-Calling Web Studio Convention This document turns the standalone web-coding demo into a reusable Context-Action convention and use-case recipe. It describes the boundary between a model/provider, the typed tool registry, workspace domain logic, browser persistence, and the React views. It is intentionally a demo convention, not a requirement that every Context-Action application must use MCP or an iframe preview. When to use this recipe Use this shape when a browser application needs one or more of the following: - a model or local agent that can inspect and mutate a document-like workspace; - MCP or function-calling tools that must be listed, approved, executed, and returned as structured results; - browser-only persistence such as IndexedDB, Blob assets, or a local folder adapter; - a live preview that acknowledges the revision it rendered; - a UI that exposes the tool catalog and execution trace for debugging. If the feature only has ordinary form state and no command boundary, use the standard Action Only or Store Only pattern instead. Canonical flow The model never receives a workspace object and the view never decides whether a tool is allowed. Each boundary has one source of truth: | Boundary | Owner | Responsibility | | --- | --- | --- | | Tool identity and input/output schema | Tool Context | Define names, descriptions, annotations, and validation | | Provider transport | action hook | Translate model messages into canonical model tool calls | | Approval and policy | Tool Context policy | Allow, deny, or request confirmation | | Workspace mutation | tool handler + manager | Check revision/type/path invariants and update the domain | | Persistence | repository/filesystem adapter | Store browser data or sync an explicitly connected folder | | Preview | preview compiler/bridge | Render a revision and acknowledge ready/error | | Observation | observable hook | Subscribe React to external workspace and trace state | | Presentation | view | Render data and emit callbacks | Panel layout preference boundary Collapsible and resizable editor panels are a presentation preference, not a workspace mutation. The standalone implementation keeps this state behind hooks/use-panel-layout.ts, passes data and callbacks into the workbench and views/preview-panel.tsx, and exposes the interaction through the pure views/panel-resize-handle.tsx primitive. The complete state contract, width bounds, Dexie persistence boundary, presentation-only ownership decision, and promotion criteria for a Store Context are maintained in Panel Layout Preference Convention. The existing WebCodingWorkspaceRepository stores the preference in its preferences table; it is not a localStorage side channel. The panel preference must not enter tools/call, revi

Key points:
• a model or local agent that can inspect and mutate a document-like workspace;
• MCP or function-calling tools that must be listed, approved, executed, and
• browser-only persistence such as IndexedDB, Blob assets, or a local folder
• a live preview that acknowledges the revision it rendered;
• a UI that exposes the tool catalog and execution trace for debugging.
• normalized paths and supported file kinds;
• expected revision and conflict handling;
• text-size and asset-size limits;
• folder-linked versus browser-only state;
• preview acknowledgement and timeout behavior.
• a model call routed through `executeModelToolCall`;
• a deterministic local-agent call routed through the same boundary;
• a manually selected palette command routed through the direct action hook.
• A view calls `workspace.setValue`, Dexie, or `fetch` directly.
• OpenRouter and local fallback each implement their own mutation path.
• The catalog reconstructs tool definitions instead of reading the registry.
• A model-originated write bypasses policy because it came from a convenient
• A handler returns a success message before persistence or preview completion.
• Revision conflicts are hidden by re-reading and overwriting the latest file.
• External ToolContext state is subscribed to separately in many views.
• Call `tools/list` from the registry.
• Build a bounded local plan from the user prompt.
• Add the observed revision to guarded mutations.
• Execute every call through `executeModelToolCall`.
• Return the same structured result and trace shape as a provider call.
• Export the registry definitions to the provider format.
• Normalize assistant tool calls and validate JSON arguments.
• Execute each call through the ToolContext registry.
• Append the canonical tool result to the provider...