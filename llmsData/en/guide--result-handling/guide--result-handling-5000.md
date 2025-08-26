---
document_id: guide--result-handling
category: guide
source_path: en/guide/pipeline/result-handling.md
character_limit: 5000
last_update: '2025-08-26T00:34:27.321Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Advanced Result Handling

Sophisticated result collection, merging, and processing strategies for Context-Action pipelines, enabling complex data aggregation and transformation patterns. Result Collection Methods

controller.setResult()

Store intermediate results that other handlers can access:

controller.getResults()

Access results from previously executed handlers:

controller.mergeResult()

Merge current result with previous results using custom logic:

Result Types

Handler Return Values

Each handler can return any value, which becomes part of the results:

Intermediate Results

Use controller.setResult() for data that doesn't need to be returned:

Result Collection Patterns

Sequential Result Building

Result Aggregation

React Integration

Result-Based UI Updates

Progress Tracking

Result Best Practices

1. Consistent Result Structure

2. Use Meaningful Step Names

3. Include Timing Information

🧪 Live Examples

Comprehensive Result Collection Demo

See advanced result handling in action with real-world examples:

→ UseActionWithResult Demo

This demo demonstrates:
- Individual Action Execution: Single handler execution with result collection
- Sequential Workflow: Multi-step processes with result dependency
- Tag-based Filtering: Handler selection using tags: ['validation', 'business-logic']
- Parallel and Merge Execution: Concurrent processing with result aggregation
- Complex Cart Workflow: Real-world validation → calculation → processing pipeline

Handler Metadata Integration

The demo also showcases comprehensive handler registration with metadata:

Live Example: Result Collection Demo

See a comprehensive result handling implementation in the UseActionWithResult Demo:

This example demonstrates real-world result collection patterns with sequential workflow execution and result aggregation. Related

- Priority System - Priority affects result order
- Blocking Operations - Blocking affects when results are available
- Abort Mechanisms - Abort affects result collection
- Dispatch Methods - Different dispatch methods affect result access.
