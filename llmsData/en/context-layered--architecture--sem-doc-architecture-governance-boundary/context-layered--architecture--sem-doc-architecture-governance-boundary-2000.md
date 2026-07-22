---
document_id: context-layered--architecture--sem-doc-architecture-governance-boundary
category: context-layered
source_path: en/context-layered/architecture/sem-doc-architecture-governance-boundary.md
character_limit: 2000
last_update: '2026-07-20T17:25:11.382Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
sem-doc and Architecture Governance Boundary

sem-doc and Architecture Governance Boundary @context-action/sem-doc and @context-action/architecture-governance are related repository tools, but they are not two names for the same library and neither replaces the other. They may use the same external sem executable and the policy-neutral Foundation packages, while keeping separate inputs, reports, consumers, and release contracts. The position is intentionally asymmetric: sem-doc is the operational Symbol Context plane, while Architecture Governance is an experimental Context-Action convention-driven control plane. The latter tests repository-local authored rules and evidence management; it is not a generic architecture standard or document editor. Decision at a glance | Package | Primary question | Main input | Main output | Consumer | Gate? | | --- | --- | --- | --- | --- | --- | | @context-action/sem-doc | What context, documents, and operational scope does an engineer need bef

Key points:
• resolve a target entity and its definition source;
• collect bounded one-hop or two-hop structural relationships;
• list dependent files and affected tests as advisory evidence;
• index exact TSDoc entity bindings and backlinks;
• capture the Git working-tree or staged diff before editing.
• project the work-context into the canonical operational `sem-doc-context-scope.v3` grouping for a screen, API, or transaction review.
• materialize bounded commit snapshots/diffs, stream them as NDJSON, and intersect changed symbols from two branches.
• keep a stable...