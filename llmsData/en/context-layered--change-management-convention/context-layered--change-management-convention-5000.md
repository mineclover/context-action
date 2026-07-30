---
document_id: context-layered--change-management-convention
category: context-layered
source_path: en/context-layered/change-management-convention.md
character_limit: 5000
last_update: '2026-07-30T23:07:57.860Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Specification, Issue, and Documentation Management Convention

Specification, Issue, and Documentation Management Convention Status: Active Last reviewed: 2026-07-17 Scope: feature work, architecture changes, bug fixes, and public documentation This document defines the operating layer between a request and a verified change. It complements the Implementation Convention, the Package Boundary and Codebase Management Convention, and the Documentation and Development Management Conventions. Review decision The repository already has strong implementation and verification conventions: - Context-Layered ownership is explicit across contexts, business, handlers, actions, hooks, and views. - tool-calling work has a canonical tools/list → model tool call → tools/call → structured result path; - runtime examples have focused convention and browser gates; - public and generated documentation have separate ownership rules; The remaining management risk is traceability. An issue can describe intent, while a specification describes the contract, but neither should be inferred from a commit message or reconstructed from a finished diff. The rules below make that connection explicit. 1. Source-of-truth hierarchy Each artifact answers a different question. Do not make one artifact silently replace another. | Artifact | Answers | Must contain | Must not become | | --- | --- | --- | --- | | Issue | Why, who, and what outcome is requested? | owner, scope, non-goals, acceptance criteria, dependencies | the complete technical design | | Specification | What contract must remain true? | types, transitions, invariants, compatibility, migration, failure behavior | a task checklist or progress log | | Code and tests | Does the contract work? | implementation anchors and executable evidence | the only explanation of user behavior | | Public documentation | How should a user or contributor understand it? | current behavior, usage, limits, verification path | an unimplemented future design | | Architecture registry/decision | Which boundary is stable and who owns it? | capability identity, owner, evidence, decision record | a file inventory without semantics | | Generated output | Which derived artifact is published? | generator source and reproducible command | the canonical source | The preferred trace is: 2. Change classification Every non-trivial issue selects one primary class before implementation: | Class | Required contract | Typical evidence | | --- | --- | --- | | Public API | exported type/API behavior and compatibility rule | package test, API docs, migration note | | Behavior or pattern | user-visible state, action, tool, or workflow behavior | focused test, runnable example, guide | | Architecture | ownership, boundary, provider order, persistence, or schema decision | decision record, architecture check

Key points:
• Context-Layered ownership is explicit across `contexts`, `business`,
• tool-calling work has a canonical `tools/list` → model tool call →
• runtime examples have focused convention and browser gates;
• public and generated documentation have separate ownership rules;
• the owned state and its boundary;
• inputs, outputs, transitions, and failure behavior;
• invariants and bounds;
• persistence, privacy, and security assumptions;
• compatibility and migration behavior;
• acceptance criteria that can be verified without subjective wording;
• implementation, test, and documentation anchors.
• public package API or workspace package ownership;
• Context-Action provider/handler/store boundaries;
• MCP/function-calling protocol or tool result contracts;
• persistence schema, migration, privacy, or credential handling;
• a compatibility exception or a temporary convention waiver.
• English and Korean public pages are paired sources; keep their meaning and
• The canonical guide owns the explanation. README files provide discovery and
• API pages and LLMS artifacts are generated or derived. Change their source
• A document must say when a feature is unavailable, best-effort, experimental,
• New conventions need a discovery link in the Convention Index and the
• [ ] Issue class, owner, scope, and non-goals are explicit.
• [ ] Durable behavior has a tracked specification or decision.
• [ ] Acceptance criteria map to implementation and test evidence.
• [ ] Persistence/API/schema changes include compatibility and migration notes.
• [ ] Authoritative English/Korean docs and discovery links are updated.
• [ ] Generated artifacts were regenerated from their source, when applicable.
• [ ] Focused gates and manual proof are recorded.
• [ ] Follow-up issues...