---
document_id: api--core--src--classes--ActionRegister
category: api
source_path: en/api/core/src/classes/ActionRegister.md
character_limit: 1000
last_update: '2026-08-09T03:26:32.458Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Class: ActionRegister\<T, TResultMap\>

context-action-monorepo v1.0.1 context-action-monorepo / packages/core/src / ActionRegister Class: ActionRegister\<T, TResultMap\> Defined in: packages/core/src/ActionRegister.ts:136 Action Register for managing action handlers with priority-based execution Central action registration and dispatch system providing type-safe action pipeline management. Supports sequential, parallel, and race

Key points:
• 'strict': throw ActionValidationError (default)
• 'warn': console.warn and continue execution
• 'silent': ignore validation errors silently