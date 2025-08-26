---
document_id: guide--composition
category: guide
source_path: en/guide/architecture/composition.md
character_limit: 5000
last_update: '2025-08-26T00:34:27.289Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Pattern Composition

For complex applications, compose all three patterns for maximum flexibility and separation of concerns. Overview

The Context-Action framework provides three core patterns that can be composed together:

- 🎯 Action Only Pattern: Pure action dispatching without stores
- 🏪 Store Only Pattern: State management without actions  
- 🔧 Ref Context Pattern: Direct DOM manipulation with zero re-renders

Complete Composition Example

Domain-Based Composition

Business + UI Domain Separation

Domain-Specific Logic Hooks

Architecture Patterns

MVVM Architecture Integration

Performance Optimization

Layer-Specific Optimizations

Best Practices

1. Handler Registration (Critical)
- Always use useCallback: All action handlers must be wrapped with useCallback to prevent infinite re-registration
- Proper Dependencies: Include only necessary dependencies in the dependency array
- Avoid Inline Functions: Never pass inline functions directly to action handlers

> Important: For detailed handler registration patterns, see the Handler Registration Guide

2. Pattern Selection Strategy
- Start with Store Only for simple state management
- Add Action Only when you need side effects or complex workflows
- Add RefContext when you need high-performance DOM manipulation
- Compose all patterns for full-featured applications

2. Domain Boundaries
- Business Logic: Use Action Only + Store Only patterns
- UI Interactions: Use Store Only + RefContext patterns  
- Performance Critical: Use RefContext pattern primarily
- Cross-Domain: Use composition hooks for integration

3. Provider Organization
- Nested Providers: Organize by domain hierarchy
- HOC Pattern: Use Higher-Order Components for automatic wrapping
- Conditional Providers: Load providers based on feature flags
- Lazy Providers: Load providers on-demand for performance

4. Performance Considerations
- RefContext: Use for animations, real-time interactions
- Store Pattern: Use reference equality for large datasets
- Action Pattern: Keep handlers lightweight, use async appropriately
- Composition: Minimize cross-pattern dependencies

Migration Guide

From Legacy Action Context Pattern

Pattern composition provides the ultimate flexibility while maintaining clear separation of concerns and optimal performance characteristics.
