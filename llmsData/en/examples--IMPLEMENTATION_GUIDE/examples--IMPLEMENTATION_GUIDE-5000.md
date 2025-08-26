---
document_id: examples--IMPLEMENTATION_GUIDE
category: examples
source_path: en/examples/architecture/IMPLEMENTATION_GUIDE.md
character_limit: 5000
last_update: '2025-08-26T00:34:27.274Z'
update_status: auto_generated
priority_score: 80
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Implementation Guide - Domain-Driven Architecture

This guide provides practical steps for implementing the Context-Action framework's modular architecture. Quick Start Checklist

1. Domain Structure Setup

2. Domain Implementation Pattern

Store Domain

Action Domain

Integration Patterns

MVVM Implementation

Model Layer (Store Domain)
- Responsibility: State management and data persistence
- Pattern: Declarative Store Pattern with reactive subscriptions
- Example: useStoreValue(store, selector)

ViewModel Layer (Action Domain)
- Responsibility: Business logic processing and coordination
- Pattern: Action Pipeline with handler registration
- Example: useActionHandler('actionType', businessLogicHandler)

View Layer (React Components)
- Responsibility: UI rendering and user interaction
- Pattern: Pure components with reactive data subscriptions
- Example: Components dispatch actions and subscribe to store changes

Cross-Domain Communication

Best Practices

1. Domain Separation
- ✅ Keep domains isolated with clear boundaries
- ✅ Use shared domain for cross-cutting concerns
- ❌ Avoid direct imports between non-shared domains

2. Context Management
- ✅ One context per specific responsibility
- ✅ Compose contexts at the application level
- ❌ Avoid deeply nested provider hierarchies

3. Type Safety
- ✅ Define domain-specific types in shared/types
- ✅ Use ActionPayloadMap for all action definitions
- ✅ Leverage TypeScript inference in store patterns

4. Performance Optimization
- ✅ Use selective subscriptions with useStoreValue
- ✅ Memoize expensive selectors and handlers
- ✅ Implement performance monitoring for critical paths

Migration Strategy

Phase 1: Foundation
1. Create domain directory structure
2. Move shared utilities to shared domain
3. Set up basic type definitions

Phase 2: Domain Extraction
1. Extract store contexts to store domain
2. Move action handlers to action domain
3. Organize async patterns in async domain

Phase 3: Component Refactoring
1. Update existing components to use domain imports
2. Implement MVVM patterns consistently
3. Add performance monitoring and debugging tools

Phase 4: Optimization
1. Add domain-specific performance optimizations
2. Implement comprehensive error handling
3. Add architectural documentation and examples

Common Patterns

Store Management Pattern

Action Handler Pattern

Async Coordination Pattern

Testing Strategy

Domain-Level Testing

Integration Testing

Troubleshooting

Common Issues

1. Context Provider Missing
   - Ensure all required providers are composed at the app level
   - Check provider hierarchy and nesting

2. Type Errors
   - Verify ActionPayloadMap interface definitions
   - Check shared type imports and exports

3. Performance Issues
   - Use performance monitoring hooks
   - Implement selective subscriptions
   - Check for unnecessary re-renders

Debug Tools

- Store debugger components in store domain
- Performance monitoring in async domain
- Action logging in action domain
- Cross-domain integration monitoring.
