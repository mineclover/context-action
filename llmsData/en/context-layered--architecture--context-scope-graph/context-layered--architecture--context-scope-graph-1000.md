---
document_id: context-layered--architecture--context-scope-graph
category: context-layered
source_path: en/context-layered/architecture/context-scope-graph.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.285Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
ContextScope Symbol Graph

ContextScope Symbol Graph Status and purpose This document defines the contract for grouping symbols by a meaningful context. The revision-bound manifest parser, context-scope CLI projection, JSON Schemas, and library-level bounded SEM dependency projection are implemented in the current PoC. A renderer and API/transaction-specific adapters remain future work. The first

Key points:
• Validate the context profile and resolve every manifest anchor against the complete snapshot.
• Verify that the manifest belongs to the same selected revision as the snapshot.
• Load SEM dependency...