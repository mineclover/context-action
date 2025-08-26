---
document_id: guide--useStoreSelector-patterns
category: guide
source_path: en/guide/patterns/store/useStoreSelector-patterns.md
character_limit: 5000
last_update: '2025-08-26T00:34:27.329Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
useStoreSelector Patterns

Advanced store selection patterns with useStoreSelector for selective subscription and performance optimization. Prerequisites

This guide builds upon the Setup specification. Ensure you have:
- Basic understanding of Store Setup Patterns
- Familiarity with UserStores and ProductStores naming patterns
- Knowledge of Store Provider Setup

Core Features

The useStoreSelector hook provides:
- Selective Subscription: Subscribe to specific parts of store data only
- Automatic Selector Stabilization: Internal useRef ensures selectors work without memoization
- Performance Optimization: Prevents unnecessary re-renders through intelligent equality checking
- Type Safety: Full TypeScript support with generic type parameters

Internal Selector Stabilization

Key Feature: useStoreSelector internally uses useRef to stabilize selector functions, meaning you can pass inline selectors without performance issues:

How it works internally:
- Selector functions are stored in useRef to maintain stable references
- Even if you pass new inline functions on each render, they work efficiently
- Development mode shows helpful warnings but doesn't break functionality
- No need for useCallback unless you want to optimize further

Basic Single Store Selection

Using Setup-based UserStores pattern:

Multi-Store Selection with useMultiStoreSelector

Combining UserStores and ProductStores patterns:

Advanced Selection Patterns

Path-based Selection with useStorePathSelector

Using Setup-based store access:

Conditional Store Selection

Using Setup-based conditional access:

Performance Optimization

Equality Functions

External Selectors (Best Performance)

Dynamic Selectors with useCallback

Quick Reference

Best Practices

1. Keep Selectors Pure

2. Minimize Selected Data

3. Choose the Right Pattern

4. Prefer External Selectors When Possible

5. Organize Selectors

Related Patterns

- useStoreValue Patterns - Basic store subscription patterns
- useComputedStore Patterns - Computed value patterns
- Performance Patterns - Performance optimization techniques.
