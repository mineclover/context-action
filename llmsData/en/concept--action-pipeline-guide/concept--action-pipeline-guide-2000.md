---
document_id: concept--action-pipeline-guide
category: concept
source_path: en/concept/action-pipeline-guide.md
character_limit: 2000
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
4.
