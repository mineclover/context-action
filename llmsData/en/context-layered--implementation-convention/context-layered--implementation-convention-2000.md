---
document_id: context-layered--implementation-convention
category: context-layered
source_path: en/context-layered/implementation-convention.md
character_limit: 2000
last_update: '2026-11-01T14:50:38.479Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Implementation Playbook Standard Convention

Implementation Playbook Standard Convention This document turns the implementation-playbook example into a reusable standard convention for canonical example and usecase surfaces. The goal is not just to keep one demo readable, but to make it possible to design, implement, test, and document more complex flows in the same way. It does not impose this folder structure on every workspace package or demo. When an interaction removes an affordance, changes a trigger, or relies on a shortcut that users must infer, write an Interaction Intent Contract (IIC) before applying this implementation convention. Use the IIC-to-implementation flow to map the intent to the six layers and its evidence. When to Use This Convention Prefer this convention when at least two of these are true: - input validation and follow-up processing should be separated - the workflow has two or more async phases - success, failure, reset, and retry states all matter - side effects such as activity log

Key points:
• input validation and follow-up processing should be separated
• the workflow has two or more async phases
• success, failure, reset, and retry states all matter
• side effects such as activity logs, analytics, or ref focus move with the workflow
• docs, examples, and tests should all share the same implementation contract
• define Action, Store, and Ref boundaries
• define initial state
• compose the state types used across the scenario
• **Action Intent Domain Separation (`No Mixed Payloads`)**: keep `BusinessActionIntent` (server/storage persistence mutations, core business state...