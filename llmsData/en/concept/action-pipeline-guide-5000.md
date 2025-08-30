---
document_id: en_concept_action-pipeline-guide
category: concept
source_path: en/concept/action-pipeline-guide.md
character_limit: 5000
last_update: '2025-08-30T10:42:22.598Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Action Pipeline Guide: ActionPayloadMap & ActionRegister

Action Pipeline Guide: ActionPayloadMap & ActionRegister Complete guide to building type-safe action pipelines with Context-Action framework. Table of Contents - Overview - ActionPayloadMap: Type Foundation - ActionRegister: Pipeline Engine - Handler Registration Patterns - Pipeline Execution Strategies - Advanced Pipeline Patterns - Real-world Examples - Best Practices - Troubleshooting Overview The Context-Action framework's action pipeline system provides type-safe, scalable business logic management through two core components: - ActionPayloadMap: TypeScript interface defining action-to-payload type mappings - ActionRegister: Central pipeline engine managing handler registration and execution ActionPayloadMap: Type Foundation Basic Concept ActionPayloadMap is a TypeScript interface that maps action names to their payload types, providing compile-time type safety throughout the pipeline. Advanced Type Patterns Generic Payload Types Conditional Payload Types Type Safety Benefits 1. Compile-time Validation: TypeScript ensures correct payload types 2. IntelliSense Support: Auto-completion for action names and payload properties 3. Refactoring Safety: Renaming actions or changing payload structure is type-checked 4. Documentation: Types serve as living documentation of your API ActionRegister: Pipeline Engine Core Architecture ActionRegister is the central orchestrator that manages the action pipeline lifecycle: Configuration Options Pipeline Lifecycle Handler Registration Patterns Basic Handler Registration Multi-Store Coordination Async Operations with Error Handling Pipeline Execution Strategies Sequential Execution (Default) Handlers execute in priority order, waiting for each to complete: Parallel Execution All handlers execute simultaneously: Race Execution First completed handler wins: Advanced Pipeline Patterns Handler Filtering System (New) The ActionRegister now supports advanced handler filtering during dispatch: Result Collection and Processing (New) Collect and process results from multiple handlers: Auto AbortController Management (New) Automatic AbortController creation and management: Priority-based Validation Pipeline Conditional Handler Execution Dynamic Handler Registration Handler Execution Flow (Updated) ActionRegister handlers follow a natural execution flow without explicit continuation calls: Handler Termination Patterns Three Ways to End Handler Execution 1. Natural Completion: Handler finishes all statements, automatically continues 2. Early Return: Use return to exit handler early, pipeline continues 3. Pipeline Abort: Use controller.abort() to stop entire pipeline execution Enhanced PipelineController API (Updated) The PipelineController now provides extensive control over pipeline execution: Pipeline Middleware Pattern Re

Key points:
• [Overview](#overview)
• [ActionPayloadMap: Type Foundation](#actionpayloadmap-type-foundation)
• [ActionRegister: Pipeline Engine](#actionregister-pipeline-engine)
• [Handler Registration Patterns](#handler-registration-patterns)
• [Pipeline Execution Strategies](#pipeline-execution-strategies)
• [Advanced Pipeline Patterns](#advanced-pipeline-patterns)
• [Real-world Examples](#real-world-examples)
• [Best Practices](#best-practices)
• [Troubleshooting](#troubleshooting)
• **ActionPayloadMap**: TypeScript interface defining action-to-payload type mappings
• **ActionRegister**: Central pipeline engine managing handler registration and execution
• **Enhanced HandlerConfig** with tags, categories, metadata, and environment controls
• **Advanced Filtering System** for selective handler execution
• **Result Collection & Processing** with multiple strategies and custom mergers
• **Auto AbortController Management** for better cancellation control
• **Comprehensive ExecutionResult** with detailed execution information
• **Registry Management APIs** for monitoring and statistics
• **Performance Metrics** with timing and error collection
• **Compile-time Validation**: TypeScript ensures correct payload types
• **IntelliSense Support**: Auto-completion for action names and payload properties
• **Refactoring Safety**: Renaming actions or changing payload structure is type-checked
• **Documentation**: Types serve as living documentation of your API
• **Natural Completion**: Handler finishes all statements, automatically continues
• **Early Return**: Use `return` to exit handler early, pipeline continues
• **Pipeline Abort**: Use `controller.abort()` to stop entire pipeline execution
• **Type Safety First**: Always define clear ActionPayloadMap interfaces
• **Natural...