---
document_id: context-layered--architecture--architecture-governance
category: context-layered
source_path: en/context-layered/architecture/architecture-governance.md
character_limit: 2000
last_update: '2026-07-20T04:39:11.523Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Architecture Governance and Evidence

Architecture Governance and Evidence In this repository, Architecture Governance is an experimental, Context-Action-convention-driven architecture and documentation evidence governance package. It turns authored registry and policy declarations into SEM/Git checks, snapshots, and review artifacts. It is not a generic architecture inference engine, a Markdown/API documentation editor, or a replacement for TypeDoc or sem-doc. Architecture Governance manages explicitly named symbols, their role descriptions, and definition locations. Context-Action keeps that relationship in a small, repository-local registry and uses SEM structural evidence to collect and verify the symbols in one pass. The separate @context-action/sem-doc package prepares work-context and TSDoc/Git evidence; it is not this registry gate. Source of truth | Artifact | Responsibility | | --- | --- | | architecture/registry.json | Capability identity (CA-), owner, authored role, definition a

Key points:
• `capabilityId` (`CA-*`) identifies an architectural responsibility in `registry.json`.
• `SymbolRef` (`projectId`, repository-relative `filePath`, and `entityId`) identifies a concrete code symbol in a snapshot.
• `contextId` identifies a derived screen, API, transaction, workflow, or document scope.
• capability paths for the specification, owner, implementation anchor, representative test, and public documentation;
• declared package dependency boundaries from `package.json`;
• SEM top-level entity identity and source-file definition scope;
• `symbolUsages[].usageFiles` for the...