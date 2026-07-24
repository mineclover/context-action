---
document_id: guide--pipeline--advanced-filtering
category: guide
source_path: en/guide/pipeline/advanced-filtering.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.158Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Advanced Filtering System

Advanced Filtering System Powerful handler filtering capabilities for precise action execution control. 🎯 Overview The Advanced Filtering System allows you to execute only specific handlers based on priority, ID, or custom logic. This enables precise control over which handlers run for each action dispatch. 🔧 Filter Types Priority Range Filtering Filter handlers by priority range to control

Key points:
• **Empty Results**: Always verify that filters don't exclude all handlers
• **Performance**: Complex custom filters can impact dispatch performance
• **Debugging**: Use `dispatchWithResult` to monitor filter...