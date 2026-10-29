---
document_id: context-layered--decisions--index
category: context-layered
source_path: en/context-layered/decisions/index.md
character_limit: 5000
last_update: '2026-10-25T07:23:14.362Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Architecture Decision Records

Architecture Decision Records Decision records keep durable architectural choices close to the conventions that govern them. They are not a runtime registry and do not duplicate a package README or public guide. What belongs where | Artifact | Owns | Does not replace | | --- | --- | --- | | Decision record | why a durable boundary was chosen, alternatives, invariants, and reversal conditions | implementation details or consumer usage | | Package README | discovery, public entry points, and a quickstart | the complete behavior or architecture contract | | Authoritative guide | current behavior, limits, and operating guidance | the decision history | | Tests and focused gates | executable proof | the explanation of intent | Use the Documentation and Development Management Convention to choose the document source and verification command for the wider change. When to create one Create a record for a decision that changes package ownership or dependency direction, provider/handler/store boundaries, a protocol contract, persistence or privacy behavior, or a temporary compatibility exception. Use a stable identifier in the filename, for example CA-TOOL-PROTOCOL-001.md. Keep the identifier when the implementation moves; link a replacement record when the decision is superseded. Required shape The implementation, focused tests, and authoritative user documentation remain the evidence for the decision. This index only establishes the durable home and format for the decision itself. Before marking a decision accepted, make sure that it has an owner, a stable identifier, an explicit non-goal or rejected alternative, implementation/test anchors, and a link to the package or guide whose contract it changes. Existing reference decisions - CA-ELEMENT-INTEROP-001: Core subpaths and host-neutral Element bindings - CA-SPEC-EVIDENCE-001: TypeSpec Evidence Integration and Frontend State Tiering Governance - PostgreSQL Durable Operation Adapter

Key points:
• [CA-ELEMENT-INTEROP-001: Core subpaths and host-neutral Element bindings](./CA-ELEMENT-INTEROP-001.md)
• [CA-SPEC-EVIDENCE-001: TypeSpec Evidence Integration and Frontend State Tiering Governance](./CA-SPEC-EVIDENCE-001.md)
• [PostgreSQL Durable Operation Adapter](../architecture/postgres-durable-operation-adapter.md)