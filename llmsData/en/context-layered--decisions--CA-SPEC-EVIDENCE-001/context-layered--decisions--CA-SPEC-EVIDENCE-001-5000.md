---
document_id: context-layered--decisions--CA-SPEC-EVIDENCE-001
category: context-layered
source_path: en/context-layered/decisions/CA-SPEC-EVIDENCE-001.md
character_limit: 5000
last_update: '2026-09-29T08:48:29.712Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
CA-SPEC-EVIDENCE-001: TypeSpec Evidence Integration and Frontend State Tiering Governance

CA-SPEC-EVIDENCE-001: TypeSpec Evidence Integration and Frontend State Tiering Governance Status: accepted Owner: Framework Core & Architecture Governance Related Issues/Specs: CA-ARCH-001, CA-SPEC-001, change-management-convention Last Reviewed: 2026-09-19 Context The Context-Action framework successfully isolates frontend state management and business logic through its 6-layer separation (contexts / business / handlers / actions / hooks / views). In particular, forcing pure functions (Draft, Validation, Result, StateMachine) into the business/ layer provides high testability. However, in large enterprise environments and autonomous AI agent workflows, new challenges emerged: 1. Lack of Compile-Time Specification Traceability Enforcement: Issue and specification IDs (CA-) were verified only at the text/PR level. When product requirements or backend schemas drifted, discrepancies with frontend business functions could not be prevented fail-closed at compile time. 2. Governance Friction from Frequent UI Changes: If all UI states were governed by strict SSOT contracts, rapid surface-level iterations (modal open/close, focus, tab switching, etc.) would require constant TypeSpec recompilations and AST hash lock churn, hurting developer velocity. To address these challenges, we integrate the compiler-backed SSOT governance from tsp-evidence and establish a Three-Tier State Classification (State Tiering) convention tailored for frontend development. --- Considered Alternatives 1. Alternative A: Full-Scale TypeSpec SSOT for All States - Model all Actions, Store States, and component-local presentation states in TypeSpec. - Rejected: Rapid presentation tweaks require continuous TypeSpec updates and AST lock maintenance, causing severe developer fatigue. 2. Alternative B: Retain Status Quo PR Text Traceability - Rely solely on check-change-traceability.mjs checking #issue or CA- commit headers. - Rejected: Inability to perform 3-phase reverse forensics from UI errors back to requirement anchors, and vulnerable to silent schema drift. 3. Alternative C (Accepted): Selective TypeSpec Evidence Integration with State Tiering - Enforce TypeSpec SSOT and strict AST hash locking (@evidenceReview) only on durable domain contracts (Tier 1). - Pure business functions bind directly as TypeSpec "Policy Hopping" targets. - Explicit waiver for volatile presentation state (Tier 3). --- Decision 1. Three-Tier State Classification All states and business functions must be classified into one of three tiers during design: | Tier | Definition | Location | TypeSpec SSOT | Evidence Enforcement Level | | :--- | :--- | :--- | :--- | :--- | | Tier 1: Durable Domain Contract | External API DTOs, persistence models (IndexedDB/storage), legal/financial validatio

Key points:
• **Inception / Experimental**: `"severity": "off"` (no CI blocks during exploratory phase)
• **Beta / Hardening**: `"severity": "warning"` (surfaces missing anchors and gaps)
• **GA / Release**: `"severity": "error"` (strict fail-closed gate; 100% coverage required)
• `pnpm convention:check`: Verifies Context-Layered boundary and React isolation.
• `node scripts/verify-context-action-conventions.mjs`: Verifies repository-wide convention integrity.
• `tsp-evidence check specs/**/*.tsp`: Verifies TypeSpec model citations and AST references.
• **Lack of Compile-Time Specification Traceability Enforcement**: Issue and specification IDs (`CA-*`) were verified only at the text/PR level. When product requirements or backend schemas drifted, discrepancies with frontend business functions could not be prevented fail-closed at compile time.
• **Governance Friction from Frequent UI Changes**: If all UI states were governed by strict SSOT contracts, rapid surface-level iterations (modal open/close, focus, tab switching, etc.) would require constant TypeSpec recompilations and AST hash lock churn, hurting developer velocity.
• **Alternative A: Full-Scale TypeSpec SSOT for All States**
• **Alternative B: Retain Status Quo PR Text Traceability**
• **Alternative C (Accepted): Selective TypeSpec Evidence Integration with State Tiering**
• **Package Independence**: `@context-action/core` and `@context-action/react` packages remain zero-dependency runtimes and do not depend directly on `@ttsc/*` or TypeSpec compiler packages.
• **Pure Function Invariant**: `business/` modules strictly observe zero React/framework imports.
• **Presentation State Waiver Invariant**: Modeling component-internal visual flags in TypeSpec is an...