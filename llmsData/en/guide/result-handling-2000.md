---
document_id: en_guide_result-handling
category: guide
source_path: en/guide/pipeline/result-handling.md
character_limit: 2000
last_update: '2025-08-30T10:41:46.502Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Advanced Result Handling

Advanced Result Handling Sophisticated result collection, merging, and processing strategies for Context-Action pipelines, enabling complex data aggregation and transformation patterns. Result Collection Methods controller.setResult() Store intermediate results that other handlers can access: controller.getResults() Access results from previously executed handlers: controller.mergeResult() Merge current result with previous results using custom logic: Result Types Handler Return Values Each handler can return any value, which becomes part of the results: Intermediate Results Use controller.setResult() for data that doesn't need to be returned: Result Collection Patterns Sequential Result Building Result Aggregation React Integration Result-Based UI Updates Progress Tracking Result Best Practices 1. Consistent Result Structure 2. Use Meaningful Step Names 3. Include Timing Information 🧪 Live Examples Comprehensive Result Collection Demo See advanced result handling in action with real-world

Key points:
• **Individual Action Execution**: Single handler execution with result collection
• **Sequential Workflow**: Multi-step processes with result dependency
• **Tag-based Filtering**: Handler selection using `tags: ['validation', 'business-logic']`
• **Parallel and Merge Execution**: Concurrent processing with result aggregation
• **Complex Cart Workflow**: Real-world validation → calculation → processing pipeline
• **[Priority System](./priority.md)** - Priority affects result order
• **[Blocking Operations](./blocking.md)** - Blocking affects when results are available
• **[Abort Mechanisms](./abort.md)** - Abort...