---
document_id: context-layered--package-boundary-convention
category: context-layered
source_path: en/context-layered/package-boundary-convention.md
character_limit: 1000
last_update: '2026-07-30T23:07:58.192Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Package Boundary and Codebase Management Convention

Package Boundary and Codebase Management Convention Status: Active for new work and boundary changes Scope: workspace packages, examples, demos, architecture evidence, and documentation ownership This convention defines how the Context-Action repository is divided into packages and how a change moves through the codebase. The package boundary is an ownership and dependency bou

Key points:
• `core` never depends on `react`.
• `tool-protocol` is framework-neutral and does not depend on `core` or `react`; it owns the provider/tool boundary.
• `tool-durable-operations` is...