---
document_id: context-layered--architecture--sem-doc-architecture-governance-boundary
category: context-layered
source_path: en/context-layered/architecture/sem-doc-architecture-governance-boundary.md
character_limit: 5000
last_update: '2026-07-20T17:25:11.382Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
sem-doc and Architecture Governance Boundary

sem-doc and Architecture Governance Boundary @context-action/sem-doc and @context-action/architecture-governance are related repository tools, but they are not two names for the same library and neither replaces the other. They may use the same external sem executable and the policy-neutral Foundation packages, while keeping separate inputs, reports, consumers, and release contracts. The position is intentionally asymmetric: sem-doc is the operational Symbol Context plane, while Architecture Governance is an experimental Context-Action convention-driven control plane. The latter tests repository-local authored rules and evidence management; it is not a generic architecture standard or document editor. Decision at a glance | Package | Primary question | Main input | Main output | Consumer | Gate? | | --- | --- | --- | --- | --- | --- | | @context-action/sem-doc | What context, documents, and operational scope does an engineer need before changing this code? | target entity/path, TSDoc bindings, Git working-tree or staged state | sem-doc-work-context.v5, canonical sem-doc-context-scope.v3, sem-documents.v3, sem-doc-git-diff.v1, binding and benchmark reports | implementer, reviewer, agent | advisory context; not an architecture gate | | @context-action/architecture-governance | Does the Context-Action-authored architecture contract have valid implementation and boundary evidence? | architecture/registry.json, policy sets, analysis projects, SEM evidence, optional revision/context manifest | verification report, complete symbol snapshot/history, snapshot diff, ContextScope | CI, maintainer, architecture reviewer | yes; selected findings fail the verification command | The distinction is about responsibility, not implementation size. sem-doc is the Symbol Context SSOT for work-context and document-binding reports. Architecture Governance is the SSOT for authored architecture registry, evidence, policy, and snapshot contracts. Separate contracts and dependencies There must be no runtime dependency from one consumer package to the other. Foundation contracts may be shared when their meaning is policy-neutral, but a report from one package is not automatically an input contract for the other. sem-doc requires @context-action/sem-foundation-contracts and @context-action/sem-foundation-repository at runtime. This is a shared-foundation dependency, not a dependency on Architecture Governance; sem-doc no longer carries a local fallback implementation for those contracts. The shared @context-action/sem-foundation-contracts package also owns the policy-neutral createSymbolSnapshotEntry conversion from a SEM entity to a complete snapshot entry. Each consumer may adapt that entry into its own report, but neither c

Key points:
• resolve a target entity and its definition source;
• collect bounded one-hop or two-hop structural relationships;
• list dependent files and affected tests as advisory evidence;
• index exact TSDoc entity bindings and backlinks;
• capture the Git working-tree or staged diff before editing.
• project the work-context into the canonical operational `sem-doc-context-scope.v3` grouping for a screen, API, or transaction review.
• materialize bounded commit snapshots/diffs, stream them as NDJSON, and intersect changed symbols from two branches.
• keep a stable `CA-*` capability and `SymbolRef` implementation anchor;
• verify owner, role, test, public-doc, and package/impact evidence;
• materialize a complete symbol snapshot for a revision;
• diff or traverse Git history without accepting a partial snapshot;
• project a revision-bound `ContextScope` for screen, API, or transaction grouping;
• fail CI or review when a selected policy/evidence finding reaches its threshold.
• Do not feed `sem-doc-work-context.v5` directly into the Architecture Governance verification report.
• Do not treat `architecture/registry.json` as the TSDoc document-binding index.
• Do not treat `usageFiles` as exact symbol references or a runtime call graph.
• Do not use `ContextScope` membership as proof that a UI/API/transaction executes at runtime.
• Do not add a package dependency merely because both packages invoke SEM.
• Do not merge schema versions, CLI names, or release policies without a separate compatibility decision.
• Do not call either package “Samdocs” in new architecture documentation; name the package that owns the
• Is the requested result work context/document navigation (`sem-doc`) or authored architecture evidence
• Does the proposed field belong to...