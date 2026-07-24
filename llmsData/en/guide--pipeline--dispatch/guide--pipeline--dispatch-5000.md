---
document_id: guide--pipeline--dispatch
category: guide
source_path: en/guide/pipeline/dispatch.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.164Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Dispatch Methods

Dispatch Methods Different ways to trigger action pipelines with varying levels of control and result collection. Core Dispatch Methods Basic Dispatch Simple action execution without result collection: Dispatch with Result Collection Comprehensive execution with detailed results: React Integration Dispatch useActionDispatch Hook Basic dispatching in React components: useActionDispatchWithResult Hook Result collection in React components: Dispatch Options Timeout Configuration Prevent indefinite hanging with timeouts: Result Collection Options Control what results are collected: Advanced Dispatch Patterns Conditional Dispatching Batch Dispatching Error Handling in Dispatch Dispatch Result Structure Success Result Aborted Result Timeout Result Performance Optimization Efficient Dispatching Batch Result Collection Dispatch Patterns by Use Case 1. Fire-and-Forget (Analytics) 2. Validation Pipeline (Result Collection) 3. Multi-Step Operation (Progress Tracking) Live Example: Result Collection with Dispatch See comprehensive dispatch patterns in the UseActionWithResult Demo: This example demonstrates real-world usage of dispatchWithResult with comprehensive error handling and UI integration. Related - Priority System - Control execution order with priorities - Blocking Operations - Control execution flow - Abort Mechanisms - Stop pipeline execution when needed - Result Handling - Process and use dispatch results

Key points:
• **[Priority System](./priority.md)** - Control execution order with priorities
• **[Blocking Operations](./blocking.md)** - Control execution flow
• **[Abort Mechanisms](./abort.md)** - Stop pipeline execution when needed
• **[Result Handling](./result-handling.md)** - Process and use dispatch results