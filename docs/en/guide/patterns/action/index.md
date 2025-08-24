# Action Patterns

Pure action dispatching patterns without state management overhead.

## Overview

Action patterns are perfect for event systems, command patterns, and side effects handling.

### Available Action Patterns

#### Core Patterns
- **[Basic Usage](./basic-usage.md)** - Fundamental Action Only pattern with type-safe dispatching
- **[Type System](./type-system.md)** - TypeScript integration and type safety
- **[Register Delegation](./register-delegation.md)** - Modular handler organization for large applications

#### Advanced Patterns
- **[Advanced Patterns](./advanced-patterns.md)** - Overview of all advanced action patterns
- **[Dispatch Patterns](./dispatch-patterns.md)** - Execution modes, filtering, and performance
- **[Dispatch with Result](./dispatch-with-result.md)** - Result collection and processing
- **[Register Patterns](./register-patterns.md)** - Advanced handler registration
- **[Dispatch Access](./dispatch-access.md)** - Hook-based vs register-based access
- **[Handler State Access](./handler-state-access.md)** - ⚠️ **Critical**: Avoiding closure traps in handlers

## Quick Reference

| Pattern | Purpose | Best For |
|---------|---------|----------|
| **Basic Usage** | Type-safe action dispatching | Event systems, analytics, API calls |
| **Hook Implementation** | Different hook patterns | Component-level implementation strategies |
| **Register Delegation** | Modular handler organization | Large apps, team separation, complex setup |

## When to Use Action Patterns

- **Pure Side Effects**: Analytics, logging, notifications
- **Command Patterns**: User actions, system commands
- **Event Systems**: Cross-component communication
- **API Integration**: External service calls
- **Modular Architecture**: Team-based handler separation

## Key Features

- ✅ Type-safe action dispatching
- ✅ Priority-based handler execution
- ✅ Abort support and error handling
- ✅ Result handling with async support
- ✅ Lightweight (no store overhead)
- ✅ Modular handler organization

## Integration

Action patterns work best when combined with:
- **[Store Patterns](../store/)** for state management
- **[Ref Patterns](../ref/)** for DOM manipulation
- **[Async Patterns](../async/)** for safe async operations