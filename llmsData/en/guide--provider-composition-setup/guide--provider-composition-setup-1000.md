---
document_id: guide--provider-composition-setup
category: guide
source_path: en/guide/patterns/setup/provider-composition-setup.md
character_limit: 1000
last_update: '2025-08-26T00:34:27.316Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Provider Composition Setup

Advanced provider composition utilities and patterns for managing multiple contexts in the Context-Action framework. Import

Overview

The composeProviders utility solves "Provider hell" by composing multiple Provider components into a single, clean component. This is essential for applications using multiple contexts (Store, Action, and RefContext). Before vs After

Basic Composition Patterns

Simple Provider Composition

Multi-Domain Composition

MVVM Layer Composition

Advanced Composition Patterns

Conditional Provider Composition

Environment-Specific Composition

Nested Domain Composition

Micro-Frontend Composition

Provider Composition with Filtering

Array-Based Composition

Conditional Array Filtering

Performance Optimization

Provider Memoization

Lazy Provider Loading

Export Patterns

Composed Provider Exports

Factory Pattern Exports

Best Practices

Composition Organization
1.
