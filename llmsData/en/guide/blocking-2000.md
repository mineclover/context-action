---
document_id: en_guide_blocking
category: guide
source_path: en/guide/pipeline/blocking.md
character_limit: 2000
last_update: '2025-08-30T10:39:54.447Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Blocking Operations

Blocking Operations Control pipeline execution flow with blocking and non-blocking handler configurations. Blocking vs Non-Blocking Blocking Handlers (Default) Blocking handlers wait for completion before proceeding to the next handler: Non-Blocking Handlers Non-blocking handlers execute in the background without stopping the pipeline: Blocking Configuration Handler-Level Blocking Configure blocking behavior per handler: Registry-Level Default Set default blocking behavior for the entire registry: Execution Flow Examples Example 1: Mixed Blocking/Non-Blocking Example 2: Performance Critical Pipeline Advanced Blocking Patterns Conditional Blocking Dynamic Blocking with Configuration Performance Considerations When to Use Blocking ✅ Use blocking for: - Critical validation that affects subsequent handlers - Security checks that must complete - Data transformations needed by later handlers   - Operations where order matters - Error-prone operations that need immediate feedback When to Use Non-Blocking

Key points:
• Critical validation that affects subsequent handlers
• Security checks that must complete
• Data transformations needed by later handlers
• Operations where order matters
• Error-prone operations that need immediate feedback
• Analytics and tracking
• Audit logging
• Performance monitoring
• Email notifications
• Background cleanup
• Optional enhancements
• **[Priority System](./priority.md)** - Priority-based execution order
• **[Abort Mechanisms](./abort.md)** - Stop pipeline execution when needed
• **[Result Handling](./result-handling.md)** - Collect and use handler results
• **[Dispatch Methods](./dispatch.md)** -...