---
document_id: context-layered--package-boundary-convention
category: context-layered
source_path: en/context-layered/package-boundary-convention.md
character_limit: 2000
last_update: '2026-07-22T19:56:24.955Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Package Boundary and Codebase Management Convention

Package Boundary and Codebase Management Convention Status: Active for new work and boundary changes Scope: workspace packages, examples, demos, architecture evidence, and documentation ownership This convention defines how the Context-Action repository is divided into packages and how a change moves through the codebase. The package boundary is an ownership and dependency boundary, not only a folder name. Each package must have one primary responsibility, one public contract, and one clear verification route. 1. Boundary rules 1. A package owns one coherent capability. If a change needs two unrelated responsibilities, split the work or record an architecture decision before adding code. 2. A package may depend on a lower-level package only through its declared package export. Do not import another package through a relative path, src/, dist/, or a test-only alias. 3. package.json is the source of truth for runtime, peer, optional, and development dependencies. A s

Key points:
• `core` never depends on `react`.
• `tool-protocol` is framework-neutral and does not depend on `core` or `react`; it owns the provider/tool boundary.
• `tool-durable-operations` is framework-neutral and does not depend on `core`, `react`, or `tool-protocol`; it owns durable mutation recovery and provider side-effect adapters.
• `react` consumes `core` and `mutative`; `mutative` consumes only the lower-level `mutative-core` runtime and does not import React types.
• `mutative-core` remains upstream-compatible and must not depend on Context-Action adapters or React.
•...