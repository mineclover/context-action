---
document_id: context-layered--convention-alignment-plan
category: context-layered
source_path: en/context-layered/convention-alignment-plan.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.315Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered Convention Alignment Plan

Context-Layered Convention Alignment Plan Status: Direct-registration inventory closed; remaining structural gates tracked Last reviewed: 2026-07-16 This document records the repository-level decision for aligning existing examples and documentation with the Context-Layered architecture. It sits beside the implementation convention because it describes the current-state classification, the fixed provider composition, and the migration gates needed to make the convention enforceable. Decisions 1. Context-Layered is the single standard for new work New scenarios use these layers: Strict MVVM material remains useful as migration context, but it is not a second standard for new implementation-playbook work. 2. Every handler is registered through a Handler Registry There is no size-based exception. - Context files define and compose boundaries; they do not register handlers. - Every domain exposes a HandlerRegistry (or an equivalent registry component). - All useActionHan

Key points:
• Context files define and compose boundaries; they do not register handlers.
• Every domain exposes a `*HandlerRegistry` (or an equivalent registry component).
• All `use*ActionHandler` calls belong inside the registry or its handler modules.
• Pages and views mount the registry; they do not register handlers directly.
• `CanonicalOrderHandlers.tsx` already composes an action provider, store provider, ref provider, and handler registry.
• `LogMonitor` was the first migration target: its boundaries now live under `contexts/`, all five handlers are registered by...