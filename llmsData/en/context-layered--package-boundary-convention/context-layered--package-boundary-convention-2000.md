---
document_id: context-layered--package-boundary-convention
category: context-layered
source_path: en/context-layered/package-boundary-convention.md
character_limit: 2000
last_update: '2026-10-25T07:23:14.371Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Package Boundary and Codebase Management Convention

Package Boundary and Codebase Management Convention Status: Active for new work and boundary changes Scope: workspace packages, examples, demos, decision records, and documentation ownership This convention defines how the Context-Action repository is divided into packages and how a change moves through the codebase. The package boundary is an ownership and dependency boundary, not only a folder name. Each package must have one primary responsibility, one public contract, and one clear verification route. 1. Boundary rules 1. A package owns one coherent capability. If a change needs two unrelated responsibilities, split the work or record an architecture decision before adding code. 2. A package may depend on a lower-level package only through its declared package export. Do not import another package through a relative path, src/, dist/, or a test-only alias. 3. package.json is the source of truth for runtime, peer, optional, and development dependencies. A source

Key points:
• `core` never depends on `react`.
• `tool-protocol` is framework-neutral and does not depend on `core` or `react`; it owns the provider/tool boundary.
• `ai-sdk` is a thin optional provider adapter. It depends on `tool-protocol` and has `ai` as a required peer, but it never depends on React, core execution, provider credentials, or an application model client.
• `tool-durable-operations` is framework-neutral and does not depend on `core`, `react`, or `tool-protocol`; it owns durable mutation recovery and provider side-effect adapters.
• `react` consumes `core` and...