---
document_id: en_guide_blocking
category: guide
source_path: en/guide/pipeline/blocking.md
character_limit: 1000
last_update: '2025-08-30T10:39:54.447Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Blocking Operations

Blocking Operations Control pipeline execution flow with blocking and non-blocking handler configurations. Blocking vs Non-Blocking Blocking Handlers (Default) Blocking handlers wait for completion before proceeding to the next handler: Non-Blocking Handlers Non-blocking handlers execute in the background without stopping the pipeline: Blocking Configuration Handler-Level Blocking Configure blocking behavior p

Key points:
• Critical validation that affects subsequent handlers
• Security checks that must complete
• Data transformations needed by later handlers
• Operations where order matters
• Error-prone operations that need immediate feedback
•...