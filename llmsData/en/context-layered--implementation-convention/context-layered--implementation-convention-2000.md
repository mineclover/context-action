---
document_id: context-layered--implementation-convention
category: context-layered
source_path: en/context-layered/implementation-convention.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.310Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Implementation Playbook Standard Convention

Implementation Playbook Standard Convention This document turns the implementation-playbook example into a reusable standard convention for the repository. The goal is not just to keep one demo readable, but to make it possible to design, implement, test, and document more complex flows in the same way. When to Use This Convention Prefer this convention when at least two of these are true: - input validation and follow-up processing should be separated - the workflow has two or more async phases - success, failure, reset, and retry states all matter - side effects such as activity logs, analytics, or ref focus move with the workflow - docs, examples, and tests should all share the same implementation contract Smaller features may use fewer business or view files, but any action handler still follows the Handler Registry rule below. Standard Folder Structure Layer Responsibilities contexts/ - define Action, Store, and Ref boundaries - define initial state - compose th

Key points:
• input validation and follow-up processing should be separated
• the workflow has two or more async phases
• success, failure, reset, and retry states all matter
• side effects such as activity logs, analytics, or ref focus move with the workflow
• docs, examples, and tests should all share the same implementation contract
• define Action, Store, and Ref boundaries
• define initial state
• compose the state types used across the scenario
• pure functions only
• draft defaults
• validation issue calculation
• result calculation
• activity event definitions
• explicit state transition...