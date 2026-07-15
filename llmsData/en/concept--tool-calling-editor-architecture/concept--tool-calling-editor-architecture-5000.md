---
document_id: concept--tool-calling-editor-architecture
category: concept
source_path: en/concept/tool-calling-editor-architecture.md
character_limit: 5000
last_update: '2026-07-15T14:31:19.548Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Tool Calling Editor Architecture

Tool Calling Editor Architecture A browser-based live editor keeps the canonical Tool Registry, policy, and call trace in the parent document. The iframe is a preview and document bridge, not the tool runtime. Execution boundary Orca is an ADE that connects multiple coding agents with worktrees, terminals, and an embedded browser. This project uses only selected boundaries from the reference clone: - Design Mode selection capture: pass selector, HTML/CSS summary, and screen state as context - browser bridge: separate browser UI from host-owned state - agent lifecycle: observe started, waiting, approval, completed, and failed states - CLI command bridge: expose explicit commands instead of arbitrary scripts Reference clone: architecture-references/orca (MIT, inspected at commit 9a23792) Realtime web-coding showcase The focused showcase route is /integrations/live-web-coding. It intentionally keeps the first slice small: a three-file HTML/CSS/JS workspace, a visible web. tool palette including bounded web.applyPatch, an optional OpenRouter model loop, and a sandboxed iframe preview. Without an API key, the same tools/list → model/local agent → tools/call → tool result path runs through a deterministic local fallback, so the tool contract and preview synchronization can be tested offline. bolt.diy is a reference for the larger browser coding-agent shape—provider selection, file-oriented editing, preview, and MCP integration. It is not a dependency or a target architecture for this showcase; browser-local persistence and the parent-owned ToolContext remain the current boundary. The Bolt-style standalone studio is published at /web-coding/ from the demos/bolt-style-editor workspace package. It is independent of the example application route and imports only the framework package plus its own editor surface. Its first slice uses a Dexie-backed browser workspace, Blob file records, and a deterministic local agent so GitHub Pages can demonstrate the complete tools/list → model/local agent → tools/call → tool result → preview flow without an API key. If IndexedDB is unavailable, it falls back to the memory workspace. Open folder now uses a parent-owned browser adapter: it prefers the File System Access API and falls back to a directory-upload input, then replaces the Dexie workspace with the imported text files. When the user grants read/write access, Save to folder writes dirty files back to that directory; a structured-clone-capable browser may persist the handle alongside workspace metadata for the next load. The directory-upload fallback remains browser-workspace-only. When a writable folder remains linked, Reload reads the directory again and replaces the browser workspace; dirty changes require explicit confirmation before they are discarde

Key points:
• Design Mode selection capture: pass selector, HTML/CSS summary, and screen state as context
• browser bridge: separate browser UI from host-owned state
• agent lifecycle: observe started, waiting, approval, completed, and failed states
• CLI command bridge: expose explicit commands instead of arbitrary scripts
• `ToolCallId` correlates a model call with its result
• `ToolCallContext` carries `source`, `sessionId`, and `revision`
• `ToolCallError` provides stable `code`, `message`, `retryable`, and `details`
• `ToolCallEvent` exposes `started`, `completed`, and `failed`
• Each `ToolCallEvent` carries the canonical `tools/call` request so an audit
• An action's optional `outputSchema` validates structured handler results before
• `allowedToolNames`: an allowlist applied to both discovery and execution
• `toolPolicy`: an `allow`, `ask`, or `deny` decision
• `onToolCall`: lifecycle observer for traces and audit UI
• preview rendering
• receiving document revisions and reporting apply status
• handling a restricted bridge message set
• the editor is reused by multiple products outside context-action;
• it needs an independent release and versioning cadence;
• editor-specific dependencies such as Monaco/Codemirror, bundlers, workers,
• framework and editor teams need separate ownership or security operations.
• Dexie is the canonical browser-local store for workspace metadata and file
• `Open folder` uses a generic file-system adapter. The current browser adapter
• Supported HTML, CSS, JavaScript, JSON, Markdown, TypeScript, and text files are
• File-system handles stay behind the parent adapter and never enter tool
• The Explorer `Reload` action re-reads the connected directory through the
• Text edits are persisted to Dexie immediately. With a read/write directory
• The...