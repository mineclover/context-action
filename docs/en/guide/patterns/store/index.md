# Store Patterns

Type-safe state management patterns without action dispatching overhead.

## Prerequisites

For complete setup instructions including store definitions, context creation, and provider configuration, see **[Basic Store Setup](../setup/basic-store-setup.md)**.

All store pattern examples reference the shared setup guide for:
- Store type definitions and configurations
- Context creation patterns and naming conventions  
- Provider composition and organization
- Export patterns and integration strategies

## Overview

Store patterns provide excellent type inference and simplified API for pure state management scenarios.

### Available Store Patterns
- **[Basic Usage](./basic-usage.md)** - Fundamental Store Only pattern with type inference
- **[useStoreValue Patterns](./useStoreValue-patterns.md)** - Core `useStoreValue` subscription patterns
- **[useStoreSelector Patterns](./useStoreSelector-patterns.md)** - Multiple store selection with `useStoreSelector`
- **[useComputedStore Patterns](./useComputedStore-patterns.md)** - Computed values with `useComputedStore`
- **[useStoreManager API](./useStoreManager-api.md)** - Low-level store access with `useStoreManager` hook
- **[Performance Patterns](./performance-patterns.md)** - Performance optimization and best practices
- **[withProvider Pattern](./withProvider-pattern.md)** - Higher-Order Component pattern for automatic Provider wrapping
- **[Store Configuration](./store-configuration.md)** - Store configuration and comparison strategies

## Quick Reference

| Pattern | Purpose | Best For |
|---------|---------|----------|
| **Basic Usage** | Type-safe state management | Data layers, simple state |
| **useStoreValue Patterns** | Core store subscriptions | Selective updates, conditional subscriptions |
| **useStoreSelector Patterns** | Multiple store selection | Combining data from multiple stores |
| **useComputedStore Patterns** | Derived state calculations | Computed values, reactive calculations |
| **useStoreManager API** | Low-level store access | Advanced operations, multiple store updates |
| **Performance Patterns** | Optimization techniques | Memoization, batching, debugging |
| **withProvider Pattern** | Automatic Provider wrapping | Clean component composition |
| **Store Configuration** | Store configuration | Custom comparisons, advanced settings |

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