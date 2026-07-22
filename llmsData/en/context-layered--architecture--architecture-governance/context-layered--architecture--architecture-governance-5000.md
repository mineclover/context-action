---
document_id: context-layered--architecture--architecture-governance
category: context-layered
source_path: en/context-layered/architecture/architecture-governance.md
character_limit: 5000
last_update: '2026-07-20T04:39:11.523Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Architecture Governance and Evidence

Architecture Governance and Evidence In this repository, Architecture Governance is an experimental, Context-Action-convention-driven architecture and documentation evidence governance package. It turns authored registry and policy declarations into SEM/Git checks, snapshots, and review artifacts. It is not a generic architecture inference engine, a Markdown/API documentation editor, or a replacement for TypeDoc or sem-doc. Architecture Governance manages explicitly named symbols, their role descriptions, and definition locations. Context-Action keeps that relationship in a small, repository-local registry and uses SEM structural evidence to collect and verify the symbols in one pass. The separate @context-action/sem-doc package prepares work-context and TSDoc/Git evidence; it is not this registry gate. Source of truth | Artifact | Responsibility | | --- | --- | | architecture/registry.json | Capability identity (CA-), owner, authored role, definition anchor, evidence, and policy references | | architecture/rules/.json | Package declaration and SEM impact boundaries | | architecture/contexts.json (optional) | Revision-bound context intent, complete anchor identities, and explicitly declared semantic edges | | packages/architecture-governance | Registry loader, SEM adapter, verifier, report contract, and CLI | | Verification report | Evidence and findings for a working tree, staged set, or commit range | The registry is not a list of files. A capability represents a user-visible behavior, an independently changed design responsibility, or an architectural boundary that needs a stable owner. A verified capability should connect a specification, a SEM top-level implementation anchor, representative tests, and public documentation. Identity vocabulary The catalog intentionally keeps three identifiers separate: - capabilityId (CA-) identifies an architectural responsibility in registry.json. - SymbolRef (projectId, repository-relative filePath, and entityId) identifies a concrete code symbol in a snapshot. - contextId identifies a derived screen, API, transaction, workflow, or document scope. implementationAnchors connect a capability to one or more SymbolRef values. A context manifest reuses the same SymbolRef tuple; it must not create a second symbol ID. This separation allows one capability to have multiple implementation symbols and one symbol to participate in multiple context scopes. This is a symbol catalog gate, not an architecture inference engine. The author declares the symbol and its authored role in the registry (with an implementation-adjacent role comment); SEM supplies the definition location; the test runner proves behavior; and the documentation system owns the public explanation. For a command-by-command

Key points:
• `capabilityId` (`CA-*`) identifies an architectural responsibility in `registry.json`.
• `SymbolRef` (`projectId`, repository-relative `filePath`, and `entityId`) identifies a concrete code symbol in a snapshot.
• `contextId` identifies a derived screen, API, transaction, workflow, or document scope.
• capability paths for the specification, owner, implementation anchor, representative test, and public documentation;
• declared package dependency boundaries from `package.json`;
• SEM top-level entity identity and source-file definition scope;
• `symbolUsages[].usageFiles` for the structural files containing dependents of each explicit anchor;
• optional package and impact boundaries used to protect the symbol catalog;
• working-tree, staged, or commit-range change scope, including binary and untracked paths;
• a versioned report contract in console, JSON, or Markdown form.
• Use this page for the symbol catalog concept, verification boundary, and minimum commands.
• Read [`governance-guide.md`](https://github.com/mineclover/context-action/blob/main/architecture/governance-guide.md) before adding a capability ID, `SymbolRef` anchor, or role comment.
• Read [`architecture/rules/README.md`](https://github.com/mineclover/context-action/blob/main/architecture/rules/README.md) before adding a package or impact rule.
• Use the generated changed/staged/range report during review.
• Consult the [implementation review](https://github.com/mineclover/context-action/blob/main/architecture/implementation-review.md) for symbol limits, the intentional LSP boundary, and roadmap decisions.