---
document_id: context-layered--architecture--context-scope-graph
category: context-layered
source_path: en/context-layered/architecture/context-scope-graph.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.286Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
ContextScope Symbol Graph

ContextScope Symbol Graph Status and purpose This document defines the contract for grouping symbols by a meaningful context. The revision-bound manifest parser, context-scope CLI projection, JSON Schemas, and library-level bounded SEM dependency projection are implemented in the current PoC. A renderer and API/transaction-specific adapters remain future work. The first delivered slice is a screen: a screen is an entry symbol and the symbols structurally used by that screen are displayed inside a larger visual boundary. The durable model is designed to support an API boundary, a transaction, a workflow, or a document, but those adapters are not implied by the first release. Therefore the durable abstraction is ContextScope, not ScreenGraph. Source layers The graph is a projection over existing evidence layers: The complete symbol snapshot remains the canonical inventory of definitions at a revision. A context graph adds membership and relationships; it must not create a second identity system or silently replace the snapshot with a partial traversal. Core contract SymbolRef is the existing canonical symbol identity: projectId, filePath, and entityId are the identity tuple. SymbolKey is the JSON-safe deterministic serialization for that tuple; it is not a new authored identity. Anchors, nodes, edges, and group members must therefore resolve against exactly the same symbol identity. A group is a view boundary, not a symbol. Group membership can overlap, so a shared symbol is referenced by multiple groups without duplicating its canonical node. Context profiles Each context kind defines valid anchor roles and the edge vocabulary used by its adapter. | Profile | Allowed anchor roles | Initial availability | Main relation path | | --- | --- | --- | --- | | screen | root, view, state-read, state-write | first adapter | component → rendered symbol → state read → child view | | api | endpoint, controller | later adapter | endpoint → controller → service → repository/schema | | transaction | trigger, state-read, state-write, view | later adapter | action → handler/business → state write → selector → affected view | | workflow | command, step | unsupported in v1 | command → step → external effect → next step | | document | definition, reference | unsupported in v1 | document definition → referenced symbol → implementation/test | Context-Action mapping The manifest is the bridge between the generic scope model and Context-Action's runtime layers. It reuses the same SymbolRef values from the snapshot and assigns graph roles without changing symbol identity: | Context-Action layer | ContextScope profile/role | Evidence boundary | | --- | --- | --- | | View/Page | screen.root, view | manifest anchor; SEM structural dependents | | Action

Key points:
• Validate the context profile and resolve every manifest anchor against the complete snapshot.
• Verify that the manifest belongs to the same selected revision as the snapshot.
• Load SEM dependency evidence and manifest-declared edges allowed by the profile.
• Sort candidate edges by `from`, `to`, `kind`, and evidence reference *before* breadth-first expansion.
• Traverse the allowed edge kinds to the configured depth, deduplicating by canonical symbol identity.
• Materialize context, architectural-layer, project, or module memberships and sort every collection
• Add the versioned `SymbolRef` and derived `SymbolKey` to Foundation, then expose the `ContextScope`,
• Add a repository-local context manifest under `architecture/`; validate complete anchor identities,
• Implement only the screen adapter: SEM `depends-on` evidence plus manifest-declared edges. **Manifest
• Expose a JSON-producing graph command and schema export before choosing a renderer. **Implemented as
• Add API and transaction adapters only after their provider/manifest evidence has a tested edge mapping;
• Add the compound graph UI and interaction evidence after the serialized contract is stable, then extend