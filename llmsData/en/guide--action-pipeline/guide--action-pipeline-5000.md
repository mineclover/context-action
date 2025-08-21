---
document_id: guide--action-pipeline
category: guide
source_path: en/guide/action-pipeline.md
character_limit: 5000
last_update: '2025-08-21T02:13:42.360Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Action Pipeline System

The Action Pipeline System is the core of Context-Action's ViewModel layer, providing centralized action processing with priority-based handler execution and sophisticated pipeline control. Core Concepts

ActionRegister

The ActionRegister class is the heart of the action pipeline system:

Handler Registration

Register handlers with priority-based execution:

Pipeline Controller

Each handler receives a PipelineController for advanced pipeline management:

Priority-Based Execution

Execution Order

Handlers execute in descending priority order (highest first):

Handler Configuration

Pipeline Control Methods

controller.abort()

Stop pipeline execution with optional reason:

controller.modifyPayload()

Transform payload for subsequent handlers:

controller.setResult() and getResults()

Manage intermediate results across handlers:

Execution Modes

Sequential Mode (Default)

Handlers execute one after another:

Parallel Mode

All handlers execute simultaneously:

Race Mode

First handler to complete wins:

Result Collection

Basic Dispatch

Dispatch with Result Collection

Error Handling

The pipeline continues execution even when individual handlers fail:

Real-World Example: Authentication Flow

Integration with React

The Action Pipeline integrates seamlessly with React through the Action Context pattern:

Next Steps

- Main Patterns - Learn about Action Only and Store Only patterns
- API Reference - Detailed ActionRegister API documentation  
- Examples - See Action Only pattern in practice.
