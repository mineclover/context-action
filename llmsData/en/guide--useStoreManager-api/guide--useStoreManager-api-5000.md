---
document_id: guide--useStoreManager-api
category: guide
source_path: en/guide/patterns/store/useStoreManager-api.md
character_limit: 5000
last_update: '2025-08-26T00:34:27.328Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
useStoreManager API

The useStoreManager hook provides low-level access to the internal StoreManager instance for advanced store management scenarios in the Declarative Store Pattern. Prerequisites

For basic store setup and context creation, see Basic Store Setup. This document demonstrates API usage using the store setup:
- Store configuration → Type Inference Configurations
- Context creation → Single Domain Store Context

Basic Usage

Getting Store Manager

Store Operations

API Reference

manager.getStore(storeName)

Get a typed store instance by name. This is the primary method for accessing stores. Store Instance Methods

Once you have a store instance, you can use these methods:

Manager Utility Methods

Advanced Patterns

Bulk Store Operations

Conditional Store Updates

Store Manager with Validation

Integration with Actions

Store Manager works seamlessly with Action Context for complex business logic:

Performance Considerations

Batch Updates

Memoized Updates

Error Handling

Safe Store Operations

TypeScript Support

Store Manager provides full type safety:

Best Practices

1. Use Functional Updates for Complex State

2. Combine with useCallback for Performance

3. Use Store Manager for Related Updates

4. Prefer Direct Store Access over useStore Hook

Real-World Examples

- User Profile Management
- Shopping Cart Operations
- Settings Panel

When to Use Store Manager

Use Store Manager When:
- Multiple Store Operations: You need to update multiple stores in a single function
- Advanced Store Logic: Complex state manipulation requiring direct store access
- Performance Optimization: Batch operations or avoiding multiple hook calls
- Action Handlers: Business logic that spans multiple stores
- Custom Store Utilities: Building reusable store manipulation functions

Use Regular Hooks When:
- Simple State Access: Just reading or updating a single store
- Component Rendering: Using useStoreValue for reactive UI updates
- Basic Operations: Simple setValue/getValue operations

Related Documentation

- Basic Store Usage - Fundamental store patterns
- useStoreValue Patterns - Advanced hook patterns
- withProvider Pattern - Higher-order component patterns
- Action Integration - Integrating with actions.
