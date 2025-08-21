# Store Patterns

Type-safe state management patterns without action dispatching overhead.

## Overview

Store patterns provide excellent type inference and simplified API for pure state management scenarios.

### Available Store Patterns
- **[Basic Usage](./basic-usage.md)** - Fundamental Store Only pattern with type inference
- **[HOC Pattern](./hoc-pattern.md)** - Higher-Order Component pattern for automatic Provider wrapping
- **[Advanced Config](./advanced-config.md)** - Performance optimization and custom comparison strategies

## Quick Reference

| Pattern | Purpose | Best For |
|---------|---------|----------|
| **Basic Usage** | Type-safe state management | Data layers, simple state |
| **HOC Pattern** | Automatic Provider wrapping | Clean component composition |
| **Advanced Config** | Performance optimization | Large datasets, complex objects |

## When to Use Store Patterns

- **Pure State Management**: No complex business logic needed
- **Data Layers**: Managing application data without side effects
- **Configuration State**: User preferences, app settings
- **UI State**: View state, form state, component state
- **Reactive Data**: Data that needs reactive subscriptions

## Key Features

- ✅ Excellent type inference without manual type annotations
- ✅ Simplified API focused on store management
- ✅ Direct value or configuration object support
- ✅ No need for separate `createStore` calls
- ✅ Multiple comparison strategies for performance
- ✅ HOC pattern for automatic Provider wrapping

## Integration

Store patterns work best when combined with:
- **[Action Patterns](../action/)** for business logic
- **[Ref Patterns](../ref/)** for DOM manipulation
- **[Async Patterns](../async/)** for safe async operations