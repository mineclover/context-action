---
document_id: context-layered--architecture--context-scope-graph
category: context-layered
source_path: en/context-layered/architecture/context-scope-graph.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.286Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
ContextScope Symbol Graph

ContextScope Symbol Graph Status and purpose This document defines the contract for grouping symbols by a meaningful context. The revision-bound manifest parser, context-scope CLI projection, JSON Schemas, and library-level bounded SEM dependency projection are implemented in the current PoC. A renderer and API/transaction-specific adapters remain future work. The first delivered slice is a screen: a screen is an entry symbol and the symbols structurally used by that screen are displayed inside a larger visual boundary. The durable model is designed to support an API boundary, a transaction, a workflow, or a document, but those adapters are not implied by the first release. Therefore the durable abstraction is ContextScope, not ScreenGraph. Source layers The graph is a projection over existing evidence layers: The complete symbol snapshot remains the canonical inventory of definitions at a revision. A context graph adds membership and relationships; it must

Key points:
• Validate the context profile and resolve every manifest anchor against the complete snapshot.
• Verify that the manifest belongs to the same selected revision as the snapshot.
• Load SEM dependency evidence and manifest-declared edges allowed by the profile.
• Sort candidate edges by `from`, `to`, `kind`, and evidence reference *before* breadth-first expansion.
• Traverse the allowed edge kinds to the configured depth, deduplicating by canonical symbol identity.
• Materialize context, architectural-layer, project, or module memberships and sort every collection
• Add the versioned `SymbolRef`...