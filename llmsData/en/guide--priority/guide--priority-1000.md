---
document_id: guide--priority
category: guide
source_path: en/guide/pipeline/priority.md
character_limit: 1000
last_update: '2025-08-26T00:34:27.314Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Priority-Based Handler Execution

Priority-based execution ensures handlers run in the correct order for proper business logic flow. Basic Priority System

Priority Levels

Handlers execute in descending priority order (highest number first):

Default Priority

If no priority is specified, handlers default to priority 50:

Priority Categories

High Priority (90-100): System Critical
- Input validation
- Security checks
- Rate limiting
- Authentication

Medium Priority (50-89): Business Logic
- Data processing
- Business rule validation
- External API calls
- State updates

Low Priority (10-49): Logging & Analytics
- Audit logging
- Analytics tracking
- Performance monitoring
- Cleanup tasks

Priority Execution Examples

Example 1: Authentication Flow

Example 2: Data Processing Pipeline

Priority Best Practices

1. Use Standard Priority Ranges

2. Group Related Handlers

3. Leave Priority Gaps

4.
