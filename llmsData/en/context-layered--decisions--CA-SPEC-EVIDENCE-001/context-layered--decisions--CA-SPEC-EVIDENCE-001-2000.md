---
document_id: context-layered--decisions--CA-SPEC-EVIDENCE-001
category: context-layered
source_path: en/context-layered/decisions/CA-SPEC-EVIDENCE-001.md
character_limit: 2000
last_update: '2026-09-29T08:48:29.711Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
CA-SPEC-EVIDENCE-001: TypeSpec Evidence Integration and Frontend State Tiering Governance

CA-SPEC-EVIDENCE-001: TypeSpec Evidence Integration and Frontend State Tiering Governance Status: accepted Owner: Framework Core & Architecture Governance Related Issues/Specs: CA-ARCH-001, CA-SPEC-001, change-management-convention Last Reviewed: 2026-09-19 Context The Context-Action framework successfully isolates frontend state management and business logic through its 6-layer separation (contexts / business / handlers / actions / hooks / views). In particular, forcing pure functions (Draft, Validation, Result, StateMachine) into the business/ layer provides high testability. However, in large enterprise environments and autonomous AI agent workflows, new challenges emerged: 1. Lack of Compile-Time Specification Traceability Enforcement: Issue and specification IDs (CA-) were verified only at the text/PR level. When product requirements or backend schemas drifted, discrepancies with frontend business functions could not be prevented fail-closed at compile tim

Key points:
• **Inception / Experimental**: `"severity": "off"` (no CI blocks during exploratory phase)
• **Beta / Hardening**: `"severity": "warning"` (surfaces missing anchors and gaps)
• **GA / Release**: `"severity": "error"` (strict fail-closed gate; 100% coverage required)
• `pnpm convention:check`: Verifies Context-Layered boundary and React isolation.
• `node scripts/verify-context-action-conventions.mjs`: Verifies repository-wide convention integrity.
• `tsp-evidence check specs/**/*.tsp`: Verifies TypeSpec model citations and AST...