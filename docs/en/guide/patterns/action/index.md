# Action Patterns

Pure action dispatching patterns without state management overhead.

## Overview

Action patterns are perfect for event systems, command patterns, and side effects handling.

### Available Action Patterns
- **[Basic Usage](./basic-usage.md)** - Fundamental Action Only pattern with type-safe dispatching
- **[Register Delegation](./register-delegation.md)** - Advanced register passing for modular handler organization

## Quick Reference

| Pattern | Purpose | Best For |
|---------|---------|----------|
| **Basic Usage** | Type-safe action dispatching | Event systems, analytics, API calls |
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