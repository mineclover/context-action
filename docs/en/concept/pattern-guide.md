# @context-action/react Pattern Guide

Complete guide to the core patterns available in @context-action/react framework.

**Note**: This guide has been moved to the [Patterns section](../guide/patterns/setup/index.md) for better organization.

## 📋 Quick Reference

Choose the right pattern for your use case:

| Pattern | Use Case | Import | Best For |
|---------|----------|--------|----------|
| **🎯 Action Only** | Action dispatching without stores | `createActionContext` | Event systems, command patterns |
| **🏪 Store Only** | State management without actions | `createStoreContext` | Pure state management, data layers |
| **🔧 Ref Context** *(Advanced)* | Direct DOM manipulation with zero re-renders | `createRefContext` | High-performance UI, animations, real-time interactions |
| **⚡ Selective Subscription** *(Advanced)* | Performance optimization through strategic subscription management | Pattern combination | High-frequency updates, performance-critical apps |

**For complex applications, compose patterns together for maximum flexibility and separation of concerns.**

## 📚 Detailed Documentation

### Core Framework Patterns
- **[🎯 Action Only Pattern](../examples/action-only.md)** - Pure action dispatching without state management
- **[🏪 Store Only Pattern](../examples/store-only.md)** - Type-safe state management without actions (Recommended)

### Advanced Patterns
- **[🔧 Ref Context Pattern](../guide/patterns/ref/basic-usage.md)** - Direct DOM manipulation with zero re-renders
- **[Pattern Composition](../examples/pattern-composition.md)** - Combining patterns for complex applications
- **[Selective Subscription Patterns](../guide/patterns/store/subscription-optimization.md)** - Pre-memoization optimization through strategic subscription management
- **[Domain Context Architecture](../context-layered/context-layered-guide.md)** - Document-centric context separation
- **[MVVM Architecture](./architecture-guide.md)** - Modern Model-View-ViewModel implementation

### Implementation Patterns
- **[Real-time State Access](../guide/patterns/async/real-time-state-access.md)** - Patterns for accessing real-time state
- **[Ref Context Setup](../guide/patterns/setup/ref-context-setup.md)** - High-performance DOM manipulation setup
- **[Wait Then Execute](../guide/patterns/async/wait-then-execute.md)** - Waiting and execution patterns
- **[Conditional Await](../guide/patterns/async/index.md)** - Conditional waiting patterns
- **[Timeout Protection](../guide/patterns/async/index.md)** - Timeout protection in async operations

## Migration Guide

### From Legacy Patterns

For users upgrading from earlier versions, see the [Migration Guide](../guide/patterns/setup/index.md) for comprehensive upgrade instructions.

## 🔍 Examples

See the `examples/` directory for complete working examples of each pattern and the [Pattern Guide documentation](../guide/patterns/setup/index.md) for comprehensive implementation details.