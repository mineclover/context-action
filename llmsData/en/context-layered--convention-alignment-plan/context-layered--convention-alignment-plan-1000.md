---
document_id: context-layered--convention-alignment-plan
category: context-layered
source_path: en/context-layered/convention-alignment-plan.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.314Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered Convention Alignment Plan

Context-Layered Convention Alignment Plan Status: Direct-registration inventory closed; remaining structural gates tracked Last reviewed: 2026-07-16 This document records the repository-level decision for aligning existing examples and documentation with the Context-Layered architecture. It sits beside the implementation convention because it describes the current-state classifi

Key points:
• Context files define and compose boundaries; they do not register handlers.
• Every domain exposes a `*HandlerRegistry` (or an equivalent registry component).
• All `use*ActionHandler` calls...