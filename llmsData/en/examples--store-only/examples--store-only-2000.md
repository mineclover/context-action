---
document_id: examples--store-only
category: examples
source_path: en/examples/store-only.md
character_limit: 2000
last_update: '2025-08-21T02:13:42.358Z'
update_status: auto_generated
priority_score: 80
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Store Only Pattern Example

This example demonstrates the Store Only Pattern for pure state management without action dispatching, ideal for data layers, application state, and reactive data flows. Use Cases

- Application state management
- Form state and UI state
- Data caching and persistence
- Derived state and computed values
- Component-level state management

Complete Example

1. Define Store Configuration

2. Create Store Pattern

3. Profile Management Component

4. Preferences Component

3. Analytics Dashboard

4. Contact Form Component

5. Store Manager Utilities

6. Main Application with HOC Pattern

Advanced Store Patterns

State Persistence

Computed State Component

Real-World Integration

Form Validation Patterns

State Synchronization

Styling

Key Benefits

✅ Type Safety: Automatic type inference without manual type annotations  
✅ Reactive Updates: Components automatically re-render on state changes  
✅ Derived State: Computed properties update automatically when base state changes  
✅ Validation: Built-in validation support with custom validator functions  
✅ HOC Pattern: Clean provider integration with withProvider()  
✅ Store Manager: Centralized management for reset, export, and bulk operations

Best Practices

1. Direct Values: Use direct value configuration for simple types
2. Configuration Objects: Use for complex validation and derived state
3. HOC Pattern: Prefer withProvider() for automatic provider wrapping
4. Reactive Subscriptions: Always use useStoreValue() for component updates
5. Bulk Operations: Use Store Manager for reset and bulk operations
6. State Structure: Keep related state together in logical groupings

Related

- Store Pattern API - Store Pattern API reference
- Store Manager API - Store Manager documentation  
- Main Patterns Guide - Pattern comparison and selection
- Pattern Composition Example - Combining with Action Pattern.
