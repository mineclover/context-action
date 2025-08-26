---
document_id: guide--priority
category: guide
source_path: en/guide/pipeline/priority.md
character_limit: 2000
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

4. Document Priority Rationale

Priority Visualization

Live Example: Priority Performance Demo

See a real implementation of priority-based execution in the Priority Performance Demo:

This example demonstrates performance tracking with timing measurements to show how priority affects execution order in real scenarios. Related

- Blocking Operations - Control execution flow with blocking
- Abort Mechanisms - Stop pipeline execution when needed
- Result Handling - Collect and use handler results
- Dispatch Methods - Different ways to trigger pipelines.
