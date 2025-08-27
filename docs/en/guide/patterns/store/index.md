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

#### Core Patterns
- **[Basic Usage](./basic-usage.md)** - Fundamental Store Only pattern with type inference
- **[useStoreValue Patterns](./useStoreValue-patterns.md)** - Core `useStoreValue` subscription patterns
- **[useStoreSelector Patterns](./useStoreSelector-patterns.md)** - Multiple store selection with `useStoreSelector`
- **[useStoreManager API](./useStoreManager-api.md)** - Low-level store access with `useStoreManager` hook

#### Computed Value Patterns
- **[Basic Computed Patterns](./useComputedStore-basic.md)** - Getting started with computed values
- **[useComputedStore Overview](./useComputedStore-overview.md)** - Comprehensive computed pattern guide
- **[useComputedStore Patterns](./useComputedStore-patterns.md)** - Complete reference (all patterns)

#### Performance & Optimization
- **[Store Performance Overview](./performance-patterns.md)** - Performance optimization guide
- **[Memoization Patterns](./memoization-patterns.md)** - Prevent unnecessary re-renders
- **[Batching Patterns](./batching-patterns.md)** - Batch multiple updates
- **[Subscription Optimization](./subscription-optimization.md)** - Optimize subscriptions
- **[Comparison Strategies](./comparison-strategies.md)** - Choose the right comparison method
- **[Lazy Evaluation Patterns](./lazy-evaluation-patterns.md)** - Defer expensive operations
- **[Memory Management](./memory-management.md)** - Prevent memory leaks
- **[Debugging & Development](./debugging-development.md)** - Development tools and debugging
- **[Error Handling & Recovery](./error-handling-recovery.md)** - Robust error handling

#### Advanced Patterns
- **[withProvider Pattern](./withProvider-pattern.md)** - Higher-Order Component pattern for automatic Provider wrapping
- **[Store Configuration](./store-configuration.md)** - Store configuration and comparison strategies

## Quick Reference

| Pattern Category | Purpose | Best For |
|-----------------|---------|----------|
| **Core Patterns** | Basic store operations | Data layers, subscriptions, multi-store access |
| **Computed Values** | Derived state calculations | Reactive calculations, data transformations |
| **Performance & Optimization** | Performance optimization | Memory management, batching, memoization |
| **Advanced Patterns** | Complex scenarios | Provider composition, custom configurations |

### Detailed Pattern Reference

| Specific Pattern | Purpose | Use When |
|-----------------|---------|----------|
| **Basic Usage** | Type-safe state management | Starting with stores |
| **useStoreValue** | Core store subscriptions | Selective updates, conditional subscriptions |
| **useComputedStore** | Derived state calculations | Computed values, multi-store calculations |
| **Memoization** | Prevent re-renders | Performance optimization needed |
| **Memory Management** | Resource efficiency | Memory leaks detected |
| **Error Handling** | Robust operations | Production applications |

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