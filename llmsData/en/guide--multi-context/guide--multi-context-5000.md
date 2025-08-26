---
document_id: guide--multi-context
category: guide
source_path: en/guide/patterns/ref/multi-context.md
character_limit: 5000
last_update: '2025-08-26T00:34:27.308Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Multi-Context RefContext Architecture

Multiple RefContext composition for complex applications with separated concerns. Prerequisites

For RefContext setup patterns and multi-domain configuration, see RefContext Setup. For provider composition patterns, see Provider Composition Setup. Overview

Multi-RefContext architecture allows you to separate different types of DOM manipulations into isolated contexts, providing better organization and performance for complex applications. Basic Multi-Context Setup

Domain Separation Pattern

Cross-Context Communication

Hierarchical Context Pattern

Context Isolation Benefits

Best Practices

1. Domain Separation: Create separate RefContexts for different UI concerns
2. Context Isolation: Keep each context focused on specific functionality
3. Cross-Context Communication: Use custom hooks for coordinated operations
4. Provider Hierarchy: Organize providers in logical hierarchy
5. Performance Isolation: Isolate expensive operations in dedicated contexts
6. Type Safety: Define clear ref types for each context domain
7. Memory Management: Each context manages its own lifecycle and cleanup.
