---
document_id: context-layered--change-management-convention
category: context-layered
source_path: en/context-layered/change-management-convention.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.274Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Specification, Issue, and Documentation Management Convention

Specification, Issue, and Documentation Management Convention Status: Active Last reviewed: 2026-07-17 Scope: feature work, architecture changes, bug fixes, and public documentation This document defines the operating layer between a request and a verified change. It complements the Implementation Convention, the Package Boundary and Codebase Management Convention, the Documentation and Development Management Conventions, and Architecture Governance and Evidence. Review decision The repository already has strong implementation and verification conventions: - Context-Layered ownership is explicit across contexts, business, handlers, actions, hooks, and views. - tool-calling work has a canonical tools/list → model tool call → tools/call → structured result path; - runtime examples have focused convention and browser gates; - public and generated documentation have separate ownership rules; - architecture governance can connect a capability to an implementation ancho

Key points:
• Context-Layered ownership is explicit across `contexts`, `business`,
• tool-calling work has a canonical `tools/list` → model tool call →
• runtime examples have focused convention and browser gates;
• public and generated documentation have separate ownership rules;
• architecture governance can connect a capability to an implementation anchor,
• the owned state and its boundary;
• inputs, outputs, transitions, and failure behavior;
• invariants and bounds;
• persistence, privacy, and security assumptions;
• compatibility and migration behavior;
• acceptance...