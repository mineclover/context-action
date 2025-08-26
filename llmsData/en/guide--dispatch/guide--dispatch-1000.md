---
document_id: guide--dispatch
category: guide
source_path: en/guide/pipeline/dispatch.md
character_limit: 1000
last_update: '2025-08-26T00:34:27.294Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Dispatch Methods

Different ways to trigger action pipelines with varying levels of control and result collection. Core Dispatch Methods

Basic Dispatch

Simple action execution without result collection:

Dispatch with Result Collection

Comprehensive execution with detailed results:

React Integration Dispatch

useActionDispatch Hook

Basic dispatching in React components:

useActionDispatchWithResult Hook

Result collection in React components:

Dispatch Options

Timeout Configuration

Prevent indefinite hanging with timeouts:

Result Collection Options

Control what results are collected:

Advanced Dispatch Patterns

Conditional Dispatching

Batch Dispatching

Error Handling in Dispatch

Dispatch Result Structure

Success Result

Aborted Result

Timeout Result

Performance Optimization

Efficient Dispatching

Batch Result Collection

Dispatch Patterns by Use Case

1. Fire-and-Forget (Analytics)

2. Validation Pipeline (Result Collection)

3.
