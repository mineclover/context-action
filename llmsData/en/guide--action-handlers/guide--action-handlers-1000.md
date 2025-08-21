---
document_id: guide--action-handlers
category: guide
source_path: en/guide/action-handlers.md
character_limit: 1000
last_update: '2025-08-21T02:13:42.359Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Action Handlers

Action handlers contain the business logic of your application. Learn how to implement, register, and manage handlers effectively for scalable, maintainable applications. Handler Implementation Pattern

Best Practice: useActionHandler Pattern

The recommended pattern for handler registration uses useActionHandler + useEffect for optimal performance and proper cleanup:

Handler Configuration Options

Handler Execution Flow

1. Sequential Mode (default): Handlers run in priority order
2. Parallel Mode: All handlers execute simultaneously
3.
