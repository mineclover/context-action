---
document_id: concept--action-pipeline-guide
category: concept
source_path: en/concept/action-pipeline-guide.md
character_limit: 5000
last_update: '2025-08-21T02:13:42.344Z'
update_status: auto_generated
priority_score: 85
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Action Pipeline Guide: ActionPayloadMap & ActionRegister

Complete guide to building type-safe action pipelines with Context-Action framework. Table of Contents

- Overview
- ActionPayloadMap: Type Foundation
- ActionRegister: Pipeline Engine
- Handler Registration Patterns
- Pipeline Execution Strategies
- Advanced Pipeline Patterns
- Real-world Examples
- Best Practices
- Troubleshooting

Overview

The Context-Action framework's action pipeline system provides type-safe, scalable business logic management through two core components:

- ActionPayloadMap: TypeScript interface defining action-to-payload type mappings
- ActionRegister: Central pipeline engine managing handler registration and execution

ActionPayloadMap: Type Foundation

Basic Concept

ActionPayloadMap is a TypeScript interface that maps action names to their payload types, providing compile-time type safety throughout the pipeline. Advanced Type Patterns

Generic Payload Types

Conditional Payload Types

Type Safety Benefits

1. Compile-time Validation: TypeScript ensures correct payload types
2. IntelliSense Support: Auto-completion for action names and payload properties
3. Refactoring Safety: Renaming actions or changing payload structure is type-checked
4. Documentation: Types serve as living documentation of your API

ActionRegister: Pipeline Engine

Core Architecture

ActionRegister is the central orchestrator that manages the action pipeline lifecycle:

Configuration Options

Pipeline Lifecycle

Handler Registration Patterns

Basic Handler Registration

Multi-Store Coordination

Async Operations with Error Handling

Pipeline Execution Strategies

Sequential Execution (Default)

Handlers execute in priority order, waiting for each to complete:

Parallel Execution

All handlers execute simultaneously:

Race Execution

First completed handler wins:

Advanced Pipeline Patterns

Handler Filtering System (New)

The ActionRegister now supports advanced handler filtering during dispatch:

Result Collection and Processing (New)

Collect and process results from multiple handlers:

Auto AbortController Management (New)

Automatic AbortController creation and management:

Priority-based Validation Pipeline

Conditional Handler Execution

Dynamic Handler Registration

Handler Execution Flow (Updated)

ActionRegister handlers follow a natural execution flow without explicit continuation calls:

Handler Termination Patterns

Three Ways to End Handler Execution

1. Natural Completion: Handler finishes all statements, automatically continues
2. Early Return: Use return to exit handler early, pipeline continues
3. Pipeline Abort: Use controller.abort() to stop entire pipeline execution

Enhanced PipelineController API (Updated)

The PipelineController now provides extensive control over pipeline execution:

Pipeline Middleware Pattern

Real-world Examples

E-commerce Order Processing

User Management System

Registry Management & Statistics (New)

Registry Information

Get comprehensive information about your ActionRegister:

Action Statistics

Monitor individual action performance:

Handler Discovery

Find handlers by tags or categories:

Execution Mode Management

Advanced execution mode control:

Statistics Management

Control execution statistics:

ExecutionResult Interface (New)

The dispatchWithResult method returns comprehensive execution information:

Best Practices

1. Type Safety

2. Handler Organization

3. Error Handling

4. Performance Optimization

5. Memory Management

6. Handler Organization (New)

7. Handler Termination Patterns (New)

8. Result Handling (New)

Troubleshooting

Common Issues and Solutions

1. Type Errors

2. Handler Not Executing

3. Handler Termination Issues

4. Memory Leaks

Debug Tools

1. Enable Debug Logging

2. Registry Information for Debugging

3. Handler Performance Monitoring

---

Conclusion

The ActionPayloadMap and ActionRegister system provides a powerful, type-safe foundation for building scalable business logic pipelines. With the latest enhancements, you now have comprehensive control over pipeline execution, advanced filtering capabilities, result collection, and detailed monitoring. Key takeaways:

1. Type Safety First: Always define clear ActionPayloadMap interfaces
2. Natural Handler Flow: Use natural completion, early returns, and explicit aborts for clean handler termination
3. Advanced Configuration: Leverage the new registry configuration options for better control
4. Handler Organization: Use tags, categories, and metadata for better organization
5. Result Management: Take advantage of the new result collection and processing system
6. Performance Monitoring: Use ExecutionResult and statistics APIs for comprehensive monitoring
7. Filtering & Control: Utilize advanced filtering options for precise handler execution
8. Error Handling: Always return after controller.abort() to prevent continued execution
9. Memory Management: Always clean up handlers and use auto-cleanup features
10.
