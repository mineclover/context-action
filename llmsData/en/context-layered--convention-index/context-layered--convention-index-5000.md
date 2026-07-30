---
document_id: context-layered--convention-index
category: context-layered
source_path: en/context-layered/convention-index.md
character_limit: 5000
last_update: '2026-07-30T23:07:58.022Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Convention Index

Convention Index This document is the central entry point for the implementation-playbook style conventions in the Context-Action repository. The docs have grown enough that it helps to group which documents define the rules, which ones demonstrate the pattern, and which ones lock the verification model. Short Recommended Reading Path 1. Package Boundary and Codebase Management 2. Implementation Convention 3. Specification, Issue, and Documentation Management 4. Usecase and Recipe Profile 5. Tool-Calling Web Studio Convention 6. Panel Layout Preference Convention 7. Canonical Order Form Example 8. Playbook Scenario Library 9. Explicit State Machine 10. Stability Test Cycle 11. Mutative Core History and Upstream References 12. Next Work and Documentation Ownership The short path above covers: - folder structure - workflow transition rules - domain-level expansion - testing expectations Grouped by Role 1. Documents that define the standard - Convention Alignment Plan - current-state classification, fixed provider order, and migration gates - Package Boundary and Codebase Management - package ownership, dependency direction, package lifecycle, and cleanup rules - Mutative Core History and Upstream References - Mutative source lineage, carried upstream fixes, licensing, and synchronization rules - Implementation Convention - the standard implementation-playbook rule set - Specification, Issue, and Documentation Management - issue lifecycle, contract traceability, decision records, and handoff evidence - Tool-Calling Web Studio Convention - tool registry, policy, workspace mutation, observable subscriptions, and live preview boundaries - Panel Layout Preference Convention - presentation-only panel state, bounded resizing, persistence, and Store Context promotion criteria - Tool-Calling Editor Architecture - detailed catalog, approval, trace, persistence, and preview reference implementation - Folder Structure - responsibility split across contexts / business / handlers / actions / hooks / views - Handler Registry - handler registration and separation rules 2. Documents that explain logic and transitions - Explicit State Machine - how to lock complex async flows as state + event + transition - Context-Layered Overview - Usecase and Recipe Profile - the high-level architectural picture - Migration Guide - how to move older structures into this model 3. Documents that demonstrate the implementation - Canonical Order Form Example - the base canonical example - Access Request Playbook Example - approval/review workflow example - Incident Escalation Playbook Example - incident/escalation workflow example - Renewal Risk Review Playbook Example - renewal/customer-success workflow example - Playbook Scenario Library - scenario extensions that follow the sa

Key points:
• folder structure
• workflow transition rules
• domain-level expansion
• testing expectations
• [Convention Alignment Plan](/en/context-layered/convention-alignment-plan)
• [Package Boundary and Codebase Management](/en/context-layered/package-boundary-convention)
• [Mutative Core History and Upstream References](/en/context-layered/mutative-core-history)
• [Implementation Convention](/en/context-layered/implementation-convention)
• [Specification, Issue, and Documentation Management](/en/context-layered/change-management-convention)
• [Tool-Calling Web Studio Convention](/en/context-layered/usecase-tool-calling-web-studio)
• [Panel Layout Preference Convention](/en/context-layered/usecase-panel-layout)
• [Tool-Calling Editor Architecture](/en/concept/tool-calling-editor-architecture)
• [Folder Structure](/en/context-layered/architecture/folder-structure)
• [Handler Registry](/en/context-layered/architecture/handler-registry)
• [Explicit State Machine](/en/context-layered/patterns/explicit-state-machine)
• [Context-Layered Overview](/en/context-layered/context-layered-guide)
• [Usecase and Recipe Profile](/en/context-layered/usecase-recipe-profile)
• [Migration Guide](/en/context-layered/migration-guide)
• [Canonical Order Form Example](/en/examples/canonical-order-form)
• [Access Request Playbook Example](/en/examples/access-request-playbook)
• [Incident Escalation Playbook Example](/en/examples/incident-escalation-playbook)
• [Renewal Risk Review Playbook Example](/en/examples/renewal-risk-review-playbook)
• [Playbook Scenario Library](/en/examples/implementation-playbook-scenarios)
• [Stability Test Cycle](/en/context-layered/stability-test-cycle)
• [Next Work and Documentation Ownership](/en/context-layered/next-work)
• `/patterns/implementation-playbook`
•...