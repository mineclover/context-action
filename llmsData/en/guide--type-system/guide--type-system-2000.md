---
document_id: guide--type-system
category: guide
source_path: en/guide/patterns/action/type-system.md
character_limit: 2000
last_update: '2025-08-26T00:34:27.325Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Action Type System

Complete guide to the Context-Action framework's type system for actions, including ActionPayloadMap, type safety, and TypeScript integration. Prerequisites

For action type definitions and context setup, see Basic Action Setup. This document demonstrates type system patterns using the action setup:
- Type definitions → Extended Action Interface
- Common patterns → Common Action Patterns

ActionPayloadMap Interface

The foundation of type-safe action handling in the Context-Action framework. Basic Action Mapping

Usage with ActionRegister

Pipeline Controller Types

Type-safe pipeline control for action handlers. Basic Pipeline Control

Early Return with Result

Priority Jumping

Action Handler Types

Type-safe action handler definitions with full TypeScript support. Store Integration Pattern

Async Handler with Error Handling

Handler Configuration

Type-safe handler configuration with comprehensive options. Basic Handler Configuration

Advanced Configuration

Conditional Handler

Real-World Examples

- TodoListDemo - Complete todo list with action types
- ChatDemo - Chat system with message actions
- UserProfileDemo - User profile management

Related Patterns

- Action Basic Usage - Fundamental action patterns
- Register Delegation - Advanced registration patterns
- Store Integration - Integrating with stores.
