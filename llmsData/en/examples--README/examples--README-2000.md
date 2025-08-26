---
document_id: examples--README
category: examples
source_path: en/examples/architecture/README.md
character_limit: 2000
last_update: '2025-08-26T00:34:27.275Z'
update_status: auto_generated
priority_score: 80
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Context-Action Example Architecture

Architecture Overview

This example application demonstrates the Context-Action framework following a Document-Centric Domain Architecture with clear separation of concerns based on MVVM principles. Core Architecture Principles

1. Document-Centric Context Separation
Each domain represents a specific document theme and deliverable management:

- Store Context: State management patterns and reactive subscriptions
- Action Context: Business logic processing and command handling  
- Async Context: Asynchronous operations and timing management
- Ref Context: Direct DOM manipulation and hardware acceleration
- Demo Context: Practical application examples

2. MVVM Pattern Implementation

3. Domain-Driven File Organization

Implementation Guidelines

1. Context Design Pattern

Each domain follows a consistent context design:

2. Component Architecture

Components follow single responsibility principle:

- Container Components: Business logic coordination
- Presentation Components: Pure UI rendering
- Hook Components: Reusable logic extraction

3. Type Safety Strategy

- Domain-Specific Types: Each domain defines its own interfaces
- Shared Types: Common interfaces in shared domain
- Pattern Types: Generic patterns for reuse across domains

4.
