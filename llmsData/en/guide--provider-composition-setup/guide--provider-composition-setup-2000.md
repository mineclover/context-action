---
document_id: guide--provider-composition-setup
category: guide
source_path: en/guide/patterns/setup/provider-composition-setup.md
character_limit: 2000
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
1. Logical Grouping: Group providers by domain, layer, or feature
2. Provider Ordering: Order providers by dependency (independent → dependent)
3. Conditional Logic: Use feature flags and runtime conditions for flexibility
4. Performance: Memoize composed providers to prevent unnecessary re-renders

Configuration Management
1. Type Safety: Use TypeScript interfaces for configuration objects
2. Environment Separation: Separate configurations for different environments
3. Feature Flags: Implement feature flag system for gradual rollouts
4. Runtime Adaptation: Adapt provider composition based on runtime conditions

Error Handling
1. Provider Validation: Validate providers before composition
2. Graceful Degradation: Handle missing providers gracefully
3. Error Boundaries: Wrap composed providers with error boundaries
4.
