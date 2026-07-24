---
document_id: guide--pipeline--priority
category: guide
source_path: en/guide/pipeline/priority.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.162Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Priority-Based Handler Execution

Priority-Based Handler Execution Priority-based execution ensures handlers run in the correct order for proper business logic flow. Basic Priority System Priority Levels Handlers execute in descending priority order (highest number first): Default Priority If no priority is specified, handlers default to priority 50: Priority Categories High Priority (90-100): System Critical - Input validation - Security

Key points:
• Input validation
• Security checks
• Rate limiting
• Authentication
• Data processing
• Business rule validation