---
document_id: context-layered--implementation-convention
category: context-layered
source_path: en/context-layered/implementation-convention.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.310Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Implementation Playbook Standard Convention

Implementation Playbook Standard Convention This document turns the implementation-playbook example into a reusable standard convention for the repository. The goal is not just to keep one demo readable, but to make it possible to design, implement, test, and document more complex flows in the same way. When to Use This Convention Prefer this convention when at least two of these are true: - input validation and follow-up processing should be separated - the workflow has two or more async phases - success, failure, reset, and retry states all matter - side effects such as activity logs, analytics, or ref focus move with the workflow - docs, examples, and tests should all share the same implementation contract Smaller features may use fewer business or view files, but any action handler still follows the Handler Registry rule below. Standard Folder Structure Layer Responsibilities contexts/ - define Action, Store, and Ref boundaries - define initial state - compose the state types used across the scenario business/ - pure functions only - draft defaults - validation issue calculation - result calculation - activity event definitions - explicit state transition function Do not put UI wording, DOM focus, or analytics calls here. handlers/ - read the latest store values - call pure business functions - apply state-machine transitions - orchestrate side effects such as ref focus, scroll, and logging Split handlers by concern: - useScenarioDraftHandlers - useScenarioSubmissionHandlers - and later useScenarioApprovalHandlers, useScenarioSyncHandlers, etc. Every handler, including a single-handler feature, is registered through the domain Handler Registry. Pages, views, and context files mount or compose the registry; they do not call useActionHandler directly. actions/ - expose dispatch helpers for the view - allow only light payload shaping hooks/ - subscribe to stores - compute view-facing derived values - interpret state-machine state into labels and messages views/ - render state and forward user intent only - do not embed validation rules, result calculation, or workflow transitions Structural Convention Gate pnpm convention:check automatically recognizes a canonical feature root when it contains sibling contexts/ and handlers/ directories. The gate then checks the direct layer folders without applying the canonical naming rules to advanced or compatibility surfaces that have not entered migration. The current gate enforces: - contexts/ files end in Context or Contexts. - business/ files use lower-camel or kebab-case names and remain free of React and @context-action/ imports. - handlers/ files use HandlerRegistry, Handlers, HandlerSupport, or HandlerDefinitions names (plus index and handler-registry entry points). - actions/ files u

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
• explicit state transition function
• read the latest store values
• call pure `business` functions
• apply state-machine transitions
• orchestrate side effects such as ref focus, scroll, and logging
• `useScenarioDraftHandlers`
• `useScenarioSubmissionHandlers`
• and later `useScenarioApprovalHandlers`, `useScenarioSyncHandlers`, etc.
• expose dispatch helpers for the view
• allow only light payload shaping
• subscribe to stores
• compute view-facing derived values
• interpret state-machine state into labels and messages
• render state and forward user intent only
• do not embed validation rules, result calculation, or workflow transitions
• `contexts/` files end in `Context` or `Contexts`.
• `business/` files use lower-camel or kebab-case names and remain free of
• `handlers/` files use `*HandlerRegistry`, `*Handlers`, `*HandlerSupport`, or
• `actions/` files use `*Actions` or `*ActionHandlers` names.
• `hooks/` files use `use*` names, with `index` and `types` entry points.
• `views/` files use `*View`, `*Views`, or a named composite such as `*Grid`.
• Context modules do not import downstream layer folders, and views do not
• name states after workflow phases
• name events after user intent or system...