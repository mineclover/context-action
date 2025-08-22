# User Guide

Welcome to the Context-Action framework user guide! This comprehensive documentation will help you master the framework's patterns and architecture.

## 🚀 Getting Started

### Essential Guides
- **[Getting Started](./getting-started.md)** - Quick start guide and installation
- **[Pipeline System](./pipeline/)** - Understanding the action processing system
- **[Hook Lifecycle](./lifecycle/)** - React hooks reference and internal behavior
- **[Best Practices](./best-practices.md)** - Recommended patterns and conventions

## 🎯 Pattern Collection

### Core Framework Patterns
- **[Code Patterns](./code-patterns.md)** - Overview and migration guide to patterns directory
- **[Pattern Collection](./patterns/)** - Comprehensive pattern documentation

The **[Pattern Collection](./patterns/)** contains all the detailed implementation patterns:

| Pattern | Use Case | Best For |
|---------|----------|----------|
| **[Action Only](./patterns/action-only-pattern.md)** | Action dispatching without stores | Event systems, command patterns |
| **[Store Only](./patterns/store-only-pattern.md)** | State management without actions | Pure state management, data layers |
| **[RefContext](./patterns/ref-context-pattern.md)** | Direct DOM manipulation | High-performance UI, animations |
| **[Pattern Composition](./patterns/pattern-composition.md)** | Combining patterns | Complex applications |
| **[MVVM Architecture](./patterns/mvvm-architecture.md)** | Architectural layers | Single domain apps |
| **[Domain Architecture](./patterns/domain-context-architecture.md)** | Business separation | Multi-domain apps |
| **[Async Patterns](./patterns/async-patterns.md)** | Safe async operations | Element waiting, timeouts |

## 📖 Learning Path

### For New Users
1. Start with **[Getting Started](./getting-started.md)** for setup
2. Read **[MVVM Architecture](./patterns/architecture/mvvm.md)** to understand the framework
3. Try **[Store Only Pattern](./patterns/store/)** for simple state management
4. Explore **[Pattern Collection](./patterns/)** as your needs grow

### For Advanced Users
1. Study **[Pipeline System](./pipeline/)** for complex business logic
2. Learn **[Domain Architecture](./patterns/architecture/domain-context.md)** for multi-team projects
3. Master **[Async Patterns](./patterns/async/)** for performance-critical code
4. Review **[Best Practices](./best-practices.md)** for production-ready implementations

## 🔗 Related Documentation

- **[Core Concepts](/en/concept/)** - Fundamental framework concepts
- **[API Reference](/en/api/)** - Complete API documentation
- **[Examples](/en/examples/)** - Working code examples
- **[LLM Resources](/en/llms/)** - AI integration guides

## 📝 Quick Navigation

Looking for something specific?

- **State Management** → [Store Only Pattern](./patterns/store-only-pattern.md)
- **Business Logic** → [Action Only Pattern](./patterns/action-only-pattern.md)
- **Performance** → [RefContext Pattern](./patterns/ref-context-pattern.md)
- **Complex Apps** → [Pattern Composition](./patterns/pattern-composition.md)
- **Architecture** → [MVVM](./patterns/mvvm-architecture.md) or [Domain](./patterns/domain-context-architecture.md)
- **Async Operations** → [Async Patterns](./patterns/async-patterns.md)
- **Troubleshooting** → [Best Practices](./best-practices.md)

---

*The Context-Action framework provides a revolutionary approach to state management with perfect separation of concerns. Start with the patterns that match your current needs and expand as your application grows.*