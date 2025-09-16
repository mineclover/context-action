---
document_id: en_architecture_context-action-complete-guide
category: architecture
source_path: en/architecture/context-action-complete-guide.md
character_limit: 5000
last_update: '2025-09-17T00:00:00.000Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
# Context-Action Framework: Complete Implementation Guide

This guide provides a comprehensive overview of the Context-Action Framework's implementation, focusing on practical patterns, folder structures, and development conventions. It introduces the **Atomic Context Architecture** and the **5-Layer Hook Architecture** as core concepts for building scalable and maintainable applications.

## Core Implementation Concepts

- **Atomic Context Structure**: Each context (e.g., `user/`, `product-list-page/`) is an independent, top-level unit, promoting modularity and parallel development.
- **5-Layer Hook Architecture**: Within each atomic context, a strict 5-layer structure separates concerns:
    1.  `contexts/`: Type definitions for stores and actions.
    2.  `handlers/`: Business logic implementation with a "delayed evaluation" pattern, accessing the latest state via `store.getValue()`.
    3.  `subscriptions/`: UI-focused, selective state subscription hooks for performance.
    4.  `registries/`: Hooks for registering handlers to the action pipeline.
    5.  `dispatchers/`: Hooks that generate `on~` functions for views to dispatch actions.
- **Delayed Evaluation**: Handlers are defined with `useCallback` and use `store.getValue()` to ensure they always operate on the most recent state, avoiding stale closure issues.
- **Selective Subscription**: Components subscribe only to the specific state slices they need, minimizing re-renders.
- **Scalability**: Contexts start with a simple, flat structure. For large-scale contexts with 10+ hooks per layer, a hierarchical `features/` directory can be introduced.

## Atomic Context Types

1.  **Domain Context**: Handles core business logic and entities (e.g., `user`, `authentication`). It is reusable across different parts of the application.
2.  **Page Context**: Manages UI state and logic for a specific page (e.g., `user-dashboard-page`), and is not shared between pages.

## Data Flow

The data flow follows a clear, unidirectional pattern:

```
Views → Dispatchers (on~) → Contexts → Registries → Handlers (delayed eval)
  ↑                                                        ↓
Subscriptions ←───────── Store Updates ←──────────────────┘
```

## Implementation Patterns

The guide provides detailed code examples for each layer, demonstrating:
- Creating typed contexts for actions and stores.
- Defining handlers with the 3-step process: read state, execute logic, update state.
- Creating selective subscription hooks, including derived state.
- Advanced patterns for handler registration, allowing for different modes like `trackable` or `pipeline`.
- Generating dispatchers that can add metadata for tracking and debugging.
- Integrating providers and composing them in the application.

Advanced patterns like currying-based handler creation for execution tracking and type-safe pipeline chaining for complex, multi-step actions are also detailed, ensuring robustness and observability.

By adhering to these conventions, developers can build a clean, decoupled, and high-performance application architecture.
