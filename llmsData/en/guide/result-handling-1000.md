---
document_id: en_guide_result-handling
category: guide
source_path: en/guide/pipeline/result-handling.md
character_limit: 1000
last_update: '2025-08-30T10:41:46.502Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Advanced Result Handling

Advanced Result Handling Sophisticated result collection, merging, and processing strategies for Context-Action pipelines, enabling complex data aggregation and transformation patterns. Result Collection Methods controller.setResult() Store intermediate results that other handlers can access: controller.getResults() Access results from previously executed handlers: controller.mergeResult() Merge curren

Key points:
• **Individual Action Execution**: Single handler execution with result collection
• **Sequential Workflow**: Multi-step processes with result dependency
• **Tag-based Filtering**: Handler selection using `tags: ['validation',...