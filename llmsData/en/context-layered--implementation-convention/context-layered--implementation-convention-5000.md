---
document_id: context-layered--implementation-convention
category: context-layered
source_path: en/context-layered/implementation-convention.md
character_limit: 5000
last_update: '2026-11-01T14:50:38.479Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Implementation Playbook Standard Convention

Implementation Playbook Standard Convention This document turns the implementation-playbook example into a reusable standard convention for canonical example and usecase surfaces. The goal is not just to keep one demo readable, but to make it possible to design, implement, test, and document more complex flows in the same way. It does not impose this folder structure on every workspace package or demo. When an interaction removes an affordance, changes a trigger, or relies on a shortcut that users must infer, write an Interaction Intent Contract (IIC) before applying this implementation convention. Use the IIC-to-implementation flow to map the intent to the six layers and its evidence. When to Use This Convention Prefer this convention when at least two of these are true: - input validation and follow-up processing should be separated - the workflow has two or more async phases - success, failure, reset, and retry states all matter - side effects such as activity logs, analytics, or ref focus move with the workflow - docs, examples, and tests should all share the same implementation contract Smaller features may use fewer business or view files, but any action handler still follows the Handler Registry rule below. Standard Folder Structure Layer Responsibilities contexts/ - define Action, Store, and Ref boundaries - define initial state - compose the state types used across the scenario - Action Intent Domain Separation (No Mixed Payloads): keep BusinessActionIntent (server/storage persistence mutations, core business state machine transitions, MCP tool dispatches) physically separated from LayoutActionIntent (split dock toggles, panel resizing, canvas zoom/pan, active tab switching, and local viewport chrome) (Unified Triad Self-Serve Sync Guide) business/ - pure functions only - draft defaults - validation issue calculation - result calculation - activity event definitions - explicit state transition function Do not put UI wording, DOM focus, or analytics calls here. > TypeSpec Evidence Integration (Policy Hopping — ttsc@0.33.1 / @wrtnlabs/evidence@0.8.0): > Pure validation and state transition functions in business/ qualify as TypeSpec SSOT runtime policy targets (CA-SPEC-EVIDENCE-001, Unified Triad Self-Serve Sync Guide). Core domain functions lock their AST contracts against generated declarations using @evidenceReview ./generated/dto.ts#Policy #hash, multi-line Heading-Form annotations (@evidence, @evidenceReview), or detached evidenceFiles (evidence//.md). handlers/ - read the latest store values - call pure business functions - apply state-machine transitions - orchestrate side effects such as ref focus, scroll, and logging - when hydrating decoupled storage aspects (@entityRoot + @aspectOf), use Promise.allSettled in paral

Key points:
• input validation and follow-up processing should be separated
• the workflow has two or more async phases
• success, failure, reset, and retry states all matter
• side effects such as activity logs, analytics, or ref focus move with the workflow
• docs, examples, and tests should all share the same implementation contract
• define Action, Store, and Ref boundaries
• define initial state
• compose the state types used across the scenario
• **Action Intent Domain Separation (`No Mixed Payloads`)**: keep `BusinessActionIntent` (server/storage persistence mutations, core business state machine transitions, MCP tool dispatches) physically separated from `LayoutActionIntent` (split dock toggles, panel resizing, canvas zoom/pan, active tab switching, and local viewport chrome) ([Unified Triad Self-Serve Sync Guide](./triad-evidence-sync-guide.md))
• pure functions only
• draft defaults
• validation issue calculation
• result calculation
• activity event definitions
• explicit state transition function
• read the latest store values
• call pure `business` functions
• apply state-machine transitions
• orchestrate side effects such as ref focus, scroll, and logging
• when hydrating decoupled storage aspects (`@entityRoot` + `@aspectOf`), use `Promise.allSettled` in parallel so optional aspect failures degrade gracefully (`degraded: true` / `null`) without blocking the core view
• `useScenarioDraftHandlers`
• `useScenarioSubmissionHandlers`
• and later `useScenarioApprovalHandlers`, `useScenarioSyncHandlers`, etc.
• expose dispatch helpers for the view
• allow only light payload shaping
• subscribe to stores
• compute view-facing derived values
• interpret state-machine state into labels and messages
• render state and forward user intent only
• do not embed validation...