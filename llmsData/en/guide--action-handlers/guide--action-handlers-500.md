---
document_id: guide--action-handlers
category: guide
source_path: en/guide/action-handlers.md
character_limit: 500
last_update: '2025-08-21T02:13:42.359Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Action Handlers

Action handlers implement business logic using the useActionHandler + useEffect pattern. Key features include:

• Priority-based execution (sequential/parallel/race modes)
• Controller methods for flow control (abort, jumpToPriority, setResult)
• Robust error handling with context and meaningful messages
• Memory cleanup with unregister functions
• Result collection from multiple handlers with configurable strategies

Best practices: wrap handlers with useCallback, use lazy store evaluation, implement proper validation, and organize handlers by domain for maintainability.
